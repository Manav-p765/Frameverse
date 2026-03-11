import Call from "../models/call.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import { getIo } from "../utils/socketEmitter.js";
import { sendPushToUser } from "../utils/pushNotifications.js";

const CALL_TIMEOUT_MS = 30_000; // 30 s ring timeout

/**
 * Create a call summary message in the DM chat between caller and receiver.
 */
async function createCallSummaryMessage(call, status, duration) {
  // Find the DM chat between the two users
  let chat = await Chat.findOne({
    isGroup: false,
    users: { $all: [call.callerId, call.receiverId], $size: 2 },
  });

  // If no DM chat exists, skip — we shouldn't create chats just for calls
  if (!chat) {
    console.log("[Call] No DM chat found between users, skipping call summary message.");
    return;
  }

  // Build human-readable content
  const callLabel = call.callType === "video" ? "Video call" : "Audio call";
  let content;
  if (status === "completed" && duration > 0) {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`;
    content = `${callLabel} · ${durationStr}`;
  } else if (status === "missed" || status === "timeout") {
    content = `Missed ${callLabel.toLowerCase()}`;
  } else if (status === "rejected") {
    content = `${callLabel} declined`;
  } else if (status === "cancelled") {
    content = `${callLabel} cancelled`;
  } else {
    content = `${callLabel} ended`;
  }

  const msg = await Message.create({
    chat: chat._id,
    sender: call.callerId,
    content,
    messageType: "call",
    callMeta: {
      callType: call.callType,
      duration,
      status,
    },
  });

  // Update chat's latestMessage
  chat.latestMessage = msg._id;
  await chat.save();

  // Populate sender for real-time display
  const populated = await msg.populate("sender", "username profilePic");

  // Emit to both users so the message appears in real-time
  const io = getIo();
  if (io) {
    io.to(call.callerId).emit("new-message", populated);
    io.to(call.receiverId).emit("new-message", populated);
  }
}

/**
 * activeCalls structure:
 * Map<callId, {
 *   callId: string,
 *   callerId: string,
 *   receiverId: string,
 *   callType: "audio" | "video",
 *   status: "ringing" | "connecting" | "connected" | "ended",
 *   startedAt: Date,
 *   connectedAt: Date | null,
 *   endedAt: Date | null,
 *   timeoutRef: NodeJS.Timeout | null
 * }>
 *
 * userCallMap:  Map<userId, callId>   — fast reverse lookup
 */

export function registerCallHandlers(io, socket, activeCalls, userCallMap) {
  const userId = socket.handshake.auth?.userId || socket.userId;

  console.log("[Call] User", userId, "joined personal room.");
  if (!userId) {
    console.warn(`[Call] Socket ${socket.id} has no userId — call events ignored.`);
    return;
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  function getSocketsForUser(targetUserId) {
    // Works with socket.io rooms named after userId
    return io.sockets.adapter.rooms.get(targetUserId) || new Set();
  }

  function isUserOnline(targetUserId) {
    return getSocketsForUser(targetUserId).size > 0;
  }

  function isUserBusy(targetUserId) {
    return userCallMap.has(targetUserId);
  }

  function emitToUser(targetUserId, event, data) {
    io.to(targetUserId).emit(event, data);
  }

  function makeCallId(a, b) {
    return [a, b].sort().join("_") + "_" + Date.now();
  }

  function endActiveCall(callId, reason = "ended") {
    const call = activeCalls.get(callId);
    if (!call) return;

    if (call.timeoutRef) clearTimeout(call.timeoutRef);

    call.status = "ended";
    call.endedAt = new Date();

    userCallMap.delete(call.callerId);
    userCallMap.delete(call.receiverId);
    activeCalls.delete(callId);

    // Persist call record to database
    const statusMap = {
      ended: "completed",
      user_ended: "completed",
      rejected: "rejected",
      timeout: "timeout",
      cancelled: "cancelled",
      disconnect: "disconnected",
    };
    const duration = call.connectedAt
      ? Math.round((call.endedAt - call.connectedAt) / 1000)
      : 0;

    Call.create({
      callId: call.callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      callType: call.callType,
      status: statusMap[reason] || "missed",
      startedAt: call.startedAt,
      connectedAt: call.connectedAt,
      endedAt: call.endedAt,
      duration,
    }).catch((err) => console.error("[Call] Failed to save call record:", err));

    // ── Create a call summary message in the DM chat ──
    createCallSummaryMessage(call, statusMap[reason] || "missed", duration)
      .catch((err) => console.error("[Call] Failed to send call summary message:", err));

    console.log(`[Call] Call ${callId} ended. Reason: ${reason}`);
  }

  // ─── Join personal room (must happen on connect) ─────────────────────────
  socket.join(userId);
  console.log(`[Call] User ${userId} joined personal room.`);

  // ─── call:request ────────────────────────────────────────────────────────
  // Caller → Server
  socket.on("call:request", ({ to, callType = "video", callerInfo }) => {
    console.log(`[Call] call:request from ${userId} to ${to} [${callType}]`);

    // Guard: caller already in a call
    if (isUserBusy(userId)) {
      socket.emit("call:error", { code: "ALREADY_IN_CALL", message: "You are already in a call." });
      return;
    }

    // Guard: receiver offline
    if (!isUserOnline(to)) {
      socket.emit("call:error", { code: "USER_OFFLINE", message: "User is offline." });
      return;
    }

    // Guard: receiver busy
    if (isUserBusy(to)) {
      socket.emit("call:busy", { from: to });
      return;
    }

    const callId = makeCallId(userId, to);

    // Ring timeout — auto-cancel if not answered
    const timeoutRef = setTimeout(() => {
      const call = activeCalls.get(callId);
      if (call && call.status === "ringing") {
        emitToUser(userId, "call:timeout", { callId });
        emitToUser(to, "call:timeout", { callId });
        endActiveCall(callId, "timeout");
      }
    }, CALL_TIMEOUT_MS);

    activeCalls.set(callId, {
      callId,
      callerId: userId,
      receiverId: to,
      callType,
      status: "ringing",
      startedAt: new Date(),
      connectedAt: null,
      endedAt: null,
      timeoutRef,
    });

    userCallMap.set(userId, callId);
    userCallMap.set(to, callId);

    // Forward to callee
    emitToUser(to, "call:incoming", {
      callId,
      from: callerInfo, // { _id, username, profilePic }
      callType,
    });

    // Confirm to caller
    socket.emit("call:ringing", { callId });

    // 🔔 Send push notification for incoming call (works outside the app)
    sendPushToUser(to, {
      title: `Incoming ${callType} call`,
      body: `${callerInfo?.username || "Someone"} is calling you`,
      icon: callerInfo?.profilePic || "/android-chrome-192x192.png",
      url: "/chats",
      tag: `call-${callId}`,
    }).catch((err) => console.error("[Push] Call notification error:", err));
  });

  // ─── call:offer ─────────────────────────────────────────────────────────
  // Caller → Server → Callee  (SDP offer)
  socket.on("call:offer", ({ callId, to, offer }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    console.log(`[Call] call:offer from ${userId} for call ${callId}`);
    emitToUser(to, "call:offer", { callId, from: userId, offer });
  });

  // ─── call:accept ────────────────────────────────────────────────────────
  // Callee → Server
  socket.on("call:accept", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.status !== "ringing") {
      socket.emit("call:error", { code: "INVALID_STATE", message: "Call no longer active." });
      return;
    }

    console.log(`[Call] call:accept for ${callId} by ${userId}`);
    call.status = "connecting";

    // Tell caller that callee accepted — caller now creates & sends offer
    emitToUser(call.callerId, "call:accepted", { callId, by: userId });
  });

  // ─── call:answer ────────────────────────────────────────────────────────
  // Callee → Server → Caller  (SDP answer)
  socket.on("call:answer", ({ callId, to, answer }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    call.status = "connected";
    call.connectedAt = new Date();
    if (call.timeoutRef) clearTimeout(call.timeoutRef);

    console.log(`[Call] call:answer from ${userId} for call ${callId}`);
    emitToUser(to, "call:answer", { callId, answer });
  });

  // ─── call:ice-candidate ─────────────────────────────────────────────────
  socket.on("call:ice-candidate", ({ callId, to, candidate }) => {
    emitToUser(to, "call:ice-candidate", { callId, from: userId, candidate });
  });

  // ─── call:reject ────────────────────────────────────────────────────────
  socket.on("call:reject", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    console.log(`[Call] call:reject for ${callId} by ${userId}`);
    emitToUser(call.callerId, "call:rejected", { callId });
    endActiveCall(callId, "rejected");
  });

  // ─── call:end ───────────────────────────────────────────────────────────
  socket.on("call:end", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    console.log(`[Call] call:end for ${callId} by ${userId}`);
    emitToUser(otherUserId, "call:ended", { callId });
    endActiveCall(callId, "user_ended");
  });

  // ─── call:cancel ────────────────────────────────────────────────────────
  // Caller cancels before callee answers
  socket.on("call:cancel", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.status !== "ringing") return;

    console.log(`[Call] call:cancel for ${callId} by ${userId}`);
    emitToUser(call.receiverId, "call:cancelled", { callId });
    endActiveCall(callId, "cancelled");
  });

  // ─── call:reconnect-offer ───────────────────────────────────────────────
  // ICE restart when network drops mid-call
  socket.on("call:reconnect-offer", ({ callId, to, offer }) => {
    emitToUser(to, "call:reconnect-offer", { callId, from: userId, offer });
  });

  socket.on("call:reconnect-answer", ({ callId, to, answer }) => {
    emitToUser(to, "call:reconnect-answer", { callId, answer });
  });

  // ─── Disconnect cleanup ──────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const callId = userCallMap.get(userId);
    if (!callId) return;

    const call = activeCalls.get(callId);
    if (!call) return;

    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    console.log(`[Call] User ${userId} disconnected mid-call ${callId}`);
    emitToUser(otherUserId, "call:ended", { callId, reason: "peer_disconnected" });
    endActiveCall(callId, "disconnect");
  });
}


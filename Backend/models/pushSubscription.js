import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        subscription: {
            endpoint: { type: String, required: true },
            keys: {
                p256dh: { type: String, required: true },
                auth: { type: String, required: true },
            },
        },
    },
    { timestamps: true }
);

// One subscription per endpoint per user
pushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
export default PushSubscription;

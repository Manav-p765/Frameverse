import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Generate a social-media caption for an image.
 * @param {string} base64Data  – raw base64 string (no data-url prefix)
 * @param {string} mimeType   – e.g. "image/jpeg", "image/png"
 * @returns {Promise<string>}
 */
export async function generateImageCaption(base64Data, mimeType) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: "Write a short, engaging social media caption for this image. Keep it 1-2 sentences max. Be creative and expressive. Do not use hashtags. Just return the caption text, nothing else.",
          },
        ],
      },
    ],
  });

  return response.text;
}

/**
 * Generate a polished bio from user-provided keywords.
 * @param {string} keywords – a line or comma-separated keywords about the user
 * @returns {Promise<string>}
 */
export async function generateBio(keywords) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are writing a social media profile bio for a user. The user describes themselves with these keywords: "${keywords}".

Write a concise, catchy profile bio (strictly under 160 characters) that sounds like a real person's Instagram/Twitter bio. It should describe WHO they are, not be a random inspirational quote. Use a mix of text and emojis. Keep it natural and cool.

Return ONLY the bio text. No quotes, no explanation.`,
  });

  return response.text;
}

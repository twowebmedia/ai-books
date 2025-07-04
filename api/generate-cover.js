// /api/generate-cover.js

import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    storyTitle,
    storyLocation,
    storyPlot,
    mainCharacterName,
    mainCharacterAge,
    mainCharacterHairColor,
    mainCharacterEyeColor,
    mainCharacterPersonality,
    synopsis
  } = req.body;

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Construct a detailed, character-based, location-aware prompt
    const prompt = `Children's book cover illustration in cartoon style. The scene shows ${mainCharacterName}, a ${mainCharacterAge}-year-old with ${mainCharacterHairColor} hair and ${mainCharacterEyeColor} eyes, who is ${mainCharacterPersonality}. They are at ${storyLocation}, which includes background elements like animals or nature that relate to this setting. The scene reflects the story: ${storyPlot}. The book title "${storyTitle}" is clearly displayed in a playful, readable children's font on top.`;

    const output = await replicate.run(
      "stability-ai/sdxl:latest",
      {
        input: {
          prompt,
          width: 1024,
          height: 1024,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      }
    );

    const imageUrl = output?.[0];

    if (!imageUrl) {
      throw new Error("No image URL returned from Replicate");
    }

    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("Image generation error:", err);
    return res.status(500).json({ error: "Failed to generate image." });
  }
}


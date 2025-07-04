export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "Missing Replicate API token" });
  }

  const { storyTitle, characterName, characterAge, hairColor, eyeColor, personality, location, plot } = req.body;

  const prompt = `Children's book cover. Square 210mm x 210mm layout. Colourful cartoon illustration of a child named ${characterName}, age ${characterAge}, with ${hairColor} hair and ${eyeColor} eyes, described as ${personality}, standing outside a landmark in ${location}. Book title: "${storyTitle}". Background includes animals or setting related to: ${plot}.`;

  try {
    // Step 1: Start prediction
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45e860e4f18982c57690f020bfa7f4ec3b4ff6755ae8e836f0c0b5dd30c", // SDXL 1.0
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024
        }
      })
    });

    const prediction = await startResponse.json();

    if (!prediction?.urls?.get) {
      throw new Error("Replicate did not return a valid prediction URL.");
    }

    // Step 2: Poll for image
    let imageReady = false;
    let finalImageUrl = null;

    for (let i = 0; i < 20; i++) {
      const pollResponse = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`
        }
      });

      const pollResult = await pollResponse.json();

      if (pollResult.status === "succeeded" && pollResult.output?.[0]) {
        finalImageUrl = pollResult.output[0];
        imageReady = true;
        break;
      } else if (pollResult.status === "failed") {
        throw new Error("Image generation failed.");
      }

      await new Promise((r) => setTimeout(r, 2000)); // Wait 2 seconds before next poll
    }

    if (!imageReady) {
      throw new Error("Image was not ready in time.");
    }

    return res.status(200).json({ imageUrl: finalImageUrl });

  } catch (err) {
    console.error("Image generation error:", err);
    return res.status(500).json({ error: "Failed to generate cover image." });
  }
}

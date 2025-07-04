export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "Missing Replicate API token" });
  }

  const { storyTitle, characterName, characterAge, hairColor, eyeColor, personality, location, plot } = req.body;

  const prompt = `Children's book cover. Square layout, colourful and whimsical illustration. 
Cartoon of a child named ${characterName}, age ${characterAge}, with ${hairColor} hair and ${eyeColor} eyes, described as ${personality}, smiling outside a place in ${location}. 
Story theme: "${storyTitle}". Scene hint: ${plot}.`;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
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

    const data = await response.json();

    if (data?.urls?.get) {
      // Poll the prediction endpoint until it's done
      let predictionResult;
      while (!predictionResult || predictionResult.status !== "succeeded") {
        const result = await fetch(data.urls.get, {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`
          }
        });
        predictionResult = await result.json();
        if (predictionResult.status === "failed") {
          throw new Error("Image generation failed.");
        }
        if (predictionResult.status !== "succeeded") {
          await new Promise((r) => setTimeout(r, 1500)); // Wait and retry
        }
      }

      const imageUrl = predictionResult.output?.[0];
      return res.status(200).json({ imageUrl });
    } else {
      return res.status(500).json({ error: "Image generation failed." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error generating image." });
  }
}

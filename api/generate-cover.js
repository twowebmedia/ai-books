export default async function handler(req, res) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "Missing API token" });
  }

  try {
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45e860e4f18982c57690f020bfa7f4ec3b4ff6755ae8e836f0c0b5dd30c",
        input: {
          prompt: "A colourful children's book cover, cartoon of a kid holding a balloon in the park, 210mm x 210mm",
          width: 1024,
          height: 1024
        }
      })
    });

    const prediction = await start.json();

    if (!prediction?.urls?.get) {
      throw new Error("Invalid Replicate response");
    }

    for (let i = 0; i < 20; i++) {
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` }
      });
      const data = await poll.json();

      if (data.status === "succeeded") {
        return res.status(200).json({ imageUrl: data.output[0] });
      }

      if (data.status === "failed") {
        throw new Error("Generation failed");
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error("Image not ready in time");
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Image generation failed." });
  }
}

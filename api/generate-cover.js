export default async function handler(req, res) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  const prompt = "a cartoon illustration of a child reading a book under a tree, colourful, square, children’s book style";

  const startRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "db21e45e860e4f18982c57690f020bfa7f4ec3b4ff6755ae8e836f0c0b5dd30c", // SDXL
      input: {
        prompt,
        width: 1024,
        height: 1024
      }
    })
  });

  const prediction = await startRes.json();

  // Polling
  let imageUrl = null;
  for (let i = 0; i < 15; i++) {
    const poll = await fetch(prediction.urls.get, {
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`
      }
    });
    const result = await poll.json();
    if (result.status === "succeeded") {
      imageUrl = result.output[0];
      break;
    } else if (result.status === "failed") {
      return res.status(500).json({ error: "Generation failed." });
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!imageUrl) {
    return res.status(500).json({ error: "Image not ready in time." });
  }

  return res.status(200).json({ imageUrl });
}

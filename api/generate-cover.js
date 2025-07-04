export default async function handler(req, res) {
  const token = process.env.REPLICATE_API_TOKEN;
  console.log("REPLICATE KEY USED:", token);

  if (!token) {
    return res.status(500).json({ error: "Missing API token" });
  }

  const prompt = "A cartoon-style children’s book cover, showing a smiling young Black boy at the zoo entrance. Colourful, square layout, with friendly zoo animals (lions, zebras, monkeys) visible behind a fence. Title over the top: 'Dave Goes to the Zoo'. Children’s illustration style, warm and soft look.";

  try {
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
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
    console.log("Prediction response:", prediction);

    if (!prediction?.urls?.get) {
      throw new Error("Invalid response from Replicate: missing 'urls.get'");
    }

    for (let i = 0; i < 15; i++) {
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${token}` }
      });

      const result = await poll.json();

      if (result.status === "succeeded") {
        console.log("Image generated:", result.output);
        return res.status(200).json({ imageUrl: result.output[0] });
      }

      if (result.status === "failed") {
        throw new Error("Image generation failed.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Image not ready after waiting.");
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}

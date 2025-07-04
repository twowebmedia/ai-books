export default async function handler(req, res) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Missing Replicate API token" });
  }

  const prompt =
    "A square children’s book cover illustration of a smiling young Black boy at the entrance of a zoo. Behind him are cartoon-style animals like a lion, zebra, and giraffe behind a colourful fence. Title at the top: 'Dave Goes to the Zoo'. Soft colours, playful, 210mm x 210mm look.";

  try {
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "cb635407d376f3000c4783bffcfe20686e6f9cefa7d7f57d3c6486cda3ae99f1", // SDXL working version
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
        },
      }),
    });

    const prediction = await startResponse.json();
    console.log("Prediction:", prediction);

    if (!prediction?.urls?.get) {
      console.error("Invalid Replicate response:", prediction);
      return res.status(500).json({ error: "Invalid response from Replicate" });
    }

    // Poll for result
    for (let i = 0; i < 15; i++) {
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${token}` },
      });

      const result = await poll.json();

      if (result.status === "succeeded") {
        console.log("Generated image:", result.output[0]);
        return res.status(200).json({ imageUrl: result.output[0] });
      }

      if (result.status === "failed") {
        return res.status(500).json({ error: "Generation failed" });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    return res.status(500).json({ error: "Timed out waiting for image" });
  } catch (err) {
    console.error("Error in generation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

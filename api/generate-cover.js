export default async function handler(req, res) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Missing Replicate API token" });
  }

  const prompt = "A square children’s book cover illustration of a smiling young Black boy at the entrance of a zoo. Behind him are cartoon-style animals like a lion, zebra, and giraffe behind a colourful fence. Title at the top: 'Dave Goes to the Zoo'. Soft colours, playful, 210mm x 210mm look.";

  try {
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl:5e13360e0cfb4ed6b5ef71d73c4ed6a61f23615271edc53077f26c1a3f69b2c0",
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
        },
      }),
    });

    const prediction = await startResponse.json();
    console.log("FULL REPLICATE RESPONSE:", prediction);

    if (!prediction?.urls?.get) {
      return res.status(500).json({
        error: "Invalid response from Replicate (no URLs)",
        raw: prediction,
      });
    }

    // Poll the prediction URL until it's done
    for (let i = 0; i < 15; i++) {
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${token}` },
      });

      const result = await poll.json();

      if (result.status === "succeeded") {
        return res.status(200).json({ imageUrl: result.output[0] });
      }

      if (result.status === "failed") {
        return res.status(500).json({ error: "Generation failed" });
      }

      // Wait 2 seconds before next poll
      await new Promise((r) => setTimeout(r, 2000));
    }

    return res.status(500).json({ error: "Timed out waiting for image" });
  } catch (err) {
    console.error("GENERATION ERROR:", err);
    return res.status(500).json({ error: "Internal error", detail: err.message });
  }
}

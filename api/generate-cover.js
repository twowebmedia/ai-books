export default async function handler(req, res) {
  const token = process.env.REPLICATE_API_TOKEN;
  console.log("REPLICATE KEY USED:", token);

  if (!token) {
    return res.status(500).json({ error: "Missing API token" });
  }

  const prompt = "A cartoon-style children's book cover featuring a smiling boy with dark skin and curly hair at the zoo. Bright colours. Square layout. Story title over the top: 'Dave Goes to the Zoo'.";

  try {
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45e860e4f18982c57690f020bfa7f4ec3b4ff6755ae8e836f0c0b5dd30c", // SDXL
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024
        }
      })
    });

    const prediction = await startResponse.json();
    if (!prediction?.urls?.get) {
      console.error("Missing prediction GET URL:", prediction);
      throw new Error("Invalid response from Replicate");
    }

    for (let i = 0; i < 15; i++) {
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${token}` }
      });

      const result = await poll.json();

      if (result.status === "succeeded") {
        console.log("Final Replicate Output:", result.output);
        return res.status(200).json({ imageUrl: result.output[0] });
      }

      if (result.status === "failed") {
        throw new Error("Generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Image not ready in time");
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Image generation failed." });
  }
}

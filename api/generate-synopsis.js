
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, description } = req.body;

  const messages = [
    { role: "system", content: "You are a children's book author." },
    { role: "user", content: `Write a short synopsis (under 100 words) for a story titled '${title}' based on this: ${description}` }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages
    })
  });

  const data = await response.json();
  const synopsis = data.choices[0]?.message?.content || "Synopsis not available.";
  res.status(200).json({ synopsis });
}

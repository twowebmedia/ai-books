// File: /api/generate-pages.js

export async function POST(req) {
  const { openaiApiKey, stabilityApiKey, storyInputs, characters, pageCount, coverPrompt } = await req.json();

  try {
    // STEP 1: Generate the story via OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a children's book author. Write a whimsical, child-friendly story in British English. Divide the story into the specified number of pages. Each page should be described vividly for illustration but use simple language for young readers. Keep the character descriptions consistent with the inputs. Return the output in JSON format with a structure like: [{ page: 1, text: '...', prompt: '...' }, ...]",
          },
          {
            role: "user",
            content: `Story title: ${storyInputs.title}\nLocation: ${storyInputs.location}\nPlot: ${storyInputs.plot}\nReading level: ${storyInputs.readingLevel}\nCharacters: ${characters.map((c) => `${c.name}, age ${c.age}, appearance: ${c.appearance}, personality: ${c.personality}`).join(" | ")}\nPages: ${pageCount}`,
          },
        ],
        temperature: 0.8,
      }),
    });

    const storyData = await openaiRes.json();
    const pages = storyData.choices?.[0]?.message?.content;

    if (!pages) {
      throw new Error("Story generation failed");
    }

    const parsedPages = JSON.parse(pages);

    // STEP 2: Generate images using Stability AI
    const stabilityResponses = await Promise.all(
      parsedPages.map(async (page) => {
        const response = await fetch("https://api.stability.ai/v1/generation/sdxl-1.0/text-to-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${stabilityApiKey}`,
          },
          body: JSON.stringify({
            text_prompts: [{ text: page.prompt }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
          }),
        });

        const result = await response.json();

        return {
          page: page.page,
          text: page.text,
          image: result.artifacts?.[0]?.url || null,
        };
      })
    );

    return new Response(JSON.stringify({ pages: stabilityResponses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Page generation error:", err);
    return new Response(JSON.stringify({ error: "Page generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


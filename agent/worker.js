// Cloudflare Worker — David M. Ho Interview Agent Backend
// Deploy at: https://developers.cloudflare.com/workers/
// Set ANTHROPIC_API_KEY and SYSTEM_PROMPT as Worker secrets/environment variables

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://emaildavidmho-pm.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages", { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: env.SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      return new Response("API error", { status: 502, headers: CORS_HEADERS });
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ reply: data.content[0].text }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  },
};

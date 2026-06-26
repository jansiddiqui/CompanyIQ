import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function callLLM(prompt: string, options: { temperature?: number } = {}): Promise<string> {
  const temp = options.temperature ?? 0.1;

  // Gather available providers based on configured keys
  const attempts: { provider: string; fn: () => Promise<string> }[] = [];

  // 1. Native Gemini
  if (process.env.GEMINI_API_KEY) {
    attempts.push({
      provider: "Gemini (Native)",
      fn: async () => {
        const model = new ChatGoogleGenerativeAI({
          model: "gemini-2.5-flash",
          apiKey: process.env.GEMINI_API_KEY,
          temperature: temp,
        });
        const response = await model.invoke(prompt);
        return response.content.toString().trim();
      }
    });
  }

  // 2. OpenRouter (Gemini 2.5 Flash fallback)
  if (process.env.OPENROUTER_API_KEY) {
    attempts.push({
      provider: "OpenRouter (Gemini)",
      fn: async () => {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://companyiq.local",
            "X-Title": "CompanyIQ",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: temp,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
          throw new Error("OpenRouter API returned an empty choices array.");
        }
        return data.choices[0].message.content.trim();
      }
    });
  }

  // 3. Groq (Llama-3 70B fallback)
  if (process.env.GROQ_API_KEY) {
    attempts.push({
      provider: "Groq (Llama-3)",
      fn: async () => {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: temp,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
          throw new Error("Groq API returned an empty choices array.");
        }
        return data.choices[0].message.content.trim();
      }
    });
  }

  if (attempts.length === 0) {
    throw new Error("No LLM API keys configured. Please set GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in your env.");
  }

  // Execute failover sequence
  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      console.log(`[LLM Router] Routing request to ${attempt.provider}...`);
      const result = await attempt.fn();
      console.log(`[LLM Router] ${attempt.provider} call succeeded.`);
      return result;
    } catch (err: any) {
      console.warn(`[LLM Router Warning] ${attempt.provider} failed: ${err.message || err}. Trying next provider...`);
      lastError = err;
    }
  }

  throw new Error(`All configured LLM providers failed. Last error: ${lastError?.message || lastError}`);
}

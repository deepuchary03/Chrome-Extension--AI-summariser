require('dotenv').config(); // Load environment variables from .env file

// Load API key from environment variable
let OPENAI_API_KEY = "";
try {
  OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
} catch (e) {
  console.warn("Could not load API key from environment.");
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.action !== "summarize") return;
  const pageText = msg?.payload?.text || "";
  (async () => {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-2024-07-18",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes text concisely.",
            },
            {
              role: "user",
              content: `Summarize this webpage content:\n\n${pageText}`,
            },
          ],
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("OpenAI API error:", data);
        sendResponse({
          summary: `Error: ${data.error?.message || "Unknown error."}`,
        });
        return;
      }
      const summary =
        data?.choices?.[0]?.message?.content || "No summary returned.";
      sendResponse({ summary });
    } catch (err) {
      console.error("Fetch error:", err);
      sendResponse({ summary: "Error: " + err.message });
    }
  })();
  return true;
});

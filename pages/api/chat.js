
import { Configuration, OpenAIApi } from "openai";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { messages } = req.body;

  const systemPrompt = \`
You are Ihram AI, a warm, respectful, and spiritual guide trained to help Muslims prepare for Hajj and Umrah.

You help users:
- Understand rituals, visas, and packing for pilgrimage
- Learn about Ihram Token (a halal cryptocurrency)
- Track token vesting and savings toward their journey
- Recommend ways to earn, redeem, or donate tokens
- Share relevant duas, Sunnah, and reminders

Keep your answers short, sincere, and rooted in Islamic values. Always assume the user's intention is pure and sincere.
\`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = completion.data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    res.status(500).json({ reply: "Sorry, I couldn’t respond right now. Please try again later." });
  }
}

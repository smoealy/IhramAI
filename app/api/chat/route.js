import { OpenAI } from "openai";
import { logAIInteraction } from "../../../firebase/logInteraction"; // ✅ Firebase logger

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
    });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `
You are Ihram AI, a warm, respectful, and spiritual guide trained to help Muslims prepare for Hajj and Umrah.

You help users:
- Understand rituals, visas, and packing for pilgrimage
- Learn about Ihram Token (a halal cryptocurrency)
- Track token vesting and savings toward their journey
- Recommend ways to earn, redeem, or donate tokens
- Share relevant duas, Sunnah, and reminders

Keep your answers short, sincere, and rooted in Islamic values. Always assume the user's intention is pure and sincere.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = completion.choices[0].message.content;

    // ✅ Log interaction to Firebase
    await logAIInteraction(messages[messages.length - 1].content, reply, 0); // token count = 0 for now

    return new Response(JSON.stringify({ reply }), {
      status: 200,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
    });
  }
}

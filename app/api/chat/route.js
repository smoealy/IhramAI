import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
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
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    const reply = completion.choices[0].message.content;
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ reply: "Sorry, I couldn’t respond right now. Please try again later." }), { status: 500 });
  }
}
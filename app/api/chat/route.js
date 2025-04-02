// app/api/chat/route.js

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
console.log("ENV KEY:", process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

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

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // use gpt-4 if you're on the paid plan
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const reply = response.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("API Chat Error:", err.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

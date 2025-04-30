import { logVote } from "../../../firebase/feedbackLogger";

export async function POST(req) {
  try {
    const { interactionId, vote } = await req.json();
    await logVote(interactionId, vote);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Vote failed" }), { status: 500 });
  }
}

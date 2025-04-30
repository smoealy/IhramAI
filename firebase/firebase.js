// firebase/logInteraction.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; // ❌ no auth needed for API routes

export async function logAIInteraction(prompt, response, tokensUsed = 0) {
  try {
    await addDoc(collection(db, "interactions"), {
      userId: "server", // fixed userId for backend logs
      prompt,
      response,
      tokensUsed,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging interaction:", error);
  }
}

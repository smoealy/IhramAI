import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; // auth removed for backend-safe logging

export async function logAIInteraction(prompt, response, tokensUsed = 0) {
  try {
    await addDoc(collection(db, "interactions"), {
      userId: "server", // fixed for now
      prompt,
      response,
      tokensUsed,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging interaction:", error);
  }
}

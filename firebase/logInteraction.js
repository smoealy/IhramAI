// firebase/logInteraction.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

export async function logAIInteraction(prompt, response, tokensUsed = 0) {
  const userId = auth.currentUser?.uid || "guest";

  try {
    await addDoc(collection(db, "interactions"), {
      userId,
      prompt,
      response,
      tokensUsed,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging interaction:", error);
  }
}

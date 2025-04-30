import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function logAIInteraction(prompt, response, tokensUsed = 0) {
  console.log("Logging to Firestore:", { prompt, response, tokensUsed });

  try {
    await addDoc(collection(db, "interactions"), {
      userId: "server",
      prompt,
      response,
      tokensUsed,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Firestore logging error:", error);
  }
}

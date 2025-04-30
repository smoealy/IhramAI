import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function logAIInteraction(prompt, response, tokensUsed = 0) {
  try {
    const docRef = await addDoc(collection(db, "interactions"), {
      userId: "server",
      prompt,
      response,
      tokensUsed,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore logging error:", error);
    return null;
  }
}

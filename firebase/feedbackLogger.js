import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logVote(interactionId, voteType) {
  try {
    await addDoc(collection(db, "feedback"), {
      interactionId,
      vote: voteType,
      timestamp: serverTimestamp()
    });
    console.log("Vote logged:", voteType);
  } catch (error) {
    console.error("Error logging vote:", error);
  }
}

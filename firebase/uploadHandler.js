import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function uploadFile(file, type = "quote") {
  try {
    console.log("Uploading file:", file.name, "as type:", type);

    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("File uploaded. URL:", downloadURL);

    await addDoc(collection(db, "uploads"), {
      filename: file.name,
      fileURL: downloadURL,
      type,
      timestamp: serverTimestamp(),
    });

    console.log("Metadata written to Firestore.");
    return downloadURL;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

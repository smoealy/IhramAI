import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function uploadFile(file, type = "quote") {
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  await addDoc(collection(db, "uploads"), {
    filename: file.name,
    fileURL: downloadURL,
    type,
    timestamp: serverTimestamp()
  });

  return downloadURL;
}

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../lib/firebase"; // Import your initialized app

const storage = getStorage(app); // Pass the app instance

/**
 * Uploads an image (from URI) to Firebase Storage and returns the download URL.
 * @param {string} imageUri - The image URI from ImagePicker.
 * @param {string} filename - The filename to use in storage.
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
export async function uploadPostImage(imageUri, filename) {
  console.log('Uploading image from URI:', imageUri);
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `posts/${filename}`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
} 
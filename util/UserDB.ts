import { setDoc, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, app } from "../lib/firebase";
import { uploadPostImage } from "./Storage";

// Replace with your deployed Firebase Cloud Function URL
const VISION_FUNCTION_URL = "http://192.168.0.14:5001/deal-me-up/us-central1/validateDealScreenshot";

// Calls the Firebase Cloud Function for Vision API validation
export async function validateDealScreenshot(base64Image, title, price) {
  try {
    const response = await fetch(VISION_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, title, price })
    });
    // console.log("OCR raw output:", response); // Removed to avoid spam
    if (!response.ok) {
      throw new Error('Vision API validation failed.');
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Validation error:', error);
    throw new Error('Failed to validate screenshot. Please try again.');
  }
}

export async function createUserDocument(email: string) {
  const username = email.split('@')[0];
  try {
    await setDoc(doc(db, "info", username), {
      email,
      payment: {
        venmo: "",
        paypal: ""
      },
      favorites: [],
      posts: [],
      onboardingComplete: false, // Default to false
      preferences: []
    });
    return { username };
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
}

// Get user document by email
export async function getUserDocument(email: string) {
  const username = email.split('@')[0];
  try {
    const userDoc = await getDoc(doc(db, "info", username));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
}

export async function updateOnboarding(email: string, complete: boolean) {
  const username = email.split('@')[0];
  try {
    await setDoc(
      doc(db, "info", username),
      { onboardingComplete: complete },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    throw error;
  }
}

// Update user payment info
export async function updateUserPayment(email: string, payment: { venmo?: string; paypal?: string }) {
  const username = email.split('@')[0];
  try {
    await setDoc(
      doc(db, "info", username),
      { payment },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating user payment info:", error);
    throw error;
  }
}

// Update user preferences (categories)
export async function updatePreferences(email: string, preferences: string[]) {
  const username = email.split('@')[0];
  try {
    await setDoc(
      doc(db, "info", username),
      { preferences },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
}

// Add a favorite (deal) to the user's favorites array
export async function addFavorite(email: string, favorite: { link: string, title: string }) {
  const username = email.split('@')[0];
  const userRef = doc(db, "info", username);
  const userDoc = await getDoc(userRef);
  let favorites: { link: string; title: string }[] = [];
  if (userDoc.exists()) {
    favorites = userDoc.data().favorites || [];
  }
  // Check for duplicate by link
  if (!favorites.some(fav => fav.link === favorite.link)) {
    favorites.push(favorite);
    await setDoc(userRef, { favorites }, { merge: true });
  }
  return favorites;
}

// Remove a favorite (deal) from the user's favorites array by link
export async function removeFavorite(email: string, link: string) {
  const username = email.split('@')[0];
  const userRef = doc(db, "info", username);
  const userDoc = await getDoc(userRef);
  let favorites: { link: string; title: string }[] = [];
  if (userDoc.exists()) {
    favorites = userDoc.data().favorites || [];
  }
  // Remove favorite by link
  const newFavorites = favorites.filter(fav => fav.link !== link);
  await setDoc(userRef, { favorites: newFavorites }, { merge: true });
  return newFavorites;
}

export async function isPostDuplicate(title: string, link: string) {
  const usersSnapshot = await getDocs(collection(db, "info"));
  for (const userDoc of usersSnapshot.docs) {
    const posts = userDoc.data().posts || [];
    if (posts.some((post: any) => post.title === title || post.link === link)) {
      return true;
    }
  }
  return false;
}

export async function addPost(email: string, post: { title: string, link: string, imageUri: string, price: string, site: string }) {
// 1. Check for duplicate
  const isDuplicate = await isPostDuplicate(post.title, post.link);
  if (isDuplicate) {
    return { success: false, message: "Duplicate", posts: null };
  }
  // 2. Upload image and get URL
  const filename = `${Date.now()}_${post.title}.jpg`;
  console.log('Image URI before addPost:', post.imageUri);
  const imageUrl = await uploadPostImage(post.imageUri, filename);
  // 3. Add post to current user
  const username = email.split('@')[0];
  const userRef = doc(db, "info", username);
  const userDoc = await getDoc(userRef);
  let posts: { title: string; link: string; imageUrl: string; price: string; site: string }[] = [];
  if (userDoc.exists()) {
    posts = userDoc.data().posts || [];
  }
  posts.push({ title: post.title, link: post.link, imageUrl, price: post.price, site: post.site });
  await setDoc(userRef, { posts }, { merge: true }); // <-- This line saves to Firestore!
  const postsForUser = posts.map(({ title, link, imageUrl, price, site }) => ({ title, link, imageUrl, price, site }));
  return { success: true, message: "Added", posts: postsForUser };
}

// Get all user-posted deals across all users
// Flag (remove) a post and clean up favorites
export async function operateFlag(postLink: string, postOwnerUsername: string) {
  try {
    // 1. Remove from the owner’s posts array
    const ownerRef = doc(db, "info", postOwnerUsername);
    const ownerDoc = await getDoc(ownerRef);
    if (ownerDoc.exists()) {
      const posts: any[] = ownerDoc.data().posts || [];
      const newPosts = posts.filter(p => p.link !== postLink);
      await setDoc(ownerRef, { posts: newPosts }, { merge: true });
    }

    // 2. Remove from any user favorites
    const usersSnapshot = await getDocs(collection(db, "info"));
    const updatePromises: Promise<any>[] = [];
    usersSnapshot.forEach(userSnap => {
      const favs: any[] = userSnap.data().favorites || [];
      const newFavs = favs.filter(f => f.link !== postLink);
      if (newFavs.length !== favs.length) {
        updatePromises.push(
          setDoc(doc(db, "info", userSnap.id), { favorites: newFavs }, { merge: true })
        );
      }
    });

    if (updatePromises.length) {
      await Promise.all(updatePromises);
    }
    return true;
  } catch (err) {
    console.error("Error operating flag:", err);
    return false;
  }
}

export async function getAllPosts() {
  try {
    const snapshot = await getDocs(collection(db, "info"));
    const allPosts: { title: string; link: string; imageUrl?: string; price?: string; username: string; payment?: { paypal?: string; zelle?: string; venmo?: string } }[] = [];

    // Lazy import to avoid circular deps if any
    const { getStorage, ref, getDownloadURL } = await import("firebase/storage");
    const storage = getStorage();

    const urlPromises: Promise<void>[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const username = docSnap.id;
      if (data.posts && Array.isArray(data.posts)) {
        data.posts.forEach((p: any) => {
          const post = { ...p, username, payment: data.payment || {} } as any;
          // If imageUrl looks like a storage path (does not start with http)
          if (post.imageUrl && !post.imageUrl.startsWith('http')) {
            const promise = getDownloadURL(ref(storage, post.imageUrl)).then(url => {
              post.imageUrl = url;
            }).catch(() => {/* ignore individual errors */});
            urlPromises.push(promise);
          }
          allPosts.push(post);
        });
      }
    });

    // Wait for all URLs to resolve
    if (urlPromises.length) {
      await Promise.allSettled(urlPromises);
    }

    return allPosts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    throw error;
  }
} 
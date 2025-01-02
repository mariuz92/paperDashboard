import { auth } from "../utils/firebaseConfig";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { createUser, getUserById } from "./userApi";
import { IUser, Role } from "./userInterface/IUser";

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  role: Role
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Collect default or derived fields for our IUser:
    const newUser: IUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? "",

      // Some fields from `firebaseUser`
      photoURL: firebaseUser.photoURL || undefined,
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || undefined,

      // We'll store creation time as "now"
      createdAt: new Date(),
      // For lastLoginAt, if you want, we can also store "now" or rely on userCredential.user.metadata
      lastLoginAt: new Date(),

      // Use the role passed as a parameter
      role: role,

      // If you want new users to be active by default
      disabled: false,
    };

    // Create user doc in your DB (if user doc doesn't exist)
    await createUser(newUser);

    return firebaseUser;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("email"); // Remove the email from local storage
  } catch (error) {
    throw error;
  }
};

// Auth state listener
export const onAuthStateChangedListener = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Check if user doc already exists in DB
    const existingUser = await getUserById(firebaseUser.uid);
    if (!existingUser) {
      // create a new user doc
      const newUser: IUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "",
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        role: "rider", // or "guide" or your default role
        disabled: false,
      };
      await createUser(newUser);
    }
    // else {
    //   // If user doc already exists, optionally update lastLoginAt:
    //   await updateUser(firebaseUser.uid, { lastLoginAt: new Date() });
    // }

    return firebaseUser;
  } catch (error) {
    throw error;
  }
};

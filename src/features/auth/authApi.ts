import { auth } from "../../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { createUser, getUserById } from "../users/api/userApi";
import { IUser, Role } from "../../types/interfaces/IUser";

// Helper to store user info in localStorage
const storeUserInLocalStorage = (user: IUser) => {
  localStorage.setItem("email", user.email);
  localStorage.setItem("userInfo", JSON.stringify(user));
};

// Helper to clear user info from localStorage
const clearUserFromLocalStorage = () => {
  localStorage.removeItem("email");
  localStorage.removeItem("userInfo");
};

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

    const newUser: IUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? "",
      photoURL: firebaseUser.photoURL || "",
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || "",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: role,
      disabled: false,
    };

    // Create user in database
    await createUser(newUser);

    // Store user info in localStorage
    storeUserInLocalStorage(newUser);

    return firebaseUser;
  } catch (error) {
    console.error("Sign-up failed:", error);
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
    const firebaseUser = userCredential.user;

    // Retrieve user info from DB
    const existingUser = await getUserById(firebaseUser.uid);

    if (!existingUser) {
      throw new Error("User does not exist. Please register first.");
    }

    // Store user info in localStorage if not already present
    if (!localStorage.getItem("userInfo")) {
      storeUserInLocalStorage(existingUser);
    }

    return firebaseUser;
  } catch (error) {
    console.error("Sign-in failed:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    clearUserFromLocalStorage();
  } catch (error) {
    console.error("Sign-out failed:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChangedListener = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Check if user exists in DB
    const existingUser = await getUserById(firebaseUser.uid);
    if (!existingUser) {
      const newUser: IUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "",
        photoURL: firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        role: "", // Default role, can be modified
        disabled: false,
      };

      // Create user in database
      await createUser(newUser);

      // Store user info in localStorage
      storeUserInLocalStorage(newUser);
    } else {
      // Optionally update `lastLoginAt` and store info in localStorage
      storeUserInLocalStorage(existingUser);
    }

    return firebaseUser;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
};

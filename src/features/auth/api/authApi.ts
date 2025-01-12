import { auth } from "../../../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  createUser,
  getUserById,
  getTenantByName,
} from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import { ITenant } from "../../../types/interfaces/ITenant";
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
  tenantName: string
) => {
  try {
    // Fetch tenant details by name
    const tenant: ITenant | null = await getTenantByName(tenantName);
    if (!tenant) {
      throw new Error("Tenant does not exist.");
    }

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
      role: "",
      disabled: false,
      tenantId: tenantName,
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
export const signInWithEmail = async (
  email: string,
  password: string,
  tenantName: string
) => {
  try {
    // Fetch tenant details by name
    const tenant: ITenant | null = await getTenantByName(tenantName);
    if (!tenant) {
      throw new Error("Tenant does not exist.");
    }

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

    if (existingUser.tenantId !== tenant.id) {
      throw new Error("User does not belong to the specified tenant.");
    }

    // Store user info in localStorage
    storeUserInLocalStorage(existingUser);

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
export const signInWithGoogle = async (tenantName: string) => {
  try {
    // Fetch tenant details by name
    const tenant: ITenant | null = await getTenantByName(tenantName);
    if (!tenant) {
      throw new Error("Tenant does not exist.");
    }

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
        tenantId: tenant.id, // Use tenant ID from ITenant
      };

      // Create user in database
      await createUser(newUser);

      // Store user info in localStorage
      storeUserInLocalStorage(newUser);
    } else {
      if (existingUser.tenantId !== tenant.id) {
        throw new Error("User does not belong to the specified tenant.");
      }

      // Optionally update `lastLoginAt` and store info in localStorage
      storeUserInLocalStorage(existingUser);
    }

    return firebaseUser;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
};

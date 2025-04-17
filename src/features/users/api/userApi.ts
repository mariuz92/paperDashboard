import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { IUser } from "../../../types/interfaces/IUser";
import { ITenant } from "../../../types/interfaces/ITenant";

/**
 * Fetches a tenant by its name from Firestore.
 * @param name - The tenant's name to search for.
 * @returns A tenant object if found, otherwise null.
 */
export const getTenantByName = async (
  name: string
): Promise<ITenant | null> => {
  try {
    if (!name.trim()) {
      console.warn("Tenant name is empty.");
      return null;
    }

    // Convert the input name to uppercase for consistency with Firestore storage
    const formattedName = name.trim().toUpperCase();

    const tenantQuery = query(
      collection(db, "tenants"),
      where("name", "==", formattedName)
    );

    const querySnapshot = await getDocs(tenantQuery);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const tenant: ITenant = {
        id: docSnap.id,
        ...docSnap.data(),
      } as ITenant;

      return tenant;
    } else {
      console.log(
        `[getTenantByName] No tenant found with name: ${formattedName}`
      );
      return null;
    }
  } catch (error) {
    throw new Error("Failed to retrieve tenant");
  }
};

// Create user
export const createUser = async (user: Omit<IUser, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "users"), user);
    return docRef.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

// Function to check if a user exists in Firestore and create if not
export const ensureUserExists = async (user: Omit<IUser, "id">): Promise<string> => {
  try {
    const usersRef = collection(db, "users");

    // Query for a user with the same email OR name
    const userQuery = query(
      usersRef,
      where("email", "==", user.email) // You can add more conditions if needed
    );

    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      // User already exists, return the existing user's ID
      const existingUser = querySnapshot.docs[0];
      return existingUser.id;
    }

    // If user not found, create a new one
    const docRef = await addDoc(usersRef, user);
    return docRef.id;
  } catch (error) {
    console.error("Error checking or creating user:", error);
    throw new Error("Failed to check or create user");
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IUser;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user:", error);
    throw new Error("Failed to get user");
  }
};

// Get all users or users by role
export const getUsers = async (role?: string): Promise<IUser[]> => {
  try {
    const usersRef = collection(db, "users");
    let q;
    if (role) {
      q = query(usersRef, where("role", "array-contains", role));
    } else {
      q = query(usersRef);
    }
    const querySnapshot = await getDocs(q);
    const users: IUser[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as IUser);
    });
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Failed to get users");
  }
};

// Update user
export const updateUser = async (
  id: string,
  user: Partial<IUser>
): Promise<void> => {
  try {
    const docRef = doc(db, "users", id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "users", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as IUser;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Failed to get user by email");
  }
};

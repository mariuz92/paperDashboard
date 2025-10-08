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
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { IUser } from "../../../types/interfaces/IUser";
import { ITenant } from "../../../types/interfaces/ITenant";

/**
 * Fetches a tenant by its name from Firestore.
 */
export const getTenantByName = async (
  name: string
): Promise<ITenant | null> => {
  try {
    if (!name.trim()) {
      console.warn("Tenant name is empty.");
      return null;
    }

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
    console.error("[getTenantByName] Error:", error);
    throw new Error("Failed to retrieve tenant");
  }
};

/**
 * Update tenant by ID
 */
export const updateTenantById = async (
  id: string,
  updates: Partial<ITenant>
): Promise<void> => {
  try {
    if (!id) throw new Error("Tenant ID is required");
    const tenantRef = doc(db, "tenants", id);
    await setDoc(tenantRef, updates, { merge: true });
  } catch (error) {
    console.error("[updateTenantById] Error updating tenant:", error);
    throw new Error("Failed to update tenant");
  }
};

/**
 * Create user with proper Timestamp fields
 * Used for creating users from invitation flow
 */
export const createUser = async (user: Omit<IUser, "id">): Promise<string> => {
  try {
    // Ensure proper Timestamp fields
    const userData = {
      ...user,
      createdAt:
        user.createdAt instanceof Timestamp ? user.createdAt : Timestamp.now(),
      lastLoginAt:
        user.lastLoginAt instanceof Timestamp
          ? user.lastLoginAt
          : Timestamp.now(),
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      emailVerified: user.emailVerified || false,
      disabled: user.disabled || false,
    };

    const docRef = await addDoc(collection(db, "users"), userData);
    console.log(`[createUser] User created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[createUser] Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

/**
 * Check if a user exists and create if not
 * Useful for authentication flows
 */
export const ensureUserExists = async (
  user: Omit<IUser, "id">
): Promise<string> => {
  try {
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", user.email));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0];
      console.log(
        `[ensureUserExists] User already exists with ID: ${existingUser.id}`
      );
      return existingUser.id;
    }

    // Create new user with proper fields
    const userData = {
      ...user,
      createdAt:
        user.createdAt instanceof Timestamp ? user.createdAt : Timestamp.now(),
      lastLoginAt:
        user.lastLoginAt instanceof Timestamp
          ? user.lastLoginAt
          : Timestamp.now(),
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      emailVerified: user.emailVerified || false,
      disabled: user.disabled || false,
    };

    const docRef = await addDoc(usersRef, userData);
    console.log(`[ensureUserExists] New user created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[ensureUserExists] Error:", error);
    throw new Error("Failed to check or create user");
  }
};

/**
 * Get user by ID with proper type conversion
 */
export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    if (!id) {
      console.warn("[getUserById] No ID provided");
      return null;
    }

    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        phoneNumber: data.phoneNumber || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        lastLoginAt:
          data.lastLoginAt instanceof Timestamp
            ? data.lastLoginAt
            : Timestamp.now(),
        role: Array.isArray(data.role) ? data.role : [],
        disabled: data.disabled || false,
        tenantId: data.tenantId || "",
      } as IUser;
    } else {
      console.log(`[getUserById] No user found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error("[getUserById] Error getting user:", error);
    throw new Error("Failed to get user");
  }
};

/**
 * Get all users or users by role with proper type conversion
 * Used by RidersPage and GuidesPage
 */
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
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        phoneNumber: data.phoneNumber || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        lastLoginAt:
          data.lastLoginAt instanceof Timestamp
            ? data.lastLoginAt
            : Timestamp.now(),
        role: Array.isArray(data.role) ? data.role : [],
        disabled: data.disabled || false,
        tenantId: data.tenantId || "",
      } as IUser);
    });

    console.log(
      `[getUsers] Retrieved ${users.length} users${
        role ? ` with role: ${role}` : ""
      }`
    );
    return users;
  } catch (error) {
    console.error("[getUsers] Error getting users:", error);
    throw new Error("Failed to get users");
  }
};

/**
 * Get users by multiple roles
 * Useful for fetching users with any of the specified roles
 */
export const getUsersByRoles = async (roles?: string[]): Promise<IUser[]> => {
  try {
    const usersRef = collection(db, "users");
    let q;

    if (!roles || roles.length === 0) {
      q = query(usersRef);
    } else if (roles.length === 1) {
      q = query(usersRef, where("role", "array-contains", roles[0]));
    } else {
      q = query(usersRef, where("role", "array-contains-any", roles));
    }

    const snapshot = await getDocs(q);
    const users: IUser[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        phoneNumber: data.phoneNumber || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        lastLoginAt:
          data.lastLoginAt instanceof Timestamp
            ? data.lastLoginAt
            : Timestamp.now(),
        role: Array.isArray(data.role) ? data.role : [],
        disabled: data.disabled || false,
        tenantId: data.tenantId || "",
      } as IUser);
    });

    console.log(`[getUsersByRoles] Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    console.error("[getUsersByRoles] Error fetching users:", error);
    throw new Error("Failed to get users by roles");
  }
};

/**
 * Update user with proper field handling
 * IMPROVED: Uses updateDoc instead of setDoc for partial updates
 * This is more efficient and safer for updates
 */
export const updateUser = async (
  id: string,
  updates: Partial<IUser>
): Promise<void> => {
  try {
    if (!id) {
      throw new Error("User ID is required");
    }

    const docRef = doc(db, "users", id);

    // Clean update object - remove undefined values
    const cleanedData: any = {};
    Object.keys(updates).forEach((key) => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    // Update lastLoginAt timestamp
    cleanedData.lastLoginAt = Timestamp.now();

    // Use updateDoc for partial updates (more efficient than setDoc)
    await updateDoc(docRef, cleanedData);
    console.log(`[updateUser] User ${id} updated successfully`);
  } catch (error) {
    console.error("[updateUser] Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error("User ID is required");
    }

    const docRef = doc(db, "users", id);
    await deleteDoc(docRef);
    console.log(`[deleteUser] User ${id} deleted successfully`);
  } catch (error) {
    console.error("[deleteUser] Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};

/**
 * Get user by email with proper type conversion
 */
export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    if (!email) {
      console.warn("[getUserByEmail] No email provided");
      return null;
    }

    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        phoneNumber: data.phoneNumber || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        lastLoginAt:
          data.lastLoginAt instanceof Timestamp
            ? data.lastLoginAt
            : Timestamp.now(),
        role: Array.isArray(data.role) ? data.role : [],
        disabled: data.disabled || false,
        tenantId: data.tenantId || "",
      } as IUser;
    } else {
      console.log(`[getUserByEmail] No user found with email: ${email}`);
      return null;
    }
  } catch (error) {
    console.error("[getUserByEmail] Error getting user by email:", error);
    throw new Error("Failed to get user by email");
  }
};

/**
 * Batch update multiple users
 * Useful for bulk operations
 */
export const batchUpdateUsers = async (
  updates: Array<{ id: string; data: Partial<IUser> }>
): Promise<void> => {
  try {
    const promises = updates.map(({ id, data }) => updateUser(id, data));
    await Promise.all(promises);
    console.log(`[batchUpdateUsers] Updated ${updates.length} users`);
  } catch (error) {
    console.error("[batchUpdateUsers] Error:", error);
    throw new Error("Failed to batch update users");
  }
};

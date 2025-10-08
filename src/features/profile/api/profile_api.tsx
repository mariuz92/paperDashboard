import { db } from "../../../config/firebaseConfig";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { IUser } from "../../../types/interfaces/IUser";

/**
 * Fetch user profile from Firestore
 * Matches Flutter's User.fromJson structure
 */
export const getProfile = async (userId: string): Promise<IUser> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error("Profilo non trovato per l'utente specificato.");
    }

    const data = userDocSnap.data();

    // Ensure data matches IUser structure with proper defaults
    return {
      id: data.id || userId,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL || null,
      emailVerified: data.emailVerified || false,
      phoneNumber: data.phoneNumber || null,
      createdAt:
        data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      lastLoginAt:
        data.lastLoginAt instanceof Timestamp
          ? data.lastLoginAt
          : Timestamp.now(),
      role: Array.isArray(data.role) ? data.role : [],
      disabled: data.disabled || false,
      tenantId: data.tenantId || "",
    } as IUser;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Errore durante il recupero del profilo: " + error);
  }
};

/**
 * Update user profile in Firestore
 * Matches Flutter's User.toJson structure
 */
export const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);

    // Clean update object - only include provided fields
    const cleanedData: any = {};

    // Copy only the fields that exist in updateData
    Object.keys(updateData).forEach((key) => {
      cleanedData[key] = (updateData as any)[key];
    });

    // Always update lastLoginAt timestamp
    cleanedData.lastLoginAt = Timestamp.now();

    await updateDoc(userDocRef, cleanedData);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Errore durante l'aggiornamento del profilo: " + error);
  }
};

import { db } from "../../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { IUser } from "../../../types/interfaces/IUser";

/**
 * Recupera il profilo utente da Firestore.
 * @param userId - L'ID dell'utente (Firebase UID).
 * @returns Una Promise che risolve in un oggetto IUser.
 * @throws Errore se il profilo non viene trovato o se si verifica un problema durante il recupero.
 */
export const getProfile = async (userId: string): Promise<IUser> => {
  try {
    // Crea un riferimento al documento dell'utente nella collezione "users"
    const userDocRef = doc(db, "users", userId);
    // Recupera il documento da Firestore
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error("Profilo non trovato per l'utente specificato.");
    }

    // Restituisce i dati tipizzati come IUser
    return userDocSnap.data() as IUser;
  } catch (error) {
    throw new Error("Errore durante il recupero del profilo: " + error);
  }
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<void> => {
  try {
    // Crea un riferimento al documento dell'utente
    const userDocRef = doc(db, "users", userId);
    // Aggiorna il documento con i nuovi dati
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    throw new Error("Errore durante l'aggiornamento del profilo: " + error);
  }
};

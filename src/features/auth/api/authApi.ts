import { auth, db } from "../../../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  createUser,
  getUserById,
  getTenantByName,
} from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import { ITenant } from "../../../types/interfaces/ITenant";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Helper to store user info in localStorage
const storeUserInLocalStorage = (user: IUser) => {
  localStorage.setItem("email", user.email);
  // const newUser: Omit<IUser, "id"> = (({ id, ...rest }) => rest)(user);

  const userInfo = {
    role: user.role,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phone: user.phoneNumber,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    disabled: user.disabled,
  };
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
  localStorage.setItem("tenantId", user.tenantId);
};

// Helper to clear user info from localStorage
const clearUserFromLocalStorage = () => {
  localStorage.removeItem("email");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("userInfo");
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  tenantName: string,
  name: string,
  phoneNumber: number
): Promise<{ firebaseUser: any; tenantId: string }> => {
  try {
    // 1. Convert tenant name to a consistent format (e.g., uppercase)
    const upperTenantName = tenantName.toUpperCase();

    // 2. Query Firestore for an existing tenant whose 'name' field matches
    const tenantsRef = collection(db, "tenants");
    const tenantQuery = query(tenantsRef, where("name", "==", upperTenantName));
    const tenantSnapshot = await getDocs(tenantQuery);

    let tenantId: string;
    if (!tenantSnapshot.empty) {
      // Tenant exists; grab the first matched doc
      const existingTenantDoc = tenantSnapshot.docs[0];
      tenantId = existingTenantDoc.id;
    } else {
      // Tenant does not exist; create a new tenant doc with auto-generated ID
      const newTenantRef = await addDoc(collection(db, "tenants"), {
        name: upperTenantName,
        createdAt: new Date(),
        isActive: true,
        description: `Tenant for ${tenantName}`,
      });
      tenantId = newTenantRef.id; // Retrieve auto-generated ID
    }

    // 3. Create the Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // 4. Build the user object
    const newUser: IUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? name,
      photoURL: firebaseUser.photoURL || "",
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || phoneNumber.toString(),
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: !tenantSnapshot.empty ? "guide" : "admin",
      disabled: false,
      tenantId, // Use the tenant ID we found or just created
    };

    // 5. Save the user in Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    // 6. Store user info in localStorage
    storeUserInLocalStorage(newUser);

    return { firebaseUser, tenantId };
  } catch (error) {
    console.error("Sign-up failed:", error);
    throw error;
  }
};

/**
 * Updates the email verification status of the user.
 */
export const updateEmailVerified = async (email: string): Promise<void> => {
  const userRef = doc(db, "users", email);
  await updateDoc(userRef, { emailVerified: true });
};

// Sign in with email and password
export const signInWithEmail = async (
  companyName: string,
  email: string,
  password: string
) => {
  try {
    // Recupera i dettagli dell'azienda
    const company: ITenant | null = await getTenantByName(companyName);
    if (!company) {
      throw new Error("L'azienda specificata non esiste.");
    }

    // Effettua il login con Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Recupera le informazioni dell'utente dal database
    const existingUser = await getUserById(firebaseUser.uid);
    if (!existingUser) {
      throw new Error("L'utente non esiste. Registrati per continuare.");
    }

    // Controlla se l'utente appartiene all'azienda specificata
    if (existingUser.tenantId !== company.id) {
      throw new Error("L'utente non appartiene all'azienda specificata.");
    }

    // Memorizza le informazioni dell'utente in localStorage
    storeUserInLocalStorage(existingUser);

    return firebaseUser;
  } catch (error: any) {
    // Mappa gli errori Firebase in messaggi più comprensibili
    let errorMessage =
      "Si è verificato un errore durante l'accesso. Riprova più tardi.";

    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "L'email inserita non è registrata.";
          break;
        case "auth/wrong-password":
          errorMessage = "La password inserita non è corretta.";
          break;
        case "auth/invalid-email":
          errorMessage =
            "Formato email non valido. Inserisci un'email corretta.";
          break;
        case "auth/user-disabled":
          errorMessage =
            "Il tuo account è stato disabilitato. Contatta il supporto.";
          break;
        default:
          errorMessage =
            "Impossibile effettuare l'accesso. Controlla le credenziali e riprova.";
          break;
      }
    }

    throw new Error(errorMessage);
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

/**
 * Registers a user via the invitation link with tenant and OTP validation.
 */
export const registerWithInvitation = async (
  email: string,
  password: string,
  tenantId: string
): Promise<IUser> => {
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
      role: "rider",
      disabled: false,
      tenantId,
    };

    await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    storeUserInLocalStorage(newUser);

    return newUser;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChangedListener = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (companyName: string) => {
  try {
    // Recupera i dettagli dell'azienda per nome
    const company: ITenant | null = await getTenantByName(companyName);
    if (!company) {
      throw new Error("L'azienda non esiste.");
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Controlla se l'utente esiste nel database
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
        role: "", // Ruolo predefinito, può essere modificato
        disabled: false,
        tenantId: company.id, // Utilizza l'ID dell'azienda
      };

      // Crea un nuovo utente nel database
      await createUser(newUser);

      // Memorizza le informazioni dell'utente in localStorage
      storeUserInLocalStorage(newUser);
    } else {
      if (existingUser.tenantId !== company.id) {
        throw new Error("L'utente non appartiene all'azienda specificata.");
      }

      // Opzionalmente aggiorna `lastLoginAt` e memorizza le informazioni
      storeUserInLocalStorage(existingUser);
    }

    return firebaseUser;
  } catch (error) {
    console.error("❌ Accesso con Google fallito:", error);
    throw new Error("Errore durante l'accesso con Google. Riprova più tardi.");
  }
};

/**
 * Invia un'email di reimpostazione della password all'utente.
 * @param email - L'email dell'utente che richiede la reimpostazione della password.
 * @returns Un oggetto con lo stato dell'operazione.
 */
export const forgotPassword = async (
  email?: string
): Promise<{ success: boolean; message?: string; error?: Error }> => {
  try {
    // Validate email before making the request
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw new Error("Email non valida. Inserisci un'email corretta.");
    }

    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
      message:
        "Email per la reimpostazione della password inviata con successo. Controlla la tua casella di posta.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: new Error(
        error.message.includes("auth/invalid-email")
          ? "L'email inserita non è valida. Verifica e riprova."
          : "Invio dell'email di reimpostazione della password fallito. Riprova più tardi."
      ),
    };
  }
};

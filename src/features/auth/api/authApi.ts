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
  console.log(`Email verified successfully for ${email}`);
};

// Sign in with email and password
export const signInWithEmail = async (
  tenantName: string,
  email: string,
  password: string
) => {
  try {
    // Fetch tenant details by name
    const tenant: ITenant | null = await getTenantByName(tenantName);
    if (!tenant) {
      throw new Error("Tenant does not exist.");
    }
    console.log("Tenant", tenantName);
    console.log("email", email);
    console.log("pass", password);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Retrieve user info from DB
    const existingUser = await getUserById(firebaseUser.uid);
    console.log("existingUser", existingUser?.tenantId);
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

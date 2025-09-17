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
import { IUser, Role } from "../../../types/interfaces/IUser";
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
import {
  consumeInvitation,
  getInvitationByToken,
} from "../../users/api/invitationApi";
import { IInvitation } from "../../../types/interfaces/IInvitations";

// User role constants
const ROLES: Record<string, Role> = {
  ADMIN: "admin",
  GUIDE: "guide",
  RIDER: "rider",
};

// Helper to store user info in localStorage
const storeUserInLocalStorage = (user: IUser) => {
  localStorage.setItem("email", user.email);

  const userInfo = {
    role: user.role,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phone: user.phoneNumber,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    disabled: user.disabled,
    isAdmin: user.isAdmin,
  };
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
  localStorage.setItem("tenantId", user.tenantId);
};

const storeChannelsUsage = (
  channels: number,
  iddleChannels: number[],
  disabledChannels: number[]
) => {
  localStorage.setItem("channels", JSON.stringify(channels));
  localStorage.setItem("Iddlechannels", JSON.stringify(iddleChannels));
  localStorage.setItem("disabledChannels", JSON.stringify(disabledChannels));
};

// Helper to clear user info from localStorage
const clearUserFromLocalStorage = () => {
  localStorage.removeItem("email");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("channels");
  localStorage.removeItem("Iddlechannels");
};

// Function to normalize tenant name (prevent case-sensitivity issues)
const normalizeTenantName = (name: string): string => {
  return name.trim().toUpperCase();
};

// Function to check if user can access the platform
export const canAccessPlatform = (user: IUser): boolean => {
  if (!user || user.disabled) {
    return false;
  }

  // Guides can sign up but cannot access the platform
  if (user.role.includes(ROLES.GUIDE) && !user.role.includes(ROLES.ADMIN)) {
    return false;
  }

  // Admins always have access
  if (user.isAdmin || user.role.includes(ROLES.ADMIN)) {
    return true;
  }

  // Riders have access
  if (user.role.includes(ROLES.RIDER)) {
    return true;
  }

  // Default: no access for undefined roles
  return false;
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
    // 1. Normalize tenant name to prevent typos and case-sensitivity issues
    const normalizedTenantName = normalizeTenantName(tenantName);

    // 2. Query Firestore for an existing tenant
    const tenantsRef = collection(db, "tenants");
    const tenantQuery = query(
      tenantsRef,
      where("name", "==", normalizedTenantName)
    );
    const tenantSnapshot = await getDocs(tenantQuery);

    let tenantId: string;
    const isNewTenant = tenantSnapshot.empty;

    if (!isNewTenant) {
      // Tenant exists; grab the first matched doc
      const existingTenantDoc = tenantSnapshot.docs[0];
      tenantId = existingTenantDoc.id;
    } else {
      // Tenant does not exist; create a new tenant doc with auto-generated ID
      const newTenantData: ITenant = {
        id: "", // Will be assigned after adding the document
        name: normalizedTenantName,
        createdAt: new Date(),
        isActive: true,
        description: `Tenant for ${tenantName}`,
        channelsNum: 35,
        iddleChannels: [],
        disabledChannels: [],
      };
      const newTenantRef = await addDoc(
        collection(db, "tenants"),
        newTenantData
      );
      tenantId = newTenantRef.id;

      // Update `id` field inside Firestore after the document is created
      await updateDoc(doc(db, "tenants", tenantId), { id: tenantId });
    }

    // 3. Create the Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // 4. Build the user object with proper role assignment
    // If tenant is new -> user becomes admin
    // If tenant exists -> user becomes guide
    const newUser: IUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? name,
      photoURL: firebaseUser.photoURL || "",
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || phoneNumber.toString(),
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: isNewTenant ? [ROLES.ADMIN] : [ROLES.GUIDE],
      isAdmin: isNewTenant, // true if creating a new tenant
      disabled: false,
      tenantId,
    };

    // 5. Save the user in Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    // 6. Store user info in localStorage
    storeUserInLocalStorage(newUser);

    // 7. If this is a tenant, store channel information
    if (isNewTenant) {
      storeChannelsUsage(35, [], []);
    } else {
      // Get tenant data to store channels information
      const tenantDoc = await getDoc(doc(db, "tenants", tenantId));
      if (tenantDoc.exists()) {
        const tenantData = tenantDoc.data() as ITenant;
        storeChannelsUsage(
          tenantData.channelsNum ?? 0,
          tenantData.iddleChannels ?? [],
          tenantData.disabledChannels ?? []
        );
      }
    }

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
    // Normalize company name to prevent case-sensitivity issues
    const normalizedCompanyName = normalizeTenantName(companyName);

    // Get company details
    const company: ITenant | null = await getTenantByName(
      normalizedCompanyName
    );
    if (!company) {
      throw new Error("L'azienda specificata non esiste.");
    }

    // Store channel information
    storeChannelsUsage(
      company.channelsNum ?? 0,
      company.iddleChannels ?? [],
      company.disabledChannels ?? []
    );

    // Perform login with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Get user information from database
    const existingUser = await getUserById(firebaseUser.uid);
    if (!existingUser) {
      throw new Error("L'utente non esiste. Registrati per continuare.");
    }

    // Check if user belongs to the specified company
    if (existingUser.tenantId !== company.id) {
      throw new Error("L'utente non appartiene all'azienda specificata.");
    }

    // Check if user can access the platform based on role
    if (!canAccessPlatform(existingUser)) {
      throw new Error("Non hai i permessi per accedere alla piattaforma.");
    }

    // Update last login time
    await updateDoc(doc(db, "users", firebaseUser.uid), {
      lastLoginAt: new Date(),
    });

    // Update user in memory with new login time
    existingUser.lastLoginAt = new Date();

    // Store user information in localStorage
    storeUserInLocalStorage(existingUser);

    return firebaseUser;
  } catch (error: any) {
    // Map Firebase errors to more user-friendly messages
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
    } else if (error.message) {
      // Use the custom error message if available
      errorMessage = error.message;
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

/// ⬇️ REPLACE your current registerWithInvitation with this version
export const registerWithInvitation = async (
  token: string,
  password: string
): Promise<IUser> => {
  try {
    // 1) Fetch invite (email, tenantId, role[], optional displayName)
    const invite = (await getInvitationByToken(token)) as Pick<
      IInvitation,
      "email" | "tenantId"
    > & { role?: Role[]; displayName?: string };

    const { email, tenantId } = invite;
    const invitedRoles = Array.isArray(invite.role) ? invite.role : [];

    // Ensure only known roles are used (defensive)
    const allowed = new Set<Role>(Object.values(ROLES) as Role[]);
    const finalRoles: Role[] =
      invitedRoles.filter((r): r is Role => allowed.has(r)) || [];

    // Fallback if invite didn't specify any role
    const rolesToAssign: Role[] = finalRoles.length
      ? finalRoles
      : [ROLES.RIDER];

    // 2) Create Auth user with invited email
    const { user: fbUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 3) Create Firestore user profile bound to the invited tenant
    const newUser: IUser = {
      id: fbUser.uid,
      email: fbUser.email ?? email,
      displayName: invite.displayName ?? fbUser.displayName ?? "",
      photoURL: fbUser.photoURL || "",
      emailVerified: fbUser.emailVerified,
      phoneNumber: fbUser.phoneNumber || "",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: rolesToAssign,
      isAdmin: rolesToAssign.includes(ROLES.ADMIN),
      disabled: false,
      tenantId, // ✅ multi-tenant: comes from invite
    };

    await setDoc(doc(db, "users", fbUser.uid), newUser);

    // 4) Mark invite as consumed
    await consumeInvitation(token);

    // 5) (Optional) preload tenant channel info like in signInWithEmail
    const tenantDoc = await getDoc(doc(db, "tenants", tenantId));
    if (tenantDoc.exists()) {
      const t = tenantDoc.data() as ITenant;
      storeChannelsUsage(
        t.channelsNum ?? 0,
        t.iddleChannels ?? [],
        t.disabledChannels ?? []
      );
    }

    // 6) Persist session info
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
    // Normalize company name
    const normalizedCompanyName = normalizeTenantName(companyName);

    // Get company details by name
    const company: ITenant | null = await getTenantByName(
      normalizedCompanyName
    );
    if (!company) {
      throw new Error("L'azienda non esiste.");
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Check if user exists in database
    const existingUser = await getUserById(firebaseUser.uid);
    if (!existingUser) {
      // If user doesn't exist, create a new one with guide role
      // (assuming they're joining an existing company)
      const newUser: IUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "",
        photoURL: firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        role: [ROLES.GUIDE], // Default role for new users with Google sign-in
        isAdmin: false,
        disabled: false,
        tenantId: company.id,
      };

      // Create new user in database
      await createUser(newUser);

      // Store user information in localStorage
      storeUserInLocalStorage(newUser);

      // Inform the user they won't have platform access
      throw new Error(
        "Registrazione completata. Il tuo account è stato creato con il ruolo di guida. Un amministratore deve approvare il tuo accesso alla piattaforma."
      );
    } else {
      // User already exists
      if (existingUser.tenantId !== company.id) {
        throw new Error("L'utente non appartiene all'azienda specificata.");
      }

      // Check if user can access platform
      if (!canAccessPlatform(existingUser)) {
        throw new Error("Non hai i permessi per accedere alla piattaforma.");
      }

      // Update last login time
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        lastLoginAt: new Date(),
      });

      // Update user in memory with new login time
      existingUser.lastLoginAt = new Date();

      // Store user information in localStorage
      storeUserInLocalStorage(existingUser);
    }

    return firebaseUser;
  } catch (error: any) {
    console.error("❌ Accesso con Google fallito:", error);
    throw new Error(
      error.message || "Errore durante l'accesso con Google. Riprova più tardi."
    );
  }
};

/**
 * Sends a password reset email to the user.
 * @param email - The email of the user requesting password reset.
 * @returns An object with the operation status.
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

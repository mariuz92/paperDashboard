// invitationApi.ts
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  updateDoc,
} from "firebase/firestore";
import { sendSignInLinkToEmail, ActionCodeSettings } from "firebase/auth";
import { db, auth } from "../../../config/firebaseConfig";
import { IInvitation } from "../../../types/interfaces/IInvitations";
import { baseUrl } from "../../../shared/utils/baseUrl";

/**
 * Stores the invitation data in Firestore.
 */
export const storeInvitation = async (
  invitation: IInvitation & { role?: string[] }
) => {
  const token = generateInviteToken();
  const invitationDoc = doc(db, "invitations", token);
  await setDoc(invitationDoc, {
    token,
    email: invitation.email,
    tenantId: invitation.tenantId,
    role: invitation.role ?? [],
    // keep OTP only if you still want it
    otp: invitation.otp ?? null,
    used: false,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    createdAt: serverTimestamp(),
  });
  return token; // ⬅️ return token so you can email a link like /join?token=...
};

// invitationApi.ts — ADD
export const generateInviteToken = () =>
  [...crypto.getRandomValues(new Uint8Array(24))]
    .map(
      (b) =>
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"[
          b % 64
        ]
    )
    .join("");

// invitationApi.ts — EDIT sendInvitationEmail to send a token link
export const sendInvitationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const actionCodeSettings: ActionCodeSettings = {
    url: `${baseUrl()}/join?token=${encodeURIComponent(token)}`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  console.log(`Invitation link sent to ${email} with token.`);
};

// invitationApi.ts — (optional) keep backward-compat validate by email+otp
export const validateInvitation = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const snapshot = await getDoc(doc(db, "invitations", email)); // legacy docs (email as id)
  if (!snapshot.exists()) return false;
  const data = snapshot.data() as IInvitation;
  return data.otp === otp;
};

// invitationApi.ts — ADD helpers for validation/consume by token
export const getInvitationByToken = async (token: string) => {
  const snap = await getDoc(doc(db, "invitations", token));
  if (!snap.exists()) throw new Error("Invito non valido");
  const data = snap.data() as any;
  if (data.used) throw new Error("Invito già utilizzato");
  if (Date.now() > data.expiresAt) throw new Error("Invito scaduto");
  return data as {
    email: string;
    tenantId: string;
    role: string[];
  };
};

export const consumeInvitation = async (token: string) => {
  await updateDoc(doc(db, "invitations", token), {
    used: true,
    usedAt: Date.now(),
  });
};

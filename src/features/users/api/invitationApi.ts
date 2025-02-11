// invitationApi.ts
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { sendSignInLinkToEmail, ActionCodeSettings } from "firebase/auth";
import { db, auth } from "../../../config/firebaseConfig";
import { IInvitation } from "../../../types/interfaces/IInvitations";
import { baseUrl } from "../../../shared/utils/baseUrl";

/**
 * Stores the invitation data in Firestore.
 */
export const storeInvitation = async (
  invitation: IInvitation
): Promise<void> => {
  const invitationDoc = doc(db, "invitations", invitation.email);
  await setDoc(invitationDoc, {
    ...invitation,
    createdAt: serverTimestamp(),
  });
};

/**
 * Sends an email invitation with a custom action link and separately sends OTP.
 */
export const sendInvitationEmail = async (
  email: string,
  otp: string,
  tenantID: string
): Promise<void> => {
  // Create an action link without OTP
  const actionCodeSettings: ActionCodeSettings = {
    url: `${baseUrl()}/join?email=${encodeURIComponent(
      email
    )}&tenant=${encodeURIComponent(tenantID)}&OTP=${encodeURIComponent(otp)}`,
    handleCodeInApp: true,
  };

  // Store the OTP in Firestore (to validate later)
  const otpRef = doc(collection(db, "invitations"), email);
  await setDoc(otpRef, {
    email,
    otp,
    tenantID,
    createdAt: serverTimestamp(),
  });

  // Send the email with just the link, OTP will be sent via a separate email
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  console.log(`Invitation link sent to ${email}. OTP stored securely.`);
};

/**
 * Validates an invitation by checking the OTP.
 */
export const validateInvitation = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const invitationDoc = doc(db, "invitations", email);
  const snapshot = await getDoc(invitationDoc);

  if (snapshot.exists()) {
    const data = snapshot.data() as IInvitation;
    return data.otp === otp;
  }
  return false;
};

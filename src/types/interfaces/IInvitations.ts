// IInvitation.ts
import { Timestamp, FieldValue } from "firebase/firestore";

export interface IInvitation {
  token: string; // doc id
  email: string;
  tenantId: string;
  role: string[]; // preassigned roles
  otp?: string | null; // optional if you still use OTP
  used: boolean;
  expiresAt: number; // epoch ms
  createdAt: Timestamp | FieldValue; // serverTimestamp() when writing
}

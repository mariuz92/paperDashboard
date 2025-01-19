// IInvitation.ts
export interface IInvitation {
  email: string;
  tenantId: string;
  otp: string;
  createdAt?: string; // Optional, as it may not always be provided
}

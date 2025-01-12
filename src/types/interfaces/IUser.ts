// Define the Role type
export type Role = "admin" | "rider" | "guide" | "";

// Define the IUser interface
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  createdAt: Date;
  lastLoginAt: Date;
  role: Role;
  disabled: boolean;
  tenantId: string;
}

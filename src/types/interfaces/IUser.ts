// IUser.ts - Matching Flutter User class exactly

import { Timestamp } from "firebase/firestore";

// Define the Role type matching Flutter enum
export type Role = "admin" | "rider" | "guide" | "";

// Define the IUser interface matching Flutter User class
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified: boolean;
  phoneNumber?: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  role: Role[]; // Array of roles, matching Flutter's List<Role>
  disabled: boolean;
  tenantId: string;
}

// Helper function to convert role string to Role type
export const roleFromString = (role: string): Role => {
  switch (role) {
    case "admin":
      return "admin";
    case "rider":
      return "rider";
    case "guide":
      return "guide";
    case "":
      return "";
    default:
      throw new Error(`Unknown role: ${role}`);
  }
};

// Helper to check if user is admin
export const isUserAdmin = (user: IUser): boolean => {
  return user.role.includes("admin");
};

// Helper to check if user has a specific role
export const hasRole = (user: IUser, role: Role): boolean => {
  return user.role.includes(role);
};

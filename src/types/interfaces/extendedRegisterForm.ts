import { RegisterFormTypes } from "@refinedev/core";

export interface ExtendedRegisterFormTypes extends RegisterFormTypes {
  companyName?: string; // New property added
  name?: string;
  phoneNumber?: number;
}

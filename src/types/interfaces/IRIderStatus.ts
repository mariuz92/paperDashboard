// IRiderStatus.ts
import { Timestamp } from "firebase/firestore";
import { IOrderStatus } from "./index";

export interface IRiderStatus {
  riderId: string;
  lastUpdate: Timestamp;
  headingTo: string | null;
  lastStatus: IOrderStatus;
  isBusy: boolean;
}

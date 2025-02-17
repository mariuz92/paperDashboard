import { Timestamp } from "firebase/firestore";
import { IOrder } from ".";

export interface IGetOrdersParams {
  page?: number; // Current page (default: 1)
  pageSize?: number; // Number of items per page (default: 10)
  startDate?: Timestamp; // Filter by orders after this date
  endDate?: Timestamp; // Filter by orders before this date
  orderByField?: keyof IOrder | string; // Field to sort by
  orderDirection?: "asc" | "desc"; // Sort direction
}

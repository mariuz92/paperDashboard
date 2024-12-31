import { IOrder } from "../../interfaces";

export interface IGetOrdersParams {
  page?: number; // Current page (default: 1)
  pageSize?: number; // Number of items per page (default: 10)
  startDate?: string; // Filter by orders after this date
  endDate?: string; // Filter by orders before this date
  orderByField?: keyof IOrder; // Field to sort by
  orderDirection?: "asc" | "desc"; // Sort direction
}

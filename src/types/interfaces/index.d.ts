import { Timestamp } from "firebase/firestore";

export interface ICategory {
  id: number;
  title: string;
}
export interface IPost {
  id: number;
  title: string;
  content: string;
  status: "published" | "draft" | "rejected";
  category: { id: number };
}

export type IOrderStatus =
  | "In Consegna"
  | "Presa in Carico"
  | "Consegnato"
  | "Ritirato";

export interface IOrder {
  id?: string;

  nomeGuida?: string;

  canaleRadio?: string;

  orarioConsegna?: Timestamp | Dayjs;

  luogoConsegna?: string;

  oraRitiro?: Timestamp | Dayjs;

  luogoRitiro?: string;

  radiolineConsegnate?: number;

  extra?: number;

  saldo?: number;

  status: IOrderStatus;

  note?: string;

  lost?: number;
}

const colors: Record<IOrderStatus, string> = {
  "In Consegna": "blue",
  "Presa in Carico": "gold",
  Consegnato: "green",
};

export interface IGetOrdersParams {
  page?: number;
  pageSize?: number;
  startDate?: Timestamp; // or Date, depending on usage
  endDate?: Timestamp; // or Date
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

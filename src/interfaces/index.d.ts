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

  orarioConsegna?: string | Dayjs;

  luogoConsegna?: string;

  oraRitiro?: string | Dayjs;

  luogoRitiro?: string;

  radiolineConsegnate?: number;

  extra?: number;

  saldo?: number;

  status: IOrderStatus;

  note?: string;
}

const colors: Record<IOrderStatus, string> = {
  "In Consegna": "blue",
  "Presa in Carico": "gold",
  Consegnato: "green",
};

export interface IGetOrdersParams {
  page?: number;
  pageSize?: number;
  startDate?: string; // or Date, depending on usage
  endDate?: string; // or Date
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

import { Timestamp } from "firebase/firestore";

export type IOrderStatus =
  | "In Consegna"
  | "Presa in Carico"
  | "Consegnato"
  | "Attesa ritiro"
  | "Annullato"
  | "In Ritiro"
  | "Ritirato";

export interface IOrder {
  id?: string;

  nomeGuida?: string;

  telefonoGuida?: string;

  canaleRadio?: string;

  orarioConsegna?: Timestamp | Dayjs;

  luogoConsegna?: string;

  oraRitiro?: Timestamp | Dayjs;

  luogoRitiro?: string;

  radioguideConsegnate?: number;

  extra?: number;

  saldo?: number;

  status: IOrderStatus;

  note?: string;

  lost?: number;

  consegnatoDa?: string 
  
  ritiratoDa? : string 
}

const colors: Record<IOrderStatus, string> = {
  "In Consegna": "blue",
  "Presa in Carico": "gold",
  Consegnato: "green",
  "Attesa ritiro": "orange",
  Annullato: "red",
  "In Ritiro": "purple",
  Ritirato: "cyan",
};

export interface IGetOrdersParams {
  page?: number;
  pageSize?: number;
  startDate?: Timestamp; // or Date, depending on usage
  endDate?: Timestamp; // or Date
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

// buildHeatmapData.ts
import dayjs from "dayjs";
import { IOrder } from "../../types/interfaces";

export interface OrdersHeatmapData {
  day: string;
  hour: number;
  delivered: number;
  retrieved: number;
}

function getDate(orderTime: any) {
  // If orderTime is a Firebase Timestamp, it has a .toDate() method.
  // Otherwise, assume it is already a date-like value (or a Dayjs object)
  return orderTime?.toDate ? dayjs(orderTime.toDate()) : dayjs(orderTime);
}

export function buildHeatmapData(orders: IOrder[]): OrdersHeatmapData[] {
  // Use an object to aggregate counts by day-hour key.
  const heatmap: Record<string, OrdersHeatmapData> = {};

  orders.forEach((order) => {
    // Process delivery time (orarioConsegna)
    if (order.oraConsegna) {
      const deliveryDate = getDate(order.oraConsegna);
      const day = deliveryDate.format("dddd"); // e.g., "Monday"
      const hour = deliveryDate.hour(); // returns an integer (0-23)
      const key = `${day}-${hour}`;
      if (!heatmap[key]) {
        heatmap[key] = { day, hour, delivered: 0, retrieved: 0 };
      }
      heatmap[key].delivered += 1;
    }

    // Process retrieval time (oraRitiro)
    if (order.oraRitiro) {
      const retrievalDate = getDate(order.oraRitiro);
      const day = retrievalDate.format("dddd");
      const hour = retrievalDate.hour();
      const key = `${day}-${hour}`;
      if (!heatmap[key]) {
        heatmap[key] = { day, hour, delivered: 0, retrieved: 0 };
      }
      heatmap[key].retrieved += 1;
    }
  });

  // Return the aggregated data as an array.
  return Object.values(heatmap);
}

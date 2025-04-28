import {
  collection,
  getDocs,
  QuerySnapshot,
  DocumentData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { IOrder, IGetOrdersParams } from "../../../types/interfaces";
import dayjs from "dayjs";

/* ------------------------------------------------------------------
   1) INTERFACES FOR COUNTING DAILY & MONTHLY ORDERS (DELIVERIES + PICKUPS)
   ------------------------------------------------------------------ */

/**
 * Tracks how many orders were *delivered* (consegne) and *picked up* (ritiri)
 * on a particular date (YYYY-MM-DD).
 */
export interface IDailyCount {
  date: string; // e.g. "2025-01-15"
  consegne: number; // # of deliveries on that date
  ritiri: number; // # of pickups on that date
}

/**
 * Tracks total orders (deliveries + pickups) in a particular month (YYYY-MM).
 */
export interface IMonthlyCount {
  month: string; // e.g. "2025-01"
  total: number; // # of all orders (deliveries + pickups) in that month
}

/* ------------------------------------------------------------------
   2) CRUD FUNCTIONS
   ------------------------------------------------------------------ */

/**
 * Save an order to Firebase Firestore.
 * @param {Omit<IOrder, "id">} order - The order object to save (excluding the ID).
 * @returns {Promise<string>} - The document ID of the saved order.
 */
export const saveOrder = async (order: Omit<IOrder, "id">): Promise<string> => {
  try {
    const ordersCollection = collection(db, "orders");
    const docRef = await addDoc(ordersCollection, order);
    console.log("Order saved with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
};

/**
 * Build a Firestore query with optional Timestamp filters.
 *
 * @param {Timestamp | undefined} startDate
 * @param {Timestamp | undefined} endDate
 * @param {keyof IOrder | string} orderByField - e.g. "oraConsegna"
 * @param {"asc" | "desc"} orderDirection
 */
const buildBaseQuery = (
  startDate?: Timestamp,
  endDate?: Timestamp,
  orderByField: keyof IOrder | string = "oraConsegna",
  orderDirection: "asc" | "desc" = "asc"
) => {
  const baseRef = collection(db, "orders");
  let q = query(baseRef);

  if (startDate) {
    q = query(q, where("oraConsegna", ">=", startDate));
  }
  if (endDate) {
    q = query(q, where("oraConsegna", "<=", endDate));
  }

  // `orderBy` expects a string. Cast if orderByField is keyof IOrder.
  q = query(q, orderBy(orderByField as string, orderDirection));

  return q;
};

/**
 * Fetch orders from Firestore with pagination, date filters, and sorting.
 * If a date range is provided (startDate and endDate), orders will be fetched
 * if either their delivery date (**oraConsegna**) OR their retrieval date (**oraRitiro**)
 * fall within the range. Additionally, orders with status "Attesa ritiro" that are missing
 * the retrieval time are always included.
 *
 * @param {IGetOrdersParams} params
 * @returns {Promise<{ data: IOrder[]; total: number }>}
 */
export const getOrders = async (
  params: IGetOrdersParams
): Promise<{
  data: IOrder[];
  total: number;
}> => {
  const {
    page = 1,
    pageSize = 10,
    startDate,
    endDate,
    orderByField = "oraConsegna",
    orderDirection = "asc",
  } = params;

  try {
    let mergedData: IOrder[] = [];
    let total = 0;

    if (startDate && endDate) {
      // -----------------------------------------------------------
      // 1. Run two queries:
      //    a. Orders where the delivery date (oraConsegna) is in range.
      //    b. Orders where the retrieval date (oraRitiro) is in range.
      // -----------------------------------------------------------
      const consegnaQuery = query(
        collection(db, "orders"),
        where("oraConsegna", ">=", startDate),
        where("oraConsegna", "<=", endDate),
        orderBy(orderByField, orderDirection)
      );

      const ritiroQuery = query(
        collection(db, "orders"),
        where("oraRitiro", ">=", startDate),
        where("oraRitiro", "<=", endDate),
        orderBy(orderByField, orderDirection)
      );

      const [consegnaSnap, ritiroSnap] = await Promise.all([
        getDocs(consegnaQuery),
        getDocs(ritiroQuery),
      ]);

      const consegnaData: IOrder[] = consegnaSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as IOrder),
      }));

      const ritiroData: IOrder[] = ritiroSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as IOrder),
      }));

      // Merge and deduplicate orders (an order may match both queries)
      mergedData = [...consegnaData, ...ritiroData].filter(
        (order, index, self) =>
          self.findIndex((o) => o.id === order.id) === index
      );

      total = mergedData.length;

      // -----------------------------------------------------------
      // 2. Sort the merged results by the chosen date field.
      //    For orders missing the field, treat the date as 0 (very early).
      // -----------------------------------------------------------
      mergedData.sort((a, b) => {
        // Attempt to convert to Date if using a Firestore Timestamp.
        const aField = a[orderByField as keyof IOrder];
        const bField = b[orderByField as keyof IOrder];

        const aDate =
          aField && (aField as any).toDate
            ? (aField as any).toDate()
            : new Date(aField || 0);
        const bDate =
          bField && (bField as any).toDate
            ? (bField as any).toDate()
            : new Date(bField || 0);

        return orderDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });

      // -----------------------------------------------------------
      // 3. Apply manual pagination.
      // -----------------------------------------------------------
      const startIdx = (page - 1) * pageSize;
      mergedData = mergedData.slice(startIdx, startIdx + pageSize);
    } else {
      // -----------------------------------------------------------
      // Fallback: If no date range is provided, use the standard base query.
      // -----------------------------------------------------------
      let baseQuery = buildBaseQuery(
        startDate,
        endDate,
        orderByField,
        orderDirection
      );

      // Count total docs for pagination.
      const totalSnapshot = await getDocs(baseQuery);
      total = totalSnapshot.size;

      // Pagination: Skip docs if needed.
      const offset = (page - 1) * pageSize;
      let lastVisibleDoc = null;

      if (offset > 0) {
        const skipQuery = query(baseQuery, limit(offset));
        const skipSnapshot = await getDocs(skipQuery);

        if (skipSnapshot.docs.length > 0) {
          lastVisibleDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        }
      }

      if (lastVisibleDoc) {
        baseQuery = query(baseQuery, startAfter(lastVisibleDoc));
      }

      baseQuery = query(baseQuery, limit(pageSize));
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
        baseQuery
      );
      mergedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as IOrder),
      }));
    }

    // -----------------------------------------------------------
    // 4. Always include orders with status "Attesa ritiro" that have missing oraRitiro.
    // -----------------------------------------------------------
    const attesaRitiroNoTimeQuery = query(
      collection(db, "orders"),
      where("status", "==", "Attesa ritiro"),
      where("oraRitiro", "==", null)
    );
    const attesaRitiroNoTimeSnap = await getDocs(attesaRitiroNoTimeQuery);
    const attesaRitiroNoTimeData: IOrder[] = attesaRitiroNoTimeSnap.docs.map(
      (doc) => ({
        id: doc.id,
        ...(doc.data() as IOrder),
      })
    );

    // -----------------------------------------------------------
    // 5. Merge the main results with the "Attesa ritiro" orders and deduplicate.
    // -----------------------------------------------------------
    let combinedData = [...mergedData, ...attesaRitiroNoTimeData];
    combinedData = combinedData.filter(
      (order, index, self) => self.findIndex((o) => o.id === order.id) === index
    );

    return { data: combinedData, total };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
// // Example placeholder for your existing base query builder
// function buildBaseQuery(
//   startDate?: Date,
//   endDate?: Date,
//   orderByField?: string,
//   orderDirection?: "asc" | "desc"
// ) {
//   let q = collection(db, "orders");
//   // Set up your date-range, orderBy, etc.
//   // e.g. q = query(q, where("oraConsegna", ">=", startDate), ... );
//   // e.g. q = query(q, orderBy(orderByField, orderDirection));
//   return q;
// }

/**
 * Get an order by ID from Firebase Firestore.
 * @param id - The document ID of the order
 * @returns The order object if found, otherwise null.
 */

export const getOrderById = async (
  orderId: string,
  riderId: string
): Promise<IOrder | null> => {
  try {
    // First, verify that the rider exists and has role "rider"
    const riderRef = doc(db, "users", riderId);
    const riderSnap = await getDoc(riderRef);

    if (!riderSnap.exists() || riderSnap.data()?.role !== "rider") {
      console.log("Unauthorized: Rider does not exist or is not a rider");
      return null;
    }

    // Then, fetch the order and ensure the rider is assigned to it
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.log("No such order found!");
      return null;
    }

    const orderData = orderSnap.data() as IOrder;

    // if (orderData.riderId !== riderId) {
    //   console.log(
    //     "Unauthorized: This order is not assigned to the provided rider."
    //   );
    //   return null;
    // }

    // If all checks pass, return the order
    return {
      id: orderSnap.id,
      ...orderData,
    };
  } catch (error) {
    console.error("Error getting order:", error);
    throw new Error("Failed to get order");
  }
};

/**
 * Update an order in Firebase Firestore.
 * @param id - The document ID of the order to update.
 * @param updatedOrder - The fields to update.
 */
export const updateOrder = async (
  id: string,
  updatedOrder: Partial<IOrder>
): Promise<void> => {
  try {
    const orderDocRef = doc(db, "orders", id);
    await updateDoc(orderDocRef, updatedOrder);
    console.log(`Order with ID: ${id} updated successfully.`);
  } catch (error) {
    console.error(`Error updating order with ID: ${id}`, error);
    throw error;
  }
};

/**
 * Delete an order from Firebase Firestore.
 * @param {string} id - The document ID of the order to delete.
 * @returns {Promise<void>} - Resolves when the document is deleted.
 */
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    const orderDocRef = doc(db, "orders", id);
    await deleteDoc(orderDocRef);
    console.log(`Order with ID: ${id} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting order with ID: ${id}`, error);
    throw error;
  }
};

/* ------------------------------------------------------------------
   3) AGGREGATOR FOR DAILY & MONTHLY COUNTS (DELIVERIES & PICKUPS)
   ------------------------------------------------------------------ */

/**
 * Fetch orders grouped by day and month for both deliveries (consegne)
 * and pickups (ritiri). If `oraRitiro` is on a different date than
 * `oraConsegna`, that order appears on two distinct days.
 *
 * Also calculates monthly totals (sum of deliveries+pickups in that month).
 *
 * @returns {Promise<{
 *   dailyCounts: IDailyCount[];
 *   monthlyCounts: IMonthlyCount[];
 * }>}
 */
export const fetchOrderCounts = async (): Promise<{
  dailyCounts: IDailyCount[];
  monthlyCounts: IMonthlyCount[];
}> => {
  try {
    const ordersRef = collection(db, "orders");
    const snapshot = await getDocs(ordersRef);

    // For day-level data, keep a map { dateString: { consegne, ritiri } }
    const dailyMap: Record<string, { consegne: number; ritiri: number }> = {};

    // For month-level data, keep a map { monthString: total }
    const monthlyMap: Record<string, number> = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as IOrder;

      // 1) If we have oraConsegna, increment that day's "consegne".
      if (data.oraConsegna) {
        const dateObj = (data.oraConsegna as Timestamp).toDate();
        const day = dayjs(dateObj).format("YYYY-MM-DD");
        const month = dayjs(dateObj).format("YYYY-MM");

        if (!dailyMap[day]) {
          dailyMap[day] = { consegne: 0, ritiri: 0 };
        }
        dailyMap[day].consegne += 1;

        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      }

      // 2) If we have oraRitiro, increment that day's "ritiri".
      if (data.oraRitiro) {
        const ritiroObj = (data.oraRitiro as Timestamp).toDate();
        const rDay = dayjs(ritiroObj).format("YYYY-MM-DD");
        const rMonth = dayjs(ritiroObj).format("YYYY-MM");

        if (!dailyMap[rDay]) {
          dailyMap[rDay] = { consegne: 0, ritiri: 0 };
        }
        dailyMap[rDay].ritiri += 1;

        monthlyMap[rMonth] = (monthlyMap[rMonth] || 0) + 1;
      }
    });

    // Convert dailyMap -> array of IDailyCount
    const dailyCounts: IDailyCount[] = Object.entries(dailyMap).map(
      ([date, { consegne, ritiri }]) => ({
        date,
        consegne,
        ritiri,
      })
    );

    // Convert monthlyMap -> array of IMonthlyCount
    const monthlyCounts: IMonthlyCount[] = Object.entries(monthlyMap).map(
      ([month, total]) => ({
        month,
        total,
      })
    );

    return { dailyCounts, monthlyCounts };
  } catch (error) {
    console.error("Error fetching order counts:", error);
    throw new Error("Failed to fetch order data.");
  }
};

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
 * @param {keyof IOrder | string} orderByField - e.g. "orarioConsegna"
 * @param {"asc" | "desc"} orderDirection
 */
const buildBaseQuery = (
  startDate?: Timestamp,
  endDate?: Timestamp,
  orderByField: keyof IOrder | string = "orarioConsegna",
  orderDirection: "asc" | "desc" = "asc"
) => {
  const baseRef = collection(db, "orders");
  let q = query(baseRef);

  if (startDate) {
    q = query(q, where("orarioConsegna", ">=", startDate));
  }
  if (endDate) {
    q = query(q, where("orarioConsegna", "<=", endDate));
  }

  // `orderBy` expects a string. Cast if orderByField is keyof IOrder.
  q = query(q, orderBy(orderByField as string, orderDirection));

  return q;
};

/**
 * Fetch orders from Firestore with pagination, date filters, and sorting.
 * Expects Timestamps for startDate and endDate in IGetOrdersParams.
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
    orderByField = "orarioConsegna",
    orderDirection = "asc",
  } = params;

  try {
    // 1. Build the base query (standard range, ordering, etc.)
    let baseQuery = buildBaseQuery(
      startDate,
      endDate,
      orderByField,
      orderDirection
    );

    // 2. Count total docs for pagination
    const totalSnapshot = await getDocs(baseQuery);
    const total = totalSnapshot.size;

    // 3. Skip / pagination
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

    // Add the final limit for this page
    baseQuery = query(baseQuery, limit(pageSize));

    // 4. Get the main "range" orders
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(baseQuery);
    let baseData: IOrder[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as IOrder),
    }));

    // -----------------------------------------------------------
    // 5. Always include orders with status="Attesa ritiro" AND
    //    (missing oraRitiro OR missing luogoRitiro).
    //    Firestore does not allow an actual OR in a single query,
    //    so we do 2 queries and merge.
    // -----------------------------------------------------------

    // 5.1 Attesa ritiro AND missing oraRitiro
    const attesaRitiroNoTimeQuery = query(
      collection(db, "orders"),
      where("status", "==", "Attesa ritiro"),
      where("oraRitiro", "==", null)
    );
    const attesaRitiroNoTimeSnap = await getDocs(attesaRitiroNoTimeQuery);
    const attesaRitiroNoTimeData = attesaRitiroNoTimeSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as IOrder),
    }));

    
    // -----------------------------------------------------------
    // 6. Combine the main query results + "Attesa ritiro" missing ritiro results
    // -----------------------------------------------------------
    let combinedData = [...baseData, ...attesaRitiroNoTimeData];

    // Deduplicate combined data
    combinedData = combinedData.filter(
      (order, index, self) =>
        self.findIndex((o) => o.id === order.id) === index
    );

    // 7. Return final data and total
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
//   // e.g. q = query(q, where("orarioConsegna", ">=", startDate), ... );
//   // e.g. q = query(q, orderBy(orderByField, orderDirection));
//   return q;
// }

/**
 * Get an order by ID from Firebase Firestore.
 * @param id - The document ID of the order
 * @returns The order object if found, otherwise null.
 */
export const getOrderById = async (id: string): Promise<IOrder | null> => {
  try {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...(docSnap.data() as IOrder),
      };
    } else {
      console.log("No such document!");
      return null;
    }
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
 * `orarioConsegna`, that order appears on two distinct days.
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

      // 1) If we have orarioConsegna, increment that day's "consegne".
      if (data.orarioConsegna) {
        const dateObj = (data.orarioConsegna as Timestamp).toDate();
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

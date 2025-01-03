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
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { IOrder } from "../../../types/interfaces";
import { IGetOrdersParams } from "../../../types/interfaces/IGetOrder";
import dayjs from "dayjs";

/**
 * Save an order to Firebase Firestore.
 * @param {Omit<IOrder, "id">} order - The order object to save.
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
 * Fetch orders from Firestore with pagination, date filters, and sorting.
 * @param {IGetOrdersParams} params
 * @returns {Promise<{ data: IOrder[]; total: number }>}
 */
export const getOrders = async (
  params: IGetOrdersParams
): Promise<{
  data: IOrder[];
  total: number;
}> => {
  // Destructure and set defaults
  const {
    page = 1,
    pageSize = 10,
    startDate,
    endDate,
    orderByField = "orarioConsegna",
    orderDirection = "asc",
  } = params;

  try {
    const ordersCollection = collection(db, "orders");

    // Build Firestore query with filters
    let firestoreQuery = query(ordersCollection);

    // Apply date filters
    // Here, we assume `startDate` and `endDate` are string timestamps
    // or something comparable to "orarioConsegna".
    // Adjust as needed for your data format.
    if (startDate) {
      firestoreQuery = query(
        firestoreQuery,
        where("orarioConsegna", ">=", startDate)
      );
    }
    if (endDate) {
      firestoreQuery = query(
        firestoreQuery,
        where("orarioConsegna", "<=", endDate)
      );
    }

    // Apply sorting
    if (orderByField) {
      firestoreQuery = query(
        firestoreQuery,
        orderBy(orderByField, orderDirection)
      );
    }

    // First, get total document count (ignoring filters, or apply same filters if needed)
    const totalSnapshot = await getDocs(ordersCollection);
    const total = totalSnapshot.size;

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // If offset > 0, we need to skip documents
    let lastVisible = null;

    if (offset > 0) {
      // Temporarily query 'offset' documents
      const tempQuery = query(firestoreQuery, limit(offset));
      const snapshot = await getDocs(tempQuery);

      if (snapshot.docs.length > 0) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
      }
    }

    // Use `startAfter` to skip the already-read documents
    if (lastVisible) {
      firestoreQuery = query(firestoreQuery, startAfter(lastVisible));
    }

    // Finally, limit to pageSize
    firestoreQuery = query(firestoreQuery, limit(pageSize));

    // Get the docs for this page
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      firestoreQuery
    );

    // Map documents to IOrder
    const data: IOrder[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as IOrder),
    }));

    return { data, total };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

/**
 * Get an order by ID from Firebase Firestore.
 * @param {string} id - The document ID of the order to retrieve.
 * @returns {Promise<IOrder | null>} - The order object if found, otherwise null.
 */
export const getOrderById = async (id: string): Promise<IOrder | null> => {
  try {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IOrder;
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
 * @param {string} id - The document ID of the order to update.
 * @param {Partial<IOrder>} updatedOrder - The fields to update.
 * @returns {Promise<void>} Resolves when the update is complete.
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

export interface OrderCount {
  date: string; // e.g., "YYYY-MM-DD"
  count: number;
}

export interface MonthlyOrderCount {
  month: string; // e.g., "YYYY-MM"
  count: number;
}

/**
 * Fetch orders grouped by day and month.
 * @returns {Promise<{ dailyCounts: OrderCount[], monthlyCounts: MonthlyOrderCount[] }>}
 */
export const fetchOrderCounts = async (): Promise<{
  dailyCounts: OrderCount[];
  monthlyCounts: MonthlyOrderCount[];
}> => {
  try {
    const ordersRef = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersRef);

    const dailyCounts: Record<string, number> = {};
    const monthlyCounts: Record<string, number> = {};

    ordersSnapshot.forEach((doc) => {
      const data = doc.data() as IOrder;
      const orderDate = data.orarioConsegna;

      if (orderDate) {
        const day = dayjs(orderDate).format("YYYY-MM-DD");
        const month = dayjs(orderDate).format("YYYY-MM");

        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });

    return {
      dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      })),
      monthlyCounts: Object.entries(monthlyCounts).map(([month, count]) => ({
        month,
        count,
      })),
    };
  } catch (error) {
    console.error("Error fetching order counts:", error);
    throw new Error("Failed to fetch order data.");
  }
};

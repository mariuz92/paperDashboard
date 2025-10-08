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
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import {
  IOrder,
  IGetOrdersParams,
  IOrderStatus,
} from "../../../types/interfaces";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import dayjs from "dayjs";

/* ------------------------------------------------------------------
   INTERFACES FOR COUNTING DAILY & MONTHLY ORDERS
   ------------------------------------------------------------------ */

export interface IDailyCount {
  date: string;
  consegne: number;
  ritiri: number;
}

export interface IMonthlyCount {
  month: string;
  total: number;
}

/* ------------------------------------------------------------------
   HELPER: UPDATE RIDER STATUS FROM ORDER
   ------------------------------------------------------------------ */

/**
 * ✅ ENHANCED: Update rider_status collection based on order changes
 * This keeps the rider status in sync with their assigned orders
 */
const updateRiderStatusFromOrder = async (order: IOrder): Promise<void> => {
  try {
    // Determine which rider to update and what their status should be
    let riderId: string | undefined;
    let headingTo: string | undefined;
    let lastStatus: IOrderStatus;
    let isBusy: boolean;

    // Priority: consegnatoDa (delivery) > ritiratoDa (pickup)
    if (
      order.consegnatoDa &&
      order.status !== "Consegnato" &&
      order.status !== "Annullato"
    ) {
      riderId = order.consegnatoDa;
      headingTo = order.luogoConsegna;
      lastStatus = order.status;
      isBusy = true;
    } else if (
      order.ritiratoDa &&
      (order.status === "In Ritiro" || order.status === "Ritirato")
    ) {
      riderId = order.ritiratoDa;
      headingTo = order.luogoRitiro;
      lastStatus = order.status;
      isBusy = true;
    }

    // If order is completed or cancelled, mark rider as free
    if (order.status === "Consegnato" || order.status === "Annullato") {
      if (order.consegnatoDa) {
        riderId = order.consegnatoDa;
      } else if (order.ritiratoDa) {
        riderId = order.ritiratoDa;
      }
      isBusy = false;
      lastStatus = order.status;
      headingTo = undefined;
    }

    // Update rider_status document if we have a rider
    if (riderId) {
      const riderStatusRef = doc(db, "rider_status", riderId);

      const statusUpdate: Partial<IRiderStatus> = {
        riderId: riderId,
        lastUpdate: Timestamp.now(),
        lastStatus: lastStatus!,
        isBusy: isBusy!,
        headingTo: headingTo || null,
      };

      // Use setDoc with merge to create or update
      await setDoc(riderStatusRef, statusUpdate, { merge: true });

      console.log(
        `[updateRiderStatusFromOrder] Updated status for rider ${riderId}`
      );
    }

    // Also update the user document with last activity
    if (order.consegnatoDa && order.oraConsegna) {
      const riderRef = doc(db, "users", order.consegnatoDa);
      await updateDoc(riderRef, {
        lastDeliveryTime: order.oraConsegna,
        lastDeliveryOrderId: order.id,
        updatedAt: Timestamp.now(),
      }).catch((err) =>
        console.warn("Could not update user delivery time:", err)
      );
    }

    if (order.ritiratoDa && order.oraRitiro) {
      const riderRef = doc(db, "users", order.ritiratoDa);
      await updateDoc(riderRef, {
        lastPickupTime: order.oraRitiro,
        lastPickupOrderId: order.id,
        updatedAt: Timestamp.now(),
      }).catch((err) =>
        console.warn("Could not update user pickup time:", err)
      );
    }
  } catch (error) {
    console.error("[updateRiderStatusFromOrder] Error:", error);
    // Don't throw - order operations should succeed even if status update fails
  }
};

/**
 * ✅ NEW: Clear rider status when they're no longer assigned to any active order
 */
const clearRiderStatusIfNoActiveOrders = async (
  riderId: string
): Promise<void> => {
  try {
    // Check if rider has any active orders
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("status", "in", [
        "In Ritiro",
        "Ritirato",
        "Presa in Carico",
        "In Consegna",
      ])
    );

    const snapshot = await getDocs(activeOrdersQuery);
    const hasActiveOrders = snapshot.docs.some((doc) => {
      const order = doc.data() as IOrder;
      return order.consegnatoDa === riderId || order.ritiratoDa === riderId;
    });

    // If no active orders, mark rider as free
    if (!hasActiveOrders) {
      const riderStatusRef = doc(db, "rider_status", riderId);
      await setDoc(
        riderStatusRef,
        {
          riderId: riderId,
          lastUpdate: Timestamp.now(),
          lastStatus: "Attesa ritiro" as IOrderStatus,
          isBusy: false,
          headingTo: null,
        },
        { merge: true }
      );

      console.log(
        `[clearRiderStatusIfNoActiveOrders] Rider ${riderId} marked as free`
      );
    }
  } catch (error) {
    console.error("[clearRiderStatusIfNoActiveOrders] Error:", error);
  }
};

/* ------------------------------------------------------------------
   CRUD FUNCTIONS
   ------------------------------------------------------------------ */

/**
 * ✅ ENHANCED: Save order and update rider status
 */
export const saveOrder = async (order: IOrder): Promise<string> => {
  try {
    const orderToSave: any = {
      nomeGuida: order.nomeGuida || null,
      telefonoGuida: order.telefonoGuida || null,
      canaleRadio: order.canaleRadio || null,
      oraConsegna: order.oraConsegna
        ? order.oraConsegna instanceof Timestamp
          ? order.oraConsegna
          : Timestamp.fromDate((order.oraConsegna as any).toDate())
        : null,
      luogoConsegna: order.luogoConsegna || null,
      oraRitiro: order.oraRitiro
        ? order.oraRitiro instanceof Timestamp
          ? order.oraRitiro
          : Timestamp.fromDate((order.oraRitiro as any).toDate())
        : null,
      luogoRitiro: order.luogoRitiro || null,
      radioguideConsegnate: order.radioguideConsegnate ?? null,
      extra: order.extra ?? null,
      saldo: order.saldo ?? null,
      lost: order.lost ?? null,
      status: order.status || "Attesa ritiro",
      note: order.note || null,
      consegnatoDa: order.consegnatoDa || null,
      ritiratoDa: order.ritiratoDa || null,
    };

    // Remove undefined values
    Object.keys(orderToSave).forEach((key) => {
      if (orderToSave[key] === undefined) {
        orderToSave[key] = null;
      }
    });

    const ordersCollection = collection(db, "orders");
    const docRef = await addDoc(ordersCollection, orderToSave);

    // ✅ Update rider status after creating order
    const orderWithId = { ...orderToSave, id: docRef.id };
    await updateRiderStatusFromOrder(orderWithId);

    console.log(`[saveOrder] Order created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[saveOrder] Error:", error);
    throw error;
  }
};

/**
 * ✅ ENHANCED: Update order and sync rider status
 */
export const updateOrder = async (
  id: string,
  updatedOrder: Partial<IOrder>
): Promise<void> => {
  try {
    const orderToUpdate: any = { ...updatedOrder };

    // Convert timestamp fields
    if (
      orderToUpdate.oraConsegna &&
      !(orderToUpdate.oraConsegna instanceof Timestamp)
    ) {
      orderToUpdate.oraConsegna = Timestamp.fromDate(
        (orderToUpdate.oraConsegna as any).toDate()
      );
    }

    if (
      orderToUpdate.oraRitiro &&
      !(orderToUpdate.oraRitiro instanceof Timestamp)
    ) {
      orderToUpdate.oraRitiro = Timestamp.fromDate(
        (orderToUpdate.oraRitiro as any).toDate()
      );
    }

    const orderDocRef = doc(db, "orders", id);
    await updateDoc(orderDocRef, orderToUpdate);

    // ✅ Get the full order after update and sync rider status
    const orderSnap = await getDoc(orderDocRef);
    if (orderSnap.exists()) {
      const fullOrder = { id: orderSnap.id, ...orderSnap.data() } as IOrder;
      await updateRiderStatusFromOrder(fullOrder);

      // ✅ If rider was removed from order, check if they have other active orders
      if (
        updatedOrder.consegnatoDa === null ||
        updatedOrder.ritiratoDa === null
      ) {
        const previousRiderId =
          updatedOrder.consegnatoDa || updatedOrder.ritiratoDa;
        if (previousRiderId) {
          await clearRiderStatusIfNoActiveOrders(previousRiderId);
        }
      }
    }

    console.log(`[updateOrder] Order ${id} updated successfully`);
  } catch (error) {
    console.error(`[updateOrder] Error updating order ${id}:`, error);
    throw error;
  }
};

/**
 * ✅ ENHANCED: Delete order and clear rider status if needed
 */
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    // Get order before deleting to clear rider status
    const orderDocRef = doc(db, "orders", id);
    const orderSnap = await getDoc(orderDocRef);

    if (orderSnap.exists()) {
      const order = { id: orderSnap.id, ...orderSnap.data() } as IOrder;

      // Delete the order
      await deleteDoc(orderDocRef);

      // Clear rider status if they have no other active orders
      if (order.consegnatoDa) {
        await clearRiderStatusIfNoActiveOrders(order.consegnatoDa);
      }
      if (order.ritiratoDa) {
        await clearRiderStatusIfNoActiveOrders(order.ritiratoDa);
      }
    } else {
      await deleteDoc(orderDocRef);
    }

    console.log(`[deleteOrder] Order ${id} deleted successfully`);
  } catch (error) {
    console.error(`[deleteOrder] Error deleting order ${id}:`, error);
    throw error;
  }
};

/* ------------------------------------------------------------------
   QUERY FUNCTIONS
   ------------------------------------------------------------------ */

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

  q = query(q, orderBy(orderByField as string, orderDirection));

  return q;
};

/**
 * ✅ Real-time stream for orders
 */
export const getOrdersStream = (
  currentUserId: string,
  isAdmin: boolean,
  ascending: boolean = true,
  callback: (orders: IOrder[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const ordersMap = new Map<string, IOrder>();
  const unsubscribers: (() => void)[] = [];

  const updateOrders = () => {
    const allOrders = Array.from(ordersMap.values());

    allOrders.sort((a, b) => {
      const aTime = (a.oraRitiro ?? a.oraConsegna)?.toDate?.() ?? new Date(0);
      const bTime = (b.oraRitiro ?? b.oraConsegna)?.toDate?.() ?? new Date(0);
      const cmp = aTime.getTime() - bTime.getTime();
      return ascending ? cmp : -cmp;
    });

    callback(allOrders);
  };

  if (isAdmin) {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docs.forEach((doc) => {
          ordersMap.set(doc.id, {
            id: doc.id,
            ...(doc.data() as IOrder),
          });
        });
        updateOrders();
      },
      (error) => {
        console.error("Error in orders stream:", error);
        if (onError) onError(error);
      }
    );
    unsubscribers.push(unsubscribe);
  } else {
    // Rider queries
    const q1 = query(
      collection(db, "orders"),
      where("consegnatoDa", "==", currentUserId)
    );
    const unsub1 = onSnapshot(q1, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        ordersMap.set(doc.id, { id: doc.id, ...(doc.data() as IOrder) });
      });
      updateOrders();
    });
    unsubscribers.push(unsub1);

    const q2 = query(
      collection(db, "orders"),
      where("ritiratoDa", "==", currentUserId)
    );
    const unsub2 = onSnapshot(q2, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        ordersMap.set(doc.id, { id: doc.id, ...(doc.data() as IOrder) });
      });
      updateOrders();
    });
    unsubscribers.push(unsub2);

    const q3 = query(
      collection(db, "orders"),
      where("status", "==", "Attesa ritiro")
    );
    const unsub3 = onSnapshot(q3, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        ordersMap.set(doc.id, { id: doc.id, ...(doc.data() as IOrder) });
      });
      updateOrders();
    });
    unsubscribers.push(unsub3);
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
    ordersMap.clear();
  };
};

/**
 * Fetch orders with pagination
 */
export const getOrders = async (
  params: IGetOrdersParams
): Promise<{ data: IOrder[]; total: number }> => {
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

      mergedData = [...consegnaData, ...ritiroData].filter(
        (order, index, self) =>
          self.findIndex((o) => o.id === order.id) === index
      );

      total = mergedData.length;

      mergedData.sort((a, b) => {
        const aField = a[orderByField as keyof IOrder];
        const bField = b[orderByField as keyof IOrder];

        const getDate = (field: any): Date => {
          if (!field) return new Date(0);
          if (field.toDate && typeof field.toDate === "function") {
            return field.toDate();
          }
          if (field instanceof Date) return field;
          const parsed = new Date(field);
          return isNaN(parsed.getTime()) ? new Date(0) : parsed;
        };

        const aDate = getDate(aField);
        const bDate = getDate(bField);

        return orderDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });

      const startIdx = (page - 1) * pageSize;
      mergedData = mergedData.slice(startIdx, startIdx + pageSize);
    } else {
      let baseQuery = buildBaseQuery(
        startDate,
        endDate,
        orderByField,
        orderDirection
      );

      const totalSnapshot = await getDocs(baseQuery);
      total = totalSnapshot.size;

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

export const getOrderById = async (
  orderId: string,
  riderId: string
): Promise<IOrder | null> => {
  try {
    const riderRef = doc(db, "users", riderId);
    const riderSnap = await getDoc(riderRef);

    if (!riderSnap.exists()) {
      console.log("Unauthorized: Rider does not exist");
      return null;
    }

    const userData = riderSnap.data();
    const roles = Array.isArray(userData?.role)
      ? userData.role
      : [userData?.role].filter(Boolean);

    if (!roles.includes("rider")) {
      console.log("Unauthorized: User is not a rider");
      return null;
    }

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.log("No such order found!");
      return null;
    }

    return {
      id: orderSnap.id,
      ...(orderSnap.data() as IOrder),
    };
  } catch (error) {
    console.error("Error getting order:", error);
    throw new Error("Failed to get order");
  }
};

export const fetchOrderCounts = async (): Promise<{
  dailyCounts: IDailyCount[];
  monthlyCounts: IMonthlyCount[];
}> => {
  try {
    const ordersRef = collection(db, "orders");
    const snapshot = await getDocs(ordersRef);

    const dailyMap: Record<string, { consegne: number; ritiri: number }> = {};
    const monthlyMap: Record<string, number> = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as IOrder;

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

    const dailyCounts: IDailyCount[] = Object.entries(dailyMap).map(
      ([date, { consegne, ritiri }]) => ({
        date,
        consegne,
        ritiri,
      })
    );

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

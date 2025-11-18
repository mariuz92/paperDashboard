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
// Update the updateRiderStatusFromOrder function (around line 34-95)
const updateRiderStatusFromOrder = async (order: IOrder): Promise<void> => {
  try {
    let riderId: string | undefined;
    let headingTo: string | undefined;
    let lastStatus: IOrderStatus;
    let isBusy: boolean;
    let riderName: string | undefined;

    // ✅ Priority: Check delivery assignment first
    if (
      order.consegnatoDa &&
      order.status === "Assegnato" // ✅ Only Assegnato means actively delivering
    ) {
      riderId = order.consegnatoDa;
      headingTo = order.luogoConsegna;
      lastStatus = order.status;
      isBusy = true;
      riderName = order.deliveryName;

      // Fetch and set deliveryName if not already set
      if (!order.deliveryName) {
        const riderDoc = await getDoc(doc(db, "users", riderId));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          riderName = riderData.displayName || null;
          order.deliveryName = riderName;

          if (order.id) {
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, {
              deliveryName: riderName,
            }).catch((err) =>
              console.warn("Could not update deliveryName in order:", err)
            );
          }
        }
      }
    }
    // ✅ Check pickup assignment - ONLY for Assegnato status
    else if (
      order.ritiratoDa &&
      order.status === "Assegnato" // ✅ FIXED: Only Assegnato, not "Attesa ritiro"
    ) {
      riderId = order.ritiratoDa;
      headingTo = order.luogoRitiro;
      lastStatus = order.status;
      isBusy = true;
      riderName = order.pickupName;

      // Fetch and set pickupName if not already set
      if (!order.pickupName) {
        const riderDoc = await getDoc(doc(db, "users", riderId));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          riderName = riderData.displayName || null;
          order.pickupName = riderName;

          if (order.id) {
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, {
              pickupName: riderName,
            }).catch((err) =>
              console.warn("Could not update pickupName in order:", err)
            );
          }
        }
      }
    }

    // ✅ If order is completed or cancelled, mark rider as free
    if (
      order.status === "Consegnato" ||
      order.status === "Annullato" ||
      order.status === "Ritirato" ||
      order.status === "Attesa ritiro" // ✅ ADDED: "Attesa ritiro" also means rider is free
    ) {
      if (order.consegnatoDa) {
        riderId = order.consegnatoDa;
        riderName = order.deliveryName;
        headingTo = order.luogoConsegna;
      } else if (order.ritiratoDa) {
        riderId = order.ritiratoDa;
        riderName = order.pickupName;
        headingTo = order.luogoRitiro;
      }
      isBusy = false; // ✅ Rider is FREE for these statuses
      lastStatus = order.status;
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
        riderName: riderName,
      };

      await setDoc(riderStatusRef, statusUpdate, { merge: true });
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
        "Assegnato",
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
      // Fetch rider name for status update
      let riderName: string | null = null;
      const riderDoc = await getDoc(doc(db, "users", riderId));
      if (riderDoc.exists()) {
        const riderData = riderDoc.data();
        riderName = riderData.displayName || null;
      }

      const riderStatusRef = doc(db, "rider_status", riderId);
      await setDoc(
        riderStatusRef,
        {
          riderId: riderId,
          lastUpdate: Timestamp.now(),
          lastStatus: "Attesa ritiro" as IOrderStatus,
          isBusy: false,
          headingTo: null,
          riderName: riderName,
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
      invoiceRequired: order.invoiceRequired ?? false, // ✅ Add this
      lost: order.lost ?? null,
      status: order.status || "Attesa ritiro",
      note: order.note || null,
      consegnatoDa: order.consegnatoDa || null,
      ritiratoDa: order.ritiratoDa || null,
      deliveryName: order.deliveryName || null, // ✅ Add this
      pickupName: order.pickupName || null, // ✅ Add this
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
    console.log("🔄 [updateOrder] Updating order:", {
      orderId: id,
      statusBefore: updatedOrder.status,
      hasRiderAssignment: !!(
        updatedOrder.consegnatoDa || updatedOrder.ritiratoDa
      ),
      updatedFields: Object.keys(updatedOrder),
    });

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

    console.log("✅ [updateOrder] Firestore updated successfully");

    // ✅ Get the full order after update and sync rider status
    const orderSnap = await getDoc(orderDocRef);
    if (orderSnap.exists()) {
      const fullOrder = { id: orderSnap.id, ...orderSnap.data() } as IOrder;

      console.log("📦 [updateOrder] Full order after update:", {
        orderId: fullOrder.id,
        status: fullOrder.status,
        consegnatoDa: fullOrder.consegnatoDa,
        ritiratoDa: fullOrder.ritiratoDa,
        deliveryName: fullOrder.deliveryName,
        pickupName: fullOrder.pickupName,
      });

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

    console.log(`✅ [updateOrder] Order ${id} updated successfully`);
  } catch (error) {
    console.error(`❌ [updateOrder] Error updating order ${id}:`, error);
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

export const watchOrders = (
  tenantId: string,
  selectedDate: Date,
  callback: (orders: IOrder[]) => void
): (() => void) => {
  // ✅ Use root orders collection, not tenant subcollection
  const ordersRef = collection(db, "orders");

  // Get start and end of selected date
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log("Watching orders for:", {
    selectedDate,
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString(),
  });

  const q = query(
    ordersRef,
    where("oraConsegna", ">=", Timestamp.fromDate(startOfDay)),
    where("oraConsegna", "<=", Timestamp.fromDate(endOfDay)),
    orderBy("oraConsegna", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("Orders snapshot received:", snapshot.size, "documents");

      const orders: IOrder[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as IOrder)
      );

      callback(orders);
    },
    (error) => {
      console.error("Error watching orders:", error);
      callback([]);
    }
  );

  return unsubscribe;
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
    // ✅ Admin sees everything - simple and straightforward
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            // Only remove if actually deleted
            ordersMap.delete(change.doc.id);
          } else {
            // Add or update
            ordersMap.set(change.doc.id, {
              id: change.doc.id,
              ...(change.doc.data() as IOrder),
            });
          }
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
    // ✅ Rider-specific logic: check if THIS rider should see the order
    const shouldRiderSeeOrder = (order: IOrder): boolean => {
      return (
        order.consegnatoDa === currentUserId ||
        order.ritiratoDa === currentUserId ||
        order.status === "Attesa ritiro"
      );
    };

    // Rider query 1: assigned deliveries
    const q1 = query(
      collection(db, "orders"),
      where("consegnatoDa", "==", currentUserId)
    );
    const unsub1 = onSnapshot(q1, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...(change.doc.data() as IOrder) };

        if (change.type === "removed" && !shouldRiderSeeOrder(order)) {
          ordersMap.delete(change.doc.id);
        } else {
          ordersMap.set(change.doc.id, order);
        }
      });
      updateOrders();
    });
    unsubscribers.push(unsub1);

    // Rider query 2: assigned pickups
    const q2 = query(
      collection(db, "orders"),
      where("ritiratoDa", "==", currentUserId)
    );
    const unsub2 = onSnapshot(q2, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...(change.doc.data() as IOrder) };

        if (change.type === "removed" && !shouldRiderSeeOrder(order)) {
          ordersMap.delete(change.doc.id);
        } else {
          ordersMap.set(change.doc.id, order);
        }
      });
      updateOrders();
    });
    unsubscribers.push(unsub2);

    // Rider query 3: available orders
    const q3 = query(
      collection(db, "orders"),
      where("status", "==", "Attesa ritiro")
    );
    const unsub3 = onSnapshot(q3, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...(change.doc.data() as IOrder) };

        if (change.type === "removed" && !shouldRiderSeeOrder(order)) {
          ordersMap.delete(change.doc.id);
        } else {
          ordersMap.set(change.doc.id, order);
        }
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

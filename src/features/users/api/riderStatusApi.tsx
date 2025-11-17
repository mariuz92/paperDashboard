import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import { IOrderStatus } from "../../../types/interfaces";

/* ------------------------------------------------------------------
   READ OPERATIONS (Real-time & One-time)
   ------------------------------------------------------------------ */

/**
 * Watch all rider statuses in real-time
 */
export const watchAllRiderStatuses = (
  callback: (statuses: IRiderStatus[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, "rider_status"),
    orderBy("lastUpdate", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const statuses: IRiderStatus[] = snapshot.docs.map((doc) => ({
        riderId: doc.data().riderId || doc.id,
        lastUpdate: doc.data().lastUpdate,
        headingTo: doc.data().headingTo || null,
        lastStatus: doc.data().lastStatus,
        isBusy: doc.data().isBusy || false,
        riderName: doc.data().riderName || null, // Add this
      }));
      callback(statuses);
    },
    (error) => {
      console.error("Error watching rider statuses:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

/**
 * Watch a single rider's status in real-time
 */
export const watchRiderStatus = (
  riderId: string,
  callback: (status: IRiderStatus | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const docRef = doc(db, "rider_status", riderId);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = docSnap.data();
      const status: IRiderStatus = {
        riderId: data.riderId || docSnap.id,
        lastUpdate: data.lastUpdate,
        headingTo: data.headingTo || null,
        lastStatus: data.lastStatus,
        isBusy: data.isBusy || false,
        riderName: data.riderName || null, // Add this
      };
      callback(status);
    },
    (error) => {
      console.error("Error watching rider status:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

/**
 * Get a single rider status (one-time fetch)
 */
export const getRiderStatus = async (
  riderId: string
): Promise<IRiderStatus | null> => {
  try {
    const docRef = doc(db, "rider_status", riderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      riderId: data.riderId || docSnap.id,
      lastUpdate: data.lastUpdate,
      headingTo: data.headingTo || null,
      lastStatus: data.lastStatus,
      isBusy: data.isBusy || false,
      riderName: data.riderName || null, // Add this
    };
  } catch (error) {
    console.error("Error getting rider status:", error);
    throw new Error("Failed to get rider status");
  }
};

/* ------------------------------------------------------------------
   WRITE OPERATIONS
   ------------------------------------------------------------------ */

/**
 * ✅ NEW: Update or create a rider's status
 * Used by orderApi when orders are created/updated/deleted
 */
export const updateRiderStatus = async (
  riderId: string,
  status: Partial<IRiderStatus>
): Promise<void> => {
  try {
    const riderStatusRef = doc(db, "rider_status", riderId);

    const statusUpdate: Partial<IRiderStatus> = {
      ...status,
      riderId,
      lastUpdate: Timestamp.now(),
    };

    // Use setDoc with merge to create or update
    await setDoc(riderStatusRef, statusUpdate, { merge: true });

    console.log(`[updateRiderStatus] Updated status for rider ${riderId}`);
  } catch (error) {
    console.error(
      `[updateRiderStatus] Error updating status for rider ${riderId}:`,
      error
    );
    throw new Error("Failed to update rider status");
  }
};

/**
 * ✅ NEW: Set rider as busy with specific order details
 */
export const setRiderBusy = async (
  riderId: string,
  orderStatus: IOrderStatus,
  destination: string
): Promise<void> => {
  try {
    await updateRiderStatus(riderId, {
      isBusy: true,
      lastStatus: orderStatus,
      headingTo: destination,
    });

    console.log(
      `[setRiderBusy] Rider ${riderId} marked as busy: ${orderStatus}`
    );
  } catch (error) {
    console.error(`[setRiderBusy] Error:`, error);
    throw error;
  }
};

/**
 * ✅ NEW: Set rider as free (no active orders)
 */
export const setRiderFree = async (riderId: string): Promise<void> => {
  try {
    await updateRiderStatus(riderId, {
      isBusy: false,
      lastStatus: "Attesa ritiro",
      headingTo: null,
    });

    console.log(`[setRiderFree] Rider ${riderId} marked as free`);
  } catch (error) {
    console.error(`[setRiderFree] Error:`, error);
    throw error;
  }
};

/**
 * ✅ NEW: Update rider status based on order progression
 * Called automatically when order status changes
 */
export const syncRiderStatusWithOrder = async (
  riderId: string,
  orderStatus: IOrderStatus,
  destination?: string | null
): Promise<void> => {
  try {
    // Map order status to rider busy state
    const busyStatuses: IOrderStatus[] = [
      "In Ritiro",
      "Ritirato",
      "Presa in Carico",
      "In Consegna",
    ];

    const isBusy = busyStatuses.includes(orderStatus);

    await updateRiderStatus(riderId, {
      isBusy,
      lastStatus: orderStatus,
      headingTo: isBusy ? destination || null : null,
    });

    console.log(
      `[syncRiderStatusWithOrder] Synced rider ${riderId} with order status: ${orderStatus}`
    );
  } catch (error) {
    console.error(`[syncRiderStatusWithOrder] Error:`, error);
    throw error;
  }
};

/**
 * ✅ NEW: Initialize rider status when they first log in
 * Creates a default status document if it doesn't exist
 */
export const initializeRiderStatus = async (riderId: string): Promise<void> => {
  try {
    const existingStatus = await getRiderStatus(riderId);

    if (!existingStatus) {
      await updateRiderStatus(riderId, {
        isBusy: false,
        lastStatus: "Attesa ritiro",
        headingTo: null,
      });

      console.log(
        `[initializeRiderStatus] Created initial status for rider ${riderId}`
      );
    }
  } catch (error) {
    console.error(`[initializeRiderStatus] Error:`, error);
    throw error;
  }
};

/**
 * ✅ NEW: Batch update rider statuses
 * Useful for administrative operations
 */
export const batchUpdateRiderStatuses = async (
  updates: Array<{ riderId: string; status: Partial<IRiderStatus> }>
): Promise<void> => {
  try {
    const promises = updates.map(({ riderId, status }) =>
      updateRiderStatus(riderId, status)
    );

    await Promise.all(promises);
    console.log(
      `[batchUpdateRiderStatuses] Updated ${updates.length} rider statuses`
    );
  } catch (error) {
    console.error(`[batchUpdateRiderStatuses] Error:`, error);
    throw error;
  }
};

/**
 * ✅ NEW: Clear all rider statuses (admin only)
 * Sets all riders to free/available state
 */
export const clearAllRiderStatuses = async (
  riderIds: string[]
): Promise<void> => {
  try {
    const updates = riderIds.map((riderId) => ({
      riderId,
      status: {
        isBusy: false,
        lastStatus: "Attesa ritiro" as IOrderStatus,
        headingTo: null,
      },
    }));

    await batchUpdateRiderStatuses(updates);
    console.log(
      `[clearAllRiderStatuses] Cleared ${riderIds.length} rider statuses`
    );
  } catch (error) {
    console.error(`[clearAllRiderStatuses] Error:`, error);
    throw error;
  }
};

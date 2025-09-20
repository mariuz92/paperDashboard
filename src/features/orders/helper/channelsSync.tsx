import { IOrder } from "../../../types/interfaces";
import { updateTenantById } from "../../users/api/userApi";

/**
 * Recomputes free channels from localStorage and saves them back to localStorage.
 * It intentionally RE-READS the canonical keys ("channels", "Iddlechannels", "disabledChannels")
 * so it doesn't rely on the function arguments.
 */
export const updateFreeChannels = (
  totalChannels: number,
  iddleChannels: number[],
  disabledChannels: number[],
  orders: IOrder[] // kept for signature compatibility (not used)
): number[] => {
  // Canonical reads from LS
  totalChannels = Number(localStorage.getItem("channels") || "0");
  iddleChannels = JSON.parse(localStorage.getItem("Iddlechannels") || "[]");
  disabledChannels = JSON.parse(
    localStorage.getItem("disabledChannels") || "[]"
  );

  // Build channel range [0..totalChannels] (inclusive)
  const allChannels = Array.from({ length: totalChannels + 1 }, (_, i) => i);

  // Free = not iddle and not disabled
  const freeChannels = allChannels.filter(
    (channel) =>
      !iddleChannels.includes(channel) && !disabledChannels.includes(channel)
  );

  // Persist result
  localStorage.setItem("freeChannels", JSON.stringify(freeChannels));
  return freeChannels;
};

export type SyncOpts = {
  /** Tenant to persist to (optional). If omitted, only localStorage is updated. */
  tenantId?: string;
  /** Channel to reserve (add to Iddlechannels). */
  reserve?: number | null;
  /** Channel to free (remove from Iddlechannels). */
  free?: number | null;
  /** setState from OrderDrawer (optional) to reflect the new free list immediately. */
  setFreeChannels?: (chs: number[]) => void;
  /** Override total channels if you want to force a value instead of LS "channels". */
  totalChannelsOverride?: number;
};

/**
 * One-shot sync for channel changes:
 * - Updates localStorage (Iddlechannels / disabledChannels / freeChannels)
 * - Optionally updates tenant document (if tenantId is provided)
 * - Optionally updates React state (setFreeChannels)
 *
 * Returns the latest freeChannels array.
 */
export async function syncChannelsAfterOrderChange({
  tenantId,
  reserve,
  free,
  setFreeChannels,
  totalChannelsOverride,
}: SyncOpts): Promise<number[]> {
  // Read canonical state from LS
  let total = Number(localStorage.getItem("channels") || "0");
  if (typeof totalChannelsOverride === "number") total = totalChannelsOverride;

  const iddleSet = new Set<number>(
    JSON.parse(localStorage.getItem("Iddlechannels") || "[]")
  );
  const disabled = JSON.parse(
    localStorage.getItem("disabledChannels") || "[]"
  ) as number[];

  // Apply requested ops
  if (typeof free === "number" && !Number.isNaN(free)) iddleSet.delete(free);
  if (typeof reserve === "number" && !Number.isNaN(reserve))
    iddleSet.add(reserve);

  // Persist canonical keys back to LS
  const iddleChannels = Array.from(iddleSet).sort((a, b) => a - b);
  localStorage.setItem("Iddlechannels", JSON.stringify(iddleChannels));
  // (we don't touch "disabledChannels" here; ManageChannels controls it)

  // Recompute + persist freeChannels using your existing helper
  const freeChannels = updateFreeChannels(total, iddleChannels, disabled, []);

  // Mirror to tenant (best effort)
  if (tenantId) {
    try {
      await updateTenantById(tenantId, {
        channelsNum: total,
        iddleChannels,
        disabledChannels: disabled,
      } as any);
    } catch (err) {
      // Keep UI responsive even if server write fails
      console.error("updateTenantById failed:", err);
    }
  }

  // Update component state if provided
  setFreeChannels?.(freeChannels);

  return freeChannels;
}

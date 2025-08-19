import { IOrder } from "../../../types/interfaces";

/**
 * Derives the free channels list based on the total number of channels,
 * channels that cannot be used (iddleChannels), and the orders that have used channels.
 *
 * @param totalChannels - Total number of available channels.
 * @param iddleChannels - Array of channels that cannot be used.
 * @param orders - Array of orders (using the IOrder interface) that have a `canaleRadio` property.
 * @returns The updated array of free (unused) channels.
 */
export const updateFreeChannels = (
  totalChannels: number,
  iddleChannels: number[],
  disabledChannels: number[],
  orders: IOrder[]
): number[] => {
  totalChannels = Number(localStorage.getItem("channels"));
  iddleChannels = JSON.parse(localStorage.getItem("Iddlechannels") || "[]");
  disabledChannels = JSON.parse(
    localStorage.getItem("disabledChannels") || "[]"
  );
  // Generate an array for all channels: [1, 2, ..., totalChannels]
  const allChannels = Array.from({ length: totalChannels + 1 }, (_, i) => i);

  // Filter out channels that are either iddle (cannot be used) or are currently in use.
  const freeChannels = allChannels.filter(
    (channel) =>
      !iddleChannels.includes(channel) && !disabledChannels.includes(channel)
  );

  // Store/update the free channels in localStorage.
  localStorage.setItem("freeChannels", JSON.stringify(freeChannels));

  return freeChannels;
};

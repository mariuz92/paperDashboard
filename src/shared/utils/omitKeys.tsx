// Custom omit function
export const omitKeys = (obj: Record<string, any>, keysToRemove: string[]) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysToRemove.includes(key))
  );
};

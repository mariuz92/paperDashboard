// ⬆️ ADD outside the component (top of file, below imports)
export const generateStrongPassword = (): string => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no confusing I/O
  const lower = "abcdefghijkmnopqrstuvwxyz"; // no l
  const nums = "23456789"; // no 0/1
  const syms = "!@#$%^&*()-_=+[]{};:,.<>?/|~";
  const all = upper + lower + nums + syms;

  const pick = (set: string, n = 1) =>
    Array.from(
      { length: n },
      () => set[Math.floor(Math.random() * set.length)]
    ).join("");

  // ensure each class is present
  let pwd = pick(upper) + pick(lower) + pick(nums) + pick(syms);

  // fill to length 12–16
  const targetLen = 12 + Math.floor(Math.random() * 5);
  while (pwd.length < targetLen) pwd += pick(all);

  // simple shuffle
  pwd = pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return pwd;
};

import bcrypt from "bcryptjs";

export const hashPassword = async (plain: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);
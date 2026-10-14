export const sanitizeUser = (user) => {
  if (!user) return null;

  const source = user.toObject ? user.toObject() : user;
  const { password, __v, ...safeUser } = source;
  return safeUser;
};

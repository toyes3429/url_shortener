import User from "../models/user.model.js";

export const findUserByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  if (includePassword) {
    query.select("+password");
  }
  return query;
};

export const findUserById = async (id) => {
  return User.findById(id);
};

export const createUser = async (name, email, hashedPassword) => {
  const newUser = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  });

  await newUser.save();
  return newUser;
};


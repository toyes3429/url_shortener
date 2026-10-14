import axiosInstance from "../utils/axiosInstance";

export const loginUser = async (password, email) => {
  const { data } = await axiosInstance.post("/api/auth/login", {
    email,
    password,
  });
  return data;
};

export const registerUser = async (name, password, email) => {
  const { data } = await axiosInstance.post("/api/auth/register", {
    name,
    email,
    password,
  });
  return data;
};

export const logoutUser = async () => {
  const { data } = await axiosInstance.post("/api/auth/logout");
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get("/api/auth/me");
  return data;
};

export const getAllUserUrls = async (page = 1, limit = 10) => {
  const { data } = await axiosInstance.get("/api/user/urls", {
    params: { page, limit },
  });
  return data;
};

export const updateUserUrl = async (id, updates) => {
  const { data } = await axiosInstance.patch(`/api/user/urls/${id}`, updates);
  return data;
};

export const deleteUserUrl = async (id) => {
  const { data } = await axiosInstance.delete(`/api/user/urls/${id}`);
  return data;
};

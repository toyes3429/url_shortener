import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "../api/user.api";
import { login } from "../store/slice/authSlice";

export const checkAuth = async ({ context }) => {
  const { queryClient, store } = context;

  try {
    const user = await queryClient.ensureQueryData({
      queryKey: ["currentUser"],
      queryFn: getCurrentUser,
      staleTime: 60_000,
    });

    if (!user) {
      throw redirect({ to: "/auth" });
    }

    store.dispatch(login(user));
    return true;
  } catch (error) {
    if (error?.isRedirect) {
      throw error;
    }

    throw redirect({ to: "/auth" });
  }
};

import api from "./adminApi";

export const loginAdmin = async (
  email,
  password
) => {

  const response = await api.post(
    "/auth/admin-login",
    {
      email,
      password,
    }
  );

  return response.data;
};
export const getMe = async (token) => {

  const response = await api.get(
    "/auth/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
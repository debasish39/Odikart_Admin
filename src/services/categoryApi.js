import adminApi from "./adminApi";

export const getCategoryTree = async () => {
  const response = await adminApi.get("/category/admin/tree");
  return response.data;
};

export const createCategory = async (data) => {
  const response = await adminApi.post("/category/create", data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await adminApi.put(`/category/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await adminApi.delete(`/category/${id}`);
  return response.data;
};
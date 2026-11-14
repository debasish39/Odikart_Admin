
import adminApi from "./adminApi";

// Get products for the Admin Banner product selector
export const getAdminProducts = async ({
  search = "",
  page = 1,
  limit = 20,
} = {}) => {
  const { data } = await adminApi.get("/products/admin/all", {
    params: {
      search,
      page,
      limit,
    },
  });

  return data;
};

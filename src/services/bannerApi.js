import adminApi from "./adminApi";

export const getAdminBanners = async () => {
  const { data } = await adminApi.get("/banners/admin");
  return data;
};

export const createBanner = async (formData) => {
  const { data } = await adminApi.post(
    "/banners/admin",
    formData
  );
  return data;
};

export const updateBanner = async (id, formData) => {
  const { data } = await adminApi.put(
    `/banners/admin/${id}`,
    formData
  );
  return data;
};

export const updateBannerStatus = async (id, isActive) => {
  const { data } = await adminApi.patch(
    `/banners/admin/${id}/status`,
    { isActive }
  );
  return data;
};

export const reorderBanners = async (items) => {
  const { data } = await adminApi.patch(
    "/banners/admin/reorder",
    { items }
  );
  return data;
};

export const deleteBanner = async (id) => {
  const { data } = await adminApi.delete(
    `/banners/admin/${id}`
  );
  return data;
};
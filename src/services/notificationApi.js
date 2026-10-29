
import adminApi from "./adminApi";

// Admin notification CRUD
export const getAdminNotifications = async () =>
  (await adminApi.get("/notifications/admin/all")).data;

export const getAdminNotification = async (id) =>
  (await adminApi.get(`/notifications/admin/${id}`)).data;

export const createAdminNotification = async (payload) =>
  (await adminApi.post("/notifications", payload)).data;

export const updateAdminNotification = async (id, payload) =>
  (await adminApi.patch(`/notifications/admin/${id}`, payload)).data;

export const deleteAdminNotification = async (id) =>
  (await adminApi.delete(`/notifications/admin/${id}`)).data;

// Send notifications
export const sendNotificationToUser = async (payload) =>
  (await adminApi.post("/notifications/send", payload)).data;

export const sendPromotionToAllCustomers = async (payload) =>
  (await adminApi.post("/notifications/send-promotion", payload)).data;

// Upload notification image to Cloudinary through the backend
export const uploadNotificationImage = async (file) => {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid image file.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await adminApi.post(
    "/notifications/upload-image",
    formData
  );

  const data = response.data?.data ?? response.data;
  const imageUrl = data?.imageUrl || data?.secure_url || data?.url;

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    throw new Error("The server did not return an image URL.");
  }

  return {
    ...data,
    imageUrl: imageUrl.trim(),
  };
};

// Customer notification read status
export const markAdminNotificationRead = async (id) =>
  (await adminApi.patch(`/notifications/${id}/read`)).data;

export const markAllAdminNotificationsRead = async () =>
  (await adminApi.patch("/notifications/read-all")).data;

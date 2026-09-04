import adminApi from "./adminApi";

// ==========================================
// GET ALL COUPONS
// ==========================================
export const getCoupons = async () => {
  const response = await adminApi.get("/coupons");
  return response.data;
};

// ==========================================
// GET COUPON BY ID
// ==========================================
export const getCouponById = async (id) => {
  const response = await adminApi.get(`/coupons/${id}`);
  return response.data;
};

// ==========================================
// CREATE COUPON
// ==========================================
export const createCoupon = async (couponData) => {
  const response = await adminApi.post(
    "/coupons/create",
    couponData
  );

  return response.data;
};

// ==========================================
// UPDATE COUPON
// ==========================================
export const updateCoupon = async (id, couponData) => {
  const response = await adminApi.put(
    `/coupons/${id}`,
    couponData
  );

  return response.data;
};

// ==========================================
// DELETE COUPON
// ==========================================
export const deleteCoupon = async (id) => {
  const response = await adminApi.delete(
    `/coupons/${id}`
  );

  return response.data;
};

// ==========================================
// APPLY COUPON
// ==========================================
export const applyCoupon = async (code, total) => {
  const response = await adminApi.post(
    "/coupons/apply",
    {
      code,
      total,
    }
  );

  return response.data;
};
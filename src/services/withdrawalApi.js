import adminApi from "./adminApi";

export const getAdminWithdrawals = async (params = {}) =>
  (await adminApi.get("/withdrawals", { params })).data;

export const getAdminWithdrawal = async (id) =>
  (await adminApi.get(`/withdrawals/${id}`)).data;

export const processWithdrawal = async (id, payload = {}) =>
  (await adminApi.put(`/withdrawals/${id}/process`, payload)).data;

export const rejectWithdrawal = async (id, reason) =>
  (await adminApi.put(`/withdrawals/${id}/reject`, { reason })).data;

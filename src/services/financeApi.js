import adminApi from "./adminApi";

export const getFinanceOverview = async (params = {}) =>
  (await adminApi.get("/finance/overview", { params })).data;

import adminApi from "./adminApi";

/* =====================================================
   ADMIN — GET ALL SELLER WALLETS
   GET /api/finance/wallets
===================================================== */

export const getAdminWallets = async (params = {}) => {
  const response = await adminApi.get(
    "/finance/wallets",
    {
      params,
    }
  );

  return response.data;
};


/* =====================================================
   ADMIN — GET SINGLE SELLER WALLET
   GET /api/finance/wallets/:sellerId
===================================================== */

export const getSellerWallet = async (sellerId) => {
  const response = await adminApi.get(
    `/finance/wallets/${sellerId}`
  );

  return response.data;
};


/* =====================================================
   ADMIN — GET SELLER WALLET TRANSACTIONS
   GET /api/finance/wallets/:sellerId/transactions
===================================================== */

export const getWalletTransactions = async (
  sellerId,
  params = {}
) => {
  const response = await adminApi.get(
    `/finance/wallets/${sellerId}/transactions`,
    {
      params,
    }
  );

  return response.data;
};
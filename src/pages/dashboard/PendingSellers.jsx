import { useEffect, useState } from "react";

import {
  Check,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import adminApi from "../../services/adminApi";

const PendingSellers = () => {

  const navigate =
    useNavigate();

  const [sellers, setSellers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSellers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await adminApi.get(
          "/admin/sellers/pending"
        );

      setSellers(
        response.data.sellers || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Unable to load sellers"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const approveSeller = async (
    sellerId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to approve this seller?"
      );

    if (!confirmed) return;

    try {

      await adminApi.put(
        `/admin/seller/${sellerId}/approve`
      );

      await loadSellers();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Unable to approve seller"
      );

    }
  };

  const rejectSeller = async (
    sellerId
  ) => {

    const reason =
      window.prompt(
        "Enter rejection reason:"
      );

    if (!reason?.trim()) {
      return;
    }

    try {

      await adminApi.put(
        `/admin/seller/${sellerId}/reject`,
        {
          reason: reason.trim(),
        }
      );

      await loadSellers();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Unable to reject seller"
      );

    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold">
            Pending Sellers
          </h1>

          <p className="text-gray-500 mt-1">
            Review seller applications before approval.
          </p>

        </div>

        <button
          onClick={loadSellers}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl hover:bg-gray-50"
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600">
          {error}
        </div>
      )}

      {loading ? (

        <div className="bg-white border rounded-2xl p-12 text-center">
          <RefreshCw
            className="animate-spin mx-auto"
            size={25}
          />

          <p className="mt-3 text-gray-500">
            Loading seller applications...
          </p>
        </div>

      ) : sellers.length === 0 ? (

        <div className="bg-white border rounded-2xl p-12 text-center">

          <div className="text-5xl">
            🎉
          </div>

          <h2 className="font-bold text-lg mt-4">
            No pending sellers
          </h2>

          <p className="text-gray-500 mt-1">
            All seller applications have been reviewed.
          </p>

        </div>

      ) : (

        <div className="bg-white border rounded-2xl overflow-hidden">

          {/* Desktop */}

          <div className="hidden md:block overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50 border-b">

                <tr>

                  <th className="text-left px-6 py-4 text-xs uppercase text-gray-500">
                    Seller
                  </th>

                  <th className="text-left px-6 py-4 text-xs uppercase text-gray-500">
                    Email
                  </th>

                  <th className="text-left px-6 py-4 text-xs uppercase text-gray-500">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-xs uppercase text-gray-500">
                    Applied
                  </th>

                  <th className="text-right px-6 py-4 text-xs uppercase text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {sellers.map(
                  (seller) => {

                    const name =
                      `${seller.firstName || ""} ${
                        seller.lastName || ""
                      }`.trim() ||
                      "Unknown Seller";

                    return (
                      <tr
                        key={seller._id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <div className="font-semibold">
                            {name}
                          </div>

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {seller.email}
                        </td>

                        <td className="px-6 py-4">

                          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                            Pending
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">

                          {seller.sellerAppliedAt
                            ? new Date(
                                seller.sellerAppliedAt
                              ).toLocaleDateString()
                            : "-"}

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/sellers/${seller._id}`
                                )
                              }
                              className="p-2.5 border rounded-lg hover:bg-gray-100"
                              title="View seller"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              onClick={() =>
                                approveSeller(
                                  seller._id
                                )
                              }
                              className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              title="Approve"
                            >
                              <Check size={17} />
                            </button>

                            <button
                              onClick={() =>
                                rejectSeller(
                                  seller._id
                                )
                              }
                              className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              title="Reject"
                            >
                              <X size={17} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

          {/* Mobile */}

          <div className="md:hidden divide-y">

            {sellers.map(
              (seller) => {

                const name =
                  `${seller.firstName || ""} ${
                    seller.lastName || ""
                  }`.trim() ||
                  "Unknown Seller";

                return (
                  <div
                    key={seller._id}
                    className="p-5"
                  >

                    <div className="flex justify-between gap-4">

                      <div>

                        <h3 className="font-bold">
                          {name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1 break-all">
                          {seller.email}
                        </p>

                      </div>

                      <span className="h-fit px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                        Pending
                      </span>

                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">

                      <button
                        onClick={() =>
                          navigate(
                            `/admin/sellers/${seller._id}`
                          )
                        }
                        className="py-2.5 border rounded-xl flex items-center justify-center"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() =>
                          approveSeller(
                            seller._id
                          )
                        }
                        className="py-2.5 bg-green-600 text-white rounded-xl flex items-center justify-center"
                      >
                        <Check size={17} />
                      </button>

                      <button
                        onClick={() =>
                          rejectSeller(
                            seller._id
                          )
                        }
                        className="py-2.5 bg-red-600 text-white rounded-xl flex items-center justify-center"
                      >
                        <X size={17} />
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default PendingSellers;
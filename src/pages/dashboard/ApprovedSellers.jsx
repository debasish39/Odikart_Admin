import { useEffect, useState } from "react";

import {
  Eye,
  Pause,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import adminApi from "../../services/adminApi";

const ApprovedSellers = () => {

  const navigate =
    useNavigate();

  const [sellers, setSellers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadSellers = async () => {

    try {

      setLoading(true);

      const response =
        await adminApi.get(
          "/admin/sellers/approved"
        );

      setSellers(
        response.data.sellers || []
      );

    } catch (error) {

      console.error(error);

      alert(
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

  const suspendSeller = async (
    id
  ) => {

    const reason =
      window.prompt(
        "Why are you suspending this seller?"
      );

    if (!reason?.trim()) {
      return;
    }

    try {

      await adminApi.put(
        `/admin/seller/${id}/suspend`,
        {
          reason: reason.trim(),
        }
      );

      await loadSellers();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Unable to suspend seller"
      );

    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold">
            Approved Sellers
          </h1>

          <p className="text-gray-500 mt-1">
            Manage active marketplace sellers.
          </p>

        </div>

        <button
          onClick={loadSellers}
          className="p-3 bg-white border rounded-xl"
        >
          <RefreshCw
            size={18}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>

      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">

        {loading ? (

          <div className="p-12 text-center">
            Loading sellers...
          </div>

        ) : sellers.length === 0 ? (

          <div className="p-12 text-center text-gray-500">
            No approved sellers found.
          </div>

        ) : (

          <div className="divide-y">

            {sellers.map(
              (seller) => {

                const name =
                  `${seller.firstName || ""} ${
                    seller.lastName || ""
                  }`.trim() ||
                  "Seller";

                return (
                  <div
                    key={seller._id}
                    className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >

                    <div>

                      <h3 className="font-bold">
                        {name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {seller.email}
                      </p>

                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        Approved
                      </span>

                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          navigate(
                            `/admin/sellers/${seller._id}`
                          )
                        }
                        className="px-4 py-2.5 border rounded-xl flex items-center gap-2"
                      >

                        <Eye size={17} />

                        View

                      </button>

                      <button
                        onClick={() =>
                          suspendSeller(
                            seller._id
                          )
                        }
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl flex items-center gap-2"
                      >

                        <Pause size={17} />

                        Suspend

                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
};

export default ApprovedSellers;
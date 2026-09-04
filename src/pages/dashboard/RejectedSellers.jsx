import { useEffect, useState } from "react";

import {
  Eye,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import adminApi from "../../services/adminApi";

const RejectedSellers = () => {

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
          "/admin/sellers/rejected"
        );

      setSellers(
        response.data.sellers || []
      );

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Unable to load rejected sellers"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold">
            Rejected Sellers
          </h1>

          <p className="text-gray-500 mt-1">
            Review rejected seller applications.
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
            Loading...
          </div>

        ) : sellers.length === 0 ? (

          <div className="p-12 text-center text-gray-500">
            No rejected sellers.
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
                    className="p-5 md:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                  >

                    <div>

                      <h3 className="font-bold">
                        {name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {seller.email}
                      </p>

                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        Rejected
                      </span>

                    </div>

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/sellers/${seller._id}`
                        )
                      }
                      className="px-4 py-2.5 border rounded-xl flex items-center gap-2"
                    >

                      <Eye size={17} />

                      View Details

                    </button>

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

export default RejectedSellers;
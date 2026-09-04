import {
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import adminApi from "../../services/adminApi";

const SellerDetails = () => {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const [seller, setSeller] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const loadSeller = async () => {

    try {

      const response =
        await adminApi.get(
          `/admin/seller/${id}`
        );

      setSeller(
        response.data.seller
      );

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Unable to load seller"
      );

      navigate(
        "/admin/sellers/pending"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadSeller();
  }, [id]);

  const approve = async () => {

    if (
      !window.confirm(
        "Approve this seller?"
      )
    ) {
      return;
    }

    try {

      await adminApi.put(
        `/admin/seller/${id}/approve`
      );

      await loadSeller();

      alert(
        "Seller approved successfully"
      );

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Unable to approve seller"
      );

    }
  };

  const reject = async () => {

    const reason =
      window.prompt(
        "Enter rejection reason:"
      );

    if (!reason?.trim()) {
      return;
    }

    try {

      await adminApi.put(
        `/admin/seller/${id}/reject`,
        {
          reason: reason.trim(),
        }
      );

      await loadSeller();

      alert(
        "Seller rejected"
      );

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Unable to reject seller"
      );

    }
  };

  if (loading) {

    return (
      <div className="p-12 text-center">
        Loading seller...
      </div>
    );

  }

  if (!seller) {
    return null;
  }

  const name =
    `${seller.firstName || ""} ${
      seller.lastName || ""
    }`.trim() ||
    "Seller";

  return (
    <div className="space-y-6">

      {/* Back */}

      <button
        onClick={() =>
          navigate(-1)
        }
        className="flex items-center gap-2 text-gray-500 hover:text-black"
      >

        <ArrowLeft size={18} />

        Back

      </button>

      {/* Profile */}

      <div className="bg-white border rounded-2xl p-6 md:p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">

              <User size={28} />

            </div>

            <div>

              <h1 className="text-2xl font-bold">
                {name}
              </h1>

              <p className="text-gray-500">
                {seller.email}
              </p>

            </div>

          </div>

          <span className="w-fit px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold">
            {seller.sellerStatus}
          </span>

        </div>

      </div>

      {/* Information */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border rounded-2xl p-6">

          <h2 className="font-bold text-lg mb-5">
            Seller Information
          </h2>

          <div className="space-y-4">

            <Info
              label="First Name"
              value={
                seller.firstName
              }
            />

            <Info
              label="Last Name"
              value={
                seller.lastName
              }
            />

            <Info
              label="Email"
              value={
                seller.email
              }
            />

            <Info
              label="Phone"
              value={
                seller.phone
              }
            />

            <Info
              label="Seller Status"
              value={
                seller.sellerStatus
              }
            />

          </div>

        </div>

        <div className="bg-white border rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-5">

            <ShieldCheck size={22} />

            <h2 className="font-bold text-lg">
              Verification
            </h2>

          </div>

          <div className="space-y-4">

            <Info
              label="KYC Status"
              value={
                seller.sellerVerificationStatus ||
                seller.sellerInfo?.verification?.status ||
                "Pending"
              }
            />

            <Info
              label="Applied"
              value={
                seller.sellerAppliedAt
                  ? new Date(
                      seller.sellerAppliedAt
                    ).toLocaleString()
                  : "-"
              }
            />

          </div>

        </div>

      </div>

      {/* Actions */}

      {seller.sellerStatus ===
        "pending" && (

        <div className="bg-white border rounded-2xl p-6">

          <h2 className="font-bold text-lg">
            Admin Decision
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-6">
            Review the seller information before making a decision.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">

            <button
              onClick={approve}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >

              <Check size={19} />

              Approve Seller

            </button>

            <button
              onClick={reject}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >

              <X size={19} />

              Reject Seller

            </button>

          </div>

        </div>

      )}

    </div>
  );
};

const Info = ({
  label,
  value,
}) => (
  <div className="flex justify-between gap-4 py-3 border-b last:border-0">

    <span className="text-sm text-gray-500">
      {label}
    </span>

    <span className="text-sm font-medium text-right">
      {value || "-"}
    </span>

  </div>
);

export default SellerDetails;
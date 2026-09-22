import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { FiCheckCircle, FiCreditCard, FiLock, FiX } from "react-icons/fi";
import { paymentMethods } from "../data/localData";
import { confirmBookingPayment, submitBookingPayment } from "../services/bookingService";

const PaymentGatewayModal = ({ booking, onClose, onPaid, context = "dashboard" }) => {
  const [method, setMethod] = useState(booking?.bookingDetails?.paymentMethod || paymentMethods[0]);
  const [reference, setReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (booking?.bookingDetails?.paymentMethod) {
      setMethod(booking.bookingDetails.paymentMethod);
    }
  }, [booking?.bookingDetails?.paymentMethod]);

  if (!booking) return null;

  const pickupText = new Date(booking.bookingDetails.pickupDate).toLocaleString();
  const returnText = new Date(booking.bookingDetails.dropOffDate).toLocaleString();
  const isCheckout = context === "checkout";

  const handleConfirm = async () => {
    if (reference.trim().length < 4) {
      setError("Enter a valid transaction reference or confirmation code.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const updatePayment = context === "checkout" ? submitBookingPayment : confirmBookingPayment;
      const updatedBooking = await updatePayment(booking._id, {
        provider: method,
        reference: reference.trim(),
      });
      onPaid(updatedBooking);
      onClose();
    } catch (paymentError) {
      console.error("Payment confirmation failed", paymentError);
      setError("Payment could not be confirmed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure payment gateway</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {isCheckout ? "Pay Now" : "Confirm Payment"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isCheckout
                ? `Enter the demo transaction reference. Rent a Ride admin will confirm booking ${String(booking._id).slice(0, 8).toUpperCase()} from the admin dashboard.`
                : `Confirm the customer payment for booking ${String(booking._id).slice(0, 8).toUpperCase()}.`}
            </p>
          </div>
          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Amount to pay</span>
            <span className="text-xl font-semibold text-slate-950">
              {new Intl.NumberFormat("en-TZ", {
                style: "currency",
                currency: "TZS",
                maximumFractionDigits: 0,
              }).format(booking.totalPrice)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <FiLock />
            Customer receipt only shows the amount paid. Vendor commission is handled internally.
          </div>
          {isCheckout && (
            <div className="mt-4 rounded-lg bg-white p-3 text-xs text-slate-600">
              After admin confirmation, Rent a Ride sends the customer payment confirmation with pickup time
              {" "}
              <span className="font-semibold text-slate-900">{pickupText}</span>
              {" "}
              and return time
              {" "}
              <span className="font-semibold text-slate-900">{returnText}</span>.
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-medium text-slate-700">
            Payment method
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Transaction reference / confirmation code
            <div className="relative mt-1">
              <FiCreditCard className="absolute left-3 top-3.5 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-200 p-3 pl-10 text-sm"
                placeholder="e.g. MPESA9Q3X7"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isProcessing}
            onClick={handleConfirm}
            type="button"
          >
            <FiCheckCircle />
            {isProcessing ? "Processing payment..." : isCheckout ? "Pay now" : "Confirm payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentGatewayModal.propTypes = {
  booking: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onPaid: PropTypes.func.isRequired,
  context: PropTypes.oneOf(["checkout", "dashboard"]),
};

export default PaymentGatewayModal;

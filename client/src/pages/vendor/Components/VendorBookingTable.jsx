import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FiEye, FiMapPin } from "react-icons/fi";
import DemoTripMonitor from "../../../components/DemoTripMonitor";
import VendorBookingDetailModal from "./VendorBookingModal";
import { setVendorOrderModalOpen, setVendorSingleOrderDetails } from "../../../redux/vendor/vendorBookingSlice";
import { formatTZS } from "../../../data/localData";
import { getBookings } from "../../../services/bookingService";
import { shouldShowInVendorDashboard } from "../../../services/demoOpsService";
import {
  getBookingLifecycleLabel,
  isBookingPaid,
  isPaymentSubmitted,
} from "../../../services/notificationService";
import { getVendorVehicles } from "../../../services/vehicleService";

const statusClass = (status) => {
  if (status === "Car booked") return "bg-emerald-100 text-emerald-700";
  if (status === "Booking in progress") return "bg-amber-100 text-amber-800";
  if (status === "Awaiting payment") return "bg-slate-100 text-slate-700";
  if (status === "canceled") return "bg-red-100 text-red-700";
  if (status === "onTrip") return "bg-sky-100 text-sky-700";
  if (status === "tripCompleted") return "bg-emerald-100 text-emerald-700";
  if (status === "overDue") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VendorBookingsTable = ({ bookings: scopedBookings }) => {
  const [bookings, setBookings] = useState(scopedBookings || []);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [filtered, setFilteredBookings] = useState([]);
  const [trackingBooking, setTrackingBooking] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;
    getVendorVehicles()
      .then((data) => active && setVendorVehicles(data || []))
      .catch((error) => console.error("Error fetching vendor vehicles:", error));
    return () => {
      active = false;
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
    }
  };

  useEffect(() => {
    if (scopedBookings) {
      setBookings(scopedBookings);
      return undefined;
    }
    fetchBookings();
    window.addEventListener("rent-a-ride-demo-reset", fetchBookings);
    window.addEventListener("rent-a-ride-payment-updated", fetchBookings);
    window.addEventListener("rent-a-ride-bookings-updated", fetchBookings);
    window.addEventListener("storage", fetchBookings);
    return () => {
      window.removeEventListener("rent-a-ride-demo-reset", fetchBookings);
      window.removeEventListener("rent-a-ride-payment-updated", fetchBookings);
      window.removeEventListener("rent-a-ride-bookings-updated", fetchBookings);
      window.removeEventListener("storage", fetchBookings);
    };
  }, [scopedBookings]);

  useEffect(() => {
    setFilteredBookings(
      bookings.filter(
        (booking) =>
          shouldShowInVendorDashboard(booking, vendorVehicles) &&
          !["canceled", "tripCompleted"].includes(booking.status)
      )
    );
  }, [vendorVehicles, bookings]);

  const handleDetailsModal = (booking) => {
    dispatch(setVendorOrderModalOpen(true));
    dispatch(setVendorSingleOrderDetails(booking));
  };

  return (
    <div className="w-full max-w-none pb-20">
      <VendorBookingDetailModal />

      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reservations</p>
          <h2 className="text-2xl font-semibold text-slate-950">Rented Cars</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track payment, schedule, and fulfillment status for vehicles from your fleet.
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {filtered.length} bookings
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-950">No active vendor bookings</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            When a customer books one of your approved vehicles, the reservation, payment status, and fulfillment actions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Car location</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                  <th className="px-4 py-3 text-right">Live GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((booking) => (
                  <tr className="align-top transition hover:bg-slate-50" key={booking._id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          alt={booking.vehicleDetails?.name || "Vehicle"}
                          className="h-14 w-20 rounded-md bg-slate-100 object-contain"
                          src={booking.vehicleDetails?.image?.[0]}
                        />
                        <div>
                          <p className="font-semibold text-slate-950">
                            {booking.vehicleDetails?.company} {booking.vehicleDetails?.model || booking.vehicleDetails?.name}
                          </p>
                          <p className="text-xs text-slate-500">{booking.vehicleDetails?.registeration_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {booking.vehicleDetails?.location || booking.vehicleDetails?.district || "Not set"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.vehicleDetails?.district || "Base location"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{String(booking._id).slice(0, 8).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatTZS(booking.totalPrice)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{formatDateTime(booking.pickupDate)}</p>
                      <p className="mt-1 text-xs text-slate-500">to {formatDateTime(booking.dropOffDate)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-[180px] truncate font-medium text-slate-800">{booking.pickUpLocation}</p>
                      <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">to {booking.dropOffLocation}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isBookingPaid(booking) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {getBookingLifecycleLabel(booking)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(isBookingPaid(booking) ? "Car booked" : isPaymentSubmitted(booking) || booking.paymentReference ? "Booking in progress" : "Awaiting payment")}`}>
                        {isBookingPaid(booking)
                          ? "Car booked"
                          : isPaymentSubmitted(booking) || booking.paymentReference
                            ? "Booking in progress"
                            : "Awaiting payment"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
                          onClick={() => handleDetailsModal(booking)}
                          title="View details"
                          type="button"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          trackingBooking?._id === booking._id
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                        onClick={() =>
                          setTrackingBooking((current) =>
                            current?._id === booking._id ? null : booking
                          )
                        }
                        type="button"
                      >
                        <FiMapPin />
                        {trackingBooking?._id === booking._id ? "Hide GPS" : "View GPS"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {trackingBooking && (
        <div className="mt-6">
          <DemoTripMonitor
            bookings={[trackingBooking]}
            role="vendor"
            title="Selected vehicle real-time location"
            emptyText="This booking has no active GPS session."
          />
        </div>
      )}
    </div>
  );
};

export default VendorBookingsTable;

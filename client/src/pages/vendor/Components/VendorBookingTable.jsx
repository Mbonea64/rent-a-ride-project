import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FiEye } from "react-icons/fi";
import VendorBookingDetailModal from "./VendorBookingModal";
import { setVendorOrderModalOpen, setVendorSingleOrderDetails } from "../../../redux/vendor/vendorBookingSlice";
import { formatTZS } from "../../../data/localData";
import { getBookings, setBookingStatus } from "../../../services/bookingService";
import { shouldShowInVendorDashboard } from "../../../services/demoOpsService";
import { getBookingLifecycleLabel, isBookingPaid } from "../../../services/notificationService";
import { getVendorVehicles } from "../../../services/vehicleService";

const statusOptions = [
  "notBooked",
  "booked",
  "onTrip",
  "notPicked",
  "canceled",
  "overDue",
  "tripCompleted",
];

const statusClass = (status) => {
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

const VendorBookingsTable = () => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [filtered, setFilteredBookings] = useState([]);
  const [busyBookingId, setBusyBookingId] = useState(null);
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
    fetchBookings();
    window.addEventListener("rent-a-ride-demo-reset", fetchBookings);
    return () => {
      window.removeEventListener("rent-a-ride-demo-reset", fetchBookings);
    };
  }, []);

  useEffect(() => {
    setFilteredBookings(
      bookings.filter(
        (booking) =>
          shouldShowInVendorDashboard(booking, vendorVehicles) &&
          !["canceled", "tripCompleted"].includes(booking.status)
      )
    );
  }, [vendorVehicles, bookings]);

  const handleStatusChange = async (event, bookingId) => {
    try {
      setBusyBookingId(bookingId);
      await setBookingStatus(bookingId, event.target.value);
      await fetchBookings();
    } catch (error) {
      console.error("Could not update booking status", error);
    } finally {
      setBusyBookingId(null);
    }
  };

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
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-600">
          No bookings yet
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
                  <th className="px-4 py-3 text-right">Actions</th>
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(booking.status)}`}>
                        {booking.status}
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
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium capitalize text-slate-700 disabled:opacity-60"
                          disabled={busyBookingId === booking._id}
                          value={booking.status}
                          onChange={(event) => handleStatusChange(event, booking._id)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBookingsTable;

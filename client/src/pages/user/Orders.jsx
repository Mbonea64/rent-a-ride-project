import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IoMdTime } from "react-icons/io";
import { CiCalendarDate } from "react-icons/ci";
import { CiLocationOn } from "react-icons/ci";
import { FiMapPin } from "react-icons/fi";
import UserOrderDetailsModal from "../../components/UserOrderDetailsModal";
import {
  setIsOrderModalOpen,
  setSingleOrderDetails,
} from "../../redux/user/userSlice";
import { formatTZS } from "../../data/localData";
import { cancelBooking, generateBookingInvoice, getBookings, modifyBooking } from "../../services/bookingService";
import DemoTripMonitor from "../../components/DemoTripMonitor";
import { getBookingLifecycleLabel, isBookingPaid } from "../../services/notificationService";
import VehicleArtwork from "../../components/VehicleArtwork";



export default function Orders() {
  const [bookings, setBookings] = useState([]);
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [timeForm, setTimeForm] = useState({ pickupDate: "", dropoffDate: "", dropoffLocation: "" });
  const dispatch = useDispatch();

  const loadBookings = () =>
    getBookings()
      .then((data) => setBookings(data))
      .catch((error) => console.error("Could not load bookings", error));

  useEffect(() => {
    let active = true;
    const refreshBookings = () =>
      getBookings()
        .then((data) => active && setBookings(data))
        .catch((error) => console.error("Could not load bookings", error));
    refreshBookings();
    window.addEventListener("storage", refreshBookings);
    window.addEventListener("rent-a-ride-payment-updated", refreshBookings);
    window.addEventListener("rent-a-ride-bookings-updated", refreshBookings);
    window.addEventListener("rent-a-ride-demo-clock-updated", refreshBookings);
    window.addEventListener("rent-a-ride-demo-reset", refreshBookings);
    return () => {
      active = false;
      window.removeEventListener("storage", refreshBookings);
      window.removeEventListener("rent-a-ride-payment-updated", refreshBookings);
      window.removeEventListener("rent-a-ride-bookings-updated", refreshBookings);
      window.removeEventListener("rent-a-ride-demo-clock-updated", refreshBookings);
      window.removeEventListener("rent-a-ride-demo-reset", refreshBookings);
    };
  }, []);

  const handleDetailsModal = (bookingDetails, vehicleDetails) => {
    dispatch(setIsOrderModalOpen(true));
    dispatch(setSingleOrderDetails(bookingDetails, vehicleDetails));
  };

  const handleCancel = async (bookingId) => {
    try {
      setBusyBookingId(bookingId);
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (error) {
      console.error("Could not cancel booking", error);
    } finally {
      setBusyBookingId(null);
    }
  };

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };

  const startEditingTime = (booking) => {
    setEditingBookingId(booking._id);
    setTimeForm({
      pickupDate: toDateTimeLocal(booking.bookingDetails.pickupDate),
      dropoffDate: toDateTimeLocal(booking.bookingDetails.dropOffDate),
      dropoffLocation: booking.bookingDetails.dropOffLocation || "",
    });
  };

  const handleTimeChange = async (booking) => {
    try {
      setBusyBookingId(booking._id);
      await modifyBooking(booking._id, {
        pickupDate: timeForm.pickupDate,
        dropoffDate: timeForm.dropoffDate,
        dropoff_location: timeForm.dropoffLocation,
        coupon: null,
        addOnCodes: booking.bookingDetails.selectedAddons || [],
        mileagePackageKm: booking.bookingDetails.mileagePackageKm,
        protectionPackage: booking.bookingDetails.protectionPackage || "standard",
      });
      setEditingBookingId(null);
      await loadBookings();
    } catch (error) {
      console.error("Could not update booking time", error);
    } finally {
      setBusyBookingId(null);
    }
  };

  const handleInvoice = async (bookingId) => {
    try {
      setBusyBookingId(bookingId);
      await generateBookingInvoice(bookingId);
      await loadBookings();
    } catch (error) {
      console.error("Could not generate invoice", error);
    } finally {
      setBusyBookingId(null);
    }
  };

  const activeBookings = bookings.filter((booking) => booking.bookingDetails.status !== "canceled");
  const cancelledBookings = bookings.filter((booking) => booking.bookingDetails.status === "canceled");

  return (
    <div className="max-w-4xl mx-auto py-20">
      <UserOrderDetailsModal />
      <h1 className="text-4xl font-semibold mb-2">Your Bookings</h1>
      <div className="text-sm text-gray-600 mb-8">
        {activeBookings && activeBookings.length > 0 ? (
          `${activeBookings.length} active booking${activeBookings.length === 1 ? "" : "s"}`
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-950">No active bookings</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Search for a vehicle, pay now, and this dashboard will show the booking, payment status, invoice, and GPS updates.
            </p>
          </div>
        )}
      </div>
      <div className="mb-8">
        {activeBookings && activeBookings.length > 0
          && activeBookings.map((cur, idx) => {
              const pickupDate = new Date(cur.bookingDetails.pickupDate);
              const dropoffDate = new Date(cur.bookingDetails.dropOffDate);

              return (
                <div
                  className="box-shadow-md drop-shadow-md border border-1px rounded-lg p-4 md:px-10 md:py-5 mb-4"
                  key={idx}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 ">
                    <div className="mb-4">
                    <VehicleArtwork
                      alt={cur.vehicleDetails.name}
                      className="aspect-video w-full rounded-[20px]"
                      src={cur.vehicleDetails.image[0]}
                    />
                    </div>
                    
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold mb-1">{cur._id}</h3>
                      <p className="text-gray-600 mb-2">
                        <span className="font-bold">Id</span> :{" "}
                        {cur.bookingDetails._id}
                      </p>
                      <p className="text-lg font-semibold mb-4 flex  items-center">
                        {formatTZS(cur.bookingDetails.totalPrice)}
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1 capitalize text-gray-700">
                          {cur.bookingDetails.status}
                        </span>
                        {cur.bookingDetails.rentalProduct === "long_term" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                            Long-term rate
                          </span>
                        )}
                        {cur.bookingDetails.protectionPackage && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                            {cur.bookingDetails.protectionPackage} protection
                          </span>
                        )}
                        <span
                          className={`rounded-full px-3 py-1 ${
                            isBookingPaid(cur) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {getBookingLifecycleLabel(cur)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <div className="">
                          <div className="mt-2 font-medium underline underline-offset-4 mb-5">
                            Pick up
                          </div>
                          <div className="mt-2 capitalize">
                            <p className="text-black text-sm mt-2 leading-6 flex items-center gap-2">
                              <span>
                                <CiLocationOn />
                              </span>
                              {cur.bookingDetails.pickUpLocation}
                            </p>

                            <div className="text-[14px] flex flex-col justify-start items-start  pr-2 gap-2 mt-2">
                              <div className="flex justify-between gap-2 items-center">
                                <span>
                                  <CiCalendarDate style={{ fontSize: 15 }} />
                                </span>
                                {
                                  <>
                                    <span> {pickupDate.getDate()}: </span>
                                    <span>{pickupDate.getMonth()} : </span>
                                    <span>{pickupDate.getFullYear()} </span>
                                  </>
                                }
                              </div>
                              <div className="flex justify-center items-center gap-2">
                                <span>
                                  <IoMdTime style={{ fontSize: 16 }} />
                                </span>
                                <span></span>
                                {pickupDate.getHours()}:
                                <span>{pickupDate.getMinutes()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="">
                          <div className="mt-2 font-medium underline underline-offset-4 mb-5">
                            Drop off
                          </div>

                          <div className="mt-2">
                            <p className="text-black text-sm leading-6 mt-2 capitalize flex items-center gap-2">
                              <span>
                                <CiLocationOn />
                              </span>
                              {cur.bookingDetails.dropOffLocation}
                            </p>

                            <div className="text-[14px] flex flex-col justify-start items-start pr-2 gap-2 mt-2">
                              <div className="flex  justify-between gap-2 items-center">
                                <span>
                                  <CiCalendarDate style={{ fontSize: 15 }} />
                                </span>
                                <span>{dropoffDate.getDate()} : </span>
                                <span>{dropoffDate.getMonth()} : </span>
                                <span>{dropoffDate.getFullYear()} </span>
                              </div>
                              <div className="flex justify-center items-center gap-2">
                                <span>
                                  <IoMdTime style={{ fontSize: 16 }} />
                                </span>
                                <span>{dropoffDate.getHours()} </span>:
                                <span>{dropoffDate.getMinutes()} </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex mt-4">
                        <button
                          className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 "
                          onClick={() => handleDetailsModal(cur)}
                        >
                          Details
                        </button>
                        <button
                          className="rounded-lg bg-white px-5 py-2.5 me-2 mb-2 text-sm font-medium text-gray-800 ring-1 ring-gray-300 disabled:opacity-60"
                          disabled={busyBookingId === cur._id}
                          onClick={() => handleInvoice(cur._id)}
                        >
                          Invoice
                        </button>
                        <button
                          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 me-2 mb-2 text-sm font-medium ring-1 transition ${
                            trackingBooking?._id === cur._id
                              ? "bg-gray-900 text-white ring-gray-900"
                              : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            setTrackingBooking((current) =>
                              current?._id === cur._id ? null : cur
                            )
                          }
                          type="button"
                        >
                          <FiMapPin />
                          {trackingBooking?._id === cur._id ? "Hide GPS" : "View GPS"}
                        </button>
                        {["notBooked", "booked"].includes(cur.bookingDetails.status) && (
                          <>
                          <button
                            className="rounded-lg bg-sky-50 px-5 py-2.5 me-2 mb-2 text-sm font-medium text-sky-700 ring-1 ring-sky-200 disabled:opacity-60"
                            disabled={busyBookingId === cur._id}
                            onClick={() => startEditingTime(cur)}
                          >
                            Manage time
                          </button>
                          <button
                            className="rounded-lg bg-red-50 px-5 py-2.5 me-2 mb-2 text-sm font-medium text-red-700 ring-1 ring-red-200 disabled:opacity-60"
                            disabled={busyBookingId === cur._id}
                            onClick={() => handleCancel(cur._id)}
                          >
                            Cancel
                          </button>
                          </>
                        )}
                      </div>
                      {editingBookingId === cur._id && (
                        <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
                          <p className="mb-3 text-sm font-semibold text-sky-950">Manage booking time</p>
                          <div className="grid gap-3 md:grid-cols-3">
                            <label className="text-xs font-medium text-slate-700">
                              Pickup
                              <input
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
                                type="datetime-local"
                                value={timeForm.pickupDate}
                                onChange={(event) => setTimeForm((current) => ({ ...current, pickupDate: event.target.value }))}
                              />
                            </label>
                            <label className="text-xs font-medium text-slate-700">
                              Drop-off
                              <input
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
                                type="datetime-local"
                                value={timeForm.dropoffDate}
                                onChange={(event) => setTimeForm((current) => ({ ...current, dropoffDate: event.target.value }))}
                              />
                            </label>
                            <label className="text-xs font-medium text-slate-700">
                              Return location
                              <input
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
                                value={timeForm.dropoffLocation}
                                onChange={(event) => setTimeForm((current) => ({ ...current, dropoffLocation: event.target.value }))}
                              />
                            </label>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              disabled={busyBookingId === cur._id}
                              onClick={() => handleTimeChange(cur)}
                            >
                              Save changes
                            </button>
                            <button
                              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                              onClick={() => setEditingBookingId(null)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                      {trackingBooking?._id === cur._id && (
                        <div className="mt-6">
                          <DemoTripMonitor
                            bookings={[cur]}
                            role="user"
                            title="Selected vehicle real-time location"
                            emptyText="This booking has no active GPS session."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          }
      </div>
      {cancelledBookings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-950">Cancelled booking history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cancelled bookings are removed from active reservations, so the vehicle can be booked again.
          </p>
          <div className="mt-4 space-y-2">
            {cancelledBookings.map((booking) => (
              <div className="flex flex-col justify-between gap-2 rounded-lg bg-white p-3 text-sm md:flex-row" key={booking._id}>
                <span className="font-medium text-slate-800">{booking.vehicleDetails?.name || "Vehicle booking"}</span>
                <span className="text-slate-500">{booking.bookingDetails.pickUpLocation} to {booking.bookingDetails.dropOffLocation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

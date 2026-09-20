import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiMapPin, FiMessageSquare, FiTruck } from "react-icons/fi";
import {
  buildDemoTrips,
  getCompanyMessageForTrip,
  subscribeDemoOps,
} from "../services/demoOpsService";

const statusClass = (trip) => {
  if (trip.deadlineBreached) return "bg-red-100 text-red-700 ring-red-200";
  if (trip.approachingDeadline || trip.outsideBoundary) return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-green-100 text-green-700 ring-green-200";
};

const formatMinutes = (minutes) => {
  if (minutes <= 0) return "Deadline passed";
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
  return `${minutes}m left`;
};

const TripMap = ({ trip }) => (
  <div className="relative mt-4 h-28 overflow-hidden rounded-lg bg-slate-950">
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 112" role="img" aria-label="Trip route simulation">
      <path
        d="M28 78 C96 16 142 94 205 52 S310 30 392 68"
        fill="none"
        stroke="rgba(255,255,255,.22)"
        strokeDasharray="8 8"
        strokeWidth="5"
      />
      <path
        d="M28 78 C96 16 142 94 205 52 S310 30 392 68"
        fill="none"
        pathLength="100"
        stroke="#38bdf8"
        strokeDasharray={`${trip.progress} 100`}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <circle cx="28" cy="78" r="8" fill="#22c55e" />
      <circle cx="392" cy="68" r="8" fill="#f97316" />
      <circle
        cx={28 + (364 * trip.progress) / 100}
        cy={trip.progress > 70 ? 68 : trip.progress > 38 ? 52 : 78 - trip.progress / 2}
        r="9"
        fill="#ffffff"
      />
    </svg>
    <div className="absolute left-3 top-3 text-xs font-semibold text-white">Live route</div>
    <div className="absolute bottom-3 left-3 max-w-[45%] truncate text-xs text-white">{trip.pickupLocation}</div>
    <div className="absolute bottom-3 right-3 max-w-[45%] truncate text-right text-xs text-white">
      {trip.dropoffLocation}
    </div>
  </div>
);

const DemoTripMonitor = ({ bookings = [], role = "admin", vendorFilter, title, emptyText }) => {
  const [, setChannelTick] = useState(0);

  useEffect(() => subscribeDemoOps(() => setChannelTick((tick) => tick + 1)), []);

  const trips = useMemo(() => {
    const activeBookings = bookings.filter(
      (booking) => !["canceled", "tripCompleted", "cancelled", "completed"].includes(booking.status || booking.bookingDetails?.status)
    );
    const allTrips = buildDemoTrips(activeBookings);
    if (!vendorFilter) return allTrips;
    return allTrips.filter((trip) => vendorFilter(trip));
  }, [bookings, vendorFilter]);

  const visibleTrips = trips.slice(0, role === "user" ? 2 : 4);

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {role === "user" ? "Rent a Ride messages" : "Operations channel"}
          </p>
          <h2 className="text-xl font-semibold text-slate-950">
            {title || "Live booking and trip monitor"}
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <FiTruck />
          {trips.length} active trips
        </span>
      </div>

      {visibleTrips.length === 0 ? (
        <div className="mt-5 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">
          {emptyText || "No active trips yet. Create a booking and this panel will update automatically."}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {visibleTrips.map((trip) => (
            <article key={trip.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{trip.vehicleName}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <FiMapPin />
                    {trip.pickupLocation} to {trip.dropoffLocation}
                  </p>
                </div>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass(trip)}`}>
                  {trip.deadlineBreached ? "Deadline breached" : formatMinutes(trip.minutesLeft)}
                </span>
              </div>

              <TripMap trip={trip} />

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  {trip.vendor.name}
                </span>
                {trip.outsideBoundary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                    <FiAlertTriangle />
                    Boundary watch
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium capitalize text-slate-700">
                  {trip.status}
                </span>
              </div>

              <div className="mt-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <FiMessageSquare />
                  Automated company message
                </div>
                <p>{getCompanyMessageForTrip(trip)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default DemoTripMonitor;

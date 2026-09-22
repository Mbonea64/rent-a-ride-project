import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiAlertTriangle, FiMapPin, FiMessageSquare, FiTruck } from "react-icons/fi";
import {
  buildDemoTrips,
  getCompanyMessageForTrip,
  subscribeDemoOps,
} from "../services/demoOpsService";
import {
  getDemoClockState,
  jumpDemoClockToScenario,
  resetDemoClock,
  subscribeDemoClock,
} from "../services/demoTimeService";

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

const TripMap = ({ trip }) => {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyRef = useRef(null);
  const boundaryRef = useRef(null);
  const routeRef = useRef(null);
  const currentPosition = [trip.currentCoordinate.lat, trip.currentCoordinate.lng];
  const homePosition = [trip.homeCoordinate.lat, trip.homeCoordinate.lng];

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const vehicleIcon = L.divIcon({
      className: "vehicle-tracker-marker",
      html: '<span class="vehicle-tracker-marker-dot"></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const map = L.map(mapElementRef.current, {
      attributionControl: false,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      keyboard: false,
    }).setView(currentPosition, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);

    boundaryRef.current = L.circle(homePosition, {
      radius: 4200,
      color: trip.outsideBoundary ? "#f97316" : "#0ea5e9",
      weight: 2,
      fillColor: trip.outsideBoundary ? "#fed7aa" : "#bae6fd",
      fillOpacity: 0.18,
      dashArray: "6 8",
    }).addTo(map);

    routeRef.current = L.polyline([homePosition, currentPosition], {
      color: "#0f172a",
      weight: 3,
      opacity: 0.6,
    }).addTo(map);

    accuracyRef.current = L.circle(currentPosition, {
      radius: 380,
      color: trip.deadlineBreached || trip.outsideBoundary ? "#ef4444" : "#22c55e",
      weight: 1,
      fillColor: trip.deadlineBreached || trip.outsideBoundary ? "#fecaca" : "#bbf7d0",
      fillOpacity: 0.35,
    }).addTo(map);

    markerRef.current = L.marker(currentPosition, { icon: vehicleIcon }).addTo(map);
    L.marker(homePosition, {
      icon: L.divIcon({
        className: "vehicle-tracker-home-marker",
        html: '<span class="vehicle-tracker-home-dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    }).addTo(map);

    map.fitBounds(L.latLngBounds([homePosition, currentPosition]).pad(0.45), {
      maxZoom: 14,
      animate: false,
    });

    window.setTimeout(() => map.invalidateSize(), 150);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      accuracyRef.current = null;
      boundaryRef.current = null;
      routeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !accuracyRef.current || !routeRef.current || !boundaryRef.current) return;
    markerRef.current.setLatLng(currentPosition);
    accuracyRef.current
      .setLatLng(currentPosition)
      .setStyle({
        color: trip.deadlineBreached || trip.outsideBoundary ? "#ef4444" : "#22c55e",
        fillColor: trip.deadlineBreached || trip.outsideBoundary ? "#fecaca" : "#bbf7d0",
      });
    boundaryRef.current.setStyle({
      color: trip.outsideBoundary ? "#f97316" : "#0ea5e9",
      fillColor: trip.outsideBoundary ? "#fed7aa" : "#bae6fd",
    });
    routeRef.current.setLatLngs([homePosition, currentPosition]);
    mapRef.current.panTo(currentPosition, { animate: true, duration: 0.75 });
  }, [
    trip.currentCoordinate.lat,
    trip.currentCoordinate.lng,
    trip.deadlineBreached,
    trip.outsideBoundary,
  ]);

  return (
    <div className="relative mx-auto mt-5 h-[520px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner">
      <div ref={mapElementRef} className="h-full w-full" aria-label="Vehicle GPS tracker map" />
      <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
        Vehicle GPS tracker
      </div>
      <div className="absolute bottom-4 left-4 max-w-[74%] truncate rounded-full bg-white/95 px-4 py-2 text-base font-semibold text-slate-800 shadow-lg">
        Last seen near {trip.gpsArea}
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-2 text-base font-semibold text-slate-800 shadow-lg">
        {trip.speedKmh} km/h
      </div>
      <div className="absolute left-4 top-16 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg">
        {trip.currentCoordinate.lat.toFixed(4)}, {trip.currentCoordinate.lng.toFixed(4)}
      </div>
    </div>
  );
};

const demoScenarios = [
  {
    key: "pickup-soon",
    label: "Pickup soon",
    note: "Shows pickup reminder messages.",
  },
  {
    key: "after-pickup",
    label: "Collected",
    note: "Starts active vehicle tracking.",
  },
  {
    key: "return-soon",
    label: "Return soon",
    note: "Shows return reminder messages.",
  },
  {
    key: "boundary-watch",
    label: "Boundary watch",
    note: "Moves GPS close to travel boundary.",
  },
  {
    key: "overdue",
    label: "Overdue",
    note: "Shows missed return deadline.",
  },
];

const formatDemoClock = (state) => {
  if (!state?.offsetMs) return "Live time";
  const simulated = new Date(Date.now() + Number(state.offsetMs || 0));
  if (Number.isNaN(simulated.getTime())) return state.label || "Demo time";
  return simulated.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DemoTripMonitor = ({ bookings = [], role = "admin", vendorFilter, title, emptyText }) => {
  const [, setChannelTick] = useState(0);
  const [clockState, setClockState] = useState(getDemoClockState());

  useEffect(() => subscribeDemoOps(() => setChannelTick((tick) => tick + 1)), []);
  useEffect(
    () =>
      subscribeDemoClock((state) => {
        setClockState(state);
        setChannelTick((tick) => tick + 1);
      }),
    []
  );
  useEffect(() => {
    const interval = window.setInterval(() => setChannelTick((tick) => tick + 1), 4500);
    return () => window.clearInterval(interval);
  }, []);

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
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {role === "user" ? "Rent a Ride messages" : "Operations channel"}
          </p>
          <h2 className="text-3xl font-semibold text-slate-950">
            {title || "Live vehicle GPS monitor"}
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <FiTruck />
          {trips.length} active trips
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Presentation simulator
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              {clockState?.label || "Live time"} · {formatDemoClock(clockState)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Fast-forward the demo to trigger pickup reminders, GPS movement, return reminders, boundary alerts, and overdue states across open dashboards.
            </p>
          </div>
          <button
            className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => {
              resetDemoClock();
              setChannelTick((tick) => tick + 1);
            }}
            type="button"
          >
            Reset live time
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {demoScenarios.map((scenario) => (
            <button
              className={`rounded-lg border px-3 py-3 text-left transition ${
                clockState?.mode === scenario.key
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
              } ${bookings.length === 0 ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={bookings.length === 0}
              key={scenario.key}
              onClick={() => {
                jumpDemoClockToScenario(bookings, scenario.key);
                setChannelTick((tick) => tick + 1);
              }}
              type="button"
            >
              <span className="block text-sm font-semibold">{scenario.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-75">{scenario.note}</span>
            </button>
          ))}
        </div>
      </div>

      {visibleTrips.length === 0 ? (
        <div className="mt-5 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">
          {emptyText || "No active vehicle GPS sessions yet. Create a booking and this panel will update automatically."}
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {visibleTrips.map((trip) => (
            <article key={trip.id} className="mx-auto w-full max-w-6xl rounded-lg border border-slate-200 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{trip.vehicleName}</h3>
                  <p className="mt-2 flex items-center gap-2 text-base text-slate-600">
                    <FiMapPin />
                    GPS online near {trip.gpsArea}
                  </p>
                </div>
                <span className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusClass(trip)}`}>
                  {trip.deadlineBreached ? "Deadline breached" : formatMinutes(trip.minutesLeft)}
                </span>
              </div>

              <TripMap trip={trip} />

              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">
                  {trip.vendor.name}
                </span>
                {trip.outsideBoundary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 font-medium text-amber-800">
                    <FiAlertTriangle />
                    Boundary watch
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-4 py-2 font-medium capitalize text-slate-700">
                  {trip.status}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">
                  Return window {trip.progress}% used
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">
                  Pickup {trip.pickupLocation}
                </span>
              </div>

              <div className="mt-5 rounded-lg bg-sky-50 p-5 text-base text-sky-900">
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

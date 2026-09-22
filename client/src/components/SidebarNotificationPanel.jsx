import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { FiBell } from "react-icons/fi";
import { getBookings } from "../services/bookingService";
import {
  buildBookingNotifications,
  getUnreadNotifications,
  markNotificationsRead,
} from "../services/notificationService";
import { shouldShowInVendorDashboard } from "../services/demoOpsService";
import { getVendorVehicles } from "../services/vehicleService";

const SidebarNotificationPanel = ({ role = "customer" }) => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const bookingData = await getBookings();
        const vehicleData = role === "vendor" ? await getVendorVehicles().catch(() => []) : [];
        if (!active) return;
        setBookings(bookingData || []);
        setVendorVehicles(vehicleData || []);
      } catch (error) {
        console.error("Could not load sidebar notifications", error);
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    const onRead = () => setReadVersion((current) => current + 1);
    window.addEventListener("rent-a-ride-notifications-read", onRead);
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("rent-a-ride-bookings-updated", load);
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("rent-a-ride-notifications-read", onRead);
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("rent-a-ride-bookings-updated", load);
      window.removeEventListener("storage", load);
    };
  }, [role]);

  const scopedBookings = useMemo(() => {
    if (role !== "vendor") return bookings;
    return bookings.filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles));
  }, [bookings, role, vendorVehicles]);

  const notifications = useMemo(
    () => getUnreadNotifications(buildBookingNotifications({ bookings: scopedBookings, role }), role).slice(0, 3),
    [scopedBookings, role, readVersion]
  );

  if (notifications.length === 0) return null;

  const markRead = (ids) => {
    markNotificationsRead(role, ids);
    setReadVersion((current) => current + 1);
  };

  return (
    <div className="mx-2 mt-6 rounded-lg border border-red-100 bg-red-50 p-3 text-red-900 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiBell />
          Notifications
        </div>
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          {notifications.length}
        </span>
      </div>
      <button
        className="mb-3 w-full rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white"
        onClick={() => markRead(notifications.map((notification) => notification.id))}
        type="button"
      >
        Mark all visible read
      </button>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div className="rounded-md bg-white/70 p-2" key={notification.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold">{notification.title}</p>
              <button
                className="shrink-0 text-[10px] font-semibold text-red-700 underline underline-offset-2"
                onClick={() => markRead([notification.id])}
                type="button"
              >
                Read
              </button>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-red-800">{notification.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

SidebarNotificationPanel.propTypes = {
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
};

export default SidebarNotificationPanel;

import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { FiBell } from "react-icons/fi";
import { getBookings } from "../services/bookingService";
import { buildBookingNotifications } from "../services/notificationService";
import { shouldShowInVendorDashboard } from "../services/demoOpsService";
import { getVendorVehicles } from "../services/vehicleService";

const SidebarNotificationPanel = ({ role = "customer" }) => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);

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
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [role]);

  const scopedBookings = useMemo(() => {
    if (role !== "vendor") return bookings;
    return bookings.filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles));
  }, [bookings, role, vendorVehicles]);

  const notifications = buildBookingNotifications({ bookings: scopedBookings, role }).slice(0, 3);

  if (notifications.length === 0) return null;

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
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div className="rounded-md bg-white/70 p-2" key={notification.id}>
            <p className="text-xs font-semibold">{notification.title}</p>
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

import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import NotificationWidget from "./NotificationWidget";
import { getBookings } from "../services/bookingService";
import { shouldShowInVendorDashboard } from "../services/demoOpsService";
import { getVendorVehicles } from "../services/vehicleService";

const NotificationsPage = ({ role = "customer" }) => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getBookings().catch(() => []),
      role === "vendor" ? getVendorVehicles().catch(() => []) : Promise.resolve([]),
    ]).then(([bookingData, vehicleData]) => {
      if (!active) return;
      setBookings(bookingData || []);
      setVendorVehicles(vehicleData || []);
    });
    return () => {
      active = false;
    };
  }, [role]);

  const scopedBookings = useMemo(() => {
    if (role !== "vendor") return bookings;
    return bookings.filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles));
  }, [bookings, role, vendorVehicles]);

  return (
    <div className="mt-6 max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts</p>
        <h1 className="text-3xl font-semibold text-slate-950">Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Booking, payment, cancellation, and schedule updates that need attention.
        </p>
      </div>
      <NotificationWidget bookings={scopedBookings} role={role} title="Current notifications" />
    </div>
  );
};

NotificationsPage.propTypes = {
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
};

export default NotificationsPage;

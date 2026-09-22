import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { getBookings } from "../services/bookingService";
import { shouldShowInVendorDashboard } from "../services/demoOpsService";
import {
  buildBookingNotifications,
  buildVehicleIssueNotifications,
  buildVehicleRequestNotifications,
  getUnreadNotifications,
} from "../services/notificationService";
import { getVehicleIssueReports } from "../services/vehicleIssueService";
import { getPendingVehicles, getVendorVehicles } from "../services/vehicleService";

const rolePaths = {
  admin: "/adminDashboard/notifications",
  vendor: "/vendorDashboard/notifications",
  customer: "/profile/notifications",
};

const SidebarNotificationLink = ({ role = "customer" }) => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [pendingVehicleRequests, setPendingVehicleRequests] = useState([]);
  const [vehicleIssueReports, setVehicleIssueReports] = useState([]);
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const bookingData = await getBookings();
        const vehicleData = role === "vendor" ? await getVendorVehicles().catch(() => []) : [];
        const pendingVehicles = role === "admin" ? await getPendingVehicles().catch(() => []) : [];
        if (!active) return;
        setBookings(bookingData || []);
        setVendorVehicles(vehicleData || []);
        setPendingVehicleRequests(pendingVehicles || []);
        setVehicleIssueReports(role === "admin" ? await getVehicleIssueReports().catch(() => []) : []);
      } catch (error) {
        console.error("Could not load notification link", error);
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    const onRead = () => setReadVersion((current) => current + 1);
    window.addEventListener("rent-a-ride-notifications-read", onRead);
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("rent-a-ride-bookings-updated", load);
    window.addEventListener("rent-a-ride-vehicle-requests-updated", load);
    window.addEventListener("rent-a-ride-vehicle-issues-updated", load);
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("rent-a-ride-notifications-read", onRead);
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("rent-a-ride-bookings-updated", load);
      window.removeEventListener("rent-a-ride-vehicle-requests-updated", load);
      window.removeEventListener("rent-a-ride-vehicle-issues-updated", load);
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("storage", load);
    };
  }, [role]);

  const scopedBookings = useMemo(() => {
    if (role !== "vendor") return bookings;
    return bookings.filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles));
  }, [bookings, role, vendorVehicles]);

  const unreadNotifications = useMemo(
    () =>
      getUnreadNotifications(
        [
          ...(role === "admin"
            ? buildVehicleRequestNotifications({ vehicles: pendingVehicleRequests })
            : []),
          ...(role === "admin"
            ? buildVehicleIssueNotifications({ reports: vehicleIssueReports })
            : []),
          ...buildBookingNotifications({ bookings: scopedBookings, role }),
        ],
        role
      ),
    [pendingVehicleRequests, vehicleIssueReports, scopedBookings, role, readVersion]
  );

  return (
    <NavLink
      to={rolePaths[role]}
      className={({ isActive }) =>
        `mx-2 mt-3 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition ${
          isActive ? "bg-red-600 text-white" : "bg-red-50 text-red-800 hover:bg-red-100"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <FiBell />
        Notifications
      </span>
      {unreadNotifications.length > 0 && (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          {unreadNotifications.length}
        </span>
      )}
    </NavLink>
  );
};

SidebarNotificationLink.propTypes = {
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
};

export default SidebarNotificationLink;

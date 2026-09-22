import { useEffect, useMemo, useState } from "react";
import PresentationDashboard from "../../../components/PresentationDashboard";
import { getBookings } from "../../../services/bookingService";
import { getAllVehicles, getPendingVehicles } from "../../../services/vehicleService";

const AdminHomeMain = () => {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([
        getBookings().catch(() => []),
        getAllVehicles().catch(() => []),
        getPendingVehicles().catch(() => []),
      ]).then(([bookingData, vehicleData, pendingData]) => {
        if (!active) return;
        setBookings(bookingData || []);
        setVehicles(vehicleData || []);
        setPendingVehicles(pendingData || []);
      });

    load();
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => ["booked", "onTrip", "overDue"].includes(booking.status)).length,
    [bookings]
  );

  return (
    <PresentationDashboard
      eyebrow="Admin command center"
      title="Fleet approvals, booking control, and marketplace oversight."
      subtitle="This workspace gives company operators one place to approve vendor inventory, monitor active reservations, and keep customer communication under the Rent a Ride brand."
      primaryAction={{ label: "Review vendor cars", to: "/adminDashboard/vendorVehicleRequests" }}
      secondaryAction={{ label: "Open bookings monitor", to: "/adminDashboard/orders" }}
      stats={[
        {
          label: "Approved fleet",
          value: vehicles.filter((vehicle) => vehicle.isAdminApproved && vehicle.isDeleted === "false").length,
          note: "Company and approved vendor vehicles visible to customers.",
        },
        {
          label: "Pending vendor cars",
          value: pendingVehicles.length,
          note: "Admin must approve before customers can book.",
        },
        {
          label: "Active bookings",
          value: activeBookings,
          note: "Trips currently booked or on the road.",
        },
      ]}
      steps={[
        {
          title: "Secure operator access",
          description: "The public customer login no longer opens the admin dashboard. Admin uses /admin-login.",
        },
        {
          title: "Vendor inventory review",
          description: "The car stays pending until the owner approves it, keeping the marketplace controlled.",
        },
        {
          title: "Reservation monitoring",
          description: "The booking appears in the admin control room and in the owning vendor dashboard.",
        },
        {
          title: "Company-managed communication",
          description: "Deadline and route warnings are branded as company messages, not vendor messages.",
        },
      ]}
      alerts={[
        {
          title: "Separate role gateways",
          description: "Customer, vendor, and admin each have their own entry path and dashboard scope.",
        },
        {
          title: "Vendor approval logic",
          description: "Vendor cars can be accepted or rejected before entering the public catalogue.",
        },
        {
          title: "Operations visibility",
          description: "Admin sees the full booking channel across company-owned and vendor-owned vehicles.",
        },
      ]}
    />
  );
};

export default AdminHomeMain;

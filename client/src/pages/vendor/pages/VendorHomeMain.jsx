import { useEffect, useMemo, useState } from "react";
import PresentationDashboard from "../../../components/PresentationDashboard";
import { getBookings } from "../../../services/bookingService";
import { shouldShowInVendorDashboard } from "../../../services/demoOpsService";
import { getVendorVehicles } from "../../../services/vehicleService";

const VendorHomeMain = () => {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([getVendorVehicles().catch(() => []), getBookings().catch(() => [])]).then(([vehicleData, bookingData]) => {
        if (!active) return;
        setVehicles(vehicleData || []);
        setBookings(bookingData || []);
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

  const vendorBookings = useMemo(
    () => bookings.filter((booking) => shouldShowInVendorDashboard(booking, vehicles)),
    [bookings, vehicles]
  );

  return (
    <PresentationDashboard
      eyebrow="Vendor workspace"
      title="Fleet submissions, approvals, and reservation tracking."
      subtitle="This workspace is scoped to the vendor account. Vendors manage their own vehicles and bookings while Rent a Ride controls marketplace approval and customer communication."
      primaryAction={{ label: "Manage my cars", to: "/vendorDashboard/vendorAllVeihcles" }}
      secondaryAction={{ label: "View my bookings", to: "/vendorDashboard/bookings" }}
      stats={[
        {
          label: "My uploaded cars",
          value: vehicles.filter((vehicle) => vehicle.isDeleted === "false").length,
          note: "Only cars uploaded by this vendor account.",
        },
        {
          label: "Approved cars",
          value: vehicles.filter((vehicle) => vehicle.isAdminApproved && vehicle.isDeleted === "false").length,
          note: "Approved vehicles can appear in customer search.",
        },
        {
          label: "My bookings",
          value: vendorBookings.length,
          note: "Bookings tied to this vendor's vehicles.",
        },
      ]}
      steps={[
        {
          title: "Submit vehicle details",
          description: "The vehicle is connected to the vendor account and submitted for admin approval.",
        },
        {
          title: "Wait for marketplace approval",
          description: "Rent a Ride keeps control of marketplace quality before customers can book.",
        },
        {
          title: "Receive reservation updates",
          description: "The booking appears here only when it belongs to this vendor's uploaded vehicle.",
        },
        {
          title: "Track delivery and return status",
          description: "The vendor sees operational status, but company reminders still come from Rent a Ride.",
        },
      ]}
      alerts={[
        {
          title: "Company-owned cars stay separate",
          description: "Seed/admin vehicles do not pretend to belong to a vendor.",
        },
        {
          title: "Approval protects the marketplace",
          description: "Pending and rejected vehicles do not become customer-facing inventory.",
        },
        {
          title: "Vendor sees only their business",
          description: "The vendor dashboard is scoped to that account's uploaded fleet.",
        },
      ]}
    />
  );
};

export default VendorHomeMain;

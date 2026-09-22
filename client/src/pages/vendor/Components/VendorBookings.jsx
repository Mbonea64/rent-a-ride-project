import { useEffect, useMemo, useState } from "react";
import { getBookings } from "../../../services/bookingService";
import { shouldShowInVendorDashboard } from "../../../services/demoOpsService";
import { getVendorVehicles } from "../../../services/vehicleService";
import VendorBookingsTable from "./VendorBookingTable"

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);

  useEffect(() => {
    let active = true;
    const load = () => Promise.all([getBookings(), getVendorVehicles().catch(() => [])])
      .then(([bookingData, vehicleData]) => {
        if (!active) return;
        setBookings(bookingData || []);
        setVendorVehicles(vehicleData || []);
      })
      .catch((error) => console.error("Could not load vendor operations", error));
    load();
    const interval = window.setInterval(load, 5000);
    const onVisibilityChange = () => {
      if (!document.hidden) load();
    };
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("rent-a-ride-bookings-updated", load);
    window.addEventListener("rent-a-ride-demo-clock-updated", load);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("rent-a-ride-bookings-updated", load);
      window.removeEventListener("rent-a-ride-demo-clock-updated", load);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("storage", load);
    };
  }, []);

  const vendorBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          shouldShowInVendorDashboard(booking, vendorVehicles) &&
          !["canceled", "tripCompleted"].includes(booking.status)
      ),
    [bookings, vendorVehicles]
  );

  return (
    <div className="mt-5 w-full max-w-none">
      <VendorBookingsTable bookings={vendorBookings} />
    </div>
  )
}

export default VendorBookings

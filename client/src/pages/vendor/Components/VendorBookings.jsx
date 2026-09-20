import { useEffect, useMemo, useState } from "react";
import DemoTripMonitor from "../../../components/DemoTripMonitor";
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
    window.addEventListener("rent-a-ride-demo-reset", load);
    return () => {
      active = false;
      window.removeEventListener("rent-a-ride-demo-reset", load);
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
      <DemoTripMonitor
        bookings={vendorBookings}
        role="vendor"
        title="Vendor delivery and return monitor"
        emptyText="Active deliveries and returns from this vendor fleet will appear here."
      />
      <VendorBookingsTable />
    </div>
  )
}

export default VendorBookings

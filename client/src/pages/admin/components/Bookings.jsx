import { useEffect, useState } from "react";
import DemoTripMonitor from "../../../components/DemoTripMonitor";
import { getBookings } from "../../../services/bookingService";
import BookingsTable from "./BookingsTable";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;
    getBookings()
      .then((data) => active && setBookings(data || []))
      .catch((error) => console.error("Could not load admin operations", error));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-4">
      <div className="my-4 mb-8">
        <h2 className="font-bold text-lg">User Bookings</h2>
      </div>
      <DemoTripMonitor
        bookings={bookings}
        role="admin"
        title="Admin control room"
        emptyText="All vendor-assigned bookings and company alerts will appear here after a customer booking."
      />
      <BookingsTable />
    </div>
  );
};

export default Bookings;

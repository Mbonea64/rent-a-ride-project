import { useEffect, useState } from "react";
import { getBookings } from "../../../services/bookingService";
import BookingsTable from "./BookingsTable";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      getBookings()
        .then((data) => active && setBookings(data || []))
        .catch((error) => console.error("Could not load admin operations", error));
    load();
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("rent-a-ride-bookings-updated", load);
    window.addEventListener("rent-a-ride-demo-clock-updated", load);
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("rent-a-ride-bookings-updated", load);
      window.removeEventListener("rent-a-ride-demo-clock-updated", load);
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <div className="mt-4">
      <div className="my-4 mb-8">
        <h2 className="font-bold text-lg">User Bookings</h2>
      </div>
      <BookingsTable bookings={bookings} />
    </div>
  );
};

export default Bookings;

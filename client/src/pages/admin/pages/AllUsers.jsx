import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { getBookings } from "../../../services/bookingService";
import { getCustomers } from "../../../services/adminService";

const AllUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getCustomers().catch(() => []), getBookings().catch(() => [])]).then(
      ([customerData, bookingData]) => {
        if (!active) return;
        setCustomers(customerData || []);
        setBookings(bookingData || []);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const rows = customers.map((customer) => {
    const customerBookings = bookings.filter((booking) => booking.userId === customer._id);
    return {
      id: customer._id,
      name: customer.username,
      phone: customer.phoneNumber || "Not provided",
      address: customer.adress || "Not provided",
      bookings: customerBookings.length,
      activeBookings: customerBookings.filter((booking) =>
        ["booked", "onTrip", "notBooked"].includes(booking.status)
      ).length,
      joined: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "Unknown",
      customer,
    };
  });

  const columns = [
    {
      field: "name",
      headerName: "Customer",
      width: 240,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <ProfileAvatar name={params.value} role="customer" src={params.row.customer.profilePicture} size={34} />
          <div>
            <p className="font-semibold text-slate-900">{params.value}</p>
            <p className="text-xs text-slate-500">{params.row.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    { field: "phone", headerName: "Phone", width: 160 },
    { field: "address", headerName: "Address", width: 220 },
    { field: "bookings", headerName: "Total bookings", width: 130 },
    { field: "activeBookings", headerName: "Active", width: 100 },
    { field: "joined", headerName: "Joined", width: 130 },
  ];

  return (
    <div className="mt-6 max-w-[1100px]">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accounts</p>
        <h1 className="text-3xl font-semibold text-slate-950">Customers</h1>
        <p className="mt-2 text-sm text-slate-600">Customer profiles and booking activity across Rent a Ride.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Customers</p>
          <p className="mt-2 text-3xl font-semibold">{customers.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Customer bookings</p>
          <p className="mt-2 text-3xl font-semibold">{bookings.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active reservations</p>
          <p className="mt-2 text-3xl font-semibold">
            {bookings.filter((booking) => ["booked", "onTrip", "notBooked"].includes(booking.status)).length}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <Box sx={{ height: 560, width: "100%" }}>
          <DataGrid rows={rows} columns={columns} pageSizeOptions={[8]} disableRowSelectionOnClick />
        </Box>
      </div>
    </div>
  );
};

export default AllUsers;

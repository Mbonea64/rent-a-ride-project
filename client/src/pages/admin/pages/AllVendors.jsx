import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { getBookings } from "../../../services/bookingService";
import { getVendors } from "../../../services/adminService";
import { getAllVehicles } from "../../../services/vehicleService";

const AllVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getVendors().catch(() => []),
      getAllVehicles().catch(() => []),
      getBookings().catch(() => []),
    ]).then(([vendorData, vehicleData, bookingData]) => {
      if (!active) return;
      setVendors(vendorData || []);
      setVehicles(vehicleData || []);
      setBookings(bookingData || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = vendors.map((vendor) => {
    const vendorVehicles = vehicles.filter((vehicle) => vehicle.addedBy === vendor._id);
    const vehicleIds = vendorVehicles.map((vehicle) => vehicle._id);
    const vendorBookings = bookings.filter((booking) => vehicleIds.includes(booking.vehicleId));
    return {
      id: vendor._id,
      name: vendor.username,
      phone: vendor.phoneNumber || "Not provided",
      vehicles: vendorVehicles.length,
      approved: vendorVehicles.filter((vehicle) => vehicle.isAdminApproved).length,
      bookings: vendorBookings.length,
      joined: vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : "Unknown",
      vendor,
    };
  });

  const columns = [
    {
      field: "name",
      headerName: "Vendor",
      width: 240,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <ProfileAvatar name={params.value} role="vendor" src={params.row.vendor.profilePicture} size={34} />
          <div>
            <p className="font-semibold text-slate-900">{params.value}</p>
            <p className="text-xs text-slate-500">{params.row.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    { field: "phone", headerName: "Phone", width: 160 },
    { field: "vehicles", headerName: "Uploaded cars", width: 130 },
    { field: "approved", headerName: "Approved", width: 110 },
    { field: "bookings", headerName: "Bookings", width: 110 },
    { field: "joined", headerName: "Joined", width: 130 },
  ];

  return (
    <div className="mt-6 max-w-[1100px]">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accounts</p>
        <h1 className="text-3xl font-semibold text-slate-950">Vendors</h1>
        <p className="mt-2 text-sm text-slate-600">Vendor accounts, uploaded fleet size, and booking activity.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Vendors</p>
          <p className="mt-2 text-3xl font-semibold">{vendors.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Vendor cars</p>
          <p className="mt-2 text-3xl font-semibold">{vehicles.filter((vehicle) => !vehicle.isAdminAdded).length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved vendor cars</p>
          <p className="mt-2 text-3xl font-semibold">
            {vehicles.filter((vehicle) => !vehicle.isAdminAdded && vehicle.isAdminApproved).length}
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

export default AllVendors;

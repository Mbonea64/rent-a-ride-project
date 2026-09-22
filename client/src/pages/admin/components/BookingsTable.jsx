import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { FiMapPin } from "react-icons/fi";
import DemoTripMonitor from "../../../components/DemoTripMonitor";
import { confirmBookingPayment, getBookings } from "../../../services/bookingService";
import { getDemoVendorForBooking } from "../../../services/demoOpsService";
import { getBookingLifecycleLabel, isBookingPaid } from "../../../services/notificationService";

const BookingsTable = ({ bookings: scopedBookings }) => {
  const [bookings, setBookings] = useState(scopedBookings || []);
  const [trackingBooking, setTrackingBooking] = useState(null);


  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      if (data) {
        setBookings(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleConfirmPayment = async (booking) => {
    try {
      await confirmBookingPayment(booking.id, {
        provider: booking.paymentProvider || "Admin verified",
        reference: booking.paymentReference || `ADMIN-${String(booking.id).slice(0, 8).toUpperCase()}`,
      });
      fetchBookings();
    } catch (error) {
      console.log(error);
    }
  };

  //all bookings
  useEffect(() => {
    if (scopedBookings) {
      setBookings(scopedBookings);
      return undefined;
    }
    fetchBookings();
    window.addEventListener("rent-a-ride-payment-updated", fetchBookings);
    window.addEventListener("rent-a-ride-bookings-updated", fetchBookings);
    window.addEventListener("rent-a-ride-demo-reset", fetchBookings);
    window.addEventListener("storage", fetchBookings);
    return () => {
      window.removeEventListener("rent-a-ride-payment-updated", fetchBookings);
      window.removeEventListener("rent-a-ride-bookings-updated", fetchBookings);
      window.removeEventListener("rent-a-ride-demo-reset", fetchBookings);
      window.removeEventListener("storage", fetchBookings);
    };
  }, [scopedBookings]);

  //columns
  const columns = [
    {
      field: "image",
      headerName: "Image",
      width: 100,
      renderCell: (params) => (
        <img
          src={params.value}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "5px",
            objectFit: "contain",
          }}
          alt="vehicle"
        />
      ),
    },
    {
      field: "Pickup_Location",
      headerName: " Pickup Location",
      width: 150,
    },
    { field: "Pickup_Date", headerName: "Pickup Date", width: 150 },
    { field: "Dropoff_Location", headerName: "Dropoff Location", width: 150 },
    {
      field: "Dropoff_Date",
      headerName: "Dropoff Date",
      width: 150,
    },
    {
      field: "Vendor",
      headerName: "Assigned Vendor",
      width: 190,
    },
    {
      field: "Payment",
      headerName: "Payment",
      width: 210,
      renderCell: (params) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.row.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "Payment_Code",
      headerName: "Payment Code",
      width: 190,
      renderCell: (params) =>
        params.value ? (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="font-mono text-xs font-semibold uppercase text-slate-950">{params.value}</p>
            <p className="mt-1 text-[10px] text-slate-500">Customer submitted</p>
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            No code submitted
          </span>
        ),
    },
    {
      field: "Payment_Action",
      headerName: "Payment Action",
      width: 190,
      renderCell: (params) =>
        params.row.isPaid ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Confirmed
          </span>
        ) : (
          <button
            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => handleConfirmPayment(params.row)}
            type="button"
            title={params.row.paymentReference ? `Confirm code ${params.row.paymentReference}` : "No customer code submitted"}
          >
            Confirm payment
          </button>
        ),
    },
    {
      field: "Vehicle_Status",
      headerName: "Vehicle Status",
      width: 150,
      renderCell: (params) => (
        <div className="bg-green-200 px-[8px] py-[6px] rounded-md mx-auto ">
          {params.value}
        </div>
      ),
    },
    {
      field: "Live_GPS",
      headerName: "Live GPS",
      width: 150,
      renderCell: (params) => (
        <button
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            trackingBooking?._id === params.row.booking._id
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() =>
            setTrackingBooking((current) =>
              current?._id === params.row.booking._id ? null : params.row.booking
            )
          }
          type="button"
        >
          <FiMapPin />
          {trackingBooking?._id === params.row.booking._id ? "Hide GPS" : "View GPS"}
        </button>
      ),
    },
  ];


  //rows
  const rows =
    bookings?.map((cur) => ({
      id: cur._id,
      bookingId: cur._id,
      image: cur.vehicleDetails.image[0],
      Pickup_Location: cur.pickUpLocation,
      Pickup_Date: new Date(cur.pickupDate),
      Dropoff_Location: cur.dropOffLocation,
      Dropoff_Date: new Date(cur.dropOffDate),
      Vendor: getDemoVendorForBooking(cur).name,
      Payment: getBookingLifecycleLabel(cur),
      isPaid: isBookingPaid(cur),
      paymentProvider: cur.paymentProvider || cur.bookingDetails?.paymentMethod,
      paymentReference: cur.paymentReference || cur.bookingDetails?.paymentReference,
      Payment_Code: cur.paymentReference || cur.bookingDetails?.paymentReference || "",
      Vehicle_Status: cur.status,
      booking: cur,
    }));

  return (
    <>
      <div className="w-full max-w-none rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="w-full overflow-x-auto">
          <Box sx={{ height: "100%", minWidth: 1700, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 8,
                  },
                },
              }}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              sx={{
                ".MuiDataGrid-columnSeparator": {
                  display: "none",
                },
                "&.MuiDataGrid-root": {
                  border: ".1px solid #ebdddd",
                  padding: "1px",
                },
              }}
            />
          </Box>
        </div>
      </div>
      {trackingBooking && (
        <div className="mt-6">
          <DemoTripMonitor
            bookings={[trackingBooking]}
            role="admin"
            title="Selected vehicle real-time location"
            emptyText="This booking has no active GPS session."
          />
        </div>
      )}
    </>
  );
};

export default BookingsTable;

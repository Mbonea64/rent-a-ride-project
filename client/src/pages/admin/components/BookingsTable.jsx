import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { getBookings, setBookingStatus } from "../../../services/bookingService";
import { getDemoVendorForBooking } from "../../../services/demoOpsService";
import { getBookingLifecycleLabel, isBookingPaid } from "../../../services/notificationService";

const BookingsTable = () => {
  const [bookings, setBookings] = useState([]);


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

  const handleStatusChange = (e, params) => {
    const newStatus = e.target.value;
    const bookingId = params.id;

    const changeVehicleStatus = async () => {
      try {
        await setBookingStatus(bookingId, newStatus);
        fetchBookings()

      } catch (error) {
        console.log(error);
      }
    };

    changeVehicleStatus();
  };

  //all bookings
  useEffect(() => {
    fetchBookings();
  }, []);

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
      width: 170,
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
      field: "Change_Status",
      headerName: "Change_Status",
      width: 150,
      renderCell: (params) => {
        return (
          <select
          className="px-4 py-2"
          value={params.selectedValue}
          onChange={(e) => {
            handleStatusChange(e, params)
          }}
        >
          {params.value.map((cur, idx) => (
            <option key={idx} value={cur}>
              {cur}
            </option>
          ))}
        </select>
        )
      }
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
      Vehicle_Status: cur.status,
      Change_Status: [
        "notBooked",
        "booked",
        "onTrip",
        "notPicked",
        "canceled",
        "overDue",
        "tripCompleted",
      ],
    }));

  return (
    <>
      <div className="max-w-[1000px]  d-flex   justify-end text-start items-end p-10 border border-slate-1 rounded-lg drop-shadow-md ">
        <Box sx={{ height: "100%", width: "100%" }}>
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
    </>
  );
};

export default BookingsTable;

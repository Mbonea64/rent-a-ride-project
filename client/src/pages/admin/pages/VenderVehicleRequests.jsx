import { GrStatusGood } from "react-icons/gr";
import { MdOutlinePending } from "react-icons/md";
import { IoIosCloseCircle } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { setUpdateRequestTable, setVenodrVehilces, setadminVenodrRequest } from "../../../redux/vendor/vendorDashboardSlice";
import { getPendingVehicles, reviewVehicle } from "../../../services/vehicleService";
import VehicleArtwork from "../../../components/VehicleArtwork";




const VenderVehicleRequests = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { vendorVehicleApproved, vendorVehilces ,adminVenodrRequest } = useSelector(
    (state) => state.vendorDashboardSlice
  );
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchVendorRequest = async () => {
      try {
        const data = await getPendingVehicles();
        dispatch(setVenodrVehilces(data));
        dispatch(setadminVenodrRequest(data))
      } catch (error) {
        console.log(error);
      }
    };
    fetchVendorRequest();
  }, [dispatch])

  //aprove vendor vehicle request
  const handleApproveRequest = async (id) => {
    try {
      dispatch(setUpdateRequestTable(id))
      await reviewVehicle(id, "approved");
      setSelectedVehicle(null);
    } catch (error) {
      console.log(error);
    }
  };

  //reject vendor Vehilce Request
  const handleReject = async (id) => {
    try {
     
      await reviewVehicle(id, "rejected");
      setSelectedVehicle(null);
    } catch (error) {
      console.log(error);
    }
  };

  const columns = [
    {
      field: "image",
      headerName: "Image",
      width: 100,
      renderCell: (params) => (
        <VehicleArtwork
          src={params.value}
          alt="vehicle"
          fit="cover"
          className="h-10 w-14 rounded-md"
        />
      ),
    },
    {
      field: "registeration_number",
      headerName: "Register Number",
      width: 150,
    },
    { field: "company", headerName: "Company", width: 150 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "owner", headerName: "Submitted By", width: 170 },
    {
      field: "details",
      headerName: "Review",
      width: 120,
      renderCell: (params) => (
        <Button size="small" onClick={() => setSelectedVehicle(params.row.vehicle)}>
          View
        </Button>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) =>
        params.row.status ? (
          <div className="text-yellow-500   bg-yellow-100 p-2 rounded-lg flex items-center justify-center gap-x-1">
            <span className="text-[8px]">Pending</span>
            <MdOutlinePending />
          </div>
        ) : (
          <div className="text-green-500   bg-green-100 p-2 rounded-lg flex items-center justify-center gap-x-1">
            <span className="text-[8px]">Approved</span>
            <GrStatusGood  />
          </div>
        ),
    },
    {
      field: "Approve",
      headerName: "Approve",
      width: 100,
      renderCell: (params) => (
        <Button
          className="bg-green-500"
          onClick={() => {handleApproveRequest(params.row.id), dispatch(setUpdateRequestTable(params.row.id))}}
        >
          <GrStatusGood style={{ fontSize: 24 , color: 'green' }}/>
        </Button>
      ),
    },
    {
      field: "reject",
      headerName: "Reject",
      width: 100,
      renderCell: (params) => (
        <Button
          className="bg-red-200"
          onClick={() => {handleReject(params.row.id), dispatch(setUpdateRequestTable(params.row.id))}}
        >
          <IoIosCloseCircle style={{ fontSize: 28 , color:'red' }}/>
        </Button>
      ),
    },
  ];

  const rows =
    (adminVenodrRequest || [])
      .filter((vehicle) => vehicle.isDeleted === "false")
      .map((vehicle) => ({
        id: vehicle._id,
        image: vehicle.image?.[0] || "",
        registeration_number: vehicle.registeration_number,
        company: vehicle.company,
        name: vehicle.name,
        owner: vehicle.ownerProfile?.username || vehicle.addedBy || "Vendor account",
        status: !vehicle.isAdminApproved,
        vehicle,
      }))

      const pendingCount = rows?.filter((row) => row.status).length || 0;
      const isVendorVehiclesEmpty = vendorVehilces && vendorVehilces.length === 0;
  return (
  <div className="w-full max-w-none d-flex justify-end text-start items-end p-6 bg-slate-100 rounded-md">
      {isVendorVehiclesEmpty ? (
      <div className="w-full rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vendor approvals</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">No vehicle requests yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Vendor vehicle submissions will appear here with document and ownership details.
        </p>
      </div>
    ) : 
    <div className="w-full space-y-6">
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vendor approvals</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Vehicle review queue</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review vendor ownership documents, insurance, roadworthy evidence, and listing quality before publishing.
          </p>
        </div>
        <div className={`rounded-lg px-5 py-4 text-center ${
          pendingCount > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
        }`}>
          <p className="text-3xl font-bold">{pendingCount}</p>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {pendingCount === 1 ? "Pending request" : "Pending requests"}
          </p>
        </div>
      </div>
      {pendingCount > 0 && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          Action needed: approve or reject the pending vendor vehicle request{pendingCount === 1 ? "" : "s"}.
        </div>
      )}
    </section>
    <Box sx={{ height: "100%", minWidth: 1180, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize:
                vendorVehicleApproved && vendorVehicleApproved.length > 10
                  ? 10
                  : 5,
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
            border: "none",
          },
        }}
      />
    </Box>
    {selectedVehicle && (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row">
          <VehicleArtwork
            src={selectedVehicle.image?.[0] || ""}
            alt={selectedVehicle.car_title || selectedVehicle.name || "Vehicle"}
            fit="cover"
            className="h-56 w-full rounded-lg xl:w-80"
          />
          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vendor vehicle confirmation
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {[selectedVehicle.company, selectedVehicle.name, selectedVehicle.model].filter(Boolean).join(" ")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted by {selectedVehicle.ownerProfile?.username || selectedVehicle.addedBy || "Vendor account"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleApproveRequest(selectedVehicle._id)}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleReject(selectedVehicle._id)}
                >
                  Reject
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Registration", selectedVehicle.registeration_number],
                ["Price / day", selectedVehicle.price ? `TZS ${Number(selectedVehicle.price).toLocaleString()}` : "Not set"],
                ["Mileage", selectedVehicle.odometerKm ? `${Number(selectedVehicle.odometerKm).toLocaleString()} km` : "Not set"],
                ["Condition", selectedVehicle.vehicleCondition?.replaceAll("_", " ") || "Not set"],
                ["Listing authority", selectedVehicle.ownershipStatus?.replaceAll("_", " ") || "Not set"],
                ["Inspection", selectedVehicle.inspectionStatus?.replaceAll("_", " ") || "Not set"],
                ["GPS tracker", selectedVehicle.trackerStatus?.replaceAll("_", " ") || "Not set"],
                ["Last service", selectedVehicle.lastServiceOn || "Not set"],
                ["Location", [selectedVehicle.location, selectedVehicle.district].filter(Boolean).join(", ") || "Not set"],
                ["Fuel", selectedVehicle.fuel_type || "Not set"],
                ["Seats", selectedVehicle.seats || "Not set"],
                ["Transmission", selectedVehicle.transmition || "Not set"],
                ["Insurance expiry", selectedVehicle.insurance_end || "Not set"],
                ["Registration expiry", selectedVehicle.registeration_end || "Not set"],
                ["Pollution expiry", selectedVehicle.pollution_end || "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {selectedVehicle.car_description && (
              <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {selectedVehicle.car_description}
              </p>
            )}
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {[
                ["Service history", selectedVehicle.serviceHistory],
                ["Paperwork status", selectedVehicle.paperworkStatus],
                ["Rental notes", selectedVehicle.rentalNotes],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{value || "Not provided"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-bold text-slate-900">Uploaded confirmation documents</h3>
          <p className="mt-1 text-sm text-slate-500">
            These uploads are optional supporting documents for admin review.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {["insurance", "registration", "pollution"].map((type) => {
              const document = selectedVehicle.vehicleDocuments?.find((item) => item.document_type === type);
              return (
                <div key={type} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-bold capitalize text-slate-900">
                    {type === "registration" ? "Registration / ownership" : type === "pollution" ? "Inspection / roadworthy" : `${type} document`}
                  </p>
                  <div className="mt-3 h-44 overflow-hidden rounded-md bg-white">
                    <VehicleArtwork
                      src={document?.url || ""}
                      alt={`${type} document`}
                      fit="cover"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">{document?.original_name || "Missing document"}</span>
                    {document?.url && (
                      <a
                        className="font-semibold text-blue-700 hover:text-blue-900"
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    )}
    </div>
}
  </div>
  )
};

export default VenderVehicleRequests;

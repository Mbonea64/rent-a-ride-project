import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import toast, { Toaster } from "react-hot-toast";

import Box from "@mui/material/Box";
import {
  setVendorDeleteSuccess,
  setVendorEditSuccess,
  setVendorError,
  setVenodrVehilces,
} from "../../../redux/vendor/vendorDashboardSlice";

import { GrStatusGood } from "react-icons/gr";
import { MdOutlinePending } from "react-icons/md";
import VendorHeader from "../Components/VendorHeader";
import { getVendorVehicles } from "../../../services/vehicleService";
import VehicleArtwork from "../../../components/VehicleArtwork";
import { reportVehicleIssue } from "../../../services/vehicleIssueService";


const VendorAllVehicles = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [reportVehicle, setReportVehicle] = useState(null);
  const [reportForm, setReportForm] = useState({
    reason: "Vehicle temporarily unavailable",
    note: "",
  });

  const { isAddVehicleClicked } = useSelector((state) => state.addVehicle);
  const { vendorVehilces, vendorEditSuccess,vendorDeleteSuccess, vendorErrorSuccess } = useSelector(
    (state) => state.vendorDashboardSlice
  );
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVendorVehicles();
        dispatch(setVenodrVehilces(data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [dispatch, isAddVehicleClicked]);


  //edit vehicles
  const handleEditVehicle = (vehicle_id) => {
    navigate(`/vendorDashboard/vendorEditProductComponent?vehicle_id=${vehicle_id}`);
  };

  //delete vehicles modal
  const handleDeleteVehicles = (vehicle_id) => {
    navigate(`/vendorDashboard/vendorDeleteVehicleModal?vehicle_id=${vehicle_id}`);
  }

  const openReportIssue = (vehicle) => {
    setReportVehicle(vehicle);
    setReportForm({
      reason: "Vehicle temporarily unavailable",
      note: `${vehicle.company} ${vehicle.model || vehicle.name} (${vehicle.registeration_number}) needs admin attention. Please review availability before customers book it.`,
    });
  };

  const handleReportIssue = async (event) => {
    event.preventDefault();
    if (!reportVehicle) return;
    try {
      await reportVehicleIssue({
        vehicle: reportVehicle,
        reason: reportForm.reason,
        note: reportForm.note,
      });
      setReportVehicle(null);
      toast.success("Vehicle report sent to admin");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Could not send report to admin");
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
    { field: "location", headerName: "Vehicle Location", width: 180 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) =>
        params.row.status === "rejected" ? (
          <div className="text-red-500   bg-red-100 p-2 rounded-lg flex items-center justify-center gap-x-1">
            <span className="text-[8px]">rejected</span>
            <MdOutlinePending />
          </div>
        ) : !params.row.status ? (
          <div className="text-yellow-500   bg-yellow-100 p-2 rounded-lg flex items-center justify-center gap-x-1">
            <span className="text-[8px]">Pending</span>
            <MdOutlinePending />
          </div>
        ) : (
          <div className="text-green-500   bg-green-100 p-2 rounded-lg flex items-center justify-center gap-x-1">
            <span className="text-[8px]">Approved</span>
            <GrStatusGood />
          </div>
        ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 100,
      renderCell: (params) => (
        <Button onClick={() => handleEditVehicle(params.row.id)}>
          <ModeEditOutlineIcon />
        </Button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 100,
      renderCell: (params) => (
        <Button onClick={() => handleDeleteVehicles(params.row.id)}>
          <DeleteForeverIcon />
        </Button>
      ),
    },
    {
      field: "report",
      headerName: "Report issue",
      width: 150,
      renderCell: (params) => (
        <button
          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
          onClick={() => openReportIssue(params.row.vehicle)}
          type="button"
        >
          Report
        </button>
      ),
    },
  ];

  const rows =
    vendorVehilces &&
    vendorVehilces
      .filter((vehicle) => vehicle.isDeleted === "false")
      .map((vehicle) => ({
        id: vehicle._id,
        image: vehicle.image?.[0] || "",
        registeration_number: vehicle.registeration_number,
        company: vehicle.company,
        name: vehicle.name,
        location: [vehicle.location, vehicle.district].filter(Boolean).join(", ") || "Not set",
        status: !vehicle.isRejected ? vehicle.isAdminApproved : "rejected",
        vehicle,
      }));

  //checking if vendor has vehicles
  const isVendorVehiclesEmpty = vendorVehilces && vendorVehilces.length === 0;

  //showing success only if the vendor request is send
  useEffect(() => {
    if (vendorEditSuccess) {
      toast.success("Request send");
      dispatch(setVendorEditSuccess(false));
    }

     //deleted success
     if(vendorDeleteSuccess){
      toast.success("Vehicle Deleted")
      dispatch(setVendorDeleteSuccess(false))
     }

    //showing error if error
    if (vendorErrorSuccess) {
      toast.error("error");
      dispatch(setVendorError(false));
    }

   
  }, [vendorEditSuccess, vendorDeleteSuccess, vendorErrorSuccess, dispatch]);

  return (
    <div className="w-full max-w-none d-flex justify-end text-start items-end rounded-md bg-slate-100 p-4 md:p-8">
      {vendorEditSuccess && <Toaster />}
      {vendorDeleteSuccess && <Toaster/>}

      <VendorHeader title="AllVehicles" />
      {isVendorVehiclesEmpty ? (
        <p>No requests yet</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Box sx={{ height: "100%", minWidth: 980, width: "100%" }}>
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
              checkboxSelection
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
        </div>
      )}

      {reportVehicle && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4">
          <form
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onSubmit={handleReportIssue}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Vendor fleet report
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Send vehicle issue to admin
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This creates an admin Fleet alert. Admin can update, hide, delete, or mark the vehicle report attended.
              </p>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-[180px_1fr]">
              <VehicleArtwork
                alt={reportVehicle.name || "Vehicle"}
                className="aspect-video w-full rounded-lg border border-slate-200"
                fit="cover"
                src={reportVehicle.image?.[0] || ""}
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {reportVehicle.company} {reportVehicle.model || reportVehicle.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {reportVehicle.registeration_number} · {reportVehicle.location || "Vehicle location not set"}
                </p>
                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  Report type
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                    value={reportForm.reason}
                    onChange={(event) =>
                      setReportForm((current) => ({ ...current, reason: event.target.value }))
                    }
                  >
                    <option>Vehicle temporarily unavailable</option>
                    <option>Vehicle needs maintenance</option>
                    <option>Document or ownership issue</option>
                    <option>GPS tracker issue</option>
                    <option>Pricing or listing correction needed</option>
                  </select>
                </label>
              </div>
              <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                Message to admin
                <textarea
                  className="mt-1 min-h-36 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm leading-6"
                  value={reportForm.note}
                  onChange={(event) =>
                    setReportForm((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setReportVehicle(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                Submit report
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default VendorAllVehicles;

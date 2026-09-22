import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { setEditData } from "../../../redux/adminSlices/actions";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import { Button } from "@mui/material";
import { Header } from "../components";
import toast, { Toaster } from "react-hot-toast";
import { DataGrid } from "@mui/x-data-grid";
import { deleteVehicle, getAllVehicles } from "../../../services/vehicleService";
import {
  getVehicleIssueReports,
  resolveVehicleIssueReport,
} from "../../../services/vehicleIssueService";
import {
  approveVehicleChangeRequest,
  getVehicleChangeRequests,
  rejectVehicleChangeRequest,
} from "../../../services/vehicleChangeRequestService";
import { sendVendorVehicleStatusEmail } from "../../../services/companyNotificationService";

import Box from "@mui/material/Box";
import { showVehicles } from "../../../redux/user/listAllVehicleSlice";
import {
  clearAdminVehicleToast,
} from "../../../redux/adminSlices/adminDashboardSlice/StatusSlice";

function AllVehicles() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAddVehicleClicked } = useSelector((state) => state.addVehicle);

  const [allVehicles, setVehicles] = useState([]);
  const [vehicleIssues, setVehicleIssues] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const { adminEditVehicleSuccess, adminAddVehicleSuccess, adminCrudError } =
    useSelector((state) => state.statusSlice);

  //show vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getAllVehicles();
        setVehicles(data);
        dispatch(showVehicles(data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchVehicles();
  }, [isAddVehicleClicked, dispatch]);

  useEffect(() => {
    const loadReports = () =>
      getVehicleIssueReports()
        .then((reports) => setVehicleIssues((reports || []).filter((report) => report.status === "open")))
        .catch(() => setVehicleIssues([]));
    loadReports();
    window.addEventListener("rent-a-ride-vehicle-issues-updated", loadReports);
    window.addEventListener("storage", loadReports);
    return () => {
      window.removeEventListener("rent-a-ride-vehicle-issues-updated", loadReports);
      window.removeEventListener("storage", loadReports);
    };
  }, []);

  useEffect(() => {
    const loadChangeRequests = () =>
      getVehicleChangeRequests()
        .then((requests) => setChangeRequests((requests || []).filter((request) => request.status === "pending")))
        .catch(() => setChangeRequests([]));
    loadChangeRequests();
    window.addEventListener("rent-a-ride-vehicle-change-requests-updated", loadChangeRequests);
    window.addEventListener("storage", loadChangeRequests);
    return () => {
      window.removeEventListener("rent-a-ride-vehicle-change-requests-updated", loadChangeRequests);
      window.removeEventListener("storage", loadChangeRequests);
    };
  }, []);

  //delete a vehicle
  const handleDelete = async (vehicle_id) => {
    try {
      setVehicles(allVehicles.filter((cur) => cur._id !== vehicle_id));
      await deleteVehicle(vehicle_id);
      toast.success("deleted", {
          duration: 800,

          style: {
            color: "white",
            background: "#c48080",
          },
        });
    } catch (error) {
      console.log(error);
    }
  };

  //edit vehicles
  const handleEditVehicle = (vehicle_id) => {
    dispatch(setEditData({ _id: vehicle_id }));
    navigate(`/adminDashboard/editProducts?vehicle_id=${vehicle_id}`);
  };

  const handleResolveIssue = (reportId) => {
    resolveVehicleIssueReport(reportId).then(() =>
      getVehicleIssueReports().then((reports) =>
        setVehicleIssues((reports || []).filter((report) => report.status === "open"))
      )
    );
  };

  const handleHideReportedVehicle = async (report) => {
    await handleDelete(report.vehicleId);
    handleResolveIssue(report.id);
  };

  const refreshChangeRequests = () =>
    getVehicleChangeRequests().then((requests) =>
      setChangeRequests((requests || []).filter((request) => request.status === "pending"))
    );

  const handleApproveChange = async (request) => {
    await approveVehicleChangeRequest(request);
    sendVendorVehicleStatusEmail({
      to: request.vendor?.email,
      vehicleName: [request.vehicle?.company, request.vehicle?.model || request.vehicle?.name].filter(Boolean).join(" ") || "Your vehicle",
      status: "edit approved",
      note: "Rent a Ride approved your submitted vehicle changes.",
    }).catch(() => null);
    toast.success("Vendor changes approved");
    await refreshChangeRequests();
  };

  const handleRejectChange = async (request) => {
    const note = window.prompt("Reason for rejecting these changes", "Please update the details and submit again.");
    if (note === null) return;
    await rejectVehicleChangeRequest(request.id, note);
    sendVendorVehicleStatusEmail({
      to: request.vendor?.email,
      vehicleName: [request.vehicle?.company, request.vehicle?.model || request.vehicle?.name].filter(Boolean).join(" ") || "Your vehicle",
      status: "edit rejected",
      note,
    }).catch(() => null);
    toast.success("Vendor changes rejected");
    await refreshChangeRequests();
  };

  const columns = [
    {
      field: "image",
      headerName: "Image",
      width: 150,
      renderCell: (params) => (
        <img
          src={params.value}
          style={{
            width: "50px",
            height: "40px",
            borderRadius: "5px",
            objectFit: "cover",
          }}
          alt="vehicle"
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
      field: "ownership",
      headerName: "Ownership",
      width: 170,
      renderCell: (params) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.row.isCompanyFleet
              ? "bg-slate-100 text-slate-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    { field: "owner", headerName: "Owner", width: 170 },
    {
      field: "edit",
      headerName: "Edit",
      width: 100,
      renderCell: (params) => (
        <Button onClick={() => handleEditVehicle(params.row.id)}>
          {params.row.isCompanyFleet ? <ModeEditOutlineIcon /> : "View"}
        </Button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 100,
      renderCell: (params) => (
        <Button onClick={() => handleDelete(params.row.id)}>
          <DeleteForeverIcon />
        </Button>
      ),
    },
  ];

  const rows = allVehicles
    .filter(
      (vehicle) => vehicle.isDeleted === "false" && vehicle.isAdminApproved
    )
    .map((vehicle) => ({
      id: vehicle._id,
      image: vehicle.image[0],
      registeration_number: vehicle.registeration_number,
      company: vehicle.company,
      name: vehicle.name,
      location: [vehicle.location, vehicle.district].filter(Boolean).join(", ") || "Not set",
      ownership: vehicle.isAdminAdded ? "Company fleet" : "Vendor fleet",
      owner: vehicle.isAdminAdded
        ? "Rent a Ride"
        : vehicle.ownerProfile?.username || vehicle.addedBy || "Vendor account",
      isCompanyFleet: vehicle.isAdminAdded,
    }));

  //edit success
  useEffect(() => {
    if (adminEditVehicleSuccess) {
      toast.success("success");
    }
    else if (adminAddVehicleSuccess) {
      toast.success("success");
    }
    else if(adminCrudError){
     toast.error("error")
    }
  }, [adminEditVehicleSuccess, adminAddVehicleSuccess,adminCrudError,dispatch]);

  useEffect(() => {
    const clearNotificationsTimeout = setTimeout(() => {
      dispatch(clearAdminVehicleToast());
    }, 3000);
  
    return () => clearTimeout(clearNotificationsTimeout);
  }, [adminEditVehicleSuccess, adminAddVehicleSuccess, adminCrudError, dispatch]);

  return (
    <>

      {adminEditVehicleSuccess ? <Toaster /> : ''} 
        {adminAddVehicleSuccess ? <Toaster /> : ''}
        {adminCrudError ? <Toaster/> : ""}     
        
        
      <div className="w-full max-w-full overflow-hidden p-4 text-start md:p-8">
        <Header category="Fleet" title="Vehicle Inventory" />
        {vehicleIssues.length > 0 && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                  Vendor fleet attention
                </p>
                <h2 className="text-lg font-semibold text-slate-950">
                  {vehicleIssues.length} vehicle report{vehicleIssues.length === 1 ? "" : "s"} need admin action
                </h2>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {vehicleIssues.map((report) => (
                <div className="rounded-lg bg-white p-4 shadow-sm" key={report.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{report.vehicleName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {report.registrationNumber || "No plate"} · {report.vendorName}
                      </p>
                      <p className="mt-2 text-sm font-medium text-amber-800">{report.reason}</p>
                      {report.note && <p className="mt-1 text-sm text-slate-600">{report.note}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                        onClick={() => handleEditVehicle(report.vehicleId)}
                        type="button"
                      >
                        Update
                      </button>
                      <button
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200"
                        onClick={() => handleHideReportedVehicle(report)}
                        type="button"
                      >
                        Hide vehicle
                      </button>
                      <button
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                        onClick={() => handleResolveIssue(report.id)}
                        type="button"
                      >
                        Mark attended
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {changeRequests.length > 0 && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Vendor edit approvals
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {changeRequests.length} pending vehicle change request{changeRequests.length === 1 ? "" : "s"}
            </h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {changeRequests.map((request) => (
                <div className="rounded-lg bg-white p-4 shadow-sm" key={request.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {[request.vehicle?.company, request.vehicle?.model || request.vehicle?.name].filter(Boolean).join(" ") || "Vendor vehicle"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {request.vehicle?.registration_number || "No plate"} · {request.vendor?.username || "Vendor"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Changed fields: {Object.keys(request.proposedChanges || {}).join(", ") || "Details update"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                        onClick={() => handleApproveChange(request)}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200"
                        onClick={() => handleRejectChange(request)}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="w-full max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Box sx={{ height: "100%", minWidth: 1180, width: "100%" }}>
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
      </div>
    </>
  );
}

export default AllVehicles;

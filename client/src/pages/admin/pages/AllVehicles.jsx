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
          <ModeEditOutlineIcon />
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
        
        
      <div className="max-w-[1100px] d-flex justify-end text-start items-end p-10">
        <Header category="Fleet" title="Vehicle Inventory" />
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
    </>
  );
}

export default AllVehicles;

import Button from "@mui/material/Button";
import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Controller, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { setEditData } from "../../../redux/adminSlices/actions";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { setadminEditVehicleSuccess } from "../../../redux/adminSlices/adminDashboardSlice/StatusSlice";
import { getAllVehicles, updateVehicle } from "../../../services/vehicleService";
import { useEffect, useState } from "react";

export default function EditProductComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, control, reset } = useForm();
  const [remoteVehicle, setRemoteVehicle] = useState(null);
  const { userAllVehicles } = useSelector((state) => state.userListVehicles);
  const { modelData, companyData, locationData, districtData } = useSelector(
    (state) => state.modelDataSlice
  );

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicle_id = queryParams.get("vehicle_id");

  const updateingItem =
    userAllVehicles.find((cur) => cur._id === vehicle_id) || remoteVehicle || {};
  const isVendorFleet = Boolean(updateingItem?._id && !updateingItem.isAdminAdded);

  useEffect(() => {
    if (!vehicle_id || updateingItem?._id) return;
    let active = true;
    getAllVehicles()
      .then((vehicles) => {
        if (!active) return;
        setRemoteVehicle((vehicles || []).find((vehicle) => vehicle._id === vehicle_id) || null);
      })
      .catch((error) => console.error("Could not load vehicle for edit", error));
    return () => {
      active = false;
    };
  }, [vehicle_id, updateingItem?._id]);

  const insuranceDefaultDate = updateingItem.insurance_end
    ? dayjs(new Date(updateingItem.insurance_end))
    : null;
  const registerationDefaultDate = updateingItem.registeration_end
    ? dayjs(new Date(updateingItem.registeration_end))
    : null;
  const pollutionDefaultDate = updateingItem.pollution_end
    ? dayjs(new Date(updateingItem.pollution_end))
    : null;

  const onEditSubmit = async (editData) => {
    if (isVendorFleet) {
      toast.error("Vendor-owned cars are read-only for admin. Use review, hide/delete, or vendor edit approvals.");
      return;
    }
    let tostID;
    try {
      if (editData && vehicle_id) {
        tostID = toast.loading("saving...", { position: "bottom-center" });
        const formData = editData;
        dispatch(setEditData({ _id: vehicle_id, ...formData }));
        await updateVehicle(vehicle_id, formData);
        toast.dismiss(tostID);
        dispatch(setadminEditVehicleSuccess(true))

        dispatch(setEditData(null));
      }
      reset();
    } catch (error) {
      console.log(error);
    }
    navigate("/adminDashboard/allProduct");
  };

  const handleClose = () => {
    navigate("/adminDashboard/allProduct");
    dispatch(setEditData(null));
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <button onClick={handleClose} className="relative left-10 top-5">
        <div className="padding-5 padding-2 rounded-full bg-slate-100 drop-shadow-md hover:shadow-lg hover:bg-blue-200 hover:translate-y-1 hover:translate-x-1 ">
          <IoMdClose style={{ fontSize: "30" }} />
        </div>
      </button>
      <form onSubmit={handleSubmit(onEditSubmit)}>
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Admin fleet editor
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {isVendorFleet ? "View vendor vehicle record" : "Edit vehicle record"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review the same vehicle information submitted by the vendor, including ownership authority,
              readiness, GPS tracker status, documents, and customer-facing listing details.
            </p>
            <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-4">
              <div>
                <p className="font-semibold text-slate-500">Owner</p>
                <p className="mt-1 text-slate-950">
                  {updateingItem.isAdminAdded ? "Rent a Ride" : updateingItem.ownerProfile?.username || "Vendor"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Plate</p>
                <p className="mt-1 text-slate-950">{updateingItem.registeration_number || "Not set"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Approval</p>
                <p className="mt-1 capitalize text-slate-950">
                  {updateingItem.approval_status || (updateingItem.isAdminApproved ? "approved" : "pending")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Documents</p>
                <p className="mt-1 text-slate-950">
                  {updateingItem.vehicleDocuments?.length || updateingItem.documents?.length || 0} uploaded
                </p>
              </div>
            </div>
            {isVendorFleet && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Vendor-owned cars are read-only for admin. Use approve/reject, hide/delete, or vendor edit approvals to control changes.
              </div>
            )}
          </div>
          <Box
            sx={{
              "& .MuiTextField-root": {
                m: 1.5,
                width: "100%",
                color: "black", // Set text color to black
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#cbd5e1",
                },
              },
            }}
            noValidate
            autoComplete="off"
          >
            <div className="grid gap-2 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
              <TextField
                required
                id="registeration_number"
                label="registeration_number"
                {...register("registeration_number")}
                defaultValue={updateingItem?.registeration_number || ""}
              />

              <Controller
                control={control}
                name="company"
                defaultValue={updateingItem?.company || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="company"
                    select
                    label="Company"
                    error={Boolean(field.value == "")}
                  >
                    {companyData.map((cur, idx) => (
                      <MenuItem value={cur} key={idx}>
                        {cur}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              ></Controller>

              <TextField
                required
                id="name"
                label="name"
                {...register("name")}
                defaultValue={updateingItem?.name || ""}
              />
              
              <Controller
                control={control}
                name="model"
                defaultValue={updateingItem?.model || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="model"
                    select
                    label="Model"
                    error={Boolean(field.value == "")}
                  >
                    {modelData.map((cur, idx) => (
                      <MenuItem value={cur} key={idx}>
                        {cur}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              ></Controller>

              <TextField
                id="title"
                label="title"
                {...register("title")}
                defaultValue={updateingItem?.car_title || ""}
              />
              <TextField
                id="base_package"
                label="base_package"
                {...register("base_package")}
                defaultValue={updateingItem?.base_package || ""}
              />
              <TextField
                id="price"
                type="number"
                label="Price"
                {...register("price")}
                defaultValue={updateingItem?.price || ""}
              />

              <TextField
                required
                id="year_made"
                type="number"
                label="year_made"
                {...register("year_made")}
                defaultValue={updateingItem?.year_made || ""}
              />
              <Controller
                control={control}
                name="fuelType"
                defaultValue={updateingItem?.fuel_type || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="fuel_type"
                    select
                    label="Fuel type"
                    error={Boolean(field.value == "")}
                  >
                    <MenuItem value={"petrol"}>petrol</MenuItem>
                    <MenuItem value={"diesel"}>diesel</MenuItem>
                    <MenuItem value={"electirc"}>electric</MenuItem>
                    <MenuItem value={"hybrid"}>hybrid</MenuItem>
                  </TextField>
                )}
              ></Controller>
            </div>

            <div className="grid gap-2 border-t border-slate-200 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
              <Controller
                name="carType"
                control={control}
                defaultValue={updateingItem?.car_type || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="car_type"
                    select
                    label="Car Type"
                    error={Boolean(field.value === "")} // Add error handling for empty value
                  >
                    <MenuItem value="sedan">Sedan</MenuItem>
                    <MenuItem value="suv">SUV</MenuItem>
                    <MenuItem value="hatchback">Hatchback</MenuItem>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="Seats"
                defaultValue={updateingItem?.seats || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="seats"
                    select
                    label="Seats"
                    error={Boolean(field.value === "")}
                    defaultValue={updateingItem.seats}
                  >
                    <MenuItem value={"5"}>5</MenuItem>
                    <MenuItem value={"7"}>7</MenuItem>
                    <MenuItem value={"8"}>8</MenuItem>
                  </TextField>
                )}
              ></Controller>

              <Controller
                control={control}
                name="transmitionType"
                defaultValue={updateingItem?.transmition || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="transmittion_type"
                    select
                    label="transmittion_type"
                    error={Boolean(field.value == "")}
                  >
                    <MenuItem value={"automatic"}>automatic</MenuItem>
                    <MenuItem value={"manual"}>manual</MenuItem>
                  </TextField>
                )}
              ></Controller>

              <Controller
                control={control}
                name="vehicleLocation"
                defaultValue={updateingItem?.location || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="vehicleLocation"
                    select
                    label="vehicleLocation"
                    error={Boolean(field.value == "")}
                  >
                    {locationData.map((cur, idx) => (
                      <MenuItem value={cur} key={idx}>
                        {cur}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              ></Controller>

              <Controller
                control={control}
                name="vehicleDistrict"
                defaultValue={updateingItem?.district || ""}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    id="vehicleDistrict"
                    select
                    label="vehicleDistrict"
                    error={Boolean(field.value == "")}
                  >
                    {districtData.map((cur, idx) => (
                      <MenuItem value={cur} key={idx}>
                        {cur}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              ></Controller>

              <TextField
                id="description"
                label="description"
                defaultValue={updateingItem?.car_description || ""}
                multiline
                rows={4}
                sx={{
                  width: "100%",
                  "@media (min-width: 1280px)": {
                    // for large screens (lg)
                    minWidth: 565,
                  },
                }}
                {...register("description")}
              />
            </div>
            <div className="grid gap-2 border-t border-slate-200 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
              <TextField
                id="odometer_km"
                type="number"
                label="Mileage / odometer (km)"
                {...register("odometer_km")}
                defaultValue={updateingItem?.odometerKm || ""}
              />
              <Controller
                name="vehicle_condition"
                control={control}
                defaultValue={updateingItem?.vehicleCondition || ""}
                render={({ field }) => (
                  <TextField {...field} id="vehicle_condition" select label="Vehicle condition">
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="needs_minor_attention">Needs minor attention</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="ownership_status"
                control={control}
                defaultValue={updateingItem?.ownershipStatus || ""}
                render={({ field }) => (
                  <TextField {...field} id="ownership_status" select label="Listing authority">
                    <MenuItem value="owner">Owner</MenuItem>
                    <MenuItem value="authorized_agent">Authorized agent</MenuItem>
                    <MenuItem value="company_vehicle">Company vehicle</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="inspection_status"
                control={control}
                defaultValue={updateingItem?.inspectionStatus || ""}
                render={({ field }) => (
                  <TextField {...field} id="inspection_status" select label="Roadworthy inspection">
                    <MenuItem value="valid">Valid / roadworthy</MenuItem>
                    <MenuItem value="pending_renewal">Pending renewal</MenuItem>
                    <MenuItem value="not_available">Not available yet</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="tracker_status"
                control={control}
                defaultValue={updateingItem?.trackerStatus || ""}
                render={({ field }) => (
                  <TextField {...field} id="tracker_status" select label="GPS tracker">
                    <MenuItem value="installed">Installed</MenuItem>
                    <MenuItem value="can_install">Can install before approval</MenuItem>
                    <MenuItem value="not_installed">Not installed</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="last_service_date"
                control={control}
                defaultValue={updateingItem?.lastServiceOn ? dayjs(new Date(updateingItem.lastServiceOn)) : null}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      label="Last service date"
                      value={field.value || null}
                      onChange={(date) => field.onChange(date)}
                      textField={(props) => <TextField {...props} />}
                    />
                  </LocalizationProvider>
                )}
              />
              <TextField
                id="service_history"
                label="Service history"
                multiline
                rows={4}
                {...register("service_history")}
                defaultValue={updateingItem?.serviceHistory || ""}
              />
              <TextField
                id="paperwork_status"
                label="Paperwork status"
                multiline
                rows={4}
                {...register("paperwork_status")}
                defaultValue={updateingItem?.paperworkStatus || ""}
              />
              <TextField
                id="rental_notes"
                label="Rental notes / restrictions"
                multiline
                rows={4}
                {...register("rental_notes")}
                defaultValue={updateingItem?.rentalNotes || ""}
              />
            </div>
            <div className="border-t border-slate-200 px-6 py-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Document dates and uploads</h2>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <Controller
                name="insurance_end_date"
                control={control}
                defaultValue={insuranceDefaultDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      label="Insurance end Date"
                      inputFormat="MM/dd/yyyy" // Customize the date format as per your requirement
                      value={field.value || null} // Ensure value is null if empty string or undefined
                      onChange={(date) => field.onChange(date)}
                      textField={(props) => <TextField {...props} />}
                    />
                  </LocalizationProvider>
                )}
              />

              <Controller
                control={control}
                name="Registeration_end_date"
                defaultValue={registerationDefaultDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      label="registeration end Date"
                      inputFormat="MM/dd/yyyy" // Customize the date format as per your requirement
                      value={field.value || null} // Ensure value is null if empty string or undefined
                      onChange={(date) => field.onChange(date)}
                      textField={(props) => <TextField {...props} />}
                    />
                  </LocalizationProvider>
                )}
              ></Controller>

              <Controller
                control={control}
                name="polution_end_date"
                defaultValue={pollutionDefaultDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      label="polution end Date "
                      inputFormat="MM/dd/yyyy" // Customize the date format as per your requirement
                      value={field.value || null} // Ensure value is null if empty string or undefined
                      onChange={(date) => field.onChange(date)}
                      textField={(props) => <TextField {...props} />}
                    />
                  </LocalizationProvider>
                )}
              ></Controller>

              {/* editing for image is not done yet , default value for image is also not done yet */}

              {/* file upload section */}
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <div className="max-w-[300px] sm:max-w-[600px]">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 "
                    htmlFor="insurance_image"
                  >
                    Upload insurance image
                  </label>
                  <input
                    className="block w-full p-2 text-sm text-gray-50 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-black focus:outline-none dark:bg-gray-200 dark:border-gray-600 dark:placeholder-gray-400"
                    aria-describedby="user_avatar_help"
                    id="insurance_image"
                    type="file"
                    multiple
                    {...register("insurance_image")}
                  />
                </div>

                <div className="max-w-[300px] sm:max-w-[600px]">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 "
                    htmlFor="rc_book_image"
                  >
                    Upload rc book image
                  </label>
                  <input
                    className="block w-full p-2  text-sm text-gray-50 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-black focus:outline-none dark:bg-gray-200 dark:border-gray-600 dark:placeholder-gray-400"
                    aria-describedby="user_avatar_help"
                    id="rc_book_image"
                    type="file"
                    multiple
                    {...register("rc_book_image")}
                  />
                </div>
                <div className="max-w-[300px] sm:max-w-[600px]">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 "
                    htmlFor="polution_image"
                  >
                    Upload polution image
                  </label>
                  <input
                    className="block w-full p-2 text-sm text-gray-50 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-black focus:outline-none dark:bg-gray-200 dark:border-gray-600 dark:placeholder-gray-900"
                    aria-describedby="user_avatar_help"
                    id="polution_image"
                    type="file"
                    multiple
                    {...register("polution_image")}
                  />
                </div>

                <div className="max-w-[300px] sm:max-w-[600px]">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 "
                    htmlFor="image"
                  >
                    Upload vehicle image
                  </label>
                  <input
                    className="block w-full p-2 text-sm text-gray-50 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-black focus:outline-none dark:bg-gray-200 dark:border-gray-600 dark:placeholder-gray-900"
                    aria-describedby="user_avatar_help"
                    id="image"
                    type="file"
                    multiple
                    {...register("image")}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-5">
              {isVendorFleet ? (
                <Button variant="outlined" type="button" onClick={handleClose}>
                  Back to fleet
                </Button>
              ) : (
                <Button variant="contained" type="submit">
                  Save changes
                </Button>
              )}
            </div>
          </Box>
        </div>
      </form>
    </div>
  );
}

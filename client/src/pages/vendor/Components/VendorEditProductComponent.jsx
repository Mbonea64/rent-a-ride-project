import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { MenuItem } from "@mui/material";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { IoMdClose } from "react-icons/io";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { setVendorEditSuccess, setVenodrVehilces } from "../../../redux/vendor/vendorDashboardSlice";
import { submitVehicleChangeRequest } from "../../../services/vehicleChangeRequestService";
import { sendVendorVehicleStatusEmail } from "../../../services/companyNotificationService";
import { getVendorVehicles } from "../../../services/vehicleService";

const fieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
};

const Section = ({ kicker, title, children }) => (
  <section className="border-t border-slate-200 px-5 py-6 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{kicker}</p>
    <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  </section>
);

export default function VendorEditProductComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleId = new URLSearchParams(location.search).get("vehicle_id");
  const { register, handleSubmit, control, reset } = useForm();
  const { vendorVehilces } = useSelector((state) => state.vendorDashboardSlice);
  const currentUser = useSelector((state) => state.user.currentUser);
  const { modelData, companyData, locationData, districtData } = useSelector((state) => state.modelDataSlice);
  const [remoteVehicles, setRemoteVehicles] = useState([]);

  const vehicle =
    vendorVehilces?.find((item) => item._id === vehicleId) ||
    remoteVehicles.find((item) => item._id === vehicleId) ||
    {};

  useEffect(() => {
    let active = true;
    getVendorVehicles()
      .then((vehicles) => {
        if (!active) return;
        setRemoteVehicles(vehicles || []);
        dispatch(setVenodrVehilces(vehicles || []));
      })
      .catch((error) => console.error("Could not load vendor vehicle for edit", error));
    return () => {
      active = false;
    };
  }, [dispatch]);

  const onEditSubmit = async (editData) => {
    let toastId;
    try {
      toastId = toast.loading("Saving vehicle changes...", { position: "bottom-center" });
      await submitVehicleChangeRequest(vehicleId, editData);
      sendVendorVehicleStatusEmail({
        to: currentUser?.email,
        vehicleName: [vehicle?.company, vehicle?.model || vehicle?.name].filter(Boolean).join(" ") || "Your vehicle",
        status: "edit awaiting approval",
        note: "Your submitted vehicle changes are waiting for Rent a Ride admin review.",
      }).catch(() => null);
      dispatch(setVendorEditSuccess(true));
      toast.success("Vehicle changes submitted for admin approval");
      reset();
      navigate("/vendorDashboard/vendorAllVeihcles");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Could not save vehicle changes");
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  };

  const close = () => navigate("/vendorDashboard/vendorAllVeihcles");

  const insuranceDefaultDate = vehicle.insurance_end ? dayjs(new Date(vehicle.insurance_end)) : null;
  const registrationDefaultDate = vehicle.registeration_end ? dayjs(new Date(vehicle.registeration_end)) : null;
  const lastServiceDate = vehicle.lastServiceOn ? dayjs(new Date(vehicle.lastServiceOn)) : null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <form onSubmit={handleSubmit(onEditSubmit)}>
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Vendor fleet editor</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Edit vehicle listing</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Keep the same details Rent a Ride uses for approval: vehicle identity, rental readiness, documents, GPS tracker status, and customer-facing notes.
              </p>
            </div>
            <button
              aria-label="Close vehicle editor"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-blue-50"
              onClick={close}
              type="button"
            >
              <IoMdClose className="text-2xl" />
            </button>
          </div>

          <Box sx={{ "& .MuiTextField-root": fieldSx }} noValidate autoComplete="off">
            <Section kicker="Vehicle profile" title="Identity and customer listing">
              <TextField label="Registration number" defaultValue={vehicle.registeration_number || ""} {...register("registeration_number")} />
              <Controller
                control={control}
                name="company"
                defaultValue={vehicle.company || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Make / company">
                    {[...new Set([...(companyData || []), vehicle.company].filter(Boolean))].map((item) => (
                      <MenuItem value={item} key={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="model"
                defaultValue={vehicle.model || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Model">
                    {[...new Set([...(modelData || []), vehicle.model].filter(Boolean))].map((item) => (
                      <MenuItem value={item} key={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField label="Vehicle display name" defaultValue={vehicle.name || ""} {...register("name")} />
              <TextField label="Listing headline" defaultValue={vehicle.car_title || ""} {...register("title")} />
              <TextField label="Base package" defaultValue={vehicle.base_package || ""} {...register("base_package")} />
            </Section>

            <Section kicker="Rental basics" title="Specs, pricing, and location">
              <TextField type="number" label="Price per day" defaultValue={vehicle.price || ""} {...register("price")} />
              <TextField type="number" label="Year made" defaultValue={vehicle.year_made || ""} {...register("year_made")} />
              <TextField type="number" label="Mileage / odometer (km)" defaultValue={vehicle.odometerKm || ""} {...register("odometer_km")} />
              <Controller
                control={control}
                name="fuelType"
                defaultValue={vehicle.fuel_type || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Fuel type">
                    <MenuItem value="petrol">Petrol</MenuItem>
                    <MenuItem value="diesel">Diesel</MenuItem>
                    <MenuItem value="electirc">Electric</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="carType"
                defaultValue={vehicle.car_type || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Car type">
                    <MenuItem value="sedan">Sedan</MenuItem>
                    <MenuItem value="suv">SUV</MenuItem>
                    <MenuItem value="hatchback">Hatchback</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="Seats"
                defaultValue={vehicle.seats || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Seats">
                    <MenuItem value="5">5 seats</MenuItem>
                    <MenuItem value="7">7 seats</MenuItem>
                    <MenuItem value="8">8 seats</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="transmitionType"
                defaultValue={vehicle.transmition || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Transmission">
                    <MenuItem value="automatic">Automatic</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="vehicleDistrict"
                defaultValue={vehicle.district || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Company inspection yard district">
                    {[...new Set([...(districtData || []), vehicle.district].filter(Boolean))].map((item) => (
                      <MenuItem value={item} key={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="vehicleLocation"
                defaultValue={vehicle.location || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Company inspection yard location">
                    {[...new Set([...(locationData || []), vehicle.location].filter(Boolean))].map((item) => (
                      <MenuItem value={item} key={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Section>

            <Section kicker="Readiness review" title="Condition, authority, and tracker">
              <Controller
                name="vehicle_condition"
                control={control}
                defaultValue={vehicle.vehicleCondition || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Vehicle condition">
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
                defaultValue={vehicle.ownershipStatus || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Listing authority">
                    <MenuItem value="owner">I own this vehicle</MenuItem>
                    <MenuItem value="authorized_agent">I am authorized to list it</MenuItem>
                    <MenuItem value="company_vehicle">Company vehicle</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="inspection_status"
                control={control}
                defaultValue={vehicle.inspectionStatus || ""}
                render={({ field }) => (
                  <TextField {...field} select label="Roadworthy inspection">
                    <MenuItem value="valid">Valid / roadworthy</MenuItem>
                    <MenuItem value="pending_renewal">Pending renewal</MenuItem>
                    <MenuItem value="not_available">Not available yet</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="tracker_status"
                control={control}
                defaultValue={vehicle.trackerStatus || ""}
                render={({ field }) => (
                  <TextField {...field} select label="GPS tracker">
                    <MenuItem value="installed">Installed</MenuItem>
                    <MenuItem value="can_install">Can install before approval</MenuItem>
                    <MenuItem value="not_installed">Not installed</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="last_service_date"
                control={control}
                defaultValue={lastServiceDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker {...field} label="Last service date" value={field.value || null} onChange={(date) => field.onChange(date)} />
                  </LocalizationProvider>
                )}
              />
              <Controller
                name="insurance_end_date"
                control={control}
                defaultValue={insuranceDefaultDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker {...field} label="Insurance end date" value={field.value || null} onChange={(date) => field.onChange(date)} />
                  </LocalizationProvider>
                )}
              />
              <Controller
                name="Registeration_end_date"
                control={control}
                defaultValue={registrationDefaultDate}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker {...field} label="Registration end date" value={field.value || null} onChange={(date) => field.onChange(date)} />
                  </LocalizationProvider>
                )}
              />
            </Section>

            <section className="border-t border-slate-200 px-5 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Operational notes</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Admin review information</h3>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <TextField label="Customer-facing description" multiline rows={4} defaultValue={vehicle.car_description || ""} {...register("description")} />
                <TextField label="Service history" multiline rows={4} defaultValue={vehicle.serviceHistory || ""} {...register("service_history")} />
                <TextField label="Paperwork status" multiline rows={4} defaultValue={vehicle.paperworkStatus || ""} {...register("paperwork_status")} />
                <TextField label="Rental notes / restrictions" multiline rows={4} defaultValue={vehicle.rentalNotes || ""} {...register("rental_notes")} />
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-8">
              <Button variant="outlined" type="button" onClick={close} sx={{ borderRadius: "8px", textTransform: "none", px: 3 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" sx={{ borderRadius: "8px", textTransform: "none", px: 3 }}>
                Save changes
              </Button>
            </div>
          </Box>
        </div>
      </form>
    </div>
  );
}

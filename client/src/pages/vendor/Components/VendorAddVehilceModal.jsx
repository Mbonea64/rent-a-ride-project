import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Autocomplete, MenuItem } from "@mui/material";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { IoMdClose } from "react-icons/io";
import { addVehicleClicked } from "../../../redux/adminSlices/actions";
import { createVehicle } from "../../../services/vehicleService";
import { sendVendorVehicleStatusEmail } from "../../../services/companyNotificationService";
import { loadCatalogMetadata } from "../../../utils/loadCatalogMetadata";

const fieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  "& .MuiInputLabel-root": {
    color: "#475569",
  },
};

const CAR_MODEL_LIBRARY = {
  Toyota: [
    "Alphard",
    "Aqua",
    "Belta",
    "Coaster",
    "Corolla",
    "Crown",
    "Fortuner",
    "Harrier",
    "Hiace",
    "Hilux",
    "IST",
    "Land Cruiser",
    "Noah",
    "Passo",
    "Prado",
    "Premio",
    "RAV4",
    "Vanguard",
    "Vitz",
    "Wish",
  ],
  "Land Rover": [
    "Defender",
    "Discovery",
    "Discovery Sport",
    "Range Rover",
    "Range Rover Evoque",
    "Range Rover Sport",
    "Range Rover Velar",
  ],
  "Range Rover": ["Evoque", "Sport", "Velar", "Vogue", "Autobiography"],
  Nissan: [
    "AD Van",
    "Bluebird Sylphy",
    "Caravan",
    "Dualis",
    "Elgrand",
    "Juke",
    "March",
    "Murano",
    "Navara",
    "Note",
    "Patrol",
    "Serena",
    "Teana",
    "Tiida",
    "X-Trail",
  ],
  Honda: [
    "Accord",
    "Airwave",
    "CR-V",
    "Civic",
    "Fit",
    "Freed",
    "Grace",
    "Insight",
    "Odyssey",
    "Stepwgn",
    "Vezel",
  ],
  Mazda: ["Atenza", "Axela", "Bongo", "CX-3", "CX-5", "CX-7", "CX-9", "Demio", "Premacy"],
  Subaru: ["Exiga", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "XV"],
  Mitsubishi: ["Canter", "Delica", "L200", "Mirage", "Outlander", "Pajero", "RVR"],
  Suzuki: ["Alto", "Escudo", "Every", "Jimny", "Solio", "Swift", "Vitara", "Wagon R"],
  Daihatsu: ["Boon", "Hijet", "Mira", "Move", "Rocky", "Tanto", "Terios"],
  Hyundai: ["Accent", "Creta", "Elantra", "H-1", "Santa Fe", "Starex", "Tucson"],
  Kia: ["Carnival", "Morning", "Picanto", "Rio", "Sorento", "Sportage"],
  Mercedes: ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE", "S-Class", "Sprinter", "Vito"],
  BMW: ["1 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X6"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  Volkswagen: ["Amarok", "Golf", "Passat", "Polo", "Tiguan", "Touareg", "Transporter"],
  Ford: ["EcoSport", "Everest", "Explorer", "Focus", "Ranger", "Transit"],
  Isuzu: ["D-Max", "Elf", "MU-X", "N-Series"],
  Chevrolet: ["Captiva", "Cruze", "Spark", "Trailblazer"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Renegade", "Wrangler"],
  Lexus: ["ES", "GS", "GX", "IS", "LX", "NX", "RX"],
  Peugeot: ["208", "3008", "5008", "Partner"],
  Renault: ["Duster", "Kangoo", "Koleos", "Logan"],
  Volvo: ["S60", "S90", "V60", "XC40", "XC60", "XC90"],
  Porsche: ["Cayenne", "Macan", "Panamera"],
  Mini: ["Clubman", "Cooper", "Countryman"],
  Fiat: ["500", "Doblo", "Panda", "Tipo"],
  Mahindra: ["Bolero", "Scorpio", "XUV500"],
  Tata: ["Indica", "Safari", "Xenon"],
  Geely: ["Coolray", "Emgrand", "Okavango"],
  Haval: ["H2", "H6", "Jolion"],
  Chery: ["Tiggo 4", "Tiggo 7", "Tiggo 8"],
  MG: ["HS", "MG3", "ZS"],
};

const uniqSorted = (items) =>
  [...new Set(items.filter(Boolean).map((item) => String(item).trim()))].sort((a, b) =>
    a.localeCompare(b)
  );

const formatTanzanianPlateInput = (value) => {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const prefix = cleaned[0];

  if (!prefix) return "";
  if (!["T", "Z"].includes(prefix)) return "";

  let digits = "";
  let letters = "";
  const rest = cleaned.slice(1);

  for (const char of rest) {
    if (digits.length < 3) {
      if (/\d/.test(char)) digits += char;
      continue;
    }

    if (letters.length < 3 && /[A-Z]/.test(char)) {
      letters += char;
    }
  }

  return [prefix, digits, letters].filter(Boolean).join(" ");
};

const normalizePlateNumber = (value) => formatTanzanianPlateInput(value);

const validateTanzanianPlate = (value) =>
  /^[TZ]\s\d{3}\s[A-Z]{3}$/i.test(value || "") ||
  "Use plate format T 123 ABC or Z 123 ABC";

const vehicleModelOptions = uniqSorted(
  Object.entries(CAR_MODEL_LIBRARY).flatMap(([make, models]) => [
    make,
    ...models,
    ...models.map((model) => `${make} ${model}`),
  ])
);

const Section = ({ kicker, title, children }) => (
  <section className="border-t border-slate-200 px-5 py-6 sm:px-8">
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        {kicker}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
    </div>
    {children}
  </section>
);

const FieldGrid = ({ children }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
);

const WideFields = ({ children }) => (
  <div className="grid gap-4 lg:grid-cols-2">{children}</div>
);

const UploadCard = ({
  id,
  label,
  note,
  preview,
  previewAlt,
  registerProps,
  error,
  required,
  count,
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <label className="text-sm font-semibold text-slate-950" htmlFor={id}>
          {label}
        </label>
        <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          required ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {required ? "Required" : "Optional"}
      </span>
    </div>
    <input
      className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
      id={id}
      type="file"
      accept="image/*"
      multiple
      {...registerProps}
    />
    {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    <div className="mt-4 h-36 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
      {preview ? (
        <img src={preview} alt={previewAlt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-xs font-medium text-slate-500">
          Preview appears here
        </div>
      )}
    </div>
    {count > 1 && (
      <p className="mt-2 text-xs font-medium text-slate-500">
        {count} vehicle photos selected
      </p>
    )}
  </div>
);

const VendorAddProductModal = () => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const [vehiclePreview, setVehiclePreview] = useState("");
  const [vehicleImageCount, setVehicleImageCount] = useState(0);
  const [documentPreviews, setDocumentPreviews] = useState({
    insurance: "",
    registration: "",
    pollution: "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAddVehicleClicked } = useSelector((state) => state.addVehicle);
  const { modelData, companyData, locationData, districtData } = useSelector(
    (state) => state.modelDataSlice
  );
  const currentUser = useSelector((state) => state.user.currentUser);
  const makeOptions = uniqSorted([
    ...Object.keys(CAR_MODEL_LIBRARY),
    ...(companyData || []),
  ]);
  const selectedMake = watch("company");
  const modelOptions = selectedMake
    ? uniqSorted(CAR_MODEL_LIBRARY[selectedMake] || modelData || [])
    : uniqSorted([
        ...vehicleModelOptions,
        ...Object.values(CAR_MODEL_LIBRARY).flat(),
        ...(modelData || []),
      ]);

  useEffect(() => {
    loadCatalogMetadata(dispatch).catch(console.error);
  }, [dispatch]);

  const vehicleImageRegister = register("image", {
    required: "Upload at least one vehicle image",
    onChange: (event) => {
      const files = Array.from(event.target.files || []);
      setVehicleImageCount(files.length);
      if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
      setVehiclePreview(files[0] ? URL.createObjectURL(files[0]) : "");
    },
  });

  const updateDocumentPreview = (type, event) => {
    const [file] = Array.from(event.target.files || []);
    setDocumentPreviews((current) => {
      if (current[type]) URL.revokeObjectURL(current[type]);
      return { ...current, [type]: file ? URL.createObjectURL(file) : "" };
    });
  };

  const insuranceImageRegister = register("insurance_image", {
    required: "Upload the insurance document",
    onChange: (event) => updateDocumentPreview("insurance", event),
  });

  const registrationImageRegister = register("rc_book_image", {
    required: "Upload the ownership or registration document",
    onChange: (event) => updateDocumentPreview("registration", event),
  });

  const pollutionImageRegister = register("polution_image", {
    required: "Upload the inspection or roadworthy document",
    onChange: (event) => updateDocumentPreview("pollution", event),
  });

  useEffect(
    () => () => {
      if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
    },
    [vehiclePreview]
  );

  useEffect(
    () => () => {
      Object.values(documentPreviews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    },
    [documentPreviews]
  );

  const onSubmit = async (addData) => {
    let tostID;
    try {
      const img = Array.from(addData.image || []);
      const insuranceImages = Array.from(addData.insurance_image || []);
      const registrationImages = Array.from(addData.rc_book_image || []);
      const inspectionImages = Array.from(addData.polution_image || []);
      if (!img.length) {
        toast.error("Please upload at least one vehicle image.");
        return;
      }
      if (!insuranceImages.length || !registrationImages.length || !inspectionImages.length) {
        toast.error("Please upload all required vehicle documents.");
        return;
      }

      const formData = new FormData();
      const appendIfPresent = (key, value) => {
        const normalized = value?.$d || value;
        if (normalized !== undefined && normalized !== null && normalized !== "") {
          formData.append(key, normalized);
        }
      };

      formData.append("registeration_number", normalizePlateNumber(addData.registeration_number));
      formData.append("company", addData.company);
      img.forEach((file) => formData.append("image", file));
      insuranceImages.forEach((file) => formData.append("insurance_image", file));
      registrationImages.forEach((file) => formData.append("rc_book_image", file));
      inspectionImages.forEach((file) => formData.append("polution_image", file));
      formData.append("name", addData.name);
      formData.append("model", addData.model);
      formData.append("title", addData.title);
      formData.append("base_package", addData.base_package);
      formData.append("price", addData.price);
      formData.append("description", addData.description);
      formData.append("year_made", addData.year_made);
      formData.append("fuel_type", addData.fuelType);
      formData.append("seat", addData.Seats);
      formData.append("transmition_type", addData.transmitionType);
      appendIfPresent("odometer_km", addData.odometer_km);
      appendIfPresent("vehicle_condition", addData.vehicle_condition);
      appendIfPresent("ownership_status", addData.ownership_status);
      appendIfPresent("inspection_status", addData.inspection_status);
      appendIfPresent("tracker_status", addData.tracker_status);
      appendIfPresent("service_history", addData.service_history);
      appendIfPresent("paperwork_status", addData.paperwork_status);
      appendIfPresent("rental_notes", addData.rental_notes);
      appendIfPresent("last_service_on", addData.last_service_date);
      appendIfPresent("insurance_end_date", addData.insurance_end_date);
      appendIfPresent("registeration_end_date", addData.Registeration_end_date);
      appendIfPresent("polution_end_date", addData.polution_end_date);
      formData.append("car_type", addData.carType);
      formData.append("location", addData.vehicleLocation);
      formData.append("district", addData.vehicleDistrict);

      tostID = toast.loading("Uploading vehicle...", { position: "bottom-center" });

      const createdVehicle = await createVehicle(formData);
      sendVendorVehicleStatusEmail({
        to: currentUser?.email,
        vehicleName: [createdVehicle?.company, createdVehicle?.model || createdVehicle?.name].filter(Boolean).join(" ") || addData.name,
        status: "awaiting approval",
        note: "Your vehicle has been submitted to Rent a Ride for inspection and eligibility review.",
      }).catch(() => null);
      toast.success("Vehicle request sent to admin");

      reset();
      setVehiclePreview("");
      setVehicleImageCount(0);
      setDocumentPreviews({ insurance: "", registration: "", pollution: "" });
      navigate("/vendorDashboard/vendorAllVeihcles");
      dispatch(addVehicleClicked(false));
    } catch (error) {
      console.log(error);
      toast.error(error?.message || "Could not upload the vehicle image. Please try again.");
    } finally {
      if (tostID) toast.dismiss(tostID);
    }
  };

  const handleClose = () => {
    navigate("/vendorDashboard/vendorAllVeihcles");
  };

  if (!isAddVehicleClicked) return null;

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 border-b border-slate-200 bg-white px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Vendor fleet intake
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                  Add a vehicle for approval
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Submit enough detail for Rent a Ride to review ownership authority,
                  condition, rental readiness, and customer-facing listing quality.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Close vehicle form"
              >
                <IoMdClose className="text-2xl" />
              </button>
            </div>

            <Box
              sx={{
                "& .MuiTextField-root": fieldSx,
              }}
              noValidate
              autoComplete="off"
            >
              <Section kicker="Vehicle profile" title="Identity and listing details">
                <FieldGrid>
                  <Controller
                    control={control}
                    name="registeration_number"
                    defaultValue=""
                    rules={{
                      required: "Registration number is required",
                      validate: validateTanzanianPlate,
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="registeration_number"
                        label="Registration number"
                        placeholder="T 123 ABC or Z 123 ABC"
                        inputProps={{ maxLength: 9 }}
                        error={Boolean(fieldState.error)}
                        helperText={
                          fieldState.error?.message ||
                          "Type T or Z, then three numbers, then three letters."
                        }
                        onChange={(event) => field.onChange(formatTanzanianPlateInput(event.target.value))}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="company"
                    defaultValue=""
                    rules={{ required: "Vehicle make is required" }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        freeSolo
                        options={makeOptions}
                        value={field.value || ""}
                        autoHighlight
                        selectOnFocus
                        clearOnBlur={false}
                        onInputChange={(_, value) => {
                          field.onChange(value);
                          const currentModel = getValues("model");
                          const nextModels = CAR_MODEL_LIBRARY[value] || [];
                          if (currentModel && nextModels.length && !nextModels.includes(currentModel)) {
                            setValue("model", "");
                          }
                        }}
                        onChange={(_, value) => {
                          const nextValue = value || "";
                          field.onChange(nextValue);
                          const currentModel = getValues("model");
                          const nextModels = CAR_MODEL_LIBRARY[nextValue] || [];
                          if (currentModel && nextModels.length && !nextModels.includes(currentModel)) {
                            setValue("model", "");
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            id="company"
                            label="Make / company"
                            placeholder="Start typing Toyota, Nissan, Hyundai"
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message || "Search from known makes or type another one."}
                          />
                        )}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="model"
                    defaultValue=""
                    rules={{ required: "Vehicle model is required" }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        freeSolo
                        options={modelOptions}
                        value={field.value || ""}
                        autoHighlight
                        selectOnFocus
                        clearOnBlur={false}
                        onInputChange={(_, value) => field.onChange(value)}
                        onChange={(_, value) => field.onChange(value || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            id="model"
                            label="Model"
                            placeholder={selectedMake ? "Start typing a model" : "Select a make first"}
                            error={Boolean(fieldState.error)}
                            helperText={
                              fieldState.error?.message ||
                              (selectedMake
                                ? `Showing common ${selectedMake} models.`
                                : "Models are filtered after make selection.")
                            }
                          />
                        )}
                      />
                    )}
                  />
                  <TextField
                    id="name"
                    label="Vehicle display name"
                    placeholder="Toyota Harrier"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    {...register("name", { required: "Vehicle display name is required" })}
                  />
                  <TextField
                    id="title"
                    label="Listing headline"
                    placeholder="Comfort SUV for city and airport trips"
                    {...register("title")}
                  />
                  <TextField
                    id="base_package"
                    label="Base package"
                    placeholder="Daily rental, self-drive"
                    {...register("base_package")}
                  />
                </FieldGrid>
              </Section>

              <Section kicker="Specs and pricing" title="Rental basics">
                <FieldGrid>
                  <TextField
                    id="price"
                    type="number"
                    label="Price per day"
                    placeholder="120000"
                    error={Boolean(errors.price)}
                    helperText={errors.price?.message}
                    {...register("price", {
                      required: "Daily price is required",
                      min: { value: 1, message: "Price must be greater than 0" },
                    })}
                  />
                  <TextField
                    id="year_made"
                    type="number"
                    label="Year made"
                    placeholder="2018"
                    error={Boolean(errors.year_made)}
                    helperText={errors.year_made?.message}
                    {...register("year_made", {
                      required: "Year made is required",
                      min: { value: 1990, message: "Use a realistic vehicle year" },
                      max: { value: new Date().getFullYear(), message: "Year cannot be in the future" },
                    })}
                  />
                  <TextField
                    id="odometer_km"
                    type="number"
                    label="Mileage / odometer (km)"
                    placeholder="65000"
                    error={Boolean(errors.odometer_km)}
                    helperText={errors.odometer_km?.message}
                    {...register("odometer_km", {
                      required: "Mileage is required",
                      min: { value: 0, message: "Mileage cannot be negative" },
                    })}
                  />
                  <Controller
                    control={control}
                    name="fuelType"
                    defaultValue=""
                    rules={{ required: "Fuel type is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="fuel_type"
                        select
                        label="Fuel type"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="petrol">Petrol</MenuItem>
                        <MenuItem value="diesel">Diesel</MenuItem>
                        <MenuItem value="electirc">Electric</MenuItem>
                        <MenuItem value="hybrid">Hybrid</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    name="carType"
                    control={control}
                    defaultValue=""
                    rules={{ required: "Car type is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="car_type"
                        select
                        label="Car type"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                    defaultValue=""
                    rules={{ required: "Seat count is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="seats"
                        select
                        label="Seats"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="5">5 seats</MenuItem>
                        <MenuItem value="7">7 seats</MenuItem>
                        <MenuItem value="8">8 seats</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    control={control}
                    name="transmitionType"
                    defaultValue=""
                    rules={{ required: "Transmission is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="transmittion_type"
                        select
                        label="Transmission"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="automatic">Automatic</MenuItem>
                        <MenuItem value="manual">Manual</MenuItem>
                      </TextField>
                    )}
                  />
                </FieldGrid>
              </Section>

              <Section kicker="Readiness review" title="Condition, authority, and location">
                <FieldGrid>
                  <Controller
                    name="vehicle_condition"
                    control={control}
                    defaultValue=""
                    rules={{ required: "Vehicle condition is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="vehicle_condition"
                        select
                        label="Vehicle condition"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
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
                    defaultValue=""
                    rules={{ required: "Listing authority is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="ownership_status"
                        select
                        label="Listing authority"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="owner">I own this vehicle</MenuItem>
                        <MenuItem value="authorized_agent">I am authorized to list it</MenuItem>
                        <MenuItem value="company_vehicle">Company vehicle</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    name="inspection_status"
                    control={control}
                    defaultValue=""
                    rules={{ required: "Roadworthy inspection status is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="inspection_status"
                        select
                        label="Roadworthy inspection"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="valid">Valid / roadworthy</MenuItem>
                        <MenuItem value="pending_renewal">Pending renewal</MenuItem>
                        <MenuItem value="not_available">Not available yet</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    name="tracker_status"
                    control={control}
                    defaultValue=""
                    rules={{ required: "GPS tracker status is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="tracker_status"
                        select
                        label="GPS tracker"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value="installed">Installed</MenuItem>
                        <MenuItem value="can_install">Can install before approval</MenuItem>
                        <MenuItem value="not_installed">Not installed</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    control={control}
                    name="vehicleDistrict"
                    defaultValue=""
                    rules={{ required: "Company inspection yard district is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="vehicleDistrict"
                        select
                        label="Company inspection yard district"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        {districtData.map((cur, idx) => (
                          <MenuItem value={cur} key={idx}>
                            {cur}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    control={control}
                    name="vehicleLocation"
                    defaultValue=""
                    rules={{ required: "Company inspection yard location is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="vehicleLocation"
                        select
                        label="Company inspection yard location"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        {locationData.map((cur, idx) => (
                          <MenuItem value={cur} key={idx}>
                            {cur}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    name="last_service_date"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          {...field}
                          label="Last service date"
                          inputFormat="MM/dd/yyyy"
                          value={field.value || null}
                          onChange={(date) => field.onChange(date)}
                          textField={(props) => <TextField {...props} />}
                        />
                      </LocalizationProvider>
                    )}
                  />
                  <Controller
                    name="insurance_end_date"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          {...field}
                          label="Insurance end date"
                          inputFormat="MM/dd/yyyy"
                          value={field.value || null}
                          onChange={(date) => field.onChange(date)}
                          textField={(props) => <TextField {...props} />}
                        />
                      </LocalizationProvider>
                    )}
                  />
                  <Controller
                    control={control}
                    name="Registeration_end_date"
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          {...field}
                          label="Registration end date"
                          inputFormat="MM/dd/yyyy"
                          value={field.value || null}
                          onChange={(date) => field.onChange(date)}
                          textField={(props) => <TextField {...props} />}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FieldGrid>
              </Section>

              <Section kicker="Operational notes" title="Admin review information">
                <WideFields>
                  <TextField
                    id="description"
                    label="Customer-facing description"
                    multiline
                    rows={4}
                    placeholder="Describe the rental experience, comfort, luggage space, and ideal use."
                    {...register("description")}
                  />
                  <TextField
                    id="service_history"
                    label="Service history"
                    multiline
                    rows={4}
                    placeholder="Recent service work, tire condition, battery, engine checks."
                    {...register("service_history")}
                  />
                  <TextField
                    id="paperwork_status"
                    label="Paperwork status"
                    multiline
                    rows={4}
                    placeholder="Insurance, registration card, ownership document, roadworthy inspection."
                    {...register("paperwork_status")}
                  />
                  <TextField
                    id="rental_notes"
                    label="Rental notes / restrictions"
                    multiline
                    rows={4}
                    placeholder="Allowed regions, airport delivery availability, mileage expectations, handling notes."
                    {...register("rental_notes")}
                  />
                </WideFields>
              </Section>

              <Section kicker="Uploads" title="Vehicle photos and optional paperwork">
                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
                  Vehicle photos and ownership documents are required before Rent a Ride can
                  review and approve a vendor vehicle.
                </div>
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <UploadCard
                    id="image"
                    label="Vehicle photos"
                    note="Exterior or interior images for the customer listing."
                    preview={vehiclePreview}
                    previewAlt="Selected vehicle preview"
                    registerProps={vehicleImageRegister}
                    error={errors.image?.message}
                    required
                    count={vehicleImageCount}
                  />
                  <UploadCard
                    id="insurance_image"
                    label="Insurance document"
                    note="Required for admin to verify active insurance coverage."
                    preview={documentPreviews.insurance}
                    previewAlt="Selected insurance document preview"
                    registerProps={insuranceImageRegister}
                    error={errors.insurance_image?.message}
                    required
                  />
                  <UploadCard
                    id="rc_book_image"
                    label="Ownership / registration document"
                    note="Upload logbook, registration card, or ownership authority document."
                    preview={documentPreviews.registration}
                    previewAlt="Selected ownership or registration document preview"
                    registerProps={registrationImageRegister}
                    error={errors.rc_book_image?.message}
                    required
                  />
                  <UploadCard
                    id="polution_image"
                    label="Inspection / roadworthy"
                    note="Required evidence that the vehicle is roadworthy for customers."
                    preview={documentPreviews.pollution}
                    previewAlt="Selected inspection document preview"
                    registerProps={pollutionImageRegister}
                    error={errors.polution_image?.message}
                    required
                  />
                </div>
              </Section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-8">
                <Button
                  variant="outlined"
                  type="button"
                  onClick={handleClose}
                  sx={{ borderRadius: "8px", textTransform: "none", px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{ borderRadius: "8px", textTransform: "none", px: 3 }}
                >
                  Submit for approval
                </Button>
              </div>
            </Box>
          </div>
        </form>
      </div>
    </>
  );
};

export default VendorAddProductModal;

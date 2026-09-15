import { requireSupabase } from "../lib/supabase";

const vehicleSelect = "*, vehicle_images(id, storage_path, public_url, position)";

const publicImageUrl = (image) => {
  if (image.public_url) return image.public_url;
  if (!image.storage_path) return "";
  return requireSupabase().storage.from("vehicle-images").getPublicUrl(image.storage_path).data.publicUrl;
};

export const toAppVehicle = (vehicle) => {
  if (!vehicle) return null;
  const images = [...(vehicle.vehicle_images || [])]
    .sort((left, right) => left.position - right.position)
    .map(publicImageUrl)
    .filter(Boolean);

  return {
    ...vehicle,
    _id: vehicle.id,
    registeration_number: vehicle.registration_number,
    car_title: vehicle.title,
    car_description: vehicle.description,
    price: Number(vehicle.price_per_day),
    transmition: vehicle.transmission,
    image: images,
    ratting: vehicle.rating,
    isDeleted: vehicle.deleted_at ? "true" : "false",
    isAdminApproved: vehicle.approval_status === "approved",
    isRejected: vehicle.approval_status === "rejected",
    isAdminAdded: vehicle.is_admin_added,
    addedBy: vehicle.owner_id,
    insurance_end: vehicle.insurance_expires_on,
    registeration_end: vehicle.registration_expires_on,
    pollution_end: vehicle.pollution_certificate_expires_on,
  };
};

const attachImages = async (vehicles) => {
  if (!vehicles?.length) return [];
  const client = requireSupabase();
  const { data: images, error } = await client
    .from("vehicle_images")
    .select("id, vehicle_id, storage_path, public_url, position")
    .in("vehicle_id", vehicles.map((vehicle) => vehicle.id));
  if (error) throw error;

  return vehicles.map((vehicle) => ({
    ...vehicle,
    vehicle_images: images.filter((image) => image.vehicle_id === vehicle.id),
  }));
};

const runVehicleQuery = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toAppVehicle);
};

export const getPublicVehicles = () =>
  runVehicleQuery(
    requireSupabase()
      .from("vehicles")
      .select(vehicleSelect)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
  );

export const getAllVehicles = () =>
  runVehicleQuery(
    requireSupabase().from("vehicles").select(vehicleSelect).order("created_at", { ascending: false })
  );

export const getVendorVehicles = async () => {
  const client = requireSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required");

  return runVehicleQuery(
    client
      .from("vehicles")
      .select(vehicleSelect)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
  );
};

export const getPendingVehicles = () =>
  runVehicleQuery(
    requireSupabase()
      .from("vehicles")
      .select(vehicleSelect)
      .eq("approval_status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
  );

export const getVehicle = async (id) => {
  const { data, error } = await requireSupabase()
    .from("vehicles")
    .select(vehicleSelect)
    .eq("id", id)
    .single();
  if (error) throw error;
  return toAppVehicle(data);
};

export const searchAvailableVehicles = async ({
  pickupDate,
  dropOffDate,
  pickUpDistrict,
  pickUpLocation,
}) => {
  const client = requireSupabase();
  const { data, error } = await client.rpc("search_available_vehicles", {
    p_pickup_at: new Date(pickupDate).toISOString(),
    p_dropoff_at: new Date(dropOffDate).toISOString(),
    p_district: pickUpDistrict || null,
    p_location: pickUpLocation || null,
  });
  if (error) throw error;

  const vehicles = await attachImages(data || []);
  const seenModels = new Set();
  return vehicles.map(toAppVehicle).filter((vehicle) => {
    if (seenModels.has(vehicle.model)) return false;
    seenModels.add(vehicle.model);
    return true;
  });
};

export const getAvailableVariants = async ({ model, ...search }) => {
  const client = requireSupabase();
  const { data, error } = await client.rpc("search_available_vehicles", {
    p_pickup_at: new Date(search.pickupDate).toISOString(),
    p_dropoff_at: new Date(search.dropOffDate).toISOString(),
    p_district: search.pickUpDistrict || null,
    p_location: search.pickUpLocation || null,
  });
  if (error) throw error;
  const vehicles = await attachImages((data || []).filter((vehicle) => vehicle.model === model));
  return vehicles.map(toAppVehicle);
};

export const getCatalogMetadata = async () => {
  const client = requireSupabase();
  const [locationsResult, vehiclesResult] = await Promise.all([
    client.from("locations").select("district, name").eq("is_active", true).order("district"),
    client.from("vehicles").select("company, model").eq("approval_status", "approved").is("deleted_at", null),
  ]);
  if (locationsResult.error) throw locationsResult.error;
  if (vehiclesResult.error) throw vehiclesResult.error;

  return [
    ...vehiclesResult.data.map((vehicle) => ({
      type: "car",
      model: vehicle.model,
      brand: vehicle.company,
    })),
    ...locationsResult.data.map((location) => ({
      type: "location",
      district: location.district,
      location: location.name,
    })),
  ];
};

const getValue = (input, ...keys) => {
  for (const key of keys) {
    const value = input instanceof FormData ? input.get(key) : input?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const toDateValue = (value) => {
  if (!value) return undefined;
  const date = value?.$d || value;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
};

const normalizeVehicleInput = (input, partial = false) => {
  const fuel = getValue(input, "fuel_type", "fuelType");
  const values = {
    registration_number: getValue(input, "registration_number", "registeration_number"),
    company: getValue(input, "company"),
    name: getValue(input, "name"),
    model: getValue(input, "model"),
    title: getValue(input, "title", "car_title"),
    description: getValue(input, "description", "car_description"),
    year_made: getValue(input, "year_made"),
    fuel_type: fuel === "electirc" ? "electric" : fuel?.toLowerCase(),
    seats: getValue(input, "seats", "seat", "Seats"),
    transmission: getValue(input, "transmission", "transmition", "transmition_type", "transmitionType"),
    car_type: getValue(input, "car_type", "carType"),
    price_per_day: getValue(input, "price_per_day", "price"),
    base_package: getValue(input, "base_package"),
    district: getValue(input, "district", "vehicleDistrict"),
    location: getValue(input, "location", "vehicleLocation"),
    insurance_expires_on: toDateValue(getValue(input, "insurance_expires_on", "insurance_end_date")),
    registration_expires_on: toDateValue(getValue(input, "registration_expires_on", "registeration_end_date", "Registeration_end_date")),
    pollution_certificate_expires_on: toDateValue(getValue(input, "pollution_certificate_expires_on", "polution_end_date")),
  };

  Object.keys(values).forEach((key) => values[key] === undefined && delete values[key]);
  if (!partial) {
    values.price_per_day = Number(values.price_per_day);
    if (values.year_made) values.year_made = Number(values.year_made);
    if (values.seats) values.seats = Number(values.seats);
  }
  return values;
};

const getImageFiles = (input) => {
  if (input instanceof FormData) return input.getAll("image").filter((item) => item instanceof File);
  const images = input?.image;
  return images ? Array.from(images).filter((item) => item instanceof File) : [];
};

const uploadVehicleImages = async (vehicleId, files, userId) => {
  const client = requireSupabase();
  for (const [position, file] of files.entries()) {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const storagePath = `${userId}/${vehicleId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await client.storage
      .from("vehicle-images")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;

    const { error: imageError } = await client.from("vehicle_images").insert({
      vehicle_id: vehicleId,
      storage_path: storagePath,
      position,
    });
    if (imageError) throw imageError;
  }
};

export const createVehicle = async (input) => {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Authentication required");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;

  const isAdmin = profile.role === "admin";
  const values = {
    ...normalizeVehicleInput(input),
    owner_id: user.id,
    approval_status: isAdmin ? "approved" : "pending",
    is_admin_added: isAdmin,
  };
  const { data: vehicle, error } = await client.from("vehicles").insert(values).select("*").single();
  if (error) throw error;

  await uploadVehicleImages(vehicle.id, getImageFiles(input), user.id);
  return getVehicle(vehicle.id);
};

export const updateVehicle = async (id, input) => {
  const client = requireSupabase();
  const { error } = await client.from("vehicles").update(normalizeVehicleInput(input, true)).eq("id", id);
  if (error) throw error;
  return getVehicle(id);
};

export const deleteVehicle = async (id) => {
  const { error } = await requireSupabase()
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
};

export const reviewVehicle = async (id, approvalStatus, rejectionReason = null) => {
  const { data, error } = await requireSupabase().rpc("review_vehicle", {
    p_vehicle_id: id,
    p_approval_status: approvalStatus,
    p_rejection_reason: rejectionReason,
  });
  if (error) throw error;
  return toAppVehicle(data);
};

import { requireSupabase } from "../lib/supabase";

export const getMyLoyaltyAccount = async () => {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Authentication required");

  const { data, error } = await client.rpc("ensure_loyalty_account", {
    p_customer_id: user.id,
  });
  if (error) throw error;
  return data;
};

export const createBusinessAccount = async ({ companyName, taxId, invoiceEmail, billingAddress }) => {
  const { data, error } = await requireSupabase().rpc("create_business_account", {
    p_company_name: companyName,
    p_tax_id: taxId || null,
    p_invoice_email: invoiceEmail || null,
    p_billing_address: billingAddress,
  });
  if (error) throw error;
  return data;
};

export const getBusinessAccounts = async () => {
  const { data, error } = await requireSupabase()
    .from("business_accounts")
    .select("*, business_account_members(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const reviewBusinessAccount = async (id, status, discountPercent = null) => {
  const { data, error } = await requireSupabase().rpc("review_business_account", {
    p_business_account_id: id,
    p_status: status,
    p_discount_percent: discountPercent,
  });
  if (error) throw error;
  return data;
};

export const createFleetBlock = async ({ vehicleId, blockType, startsAt, endsAt, reason }) => {
  const { data, error } = await requireSupabase().rpc("create_fleet_block", {
    p_vehicle_id: vehicleId,
    p_block_type: blockType,
    p_starts_at: new Date(startsAt).toISOString(),
    p_ends_at: new Date(endsAt).toISOString(),
    p_reason: reason || null,
  });
  if (error) throw error;
  return data;
};

export const getFleetBlocks = async () => {
  const { data, error } = await requireSupabase()
    .from("fleet_blocks")
    .select("*, vehicle:vehicles(id, company, model, registration_number)")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createSubscription = async ({
  vehicleId,
  preferredModel,
  monthlyPrice,
  mileagePackageKm,
  protectionPackage = "standard",
  businessAccountId = null,
}) => {
  const { data, error } = await requireSupabase().rpc("create_subscription", {
    p_vehicle_id: vehicleId || null,
    p_preferred_model: preferredModel || null,
    p_monthly_price: Number(monthlyPrice),
    p_mileage_package_km: Number(mileagePackageKm),
    p_protection_package: protectionPackage,
    p_business_account_id: businessAccountId,
  });
  if (error) throw error;
  return data;
};

export const pauseSubscription = async (id, pausedUntil) => {
  const { data, error } = await requireSupabase().rpc("pause_subscription", {
    p_subscription_id: id,
    p_paused_until: new Date(pausedUntil).toISOString(),
  });
  if (error) throw error;
  return data;
};

export const getSubscriptions = async () => {
  const { data, error } = await requireSupabase()
    .from("subscriptions")
    .select("*, vehicle:vehicles(id, company, model, registration_number)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createRideBooking = async ({
  serviceType,
  pickupAt,
  pickupLocation,
  destinationLocation,
  hours,
  passengerCount,
  luggageCount,
  rideClass,
  contactEmail,
  contactPhone,
  businessAccountId = null,
}) => {
  const { data, error } = await requireSupabase().rpc("create_ride_booking", {
    p_service_type: serviceType,
    p_pickup_at: new Date(pickupAt).toISOString(),
    p_pickup_location: pickupLocation,
    p_destination_location: destinationLocation || null,
    p_hours: hours ? Number(hours) : null,
    p_passenger_count: Number(passengerCount || 1),
    p_luggage_count: Number(luggageCount || 0),
    p_ride_class: rideClass || "standard",
    p_contact_email: contactEmail,
    p_contact_phone: contactPhone,
    p_business_account_id: businessAccountId,
  });
  if (error) throw error;
  return data;
};

export const getRideBookings = async () => {
  const { data, error } = await requireSupabase()
    .from("ride_bookings")
    .select("*")
    .order("pickup_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

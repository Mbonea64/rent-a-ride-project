import { requireSupabase } from "../lib/supabase";
import { publishDemoBooking } from "./demoOpsService";
import { toAppVehicle } from "./vehicleService";

const bookingSelect = `
  *,
  vehicle:vehicles(*, vehicle_images(id, storage_path, public_url, position)),
  payments(*),
  booking_line_items(*),
  invoices(*)
`;

const legacyBookingSelect = `
  *,
  vehicle:vehicles(*, vehicle_images(id, storage_path, public_url, position)),
  payments(*)
`;

const demoRentalAddOns = [
  {
    code: "extra_driver",
    name: "Extra driver",
    description: "Add one approved additional driver to the rental.",
    price_type: "per_day",
    price_amount: 12000,
    applies_to: "rental",
    is_active: true,
  },
  {
    code: "child_seat",
    name: "Child seat",
    description: "Reserve a child safety seat for the trip.",
    price_type: "per_booking",
    price_amount: 20000,
    applies_to: "rental",
    is_active: true,
  },
  {
    code: "airport_meet",
    name: "Airport meet and greet",
    description: "A team member meets the renter at airport pickup.",
    price_type: "per_booking",
    price_amount: 30000,
    applies_to: "rental",
    is_active: true,
  },
  {
    code: "unlimited_mileage",
    name: "Unlimited mileage",
    description: "Remove daily mileage limits for local travel.",
    price_type: "per_day",
    price_amount: 18000,
    applies_to: "rental",
    is_active: true,
  },
  {
    code: "vehicle_delivery",
    name: "Vehicle delivery",
    description: "Deliver the vehicle to the selected pickup address.",
    price_type: "per_booking",
    price_amount: 25000,
    applies_to: "rental",
    is_active: true,
  },
];

const isMissingFeatureError = (error) => {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return (
    ["pgrst202", "pgrst205", "42p01", "42883"].includes(error?.code) ||
    message.includes("schema cache") ||
    message.includes("could not find the function") ||
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
};

const calculateRentalDays = (pickupDate, dropoffDate) => {
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const days = Math.ceil((end - start) / (1000 * 3600 * 24));
  return Number.isFinite(days) && days > 0 ? days : 1;
};

const demoEnhancementKey = "rent_a_ride_demo_booking_enhancements";
const demoBookingOverrideKey = "rent_a_ride_demo_booking_overrides";
const hiddenDemoBookingKey = "rent_a_ride_hidden_demo_bookings";

const readDemoEnhancements = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(demoEnhancementKey) || "{}");
  } catch {
    return {};
  }
};

const writeDemoEnhancement = (bookingId, quote) => {
  if (typeof window === "undefined" || !bookingId || !quote) return;
  const current = readDemoEnhancements();
  window.localStorage.setItem(
    demoEnhancementKey,
    JSON.stringify({
      ...current,
      [bookingId]: quote,
    })
  );
};

const getDemoEnhancement = (bookingId) => readDemoEnhancements()[bookingId] || {};

const readDemoBookingOverrides = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(demoBookingOverrideKey) || "{}");
  } catch {
    return {};
  }
};

const writeDemoBookingOverride = (bookingId, values) => {
  if (typeof window === "undefined" || !bookingId) return;
  const current = readDemoBookingOverrides();
  window.localStorage.setItem(
    demoBookingOverrideKey,
    JSON.stringify({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || {}),
        ...values,
        updated_at: new Date().toISOString(),
      },
    })
  );
};

const getDemoBookingOverride = (bookingId) => readDemoBookingOverrides()[bookingId] || {};

const readHiddenDemoBookings = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(hiddenDemoBookingKey) || "[]");
  } catch {
    return [];
  }
};

const isHiddenDemoBooking = (bookingId) => readHiddenDemoBookings().includes(bookingId);

export const hideDemoBookings = (bookingIds = []) => {
  if (typeof window === "undefined") return;
  const hidden = new Set(readHiddenDemoBookings());
  bookingIds.filter(Boolean).forEach((id) => hidden.add(id));
  window.localStorage.setItem(hiddenDemoBookingKey, JSON.stringify([...hidden]));
  window.dispatchEvent(new Event("rent-a-ride-demo-reset"));
  window.dispatchEvent(new Event("storage"));
};

export const resetDemoBookingState = async () => {
  const bookings = await getBookings({ includeHidden: true }).catch(() => []);
  await Promise.all(
    bookings
      .filter((booking) => !["canceled", "tripCompleted"].includes(booking.status))
      .map((booking) => setBookingStatus(booking._id, "canceled").catch(() => null))
  );
  hideDemoBookings(bookings.map((booking) => booking._id));
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(demoEnhancementKey);
    window.localStorage.removeItem(demoBookingOverrideKey);
  }
  return bookings.length;
};

const quoteBookingForDemo = (order) => {
  const rentalDays = calculateRentalDays(order.pickupDate, order.dropoffDate);
  const dailyPrice = Number(order.dailyPrice || order.price || 0);
  const subtotal = dailyPrice * rentalDays;
  const deliveryFee = 10000;
  const oneWayFee =
    String(order.pickup_location || "").toLowerCase() !==
    String(order.dropoff_location || "").toLowerCase()
      ? 25000
      : 0;
  const protectionFee = {
    plus: rentalDays * 15000,
    premium: rentalDays * 25000,
  }[order.protectionPackage] || 0;
  const mileageFee =
    Number(order.mileagePackageKm || 0) >= 2000
      ? 50000
      : Number(order.mileagePackageKm || 0) >= 1000
        ? 25000
        : 0;
  const selectedAddOns = demoRentalAddOns.filter((addOn) =>
    (order.addOnCodes || []).includes(addOn.code)
  );
  const addOnsTotal = selectedAddOns.reduce(
    (sum, addOn) =>
      sum + (addOn.price_type === "per_day" ? addOn.price_amount * rentalDays : addOn.price_amount),
    0
  );
  const couponDiscount = String(order.coupon || "").toUpperCase() === "KARIBU10000" ? 10000 : 0;
  const longTermDiscount = rentalDays >= 90 ? subtotal * 0.15 : rentalDays >= 28 ? subtotal * 0.1 : 0;
  const loyaltyDiscount = subtotal * 0.02;
  const grossTotal = subtotal + deliveryFee + oneWayFee + protectionFee + mileageFee + addOnsTotal;
  const discount = Math.min(grossTotal, couponDiscount + longTermDiscount + loyaltyDiscount);
  const totalPrice = Math.max(0, grossTotal - discount);
  const depositAmount = Math.max(50000, Math.round(totalPrice * 0.15));
  const addOnLineItems = selectedAddOns.map((addOn) => ({
    id: `demo-${addOn.code}`,
    item_type: "addon",
    code: addOn.code,
    description: addOn.name,
    amount: addOn.price_type === "per_day" ? addOn.price_amount * rentalDays : addOn.price_amount,
  }));

  return {
    vehicle_id: order.vehicle_id,
    rental_days: rentalDays,
    rental_product: rentalDays >= 28 ? "long_term" : "short_term",
    daily_price: dailyPrice,
    subtotal,
    delivery_fee: deliveryFee,
    one_way_fee: oneWayFee,
    protection_fee: protectionFee,
    mileage_fee: mileageFee,
    add_ons_total: addOnsTotal,
    coupon_discount: couponDiscount,
    long_term_discount: longTermDiscount,
    loyalty_discount: loyaltyDiscount,
    business_discount: 0,
    discount,
    total_price: totalPrice,
    deposit_amount: depositAmount,
    currency: "TZS",
    line_items: [
      { id: "demo-rent", item_type: "rent", code: "daily_rent", description: "Rental days", amount: subtotal },
      { id: "demo-support", item_type: "fee", code: "pickup_support", description: "Pickup support", amount: deliveryFee },
      ...(oneWayFee ? [{ id: "demo-one-way", item_type: "fee", code: "one_way", description: "Different return location", amount: oneWayFee }] : []),
      ...(protectionFee ? [{ id: "demo-protection", item_type: "addon", code: "protection", description: `${order.protectionPackage} protection`, amount: protectionFee }] : []),
      ...(mileageFee ? [{ id: "demo-mileage", item_type: "addon", code: "mileage_package", description: "Mileage package", amount: mileageFee }] : []),
      ...addOnLineItems,
      ...(discount ? [{ id: "demo-discount", item_type: "discount", code: "discounts", description: "Applied discounts", amount: -discount }] : []),
      { id: "demo-deposit", item_type: "deposit", code: "security_deposit", description: "Refundable security deposit estimate", amount: depositAmount },
    ],
  };
};

const toLegacyStatus = (status) => ({
  pending: "notBooked",
  confirmed: "booked",
  active: "onTrip",
  completed: "tripCompleted",
  cancelled: "canceled",
  rejected: "notPicked",
}[status] || status);

const toDatabaseStatus = (status) => ({
  notBooked: "pending",
  booked: "confirmed",
  onTrip: "active",
  tripCompleted: "completed",
  canceled: "cancelled",
  notPicked: "rejected",
  overDue: "active",
}[status] || status);

export const toAppBooking = (booking) => {
  if (!booking) return null;
  const demoEnhancement = getDemoEnhancement(booking.id);
  const demoOverride = getDemoBookingOverride(booking.id);
  const vehicle = toAppVehicle(booking.vehicle);
  const status = toLegacyStatus(booking.status);
  const payment = booking.payments?.[0] || {};
  const paymentStatus = payment.status || "pending";
  const lineItems = booking.booking_line_items || demoEnhancement.line_items || [];
  const pickupAt = demoOverride.pickup_at || booking.pickup_at;
  const dropoffAt = demoOverride.dropoff_at || booking.dropoff_at;
  const dropoffLocation = demoOverride.dropoff_location || booking.dropoff_location;
  const updatedAt = demoOverride.updated_at || booking.updated_at;

  return {
    ...booking,
    _id: booking.id,
    updated_at: updatedAt,
    vehicleId: booking.vehicle_id,
    userId: booking.customer_id,
    pickupDate: pickupAt,
    dropOffDate: dropoffAt,
    pickUpDistrict: booking.pickup_district,
    pickUpLocation: booking.pickup_location,
    dropOffLocation: dropoffLocation,
    totalPrice: Number(demoEnhancement.total_price || booking.total_price),
    subtotal: Number(booking.subtotal || demoEnhancement.subtotal || 0),
    deliveryFee: Number(booking.delivery_fee || demoEnhancement.delivery_fee || 0),
    oneWayFee: Number(booking.one_way_fee || demoEnhancement.one_way_fee || 0),
    addOnsTotal: Number(booking.add_ons_total || demoEnhancement.add_ons_total || 0),
    discount: Number(booking.discount || demoEnhancement.discount || 0),
    longTermDiscount: Number(booking.long_term_discount || demoEnhancement.long_term_discount || 0),
    loyaltyDiscount: Number(booking.loyalty_discount || demoEnhancement.loyalty_discount || 0),
    businessDiscount: Number(booking.business_discount || demoEnhancement.business_discount || 0),
    depositAmount: Number(booking.deposit_amount || demoEnhancement.deposit_amount || 0),
    cancellationFee: Number(booking.cancellation_fee || 0),
    rentalProduct: booking.rental_product || demoEnhancement.rental_product,
    protectionPackage: booking.protection_package || demoEnhancement.protection_package,
    mileagePackageKm: booking.mileage_package_km || demoEnhancement.mileage_package_km,
    selectedAddons: booking.selected_addons || demoEnhancement.selected_addons || [],
    lineItems,
    invoices: booking.invoices || [],
    paymentProvider: payment.provider || "Pending",
    paymentStatus,
    status,
    vehicleDetails: vehicle,
    bookingDetails: {
      _id: booking.id,
      status,
      paymentMethod: payment.provider || "Pending",
      paymentStatus,
      totalPrice: Number(demoEnhancement.total_price || booking.total_price),
      subtotal: Number(booking.subtotal || demoEnhancement.subtotal || 0),
      deliveryFee: Number(booking.delivery_fee || demoEnhancement.delivery_fee || 0),
      oneWayFee: Number(booking.one_way_fee || demoEnhancement.one_way_fee || 0),
      addOnsTotal: Number(booking.add_ons_total || demoEnhancement.add_ons_total || 0),
      discount: Number(booking.discount || demoEnhancement.discount || 0),
      longTermDiscount: Number(booking.long_term_discount || demoEnhancement.long_term_discount || 0),
      loyaltyDiscount: Number(booking.loyalty_discount || demoEnhancement.loyalty_discount || 0),
      businessDiscount: Number(booking.business_discount || demoEnhancement.business_discount || 0),
      depositAmount: Number(booking.deposit_amount || demoEnhancement.deposit_amount || 0),
      cancellationFee: Number(booking.cancellation_fee || 0),
      rentalProduct: booking.rental_product || demoEnhancement.rental_product,
      protectionPackage: booking.protection_package || demoEnhancement.protection_package,
      mileagePackageKm: booking.mileage_package_km || demoEnhancement.mileage_package_km,
      selectedAddons: booking.selected_addons || demoEnhancement.selected_addons || [],
      lineItems,
      pickupDate: pickupAt,
      dropOffDate: dropoffAt,
      pickUpDistrict: booking.pickup_district,
      pickUpLocation: booking.pickup_location,
      dropOffLocation: dropoffLocation,
      contactPhone: booking.contact_phone,
      contactAddress: booking.contact_address,
    },
  };
};

const loadBooking = async (id) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .eq("id", id)
    .single();
  if (error && isMissingFeatureError(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from("bookings")
      .select(legacyBookingSelect)
      .eq("id", id)
      .single();
    if (legacyError) throw legacyError;
    return toAppBooking(legacyData);
  }
  if (error) throw error;
  return toAppBooking(data);
};

const toQuoteInput = (order) => ({
  p_vehicle_id: order.vehicle_id,
  p_pickup_at: new Date(order.pickupDate).toISOString(),
  p_dropoff_at: new Date(order.dropoffDate).toISOString(),
  p_pickup_district: order.pickup_district,
  p_pickup_location: order.pickup_location,
  p_dropoff_location: order.dropoff_location,
  p_coupon_code: order.coupon || null,
  p_add_on_codes: order.addOnCodes || [],
  p_business_account_id: order.businessAccountId || null,
  p_mileage_package_km: order.mileagePackageKm ? Number(order.mileagePackageKm) : null,
  p_protection_package: order.protectionPackage || "standard",
});

export const getRentalAddOns = async () => {
  const { data, error } = await requireSupabase()
    .from("booking_add_ons")
    .select("*")
    .eq("applies_to", "rental")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error && isMissingFeatureError(error)) return demoRentalAddOns;
  if (error) throw error;
  return data || [];
};

export const quoteBooking = async (order) => {
  const { data, error } = await requireSupabase().rpc("quote_booking", toQuoteInput(order));
  if (error && isMissingFeatureError(error)) return quoteBookingForDemo(order);
  if (error) throw error;
  return data;
};

export const createBooking = async (order) => {
  const { data, error } = await requireSupabase().rpc("create_booking", {
    ...toQuoteInput(order),
    p_contact_email: order.email,
    p_contact_phone: order.phoneNumber,
    p_contact_address: order.adress,
    p_payment_method: order.paymentMethod,
  });
  if (error && isMissingFeatureError(error)) {
    const demoQuote = quoteBookingForDemo(order);
    const { data: legacyData, error: legacyError } = await requireSupabase().rpc("create_booking", {
      p_vehicle_id: order.vehicle_id,
      p_pickup_at: new Date(order.pickupDate).toISOString(),
      p_dropoff_at: new Date(order.dropoffDate).toISOString(),
      p_pickup_district: order.pickup_district,
      p_pickup_location: order.pickup_location,
      p_dropoff_location: order.dropoff_location,
      p_contact_email: order.email,
      p_contact_phone: order.phoneNumber,
      p_contact_address: order.adress,
      p_payment_method: order.paymentMethod,
      p_coupon_code: order.coupon || null,
    });
    if (legacyError) throw legacyError;
    writeDemoEnhancement(legacyData.id, {
      ...demoQuote,
      protection_package: order.protectionPackage || "standard",
      mileage_package_km: order.mileagePackageKm ? Number(order.mileagePackageKm) : null,
      selected_addons: order.addOnCodes || [],
    });
    const booking = await loadBooking(legacyData.id);
    publishDemoBooking(booking);
    return booking;
  }
  if (error) throw error;
  const booking = await loadBooking(data.id);
  publishDemoBooking(booking);
  return booking;
};

export const getBookings = async ({ includeHidden = false } = {}) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .order("created_at", { ascending: false });
  if (error && isMissingFeatureError(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from("bookings")
      .select(legacyBookingSelect)
      .order("created_at", { ascending: false });
    if (legacyError) throw legacyError;
    const bookings = (legacyData || []).map(toAppBooking);
    return includeHidden ? bookings : bookings.filter((booking) => !isHiddenDemoBooking(booking._id));
  }
  if (error) throw error;
  const bookings = (data || []).map(toAppBooking);
  return includeHidden ? bookings : bookings.filter((booking) => !isHiddenDemoBooking(booking._id));
};

export const setBookingStatus = async (id, status) => {
  const { error } = await requireSupabase().rpc("set_booking_status", {
    p_booking_id: id,
    p_status: toDatabaseStatus(status),
  });
  if (error) throw error;
  return loadBooking(id);
};

export const cancelBooking = async (id) => {
  const { error } = await requireSupabase().rpc("cancel_own_booking", { p_booking_id: id });
  if (error) throw error;
  return loadBooking(id);
};

export const modifyBooking = async (id, updates) => {
  const { error } = await requireSupabase().rpc("modify_own_booking", {
    p_booking_id: id,
    p_pickup_at: new Date(updates.pickupDate).toISOString(),
    p_dropoff_at: new Date(updates.dropoffDate).toISOString(),
    p_dropoff_location: updates.dropoff_location,
    p_coupon_code: updates.coupon || null,
    p_add_on_codes: updates.addOnCodes || [],
    p_mileage_package_km: updates.mileagePackageKm ? Number(updates.mileagePackageKm) : null,
    p_protection_package: updates.protectionPackage || "standard",
  });
  if (error && isMissingFeatureError(error)) {
    writeDemoBookingOverride(id, {
      pickup_at: new Date(updates.pickupDate).toISOString(),
      dropoff_at: new Date(updates.dropoffDate).toISOString(),
      dropoff_location: updates.dropoff_location,
    });
    return loadBooking(id);
  }
  if (error) throw error;
  return loadBooking(id);
};

export const generateBookingInvoice = async (id) => {
  const { data, error } = await requireSupabase().rpc("generate_booking_invoice", {
    p_booking_id: id,
  });
  if (error && isMissingFeatureError(error)) {
    return {
      id: `demo-invoice-${id}`,
      booking_id: id,
      invoice_number: `RAR-DEMO-${String(id).slice(0, 8).toUpperCase()}`,
      status: "issued",
      issued_at: new Date().toISOString(),
    };
  }
  if (error) throw error;
  return data;
};

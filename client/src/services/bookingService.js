import { requireSupabase } from "../lib/supabase";
import { toAppVehicle } from "./vehicleService";

const bookingSelect = `
  *,
  vehicle:vehicles(*, vehicle_images(id, storage_path, public_url, position)),
  payments(*)
`;

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
  const vehicle = toAppVehicle(booking.vehicle);
  const status = toLegacyStatus(booking.status);

  return {
    ...booking,
    _id: booking.id,
    vehicleId: booking.vehicle_id,
    userId: booking.customer_id,
    pickupDate: booking.pickup_at,
    dropOffDate: booking.dropoff_at,
    pickUpDistrict: booking.pickup_district,
    pickUpLocation: booking.pickup_location,
    dropOffLocation: booking.dropoff_location,
    totalPrice: Number(booking.total_price),
    status,
    vehicleDetails: vehicle,
    bookingDetails: {
      _id: booking.id,
      status,
      paymentMethod: booking.payments?.[0]?.provider || "Pending",
      totalPrice: Number(booking.total_price),
      pickupDate: booking.pickup_at,
      dropOffDate: booking.dropoff_at,
      pickUpDistrict: booking.pickup_district,
      pickUpLocation: booking.pickup_location,
      dropOffLocation: booking.dropoff_location,
      contactPhone: booking.contact_phone,
      contactAddress: booking.contact_address,
    },
  };
};

const loadBooking = async (id) => {
  const { data, error } = await requireSupabase()
    .from("bookings")
    .select(bookingSelect)
    .eq("id", id)
    .single();
  if (error) throw error;
  return toAppBooking(data);
};

export const createBooking = async (order) => {
  const { data, error } = await requireSupabase().rpc("create_booking", {
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
  if (error) throw error;
  return loadBooking(data.id);
};

export const getBookings = async () => {
  const { data, error } = await requireSupabase()
    .from("bookings")
    .select(bookingSelect)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toAppBooking);
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

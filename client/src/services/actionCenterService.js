import { getBookings } from "./bookingService";
import { shouldShowInVendorDashboard } from "./demoOpsService";
import { isBookingPaid, isPaymentSubmitted } from "./notificationService";
import { getPendingVehicles, getVendorVehicles } from "./vehicleService";

const isActiveBooking = (booking = {}) =>
  !["canceled", "cancelled", "tripCompleted", "completed", "notPicked", "rejected"].includes(
    booking.status
  );

const isCustomerBooking = (booking = {}, userId) => !userId || booking.userId === userId;

export const getAdminActionCounts = async () => {
  const [bookings, pendingVehicles] = await Promise.all([
    getBookings().catch(() => []),
    getPendingVehicles().catch(() => []),
  ]);

  const paymentConfirmations = bookings.filter(
    (booking) => isActiveBooking(booking) && isPaymentSubmitted(booking)
  ).length;
  const unpaidBookings = bookings.filter(
    (booking) =>
      isActiveBooking(booking) && !isBookingPaid(booking) && !isPaymentSubmitted(booking)
  ).length;

  return {
    orders: paymentConfirmations + unpaidBookings,
    sales: paymentConfirmations,
    vendorVehicleRequests: pendingVehicles.length,
    notifications: paymentConfirmations + unpaidBookings + pendingVehicles.length,
  };
};

export const getVendorActionCounts = async () => {
  const [bookings, vendorVehicles] = await Promise.all([
    getBookings().catch(() => []),
    getVendorVehicles().catch(() => []),
  ]);

  const vendorBookings = bookings.filter((booking) =>
    shouldShowInVendorDashboard(booking, vendorVehicles)
  );
  const actionableBookings = vendorBookings.filter(isActiveBooking).length;
  const pendingCars = vendorVehicles.filter(
    (vehicle) => !vehicle.isAdminApproved && !vehicle.isRejected && vehicle.isDeleted !== "true"
  ).length;
  const payableSales = vendorBookings.filter(
    (booking) => isActiveBooking(booking) && isBookingPaid(booking)
  ).length;

  return {
    vendorAllVeihcles: pendingCars,
    bookings: actionableBookings,
    sales: payableSales,
    notifications: actionableBookings + pendingCars,
  };
};

export const getCustomerActionCounts = async (userId) => {
  const bookings = await getBookings().catch(() => []);
  const customerBookings = bookings.filter((booking) => isCustomerBooking(booking, userId));
  const activeBookings = customerBookings.filter(isActiveBooking);
  const needsPayment = activeBookings.filter((booking) => !isBookingPaid(booking)).length;

  return {
    orders: needsPayment,
    notifications: activeBookings.length,
  };
};

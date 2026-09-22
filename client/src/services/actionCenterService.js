import { getBookings } from "./bookingService";
import { shouldShowInVendorDashboard } from "./demoOpsService";
import { isBookingPaid, isPaymentSubmitted } from "./notificationService";
import { getVehicleIssueReports } from "./vehicleIssueService";
import { getVehicleChangeRequests } from "./vehicleChangeRequestService";
import { getPendingVehicles, getVendorVehicles } from "./vehicleService";

const isActiveBooking = (booking = {}) =>
  !["canceled", "cancelled", "tripCompleted", "completed", "notPicked", "rejected"].includes(
    booking.status
  );

const isCustomerBooking = (booking = {}, userId) => !userId || booking.userId === userId;

const hasSubmittedPaymentCode = (booking = {}) =>
  Boolean(booking.paymentReference || booking.bookingDetails?.paymentReference);

export const getAdminActionCounts = async () => {
  const [bookings, pendingVehicles, issueReports, changeRequests] = await Promise.all([
    getBookings().catch(() => []),
    getPendingVehicles().catch(() => []),
    getVehicleIssueReports().catch(() => []),
    getVehicleChangeRequests().catch(() => []),
  ]);
  const vehicleIssues = issueReports.filter((report) => report.status === "open");
  const pendingChanges = changeRequests.filter((request) => request.status === "pending");

  const paymentConfirmations = bookings.filter(
    (booking) =>
      isActiveBooking(booking) &&
      (isPaymentSubmitted(booking) || (!isBookingPaid(booking) && hasSubmittedPaymentCode(booking)))
  ).length;

  return {
    orders: paymentConfirmations,
    sales: paymentConfirmations,
    vendorVehicleRequests: pendingVehicles.length,
    allProduct: vehicleIssues.length + pendingChanges.length,
    notifications: paymentConfirmations + pendingVehicles.length + vehicleIssues.length + pendingChanges.length,
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

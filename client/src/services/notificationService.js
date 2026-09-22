const formatWhen = (value) => {
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const vehicleLabel = (booking) =>
  [booking.vehicleDetails?.company, booking.vehicleDetails?.model || booking.vehicleDetails?.name]
    .filter(Boolean)
    .join(" ") || "Vehicle";

const getPaymentLabel = (status) => {
  if (["paid", "succeeded", "completed", "captured"].includes(status)) return "Paid";
  if (["failed", "cancelled", "canceled"].includes(status)) return "Payment issue";
  if (["submitted", "awaiting_confirmation", "under_review"].includes(status)) return "Awaiting admin confirmation";
  return "Payment pending";
};

const formatBookingDate = (value) => {
  if (!value) return "the scheduled time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "the scheduled time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isBookingPaid = (booking) =>
  ["paid", "succeeded", "completed", "captured"].includes(booking.paymentStatus);

export const isPaymentSubmitted = (booking) =>
  ["submitted", "awaiting_confirmation", "under_review"].includes(booking.paymentStatus);

export const getBookingLifecycleLabel = (booking) => {
  if (booking.status === "canceled") return "Canceled";
  if (isBookingPaid(booking)) return "Paid booking";
  if (isPaymentSubmitted(booking)) return "Awaiting admin confirmation";
  return "Booked, payment pending";
};

export const buildBookingNotifications = ({ bookings = [], role = "admin" }) => {
  const notifications = [];

  bookings.forEach((booking) => {
    const vehicle = vehicleLabel(booking);
    const bookingId = String(booking._id || booking.id || "").slice(0, 8).toUpperCase();
    const paymentLabel = getPaymentLabel(booking.paymentStatus);
    const pickupTime = formatBookingDate(booking.pickupDate || booking.bookingDetails?.pickupDate);
    const returnTime = formatBookingDate(booking.dropOffDate || booking.bookingDetails?.dropOffDate);

    if (booking.status === "canceled") {
      notifications.push({
        id: `${booking._id}-cancelled`,
        tone: "danger",
        title: "Booking canceled",
        body:
          role === "vendor"
            ? `${vehicle} booking ${bookingId} was canceled. The car is available for new reservations.`
            : `${vehicle} booking ${bookingId} was canceled and removed from active reservations.`,
        time: formatWhen(booking.cancelled_at || booking.updated_at),
      });
      return;
    }

    if (isPaymentSubmitted(booking)) {
      notifications.push({
        id: `${booking._id}-payment-submitted`,
        tone: "info",
        title: "Payment submitted",
        body:
          role === "customer"
            ? `${vehicle} booking ${bookingId} payment was received for review. Rent a Ride will notify you after admin confirmation.`
            : `${vehicle} booking ${bookingId} payment is waiting for admin confirmation.`,
        time: formatWhen(booking.updated_at || booking.created_at),
      });
    } else if (!isBookingPaid(booking)) {
      notifications.push({
        id: `${booking._id}-payment`,
        tone: "warning",
        title: paymentLabel,
        body:
          role === "customer"
            ? `${vehicle} is reserved, but payment is still pending.`
            : `${vehicle} booking ${bookingId} is reserved but not paid yet.`,
        time: formatWhen(booking.created_at),
      });
    } else {
      notifications.push({
        id: `${booking._id}-paid`,
        tone: "success",
        title: "Payment confirmed",
        body:
          role === "vendor"
            ? `${vehicle} booking ${bookingId} has been paid and is ready for fulfillment.`
            : `${vehicle} booking ${bookingId} payment is confirmed. Pickup is ${pickupTime}; return is ${returnTime}.`,
        time: formatWhen(booking.updated_at || booking.created_at),
      });
    }

    if (booking.updated_at && booking.updated_at !== booking.created_at) {
      notifications.push({
        id: `${booking._id}-updated`,
        tone: "info",
        title: "Booking updated",
        body:
          role === "vendor"
            ? `${vehicle} booking ${bookingId} time or trip details were updated by the customer.`
            : `${vehicle} booking ${bookingId} has updated trip details.`,
        time: formatWhen(booking.updated_at),
      });
    }
  });

  return notifications.slice(0, 6);
};

export const buildVehicleRequestNotifications = ({ vehicles = [] }) =>
  vehicles.slice(0, 6).map((vehicle) => {
    const vehicleName =
      [vehicle.company, vehicle.model || vehicle.name].filter(Boolean).join(" ") ||
      "Vendor vehicle";
    const owner =
      vehicle.ownerProfile?.username ||
      vehicle.owner?.username ||
      vehicle.addedBy ||
      "Vendor account";

    return {
      id: `${vehicle._id || vehicle.id}-vehicle-review`,
      tone: "warning",
      title: "Vendor vehicle awaiting approval",
      body: `${vehicleName} was submitted by ${owner}. Review documents, ownership details, condition, and GPS tracker status before publishing it.`,
      time: formatWhen(vehicle.created_at),
    };
  });

export const buildVehicleIssueNotifications = ({ reports = [] }) =>
  reports
    .filter((report) => report.status === "open")
    .slice(0, 6)
    .map((report) => ({
      id: `${report.id}-vehicle-issue`,
      tone: "warning",
      title: "Vendor vehicle issue reported",
      body: `${report.vehicleName} was reported by ${report.vendorName}. ${report.reason}. ${report.note || "Open Fleet to update, hide, delete, or mark it attended."}`,
      time: formatWhen(report.createdAt),
    }));

const readKey = (role) => `rent_a_ride_read_notifications_${role}`;

export const getReadNotificationIds = (role = "admin") => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(readKey(role)) || "[]");
  } catch {
    return [];
  }
};

export const markNotificationsRead = (role = "admin", ids = []) => {
  if (typeof window === "undefined") return [];
  const current = new Set(getReadNotificationIds(role));
  ids.forEach((id) => current.add(id));
  const next = [...current];
  window.localStorage.setItem(readKey(role), JSON.stringify(next));
  window.dispatchEvent(new Event("rent-a-ride-notifications-read"));
  return next;
};

export const clearAllNotificationReadState = () => {
  if (typeof window === "undefined") return;
  ["admin", "vendor", "customer"].forEach((role) => {
    window.localStorage.removeItem(readKey(role));
  });
  window.dispatchEvent(new Event("rent-a-ride-notifications-read"));
};

export const withReadState = (notifications = [], role = "admin") => {
  const readIds = new Set(getReadNotificationIds(role));
  return notifications.map((notification) => ({
    ...notification,
    isRead: readIds.has(notification.id),
  }));
};

export const getUnreadNotifications = (notifications = [], role = "admin") =>
  withReadState(notifications, role).filter((notification) => !notification.isRead);

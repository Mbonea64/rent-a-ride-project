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
  return "Payment pending";
};

export const isBookingPaid = (booking) =>
  ["paid", "succeeded", "completed", "captured"].includes(booking.paymentStatus);

export const getBookingLifecycleLabel = (booking) => {
  if (booking.status === "canceled") return "Canceled";
  if (isBookingPaid(booking)) return "Paid booking";
  return "Booked, payment pending";
};

export const buildBookingNotifications = ({ bookings = [], role = "admin" }) => {
  const notifications = [];

  bookings.forEach((booking) => {
    const vehicle = vehicleLabel(booking);
    const bookingId = String(booking._id || booking.id || "").slice(0, 8).toUpperCase();
    const paymentLabel = getPaymentLabel(booking.paymentStatus);

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

    if (!isBookingPaid(booking)) {
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
            : `${vehicle} booking ${bookingId} payment is confirmed.`,
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

export const withReadState = (notifications = [], role = "admin") => {
  const readIds = new Set(getReadNotificationIds(role));
  return notifications.map((notification) => ({
    ...notification,
    isRead: readIds.has(notification.id),
  }));
};

export const getUnreadNotifications = (notifications = [], role = "admin") =>
  withReadState(notifications, role).filter((notification) => !notification.isRead);

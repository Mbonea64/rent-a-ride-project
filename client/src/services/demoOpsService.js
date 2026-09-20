const CHANNEL_KEY = "rent_a_ride_demo_ops_channel";

export const demoVendors = [
  {
    id: "rent-a-ride",
    name: "Rent a Ride Owned Fleet",
    serviceArea: "Company managed vehicles",
    contact: "Rent a Ride operations",
    isCompanyFleet: true,
  },
  {
    id: "vendor-a",
    name: "Vendor A - City Fleet",
    serviceArea: "Dar es Salaam Central",
    contact: "+255 711 000 101",
  },
  {
    id: "vendor-b",
    name: "Vendor B - Airport Fleet",
    serviceArea: "Airport and Coastal Routes",
    contact: "+255 711 000 202",
  },
  {
    id: "vendor-c",
    name: "Vendor C - Premium Fleet",
    serviceArea: "Executive and Long-term Rentals",
    contact: "+255 711 000 303",
  },
];

const readChannel = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHANNEL_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeChannel = (value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHANNEL_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("rent-a-ride-demo-ops"));
};

const hashText = (value) =>
  String(value || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

export const getDemoVendorForVehicle = (vehicle = {}) => {
  if (vehicle.addedBy && !vehicle.isAdminAdded) {
    return {
      id: vehicle.addedBy,
      name: "Logged-in Vendor Fleet",
      serviceArea: vehicle.district || "Vendor service area",
      contact: "Vendor account",
      isRealOwner: true,
    };
  }

  if (vehicle.isAdminAdded || !vehicle.addedBy) {
    return demoVendors[0];
  }

  const key = `${vehicle.company || ""}${vehicle.model || ""}${vehicle._id || vehicle.id || ""}`;
  const partnerVendors = demoVendors.filter((vendor) => !vendor.isCompanyFleet);
  return partnerVendors[hashText(key) % partnerVendors.length] || demoVendors[0];
};

export const getDemoVendorForBooking = (booking = {}) =>
  getDemoVendorForVehicle(booking.vehicleDetails || booking.vehicle || {});

export const publishDemoBooking = (booking) => {
  if (!booking?._id && !booking?.id) return;
  const id = booking._id || booking.id;
  const current = readChannel();
  const vendor = getDemoVendorForBooking(booking);
  writeChannel({
    ...current,
    [id]: {
      bookingId: id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      updatedAt: new Date().toISOString(),
    },
  });
};

export const subscribeDemoOps = (callback) => {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback(readChannel());
  window.addEventListener("storage", handler);
  window.addEventListener("rent-a-ride-demo-ops", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("rent-a-ride-demo-ops", handler);
  };
};

const getBookingDates = (booking = {}) => {
  const details = booking.bookingDetails || booking;
  return {
    pickupDate: new Date(details.pickupDate || booking.pickupDate || Date.now()),
    dropoffDate: new Date(details.dropOffDate || booking.dropOffDate || Date.now()),
  };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTripProgress = (booking) => {
  const { pickupDate, dropoffDate } = getBookingDates(booking);
  const duration = dropoffDate.getTime() - pickupDate.getTime();
  if (!Number.isFinite(duration) || duration <= 0) return 46;
  return Math.round(clamp(((Date.now() - pickupDate.getTime()) / duration) * 100, 8, 96));
};

const getMinutesUntilDropoff = (booking) => {
  const { dropoffDate } = getBookingDates(booking);
  return Math.round((dropoffDate.getTime() - Date.now()) / 60000);
};

export const buildDemoTrip = (booking) => {
  const details = booking.bookingDetails || booking;
  const vendor = getDemoVendorForBooking(booking);
  const progress = getTripProgress(booking);
  const minutesLeft = getMinutesUntilDropoff(booking);
  const status = details.status || booking.status || "booked";
  const isActive = ["booked", "onTrip", "overDue", "active", "confirmed"].includes(status);
  const approachingDeadline = isActive && minutesLeft <= 120 && minutesLeft > 0;
  const deadlineBreached = isActive && minutesLeft <= 0;
  const outsideBoundary = isActive && progress >= 78;
  const vehicleName = [booking.vehicleDetails?.company, booking.vehicleDetails?.model || booking.vehicleDetails?.name]
    .filter(Boolean)
    .join(" ");

  return {
    id: booking._id || booking.id || details._id,
    vendor,
    vehicleName: vehicleName || "Booked vehicle",
    customer: details.contactPhone || "Customer",
    pickupLocation: details.pickUpLocation || booking.pickUpLocation || "Pickup point",
    dropoffLocation: details.dropOffLocation || booking.dropOffLocation || "Drop-off point",
    status,
    progress,
    minutesLeft,
    approachingDeadline,
    deadlineBreached,
    outsideBoundary,
  };
};

export const buildDemoTrips = (bookings = []) => bookings.map(buildDemoTrip);

export const getCompanyMessageForTrip = (trip) => {
  if (trip.deadlineBreached) {
    return `Rent a Ride: Your ${trip.vehicleName} return time has passed. Please return the car or contact Rent a Ride support immediately.`;
  }
  if (trip.approachingDeadline) {
    return `Rent a Ride: Your ${trip.vehicleName} booking is due in about ${Math.max(trip.minutesLeft, 1)} minutes. Please prepare for return or request an extension.`;
  }
  if (trip.outsideBoundary) {
    return `Rent a Ride: We noticed your ${trip.vehicleName} trip is close to the allowed travel boundary. Rent a Ride support is monitoring it.`;
  }
  return `Rent a Ride: Your ${trip.vehicleName} booking is active. We will notify you before the deadline or if route support is needed.`;
};

export const shouldShowInVendorDashboard = (booking, vendorVehicles = []) => {
  const realVehicleIds = vendorVehicles.map((vehicle) => vehicle._id || vehicle.id);
  return realVehicleIds.includes(booking.vehicleId);
};

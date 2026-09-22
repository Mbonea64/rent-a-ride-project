import { supabase } from "../lib/supabase";
import { getDemoNow } from "./demoTimeService";

const companyNotificationKey = "rent_a_ride_company_notification_settings";
const companyDispatchLogKey = "rent_a_ride_company_dispatch_log";

const defaultSettings = {
  companyName: "Rent a Ride",
  whatsappSender: "Rent a Ride Notify",
  emailSender: "notifications@rentaride.example",
  supportPhone: "+255 700 111 222",
  supportEmail: "support@rentaride.example",
  pickupReminderMinutes: 60,
  returnReminderMinutes: 90,
};

const assignedDrivers = [
  { name: "Rent a Ride Driver A", phone: "+255 712 450 101" },
  { name: "Rent a Ride Driver B", phone: "+255 713 450 202" },
  { name: "Rent a Ride Driver C", phone: "+255 714 450 303" },
];

export const getCompanyNotificationSettings = () => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    return {
      ...defaultSettings,
      ...JSON.parse(window.localStorage.getItem(companyNotificationKey) || "{}"),
    };
  } catch {
    return defaultSettings;
  }
};

export const saveCompanyNotificationSettings = (settings) => {
  if (typeof window === "undefined") return defaultSettings;
  const next = {
    ...getCompanyNotificationSettings(),
    ...settings,
  };
  window.localStorage.setItem(companyNotificationKey, JSON.stringify(next));
  window.dispatchEvent(new Event("rent-a-ride-company-settings-updated"));
  return next;
};

const minutesUntil = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date.getTime() - getDemoNow()) / 60000);
};

const vehicleName = (booking) =>
  [booking.vehicleDetails?.company, booking.vehicleDetails?.model || booking.vehicleDetails?.name]
    .filter(Boolean)
    .join(" ") || "your rental car";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "the scheduled time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const bookingSeed = (booking = {}) =>
  String(booking._id || booking.id || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const hasAddOn = (booking = {}, code) =>
  (booking.lineItems || booking.bookingDetails?.lineItems || []).some((item) => item.code === code) ||
  (booking.selectedAddons || booking.bookingDetails?.selectedAddons || []).includes(code);

const getAssignedDriver = (booking = {}) => assignedDrivers[bookingSeed(booking) % assignedDrivers.length];

const getDriverNote = (booking = {}) => {
  const needsDriver = hasAddOn(booking, "company_driver") || hasAddOn(booking, "vehicle_delivery");
  if (!needsDriver) return null;
  const driver = getAssignedDriver(booking);
  return {
    driver,
    text: `Assigned Rent a Ride driver: ${driver.name}, ${driver.phone}.`,
  };
};

const getRecipient = (booking, channel) => {
  if (channel === "Email") {
    return booking.bookingDetails?.contactEmail || booking.contact_email || "";
  }
  return booking.bookingDetails?.contactPhone || booking.contact_phone || "customer phone";
};

export const getCompanyDispatchLog = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(companyDispatchLogKey) || "[]");
  } catch {
    return [];
  }
};

const saveCompanyDispatchLog = (items = []) => {
  if (typeof window === "undefined") return items;
  window.localStorage.setItem(companyDispatchLogKey, JSON.stringify(items.slice(0, 50)));
  window.dispatchEvent(new Event("rent-a-ride-company-message-sent"));
  return items;
};

export const clearCompanyDispatchLog = () => {
  if (typeof window === "undefined") return [];
  window.localStorage.removeItem(companyDispatchLogKey);
  window.dispatchEvent(new Event("rent-a-ride-company-message-sent"));
  return [];
};

const sendWhatsAppMessage = async ({ to, body }) => {
  if (!supabase) {
    return {
      delivered: false,
      mode: "demo",
      error: "Supabase is not configured in this frontend",
    };
  }

  const { data, error } = await supabase.functions.invoke("send-whatsapp", {
    body: { to, body },
  });

  if (error) {
    return {
      delivered: false,
      mode: "edge_function_error",
      error: error.message || "Could not invoke WhatsApp function",
    };
  }

  return data || { delivered: false, mode: "unknown" };
};

const getWhatsAppDispatchStatus = (result = {}) => {
  if (result.delivered) return "sent";
  if (result.mode === "not_configured") return "not configured";
  if (result.error) return "failed";
  return "queued";
};

const sendEmailMessage = async ({ to, subject, html, text }) => {
  if (!to) {
    return {
      delivered: false,
      mode: "missing_recipient",
      error: "Customer email is missing",
    };
  }

  if (!supabase) {
    return {
      delivered: false,
      mode: "demo",
      error: "Supabase is not configured in this frontend",
    };
  }

  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html, text },
  });

  if (error) {
    return {
      delivered: false,
      mode: "edge_function_error",
      error: error.message || "Could not invoke email function",
    };
  }

  return data || { delivered: false, mode: "unknown" };
};

const getEmailDispatchStatus = (result = {}) => {
  if (result.delivered) return "sent";
  if (["not_configured", "missing_recipient", "demo"].includes(result.mode)) return "not configured";
  if (result.error) return "failed";
  return "queued";
};

const getEmailProviderNote = (result = {}) => {
  if (result.delivered && result.mode === "brevo") return "Brevo accepted the email";
  return result.warning || result.error || result.mode || "sent";
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const dispatchPaymentConfirmationMessages = async (booking) => {
  const settings = getCompanyNotificationSettings();
  const bookingId = String(booking._id || booking.id || "").slice(0, 8).toUpperCase();
  const pickupTime = formatDateTime(booking.pickupDate || booking.bookingDetails?.pickupDate);
  const returnTime = formatDateTime(booking.dropOffDate || booking.bookingDetails?.dropOffDate);
  const carName = vehicleName(booking);
  const driverNote = getDriverNote(booking);
  const supportLine = `For pickup guidance, vehicle handover, or any concern, contact ${settings.companyName} support on ${settings.supportPhone} or ${settings.supportEmail}.`;
  const body = `${settings.companyName}: Payment confirmed for ${vehicleName(booking)} booking ${bookingId}. Pickup is ${pickupTime}; return is ${returnTime}. ${driverNote ? `${driverNote.text} ` : ""}${supportLine}`;
  const emailSubject = `${settings.companyName} payment confirmed`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #14213d; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Payment confirmed</h2>
      <p>Your payment for <strong>${escapeHtml(carName)}</strong> has been confirmed.</p>
      <p><strong>Booking:</strong> ${escapeHtml(bookingId)}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(pickupTime)}</p>
      <p><strong>Return:</strong> ${escapeHtml(returnTime)}</p>
      ${
        driverNote
          ? `<p><strong>Assigned driver:</strong> ${escapeHtml(driverNote.driver.name)} — ${escapeHtml(driverNote.driver.phone)}</p>`
          : ""
      }
      <p>${escapeHtml(supportLine)}</p>
      <p>Thank you for choosing ${escapeHtml(settings.companyName)}.</p>
    </div>
  `;
  const createdAt = new Date().toISOString();
  const whatsappRecipient = getRecipient(booking, "WhatsApp");
  const emailRecipient = getRecipient(booking, "Email");
  const whatsappResult = await sendWhatsAppMessage({
    to: whatsappRecipient,
    body,
  });
  const emailResult = await sendEmailMessage({
    to: emailRecipient,
    subject: emailSubject,
    html: emailHtml,
    text: body,
  });
  const vendorEmail = booking.vehicleDetails?.ownerProfile?.email || "";
  const isVendorFleet = booking.vehicleDetails?.addedBy && !booking.vehicleDetails?.isAdminAdded;
  const vendorSubject = `${settings.companyName}: Your vehicle has been rented`;
  const vendorBody = `${settings.companyName}: Payment has been confirmed for ${carName} booking ${bookingId}. Pickup is ${pickupTime}; return is ${returnTime}. Please check your vendor dashboard for full booking details. For questions or concerns, contact ${settings.companyName} support on ${settings.supportPhone} or ${settings.supportEmail}.`;
  const vendorEmailResult = isVendorFleet
    ? await sendEmailMessage({
        to: vendorEmail,
        subject: vendorSubject,
        html: `
          <div style="font-family: Arial, sans-serif; color: #14213d; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Vehicle rented</h2>
            <p>Your vehicle <strong>${escapeHtml(carName)}</strong> has a confirmed paid booking.</p>
            <p><strong>Booking:</strong> ${escapeHtml(bookingId)}</p>
            <p><strong>Pickup:</strong> ${escapeHtml(pickupTime)}</p>
            <p><strong>Return:</strong> ${escapeHtml(returnTime)}</p>
            <p>Please check your vendor dashboard for further details.</p>
            <p>For questions or concerns, contact ${escapeHtml(settings.companyName)} support on ${escapeHtml(settings.supportPhone)} or ${escapeHtml(settings.supportEmail)}.</p>
          </div>
        `,
        text: vendorBody,
      })
    : null;
  const dispatches = [
    {
      id: `${bookingId}-whatsapp-${createdAt}`,
      bookingId,
      channel: "WhatsApp",
      status: getWhatsAppDispatchStatus(whatsappResult),
      sender: settings.whatsappSender,
      recipient: whatsappRecipient,
      title: whatsappResult.delivered ? "WhatsApp confirmation sent" : "WhatsApp confirmation pending",
      body,
      providerMessageId: whatsappResult.messageId || null,
      providerNote: whatsappResult.warning || whatsappResult.error || whatsappResult.mode || "sent",
      createdAt,
    },
    {
      id: `${bookingId}-email-${createdAt}`,
      bookingId,
      channel: "Email",
      status: getEmailDispatchStatus(emailResult),
      sender: settings.emailSender,
      recipient: emailRecipient || "Customer email missing",
      title: emailResult.delivered ? "Brevo email confirmation sent" : "Brevo email confirmation pending",
      body,
      providerMessageId: emailResult.messageId || null,
      providerNote: getEmailProviderNote(emailResult),
      createdAt,
    },
    ...(isVendorFleet
      ? [
          {
            id: `${bookingId}-vendor-email-${createdAt}`,
            bookingId,
            channel: "Email",
            status: getEmailDispatchStatus(vendorEmailResult),
            sender: settings.emailSender,
            recipient: vendorEmail || "Vendor email missing",
            title: vendorEmailResult?.delivered ? "Vendor booking email sent" : "Vendor booking email pending",
            body: vendorBody,
            providerMessageId: vendorEmailResult?.messageId || null,
            providerNote: getEmailProviderNote(vendorEmailResult || {}),
            createdAt,
          },
        ]
      : []),
  ];
  saveCompanyDispatchLog([...dispatches, ...getCompanyDispatchLog()]);
  return dispatches;
};

export const buildAutomatedCustomerMessages = (bookings = []) => {
  const settings = getCompanyNotificationSettings();

  return bookings.flatMap((booking) => {
    if (["canceled", "tripCompleted"].includes(booking.status)) return [];

    const pickupMinutes = minutesUntil(booking.pickupDate);
    const returnMinutes = minutesUntil(booking.dropOffDate);
    const messages = [];

    if (pickupMinutes !== null && pickupMinutes <= settings.pickupReminderMinutes && pickupMinutes >= -15) {
      messages.push({
        id: `${booking._id}-pickup-reminder`,
        channel: "WhatsApp + Email",
        title: "Pickup reminder",
        recipient: booking.bookingDetails?.contactPhone || booking.contact_phone || "Customer contact",
        body: `${settings.companyName}: Your ${vehicleName(booking)} is scheduled for pickup at ${booking.pickUpLocation}. Please be ready with your ID and payment confirmation.`,
      });
    }

    if (returnMinutes !== null && returnMinutes <= settings.returnReminderMinutes && returnMinutes >= -30) {
      messages.push({
        id: `${booking._id}-return-reminder`,
        channel: "WhatsApp + Email",
        title: "Return reminder",
        recipient: booking.bookingDetails?.contactPhone || booking.contact_phone || "Customer contact",
        body: `${settings.companyName}: Your ${vehicleName(booking)} is due for return at ${booking.dropOffLocation}. Please return it on time or request support.`,
      });
    }

    return messages;
  });
};

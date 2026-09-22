import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import NotificationWidget from "./NotificationWidget";
import CompanyNotificationSettings from "./CompanyNotificationSettings";
import { getBookings } from "../services/bookingService";
import { buildAutomatedCustomerMessages, getCompanyDispatchLog } from "../services/companyNotificationService";
import { shouldShowInVendorDashboard } from "../services/demoOpsService";
import { getPendingVehicles, getVendorVehicles } from "../services/vehicleService";
import {
  buildVehicleIssueNotifications,
  buildVehicleRequestNotifications,
} from "../services/notificationService";
import { getVehicleIssueReports } from "../services/vehicleIssueService";

const dispatchTone = (status = "") => {
  if (status === "sent") return "bg-emerald-50 border-emerald-100 text-emerald-950";
  if (status === "not configured") return "bg-amber-50 border-amber-100 text-amber-950";
  if (status === "failed") return "bg-red-50 border-red-100 text-red-950";
  return "bg-sky-50 border-sky-100 text-sky-950";
};

const dispatchBadgeTone = (status = "") => {
  if (status === "sent") return "bg-white text-emerald-700";
  if (status === "not configured") return "bg-white text-amber-700";
  if (status === "failed") return "bg-white text-red-700";
  return "bg-white text-sky-700";
};

const deliveryLabel = (status = "") => {
  if (status === "sent") return "Delivered";
  if (status === "not configured") return "Setup needed";
  if (status === "failed") return "Needs attention";
  return "Pending delivery";
};

const deliveryNote = (message = {}) => {
  if (message.status === "sent" && String(message.providerNote || "").includes("Demo mode")) {
    return "Demo delivery routed to the presentation inbox.";
  }
  if (message.status === "sent") return "Customer communication accepted.";
  if (message.status === "not configured") return "Connect this channel before sending real customer messages.";
  if (message.status === "failed") return "Delivery needs attention before recording.";
  return "Waiting for delivery confirmation.";
};

const NotificationsPage = ({ role = "customer" }) => {
  const [bookings, setBookings] = useState([]);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [pendingVehicleRequests, setPendingVehicleRequests] = useState([]);
  const [vehicleIssueReports, setVehicleIssueReports] = useState([]);
  const [dispatchLog, setDispatchLog] = useState(getCompanyDispatchLog());

  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([
        getBookings().catch(() => []),
        role === "vendor" ? getVendorVehicles().catch(() => []) : Promise.resolve([]),
        role === "admin" ? getPendingVehicles().catch(() => []) : Promise.resolve([]),
      ]).then(async ([bookingData, vehicleData, pendingVehicles]) => {
        if (!active) return;
        setBookings(bookingData || []);
        setVendorVehicles(vehicleData || []);
        setPendingVehicleRequests(pendingVehicles || []);
        setVehicleIssueReports(role === "admin" ? await getVehicleIssueReports().catch(() => []) : []);
        setDispatchLog(getCompanyDispatchLog());
      });
    load();
    const refreshDispatchLog = () => setDispatchLog(getCompanyDispatchLog());
    window.addEventListener("storage", load);
    window.addEventListener("rent-a-ride-payment-updated", load);
    window.addEventListener("rent-a-ride-bookings-updated", load);
    window.addEventListener("rent-a-ride-vehicle-requests-updated", load);
    window.addEventListener("rent-a-ride-vehicle-issues-updated", load);
    window.addEventListener("rent-a-ride-demo-clock-updated", load);
    window.addEventListener("rent-a-ride-demo-reset", load);
    window.addEventListener("rent-a-ride-company-message-sent", refreshDispatchLog);
    return () => {
      active = false;
      window.removeEventListener("storage", load);
      window.removeEventListener("rent-a-ride-payment-updated", load);
      window.removeEventListener("rent-a-ride-bookings-updated", load);
      window.removeEventListener("rent-a-ride-vehicle-requests-updated", load);
      window.removeEventListener("rent-a-ride-vehicle-issues-updated", load);
      window.removeEventListener("rent-a-ride-demo-clock-updated", load);
      window.removeEventListener("rent-a-ride-demo-reset", load);
      window.removeEventListener("rent-a-ride-company-message-sent", refreshDispatchLog);
    };
  }, [role]);

  const scopedBookings = useMemo(() => {
    if (role !== "vendor") return bookings;
    return bookings.filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles));
  }, [bookings, role, vendorVehicles]);

  const automatedMessages = useMemo(
    () => buildAutomatedCustomerMessages(scopedBookings),
    [scopedBookings]
  );

  const extraNotifications = useMemo(
    () =>
      role === "admin"
        ? [
            ...buildVehicleRequestNotifications({ vehicles: pendingVehicleRequests }),
            ...buildVehicleIssueNotifications({ reports: vehicleIssueReports }),
          ]
        : [],
    [pendingVehicleRequests, vehicleIssueReports, role]
  );

  return (
    <div className="mt-6 w-full max-w-none">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts</p>
        <h1 className="text-3xl font-semibold text-slate-950">Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Booking, payment, cancellation, and schedule updates that need attention.
        </p>
      </div>
      {role === "admin" && <CompanyNotificationSettings />}
      <NotificationWidget
        bookings={scopedBookings}
        extraNotifications={extraNotifications}
        role={role}
        title="Current notifications"
      />
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer messaging</p>
          <h2 className="text-3xl font-semibold text-slate-950">Customer communication log</h2>
          <p className="mt-2 text-base text-slate-600">
            Payment confirmations and scheduled customer reminders appear here under the Rent a Ride brand.
          </p>
        </div>
        {dispatchLog.length > 0 && (
          <div className="mb-5 grid gap-3 xl:grid-cols-2">
            {dispatchLog.slice(0, 6).map((message) => (
              <article className={`rounded-lg border p-6 ${dispatchTone(message.status)}`} key={message.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{message.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dispatchBadgeTone(message.status)}`}>
                    {message.channel} {deliveryLabel(message.status)}
                  </span>
                </div>
                <p className="text-sm opacity-80">From: {message.sender}</p>
                <p className="text-sm opacity-80">To: {message.recipient}</p>
                <p className="text-sm opacity-80">Status: {deliveryNote(message)}</p>
                <p className="mt-3 text-lg leading-8">{message.body}</p>
              </article>
            ))}
          </div>
        )}
        {automatedMessages.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-6 text-base text-slate-600">
            No customer reminders are due right now. New pickup, return, and payment alerts will appear during the demo flow.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {automatedMessages.map((message) => (
              <article className="rounded-lg border border-slate-100 p-6" key={message.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-950">{message.title}</h3>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {message.channel}
                  </span>
                </div>
                <p className="text-sm text-slate-500">To: {message.recipient}</p>
                <p className="mt-2 text-base leading-7 text-slate-700">{message.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

NotificationsPage.propTypes = {
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
};

export default NotificationsPage;

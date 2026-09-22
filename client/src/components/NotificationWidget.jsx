import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle, FiClock, FiInfo, FiXCircle } from "react-icons/fi";
import {
  buildBookingNotifications,
  markNotificationsRead,
  withReadState,
} from "../services/notificationService";

const toneClasses = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-sky-50 text-sky-700",
};

const toneIcons = {
  danger: <FiXCircle />,
  warning: <FiClock />,
  success: <FiCheckCircle />,
  info: <FiInfo />,
};

const NotificationWidget = ({
  bookings = [],
  extraNotifications = [],
  role = "admin",
  title = "Notifications",
}) => {
  const [version, setVersion] = useState(0);
  const notifications = useMemo(
    () =>
      withReadState(
        [...extraNotifications, ...buildBookingNotifications({ bookings, role })],
        role
      ),
    [bookings, extraNotifications, role, version]
  );
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markRead = (ids) => {
    markNotificationsRead(role, ids);
    setVersion((current) => current + 1);
  };

  return (
    <section className="w-full rounded-[28px] border border-slate-200 bg-slate-100 p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notification center</p>
          <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl text-white">
          <FiBell />
        </span>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-base shadow-sm">
        <span className="font-medium text-slate-700">
          {unreadCount ? `${unreadCount} unread` : "All caught up"}
        </span>
        {unreadCount > 0 && (
          <button
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => markRead(notifications.map((notification) => notification.id))}
            type="button"
          >
            <FiCheck />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-base text-slate-600 shadow-sm">
          No current notifications.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              className={`rounded-3xl bg-white p-5 shadow-sm transition ${
                notification.isRead ? "opacity-70" : "ring-2 ring-red-100"
              }`}
              key={notification.id}
            >
              <div className="flex gap-3">
                <span
                  className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${
                    toneClasses[notification.tone] || toneClasses.info
                  }`}
                >
                  {toneIcons[notification.tone] || toneIcons.info}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-red-500" />}
                        <h3 className="text-lg font-semibold text-slate-950">{notification.title}</h3>
                      </div>
                      <p className="mt-2 text-base leading-7 text-slate-600">{notification.body}</p>
                    </div>
                    <span className="shrink-0 text-sm text-slate-400">{notification.time}</span>
                  </div>
                  {!notification.isRead && (
                    <button
                      className="mt-4 text-sm font-semibold text-slate-950 underline underline-offset-4"
                      onClick={() => markRead([notification.id])}
                      type="button"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

NotificationWidget.propTypes = {
  bookings: PropTypes.array,
  extraNotifications: PropTypes.array,
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
  title: PropTypes.string,
};

export default NotificationWidget;

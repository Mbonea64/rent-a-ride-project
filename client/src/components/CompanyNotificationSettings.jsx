import { useEffect, useState } from "react";
import {
  getCompanyNotificationSettings,
  saveCompanyNotificationSettings,
} from "../services/companyNotificationService";

const CompanyNotificationSettings = () => {
  const [settings, setSettings] = useState(getCompanyNotificationSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onUpdate = () => setSettings(getCompanyNotificationSettings());
    window.addEventListener("rent-a-ride-company-settings-updated", onUpdate);
    return () => window.removeEventListener("rent-a-ride-company-settings-updated", onUpdate);
  }, []);

  const handleSave = () => {
    saveCompanyNotificationSettings({
      ...settings,
      pickupReminderMinutes: Number(settings.pickupReminderMinutes),
      returnReminderMinutes: Number(settings.returnReminderMinutes),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Automated messaging</p>
        <h2 className="text-xl font-semibold text-slate-950">Company notification identity</h2>
        <p className="mt-1 text-sm text-slate-600">
          Email confirmations are delivered through Brevo using the sender configured in Supabase.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Company name
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
            value={settings.companyName}
            onChange={(event) => setSettings((current) => ({ ...current, companyName: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          WhatsApp sender name
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
            value={settings.whatsappSender}
            onChange={(event) => setSettings((current) => ({ ...current, whatsappSender: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email sender
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
            value={settings.emailSender}
            onChange={(event) => setSettings((current) => ({ ...current, emailSender: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Support phone
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
            value={settings.supportPhone}
            onChange={(event) => setSettings((current) => ({ ...current, supportPhone: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Support email
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
            value={settings.supportEmail}
            onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Pickup reminder minutes
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
              min="5"
              type="number"
              value={settings.pickupReminderMinutes}
              onChange={(event) => setSettings((current) => ({ ...current, pickupReminderMinutes: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Return reminder minutes
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
              min="5"
              type="number"
              value={settings.returnReminderMinutes}
              onChange={(event) => setSettings((current) => ({ ...current, returnReminderMinutes: event.target.value }))}
            />
          </label>
        </div>
      </div>
      <button
        className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        onClick={handleSave}
        type="button"
      >
        {saved ? "Saved" : "Save notification settings"}
      </button>
    </section>
  );
};

export default CompanyNotificationSettings;

import { requireSupabase } from "../lib/supabase";

const vehicleIssueReportsKey = "rent_a_ride_vehicle_issue_reports";

const isMissingFeatureError = (error) => {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return (
    ["pgrst205", "42p01"].includes(error?.code) ||
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
};

const emitVehicleIssueUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("rent-a-ride-vehicle-issues-updated"));
};

const readLocalReports = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(vehicleIssueReportsKey) || "[]");
  } catch {
    return [];
  }
};

const saveLocalReports = (reports = []) => {
  if (typeof window === "undefined") return reports;
  window.localStorage.setItem(vehicleIssueReportsKey, JSON.stringify(reports));
  emitVehicleIssueUpdate();
  return reports;
};

const toAppReport = (report = {}) => ({
  id: report.id,
  vehicleId: report.vehicle_id || report.vehicleId,
  vehicleName:
    report.vehicleName ||
    [report.vehicle?.company, report.vehicle?.model || report.vehicle?.name].filter(Boolean).join(" ") ||
    "Vendor vehicle",
  registrationNumber: report.registrationNumber || report.vehicle?.registration_number || "",
  vendorName: report.vendorName || report.vendor?.username || "Vendor",
  reason: report.reason,
  note: report.note,
  status: report.status,
  createdAt: report.created_at || report.createdAt,
  resolvedAt: report.resolved_at || report.resolvedAt,
});

export const getVehicleIssueReports = async () => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("vehicle_issue_reports")
    .select(`
      *,
      vehicle:vehicles(id, company, model, name, registration_number),
      vendor:profiles!vehicle_issue_reports_vendor_id_fkey(id, username)
    `)
    .order("created_at", { ascending: false });
  if (error && isMissingFeatureError(error)) return readLocalReports();
  if (error) throw error;
  return (data || []).map(toAppReport);
};

export const reportVehicleIssue = async ({ vehicle, reason, note }) => {
  const vehicleId = vehicle?._id || vehicle?.id;
  const {
    data: { user },
    error: authError,
  } = await requireSupabase().auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in as vendor to report this vehicle.");

  const { data, error } = await requireSupabase()
    .from("vehicle_issue_reports")
    .insert({
      vehicle_id: vehicleId,
      vendor_id: user.id,
      reason: reason || "Vehicle availability issue",
      note: note || "",
    })
    .select(`
      *,
      vehicle:vehicles(id, company, model, name, registration_number),
      vendor:profiles!vehicle_issue_reports_vendor_id_fkey(id, username)
    `)
    .single();

  if (error && isMissingFeatureError(error)) {
    const vehicleName =
      [vehicle?.company, vehicle?.model || vehicle?.name].filter(Boolean).join(" ") ||
      "Vendor vehicle";
    const report = {
      id: `${vehicleId || "vehicle"}-${Date.now()}`,
      vehicleId,
      vehicleName,
      registrationNumber: vehicle?.registeration_number || vehicle?.registration_number || "",
      vendorName: vehicle?.ownerProfile?.username || "Vendor",
      reason: reason || "Vehicle availability issue",
      note: note || "",
      status: "open",
      createdAt: new Date().toISOString(),
    };
    saveLocalReports([report, ...readLocalReports()]);
    return report;
  }
  if (error) throw error;
  emitVehicleIssueUpdate();
  return toAppReport(data);
};

export const resolveVehicleIssueReport = async (reportId) => {
  const { error } = await requireSupabase()
    .from("vehicle_issue_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error && isMissingFeatureError(error)) {
    return saveLocalReports(
      readLocalReports().map((report) =>
        report.id === reportId
          ? { ...report, status: "resolved", resolvedAt: new Date().toISOString() }
          : report
      )
    );
  }
  if (error) throw error;
  emitVehicleIssueUpdate();
  return getVehicleIssueReports();
};

export const clearVehicleIssueReports = async () => {
  saveLocalReports([]);
  emitVehicleIssueUpdate();
};

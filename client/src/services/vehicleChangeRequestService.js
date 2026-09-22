import { requireSupabase } from "../lib/supabase";
import { updateVehicle } from "./vehicleService";

const isMissingFeatureError = (error) => {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return (
    ["pgrst205", "42p01"].includes(error?.code) ||
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
};

const emitChangeRequestUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("rent-a-ride-vehicle-change-requests-updated"));
};

const toAppChangeRequest = (request = {}) => ({
  id: request.id,
  vehicleId: request.vehicle_id,
  vendorId: request.vendor_id,
  proposedChanges: request.proposed_changes || {},
  status: request.status,
  adminNote: request.admin_note,
  createdAt: request.created_at,
  reviewedAt: request.reviewed_at,
  vehicle: request.vehicle,
  vendor: request.vendor,
});

export const getVehicleChangeRequests = async () => {
  const { data, error } = await requireSupabase()
    .from("vehicle_change_requests")
    .select(`
      *,
      vehicle:vehicles(id, company, model, name, registration_number),
      vendor:profiles!vehicle_change_requests_vendor_id_fkey(id, username, email)
    `)
    .order("created_at", { ascending: false });
  if (error && isMissingFeatureError(error)) return [];
  if (error) throw error;
  return (data || []).map(toAppChangeRequest);
};

export const submitVehicleChangeRequest = async (vehicleId, proposedChanges) => {
  const {
    data: { user },
    error: authError,
  } = await requireSupabase().auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in as vendor to submit vehicle changes.");

  const { data, error } = await requireSupabase()
    .from("vehicle_change_requests")
    .insert({
      vehicle_id: vehicleId,
      vendor_id: user.id,
      proposed_changes: proposedChanges || {},
      status: "pending",
    })
    .select("*")
    .single();
  if (error && isMissingFeatureError(error)) return null;
  if (error) throw error;
  emitChangeRequestUpdate();
  return toAppChangeRequest(data);
};

export const approveVehicleChangeRequest = async (request) => {
  await updateVehicle(request.vehicleId, request.proposedChanges || {});
  const { error } = await requireSupabase()
    .from("vehicle_change_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error && !isMissingFeatureError(error)) throw error;
  emitChangeRequestUpdate();
};

export const rejectVehicleChangeRequest = async (requestId, adminNote = "") => {
  const { error } = await requireSupabase()
    .from("vehicle_change_requests")
    .update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error && !isMissingFeatureError(error)) throw error;
  emitChangeRequestUpdate();
};

import { requireSupabase } from "../lib/supabase";

const toAppProfile = (profile) => ({
  ...profile,
  _id: profile.id,
  username: profile.username || "Unnamed account",
  phoneNumber: profile.phone_number || "",
  adress: profile.address || "",
  profilePicture: profile.avatar_url || "",
  role: profile.role,
  isUser: profile.role === "customer",
  isVendor: profile.role === "vendor",
  isAdmin: profile.role === "admin",
});

export const getProfilesByRole = async (role) => {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("id, username, phone_number, address, avatar_url, role, created_at, updated_at")
    .eq("role", role)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toAppProfile);
};

export const getCustomers = () => getProfilesByRole("customer");

export const getVendors = () => getProfilesByRole("vendor");

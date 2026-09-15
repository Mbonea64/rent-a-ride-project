import { requireSupabase, supabase } from "../lib/supabase";

const pendingRoleKey = "rent-a-ride-pending-role";

export const toAppUser = (profile, authUser) => {
  if (!profile || !authUser) return null;

  return {
    _id: profile.id,
    username: profile.username,
    email: authUser.email,
    phoneNumber: profile.phone_number || "",
    adress: profile.address || "",
    profilePicture: profile.avatar_url || "",
    role: profile.role,
    isUser: profile.role === "customer",
    isVendor: profile.role === "vendor",
    isAdmin: profile.role === "admin",
  };
};

export const getCurrentUser = async () => {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) throw authError;
  if (!user) return null;

  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return toAppUser(profile, user);
};

export const signInWithPassword = async ({ email, password }) => {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return getCurrentUser();
};

export const signUpWithPassword = async ({ username, email, password, role = "customer" }) => {
  const client = requireSupabase();
  const safeRole = role === "vendor" ? "vendor" : "customer";
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { username, role: safeRole } },
  });

  if (error) throw error;
  if (!data.session) {
    return { requiresEmailConfirmation: true, email };
  }

  return getCurrentUser();
};

export const signInWithProvider = async (provider, role = "customer") => {
  const client = requireSupabase();
  const safeRole = role === "vendor" ? "vendor" : "customer";
  localStorage.setItem(pendingRoleKey, safeRole);

  const redirectPath = safeRole === "vendor" ? "/vendorSignin" : "/signin";
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}${redirectPath}` },
  });
  if (error) throw error;
};

export const completePendingRole = async () => {
  const client = requireSupabase();
  const pendingRole = localStorage.getItem(pendingRoleKey);
  if (!pendingRole) return;

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  if (pendingRole === "vendor") {
    const { error } = await client.rpc("register_as_vendor");
    if (error) throw error;
  }
  localStorage.removeItem(pendingRoleKey);
};

export const updateCurrentProfile = async ({ username, email, phoneNumber, adress }) => {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Authentication required");

  if (email && email !== user.email) {
    const { error } = await client.auth.updateUser({ email });
    if (error) throw error;
  }

  const { error } = await client
    .from("profiles")
    .update({
      username,
      phone_number: phoneNumber || null,
      address: adress || null,
    })
    .eq("id", user.id);
  if (error) throw error;

  return getCurrentUser();
};

export const signOutFromSupabase = async () => {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const deleteCurrentAccount = async () => {
  const client = requireSupabase();
  const { error } = await client.functions.invoke("delete-account", {
    method: "DELETE",
  });
  if (error) throw error;
  await client.auth.signOut({ scope: "local" });
};

export const onAuthStateChange = (callback) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
};

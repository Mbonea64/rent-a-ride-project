import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const firstKey = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Object.values(parsed)[0] as string | undefined;
  } catch {
    return undefined;
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "DELETE" && request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_ANON_KEY") || firstKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"));
    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || firstKey(Deno.env.get("SUPABASE_SECRET_KEYS"));
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !publishableKey || !secretKey || !authorization) {
      return Response.json({ error: "Authentication is not configured" }, { status: 401, headers: corsHeaders });
    }

    const token = authorization.replace(/^Bearer\s+/i, "");
    const authClient = createClient(supabaseUrl, publishableKey);
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: bookingError } = await adminClient
      .from("bookings")
      .update({
        contact_email: `deleted-${user.id}@invalid.local`,
        contact_phone: "Deleted",
        contact_address: "Deleted",
      })
      .eq("customer_id", user.id);
    if (bookingError) throw bookingError;

    const { error: vehicleError } = await adminClient
      .from("vehicles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("owner_id", user.id);
    if (vehicleError) throw vehicleError;

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not delete account" },
      { status: 500, headers: corsHeaders }
    );
  }
});

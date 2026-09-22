const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailRequest = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

const json = (payload: unknown, status = 200) =>
  Response.json(payload, { status, headers: corsHeaders });

const parseSender = (value: string, fallbackEmail: string) => {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) {
    return {
      name: "Rent a Ride",
      email: value || fallbackEmail,
    };
  }

  return {
    name: match[1].trim() || "Rent a Ride",
    email: match[2].trim(),
  };
};

const sendWithBrevo = async ({
  apiKey,
  from,
  to,
  subject,
  html,
  text,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const sender = parseSender(from, "no-reply@example.com");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "Content-Type": "application/json",
      "User-Agent": "rent-a-ride/1.0",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      ...(html ? { htmlContent: html } : { textContent: text }),
      ...(html && text ? { textContent: text } : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  return { response, result };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ delivered: false, error: "Method not allowed" }, 405);

  try {
    const provider = "brevo";
    const apiKey = Deno.env.get("BREVO_API_KEY");
    const from = Deno.env.get("EMAIL_FROM") || Deno.env.get("BREVO_FROM_EMAIL");
    const demoTo = Deno.env.get("EMAIL_DEMO_TO")?.trim();

    if (!apiKey) {
      return json({
        delivered: false,
        mode: "not_configured",
        provider,
        error: "BREVO_API_KEY is not configured",
      });
    }

    if (!from) {
      return json({
        delivered: false,
        mode: "not_configured",
        provider,
        error: "EMAIL_FROM is not configured",
      });
    }

    const payload = (await request.json()) as EmailRequest;
    const intendedTo = String(payload.to || "").trim();
    const to = demoTo || intendedTo;
    const subject = String(payload.subject || "Rent a Ride payment confirmation").trim();
    const html = String(payload.html || "").trim();
    const text = String(payload.text || "").trim();

    if (!intendedTo && !demoTo) return json({ delivered: false, error: "Recipient email is required" }, 400);
    if (!html && !text) return json({ delivered: false, error: "Email content is required" }, 400);

    const { response, result } = await sendWithBrevo({ apiKey, from, to, subject, html, text });

    if (!response.ok) {
      return json({
        delivered: false,
        mode: provider,
        status: response.status,
        error: result?.message || result?.error || result?.code || "Email API rejected the message",
        details: result,
      });
    }

    return json({
      delivered: true,
      mode: provider,
      messageId: result?.messageId || result?.id || null,
      warning: demoTo && intendedTo !== demoTo ? `Demo mode sent to ${demoTo} instead of ${intendedTo}` : null,
      details: result,
    });
  } catch (error) {
    return json(
      {
        delivered: false,
        error: error instanceof Error ? error.message : "Could not send email",
      },
      500
    );
  }
});

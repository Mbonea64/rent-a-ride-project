const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WhatsAppRequest = {
  to?: string;
  body?: string;
  templateName?: string;
  languageCode?: string;
};

const json = (payload: unknown, status = 200) =>
  Response.json(payload, { status, headers: corsHeaders });

const normalizePhone = (value = "") => {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0")) return `255${digits.slice(1)}`;
  return digits;
};

const sendMetaMessage = async (
  graphVersion: string,
  phoneNumberId: string,
  accessToken: string,
  messagePayload: Record<string, unknown>
) => {
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });
  const result = await response.json();
  return { ok: response.ok, status: response.status, result };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v20.0";

    if (!accessToken || !phoneNumberId) {
      return json(
        {
          delivered: false,
          mode: "not_configured",
          error: "WhatsApp API secrets are not configured",
        },
        200
      );
    }

    const payload = (await request.json()) as WhatsAppRequest;
    const to = normalizePhone(payload.to);
    const body = String(payload.body || "").trim();
    const templateName = payload.templateName || Deno.env.get("WHATSAPP_TEMPLATE_NAME");
    const languageCode = payload.languageCode || Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "en_US";

    if (!to) return json({ delivered: false, error: "Recipient phone number is required" }, 400);
    if (!body && !templateName) return json({ delivered: false, error: "Message body or template is required" }, 400);

    const messagePayload = templateName
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
          },
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body,
          },
        };

    const firstAttempt = await sendMetaMessage(graphVersion, phoneNumberId, accessToken, messagePayload);
    if (!firstAttempt.ok && !templateName) {
      const fallbackTemplatePayload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      };
      const fallbackAttempt = await sendMetaMessage(graphVersion, phoneNumberId, accessToken, fallbackTemplatePayload);
      if (fallbackAttempt.ok) {
        return json({
          delivered: true,
          mode: "template_fallback",
          messageId: fallbackAttempt.result?.messages?.[0]?.id || null,
          warning: firstAttempt.result?.error?.message || "Free-text message was rejected, sent hello_world template instead",
          details: fallbackAttempt.result,
        });
      }
      return json(
        {
          delivered: false,
          mode: "text_then_template_fallback",
          status: fallbackAttempt.status,
          error:
            fallbackAttempt.result?.error?.message ||
            firstAttempt.result?.error?.message ||
            "WhatsApp API rejected the message",
          details: {
            textAttempt: firstAttempt.result,
            fallbackAttempt: fallbackAttempt.result,
          },
        },
        200
      );
    }

    if (!firstAttempt.ok) {
      return json(
        {
          delivered: false,
          mode: templateName ? "template" : "text",
          status: firstAttempt.status,
          error: firstAttempt.result?.error?.message || "WhatsApp API rejected the message",
          details: firstAttempt.result,
        },
        200
      );
    }

    return json({
      delivered: true,
      mode: templateName ? "template" : "text",
      messageId: firstAttempt.result?.messages?.[0]?.id || null,
      details: firstAttempt.result,
    });
  } catch (error) {
    return json(
      {
        delivered: false,
        error: error instanceof Error ? error.message : "Could not send WhatsApp message",
      },
      500
    );
  }
});

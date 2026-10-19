import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@6.34.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingEmail = {
  to_name?: string;
  to_email?: string;
  booking_id?: string;
  booking_date_time?: string;
  party_size?: number | string;
  special_requests?: string;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isBlankNote = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "none" || normalized === "n/a" || normalized === "address to be confirmed";
};

const guestLabel = (partySize: string) => {
  const count = Number(partySize);
  if (!Number.isFinite(count) || count <= 0) return partySize || "—";
  return `${count} ${count === 1 ? "guest" : "guests"}`;
};

const splitWhen = (when: string) => {
  const marker = " at ";
  const index = when.lastIndexOf(marker);
  if (index <= 0) return { date: when, time: "" };
  return { date: when.slice(0, index), time: when.slice(index + marker.length) };
};

const detailRow = (label: string, valueHtml: string, last: boolean) => `
  <tr>
    <td style="padding:16px 20px;${last ? "" : "border-bottom:1px solid #efe6d6;"}">
      <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#a08b72;">${escapeHtml(label)}</p>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.45;color:#2a241c;">${valueHtml}</div>
    </td>
  </tr>`;

const buildBookingEmail = (input: {
  restaurantName: string;
  guestName: string;
  when: string;
  partySize: string;
  requests: string;
  address: string;
  phone: string;
  restaurantEmail: string;
  bookingId: string;
}) => {
  const { date, time } = splitWhen(input.when);
  const whenValue = time ? `${date}, ${time}` : input.when;
  const whenHtml = time
    ? `<p style="margin:0;">${escapeHtml(date)}</p><p style="margin:4px 0 0;color:#5c5348;">${escapeHtml(time)}</p>`
    : `<p style="margin:0;">${escapeHtml(input.when)}</p>`;
  const details: Array<{ label: string; valueHtml: string }> = [
    { label: "When", valueHtml: whenHtml },
    { label: "Party", valueHtml: `<p style="margin:0;">${escapeHtml(guestLabel(input.partySize))}</p>` },
  ];
  if (!isBlankNote(input.requests)) {
    details.push({ label: "Requests", valueHtml: `<p style="margin:0;">${escapeHtml(input.requests)}</p>` });
  }
  if (!isBlankNote(input.address)) {
    details.push({ label: "Address", valueHtml: `<p style="margin:0;">${escapeHtml(input.address)}</p>` });
  }
  if (input.phone) details.push({ label: "Phone", valueHtml: `<p style="margin:0;">${escapeHtml(input.phone)}</p>` });
  if (input.restaurantEmail) {
    details.push({ label: "Email", valueHtml: `<p style="margin:0;">${escapeHtml(input.restaurantEmail)}</p>` });
  }
  const rows = details.map((detail, index) => detailRow(detail.label, detail.valueHtml, index === details.length - 1));

  const reference = input.bookingId
    ? `<p style="margin:22px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#a08b72;">Reference ${escapeHtml(input.bookingId)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f6f1e7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your table at ${escapeHtml(input.restaurantName)} is confirmed${time ? ` for ${escapeHtml(time)}` : ""}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="height:6px;background:#c4a36a;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:#2a241c;padding:36px 32px 32px;text-align:center;">
                <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#c4a36a;">Reservation confirmed</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:normal;color:#faf6ef;">${escapeHtml(input.restaurantName)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:#2a241c;">Hi ${escapeHtml(input.guestName)},</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#5c5348;">Your table is reserved. We look forward to welcoming you.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:12px;">
                  ${rows.join("")}
                </table>
                ${reference}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    `Reservation confirmed — ${input.restaurantName}`,
    "",
    `Hi ${input.guestName},`,
    "Your table is reserved. We look forward to welcoming you.",
    "",
    `When: ${whenValue}`,
    `Party: ${guestLabel(input.partySize)}`,
  ];
  if (!isBlankNote(input.requests)) textLines.push(`Requests: ${input.requests}`);
  if (!isBlankNote(input.address)) textLines.push(`Address: ${input.address}`);
  if (input.phone) textLines.push(`Phone: ${input.phone}`);
  if (input.restaurantEmail) textLines.push(`Email: ${input.restaurantEmail}`);
  if (input.bookingId) textLines.push("", `Reference: ${input.bookingId}`);

  return { html, text: textLines.join("\n") };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Resend is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as BookingEmail;
    const to = String(body.to_email || "").trim();
    if (!to) {
      return new Response(JSON.stringify({ error: "Recipient email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const restaurantName = body.restaurant_name?.trim() || "Your Restaurant";  // Default fallback
    const guestName = body.to_name?.trim() || "there";
    const when = body.booking_date_time?.trim() || "the booked time";
    const partySize = body.party_size ?? "";
    const requests = body.special_requests?.trim() || "None";
    const address = body.restaurant_address?.trim() || "";
    const phone = body.restaurant_phone?.trim() || "";
    const restaurantEmail = body.restaurant_email?.trim() || "";
    const bookingId = body.booking_id?.trim() || "";
    const from = Deno.env.get("RESEND_FROM") || "Table Pilot <bookings@tablepilot.co.uk>";  // Default fallback

    const message = buildBookingEmail({
      restaurantName,
      guestName,
      when,
      partySize: String(partySize),
      requests,
      address,
      phone,
      restaurantEmail,
      bookingId,
    });

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Your table is reserved at ${restaurantName}`,
      html: message.html,
      text: message.text,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

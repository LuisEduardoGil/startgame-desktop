import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Start Game <noreply@startgame.app>";
const LOGO_URL = "https://zacdqpvhnlgtbgurfqac.supabase.co/storage/v1/object/public/assets/Logo%20Start%20Game.png";

const ML: Record<string, string> = {
  pagomovil: "Pago Móvil",
  binance: "Binance Pay",
  zinli: "Zinli",
  zelle: "Zelle",
  paypal: "PayPal",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }});
  }

  try {
    const { order_id, customer_email, gift_code, items, total, total_bs, payment_method } = await req.json();
    if (!customer_email || !gift_code) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Parse gift_code — JSON array (multi) or plain string (single)
    let codesArray: { name: string; amount: string; code: string }[] | null = null;
    try {
      const parsed = JSON.parse(gift_code);
      if (Array.isArray(parsed)) codesArray = parsed;
    } catch (_) { /* single code */ }

    const orderId = order_id?.slice(0, 8).toUpperCase();

    // Build one row per item with its code
    const rowsHtml = codesArray
      ? codesArray.map((entry, i) => {
          const item = (items || [])[i] || {};
          const qty = item.quantity || 1;
          return `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${qty}x ${entry.name} USD ${entry.amount.replace("$","").trim()}</p>
              <p style="margin:4px 0 0;font-size:13px;font-family:Arial,sans-serif;">Código: <span style="background:#0a0a14;color:#ffffff;padding:3px 10px;border-radius:5px;font-family:'Courier New',monospace;letter-spacing:0.05em;">${entry.code}</span></p>
            </td>
          </tr>`;
        }).join("")
      : `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
              ${(items||[]).map((item: {name:string;amount:string;quantity:number}) =>
                `<p style="margin:0 0 2px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${item.quantity}x ${item.name} USD ${item.amount.replace("$","").trim()}</p>`
              ).join("")}
              <p style="margin:6px 0 0;font-size:13px;font-family:Arial,sans-serif;">Código: <span style="background:#0a0a14;color:#ffffff;padding:3px 10px;border-radius:5px;font-family:'Courier New',monospace;letter-spacing:0.05em;">${gift_code}</span></p>
            </td>
          </tr>`;

    // Format total in Bs
    const totalBsFormatted = total_bs
      ? `Bs. ${Number(total_bs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${total}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">

    <!-- Header -->
    <div style="background:#0a0a14;padding:28px 32px;text-align:center;">
      <img src="${LOGO_URL}" width="60" height="60" style="border-radius:12px;display:block;margin:0 auto 12px;" alt="Start Game"/>
      <p style="color:#ffffff;margin:0;font-size:18px;font-weight:700;font-family:Arial,sans-serif;">Start Game</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <p style="font-size:15px;color:#1a1a1a;margin:0 0 16px;font-family:Arial,sans-serif;">
        Hola <strong>${customer_email}</strong>,
      </p>
      <p style="font-size:14px;color:#444;margin:0 0 24px;line-height:1.6;font-family:Arial,sans-serif;">
        ¡Gracias por comprar en nuestra tienda! Agradecemos enormemente su preferencia.
      </p>

      <!-- Order summary -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <span style="font-size:13px;color:#888;font-family:Arial,sans-serif;">Importe total del pedido</span><br/>
            <span style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">${totalBsFormatted}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <span style="font-size:13px;color:#888;font-family:Arial,sans-serif;">Número de pedido</span><br/>
            <span style="font-size:14px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">#${orderId}</span>
          </td>
        </tr>
        ${rowsHtml}
      </table>

      <p style="font-size:12px;color:#999;margin:0;font-family:Arial,sans-serif;line-height:1.6;">
        ¿Tienes algún problema con tu pedido? <a href="https://wa.me/584243663119?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido" style="color:#25D366;text-decoration:none;font-weight:700;">Contáctanos por WhatsApp</a> y te ayudaremos.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:16px 32px;text-align:center;">
      <p style="color:#bbb;font-size:11px;margin:0;font-family:Arial,sans-serif;">© 2025 Start Game · <a href="https://startgame.app" style="color:#7B6FFF;text-decoration:none;">startgame.app</a></p>
    </div>

  </div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [customer_email],
        subject: `🎮 Tu${codesArray && codesArray.length > 1 ? 's códigos' : ' código'} Start Game — Pedido #${orderId}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: data }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

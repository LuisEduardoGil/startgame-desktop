import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = "re_Duch2Gnq_BytxT55CVVjH7YP6p3HoYEMR";
const FROM_EMAIL = "Start Game <noreply@startgame.app>";

const EMAIL_IMGS: Record<string, string> = {
  "PlayStation":    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Playstation_logo_colour.svg/120px-Playstation_logo_colour.svg.png",
  "Xbox":           "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/120px-Xbox_one_logo.svg.png",
  "Xbox Gift Card": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/120px-Xbox_one_logo.svg.png",
  "Game Pass":      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/120px-Xbox_one_logo.svg.png",
  "Nintendo":       "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/120px-Nintendo.svg.png",
  "Steam":          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/120px-Steam_icon_logo.svg.png",
  "Roblox":         "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/120px-Roblox_player_icon_black.svg.png",
  "Discord":        "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg",
  "Apple":          "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png",
  "Free Fire":      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Free_Fire_logo.png/120px-Free_Fire_logo.png",
  "Riot Games":     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Riot_Games_logo.svg/120px-Riot_Games_logo.svg.png",
};

const LOGO_URL = "https://zacdqpvhnlgtbgurfqac.supabase.co/storage/v1/object/public/assets/Logo%20Start%20Game.png";

const ML: Record<string, string> = {
  pagomovil: "Pago Móvil",
  binance: "Binance Pay",
  zinli: "Zinli",
  googlepay: "Google Pay",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }});
  }

  try {
    const { order_id, customer_email, gift_code, items, total, payment_method } = await req.json();
    if (!customer_email || !gift_code) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const itemsHtml = (items || []).map((i: { name: string; amount: string; quantity: number }) => {
      const imgUrl = EMAIL_IMGS[i.name] || "";
      const imgTag = imgUrl
        ? `<img src="${imgUrl}" width="44" height="44" style="border-radius:10px;object-fit:contain;background:#1a1a2e;padding:4px;vertical-align:middle;margin-right:12px;" alt="${i.name}"/>`
        : "";
      return `<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${imgTag}<div><p style="color:#fff;font-size:14px;font-weight:700;margin:0 0 2px;font-family:'Inter',sans-serif;">${i.name}</p><p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Inter',sans-serif;">${i.amount} × ${i.quantity}</p></div></div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:32px 16px;">
    <div style="background:#111118;border-radius:24px 24px 0 0;padding:32px 28px 24px;text-align:center;border:1px solid rgba(255,255,255,0.08);border-bottom:none;">
      <img src="${LOGO_URL}" width="72" height="72" style="border-radius:14px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" alt="Start Game"/>
      <p style="color:#fff;margin:0 0 2px;font-size:18px;font-weight:900;font-family:'Inter',sans-serif;">Start Game</p>
      <p style="color:rgba(255,255,255,0.3);margin:0;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;font-family:'Inter',sans-serif;">Plataforma de Gift Cards</p>
    </div>
    <div style="height:2px;background:linear-gradient(90deg,#7B6FFF,#4F8EFF,#00C896);"></div>
    <div style="background:#111118;border:1px solid rgba(255,255,255,0.08);border-top:none;border-bottom:none;padding:32px 28px;">
      <div style="text-align:center;margin-bottom:24px;">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style="margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">
          <circle cx="36" cy="36" r="30" stroke="rgba(0,200,150,0.2)" stroke-width="4"/>
          <circle cx="36" cy="36" r="30" stroke="#00C896" stroke-width="4" stroke-linecap="round" stroke-dasharray="188.5" stroke-dashoffset="0" transform="rotate(-90 36 36)"/>
          <polyline points="22,37 31,46 50,27" stroke="#00C896" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 style="color:#fff;margin:0 0 6px;font-size:22px;font-weight:900;font-family:'Inter',sans-serif;">¡Gift card entregada!</h2>
        <p style="color:rgba(255,255,255,0.35);margin:0;font-size:13px;font-family:'Inter',sans-serif;">Pedido <strong style="color:#7B6FFF;">#${order_id?.slice(0, 8).toUpperCase()}</strong></p>
      </div>
      <div style="background:rgba(0,200,150,0.06);border:1.5px solid rgba(0,200,150,0.2);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
        <p style="color:rgba(0,200,150,0.7);font-size:10px;font-weight:700;letter-spacing:0.2em;margin:0 0 12px;text-transform:uppercase;font-family:'Inter',sans-serif;">Tu código</p>
        <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 20px;margin-bottom:10px;">
          <p style="color:#fff;font-size:26px;font-weight:900;margin:0;letter-spacing:0.1em;font-family:'Courier New',monospace;">${gift_code}</p>
        </div>
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;font-family:'Inter',sans-serif;">Canjéalo en la plataforma correspondiente</p>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px;margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.25);font-size:10px;font-weight:700;letter-spacing:0.15em;margin:0 0 12px;text-transform:uppercase;font-family:'Inter',sans-serif;">Resumen del pedido</p>
        <div style="padding:0 0 4px;">${itemsHtml}</div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr><td style="color:rgba(255,255,255,0.35);font-size:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Inter',sans-serif;">Método de pago</td><td style="color:#fff;font-size:12px;font-weight:700;text-align:right;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Inter',sans-serif;">${ML[payment_method] || payment_method}</td></tr>
          <tr><td style="color:rgba(255,255,255,0.35);font-size:12px;padding:7px 0;font-family:'Inter',sans-serif;">Total pagado</td><td style="color:#00C896;font-size:15px;font-weight:900;text-align:right;padding:7px 0;font-family:'Inter',sans-serif;">$${total}</td></tr>
        </table>
      </div>
      <div style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:14px 16px;text-align:center;">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Inter',sans-serif;line-height:1.6;">¿Algún problema? Contáctanos por <span style="color:#25D366;font-weight:700;">WhatsApp</span></p>
      </div>
    </div>
    <div style="background:#0d0d14;border:1px solid rgba(255,255,255,0.05);border-top:none;border-radius:0 0 20px 20px;padding:16px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;margin:0;font-family:'Inter',sans-serif;">© 2025 Start Game · <a href="https://startgame.app" style="color:rgba(123,111,255,0.5);text-decoration:none;">startgame.app</a></p>
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
        subject: `🎮 Tu código Start Game — Pedido #${order_id?.slice(0, 8).toUpperCase()}`,
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

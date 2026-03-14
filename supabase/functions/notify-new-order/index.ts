import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN") ?? "";
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

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
    const { record } = await req.json();
    if (!record) return new Response("no record", { status: 400 });

    const orderId = record.id?.slice(0, 8).toUpperCase();
    const items = (record.items || []).map((i: any) =>
      `  • ${i.quantity}x ${i.name} — ${i.amount}`
    ).join("\n");
    const total = record.total_bs
      ? `Bs. ${Number(record.total_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
      : `$${record.total} USD`;
    const method = ML[record.payment_method] || record.payment_method || "—";
    const email = record.customer_email || "Sin correo";

    const message = `🛒 *NUEVO PEDIDO*\n\n` +
      `📦 Pedido: \`#${orderId}\`\n` +
      `💳 Método: ${method}\n` +
      `📧 Cliente: ${email}\n` +
      `💰 Total: ${total}\n\n` +
      `🎮 Productos:\n${items}\n\n` +
      `🔗 Ref: \`${record.customer_ref || "—"}\``;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

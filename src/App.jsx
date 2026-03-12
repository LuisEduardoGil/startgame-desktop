import { useState, useRef, useEffect } from "react";
import logo from "./Logo.png";

import imgApple       from "./assets/cards/apple.png";
import imgBattlenet   from "./assets/cards/battlenet.png";
import imgBloodstrike from "./assets/cards/bloodstrike.png";
import imgDiscord     from "./assets/cards/discord.png";
import imgFreeFire    from "./assets/cards/free-fire.png";
import imgGamepass    from "./assets/cards/gamepass.png";
import imgNintendo    from "./assets/cards/nintendo.png";
import imgNordVpn     from "./assets/cards/nord-vpn.png";
import imgPlaystation from "./assets/cards/playstation.png";
import imgRiot        from "./assets/cards/riot.png";
import imgRoblox      from "./assets/cards/roblox.png";
import imgSteam       from "./assets/cards/steam.png";
import imgXbox        from "./assets/cards/xbox.png";

// ─── SUPABASE ───
const SUPABASE_URL = "https://zacdqpvhnlgtbgurfqac.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY2RxcHZobmxndGJndXJmcWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODQzNjksImV4cCI6MjA4ODE2MDM2OX0.yFPCd6MfcT-wCRC1PELVu0YIyWxbozjHpsB63bo8zjs";

// ─── RESEND CONFIG ───────────────────────────────────────────────
const RESEND_API_KEY = "re_Duch2Gnq_BytxT55CVVjH7YP6p3HoYEMR";
const FROM_EMAIL     = "Start Game <noreply@startgame.app>";

async function sendGiftEmail({ to_email, order_id, gift_code, items, payment_method, total }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ order_id, customer_email: to_email, gift_code, items, total, payment_method }),
  });
  if (!res.ok) {
    const err = await res.json();
    console.error("Email error:", err);
    throw new Error(err.message || "Email failed");
  }
  return res.json();
}

// Supabase Auth helpers
const sbAuth = {
  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY}, body:JSON.stringify({email,password}) });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY}, body:JSON.stringify({email,password}) });
    return r.json();
  },
  async signInWithGoogle() {
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`} });
  },
  async getUser(token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`} });
    return r.json();
  },
  getSession() {
    try { return JSON.parse(localStorage.getItem("sg_session")||"null"); } catch { return null; }
  },
  saveSession(s) { localStorage.setItem("sg_session", JSON.stringify(s)); },
  clearSession() { localStorage.removeItem("sg_session"); },
  parseHashSession() {
    const hash = window.location.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash.replace("#",""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token) { window.location.hash = ""; return {access_token,refresh_token}; }
    return null;
  }
};
const ADMIN_PASSWORD = "Dios.luis.k.1234";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

const sb = {
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async getAll(table) {
    const order = table === "orders" ? "?order=created_at.desc" : "?order=name.asc";
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${order}&select=*`, {
      headers: HEADERS,
    });
    return r.json();
  },
  async getOne(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      headers: HEADERS,
    });
    const rows = await r.json();
    return rows[0] || null;
  },
  subscribe(table, id, callback) {
    const poll = setInterval(async () => {
      const row = await sb.getOne(table, id);
      if (row) callback(row);
    }, 3000);
    return () => clearInterval(poll);
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: HEADERS,
    });
    return r.ok;
  },
  async upsertSetting(key, value) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({ value }),
    });
    return r.ok;
  },
  async getSetting(key) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, { headers: HEADERS });
    const rows = await r.json();
    return rows[0]?.value || null;
  },
};

// ── Global tasa context ──
let GLOBAL_TASA = 36.50;
const tasaListeners = new Set();
function setGlobalTasa(v) {
  GLOBAL_TASA = v;
  tasaListeners.forEach(fn => fn(v));
}
function useBanner() {
  const [banner, setBanner] = useState({ badge:"NEXUS IA DISPONIBLE", title:"Tu agente experto en videojuegos", subtitle:"Pregúntale cualquier cosa sobre gaming", btn:"HABLAR CON NEXUS →", visible:true });
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.banner&select=value`, { headers:{ "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}` } })
      .then(r=>r.json()).then(d=>{ if(d[0]?.value) setBanner(typeof d[0].value==="string"?JSON.parse(d[0].value):d[0].value); }).catch(()=>{});
  }, []);
  return banner;
}

function useTasa() {
  const [tasa, setTasa] = useState(GLOBAL_TASA);
  useEffect(() => {
    const fn = v => setTasa(v);
    tasaListeners.add(fn);
    return () => tasaListeners.delete(fn);
  }, []);
  return tasa;
}

function fmtBs(usd, tasa, usdtOverride) {
  const base = usdtOverride != null ? usdtOverride : usd;
  const bs = base * tasa;
  return `Bs. ${bs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


const COLORS = {
  bg:          "#08080E",
  surface:     "rgba(255,255,255,0.06)",
  card:        "rgba(255,255,255,0.07)",
  border:      "rgba(255,255,255,0.10)",
  accent:      "#FFFFFF",
  text:        "#FFFFFF",
  textMuted:   "#F0EDE8",
  textSub:     "rgba(255,255,255,0.90)",
  neon:        "rgba(200,200,255,0.95)",
  danger:      "#FF4D6A",
};

const F = "'Roboto', sans-serif";

// Static fallback image map
// URLs públicas para emails (las imágenes locales no funcionan en emails)
const EMAIL_IMGS = {
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

const LOCAL_IMGS = {
  "PlayStation": imgPlaystation,
  "Xbox": imgXbox, "Xbox Gift Card": imgXbox,
  "Game Pass": imgGamepass, "Game Pass Ultimate": imgGamepass,
  "Nintendo": imgNintendo, "Nintendo eShop": imgNintendo,
  "Steam": imgSteam,
  "Battle.net": imgBattlenet, "Battlenet": imgBattlenet,
  "Riot Games": imgRiot, "Riot": imgRiot,
  "Discord": imgDiscord, "Discord Nitro": imgDiscord,
  "Nord VPN": imgNordVpn, "NordVPN": imgNordVpn,
  "Roblox": imgRoblox,
  "Free Fire": imgFreeFire,
  "Blood Strike": imgBloodstrike, "Blood Strike Mobile": imgBloodstrike,
  "Apple": imgApple, "Apple Gift Card": imgApple,
};

// Default products (used as fallback & seed)
const DEFAULT_PRODUCTS = [
  { id:"1",  name:"PlayStation",  img_url:null, tag:"Popular", amounts:[10,20,25,50], category:"Consola", active:true, usdt_rate:null },
  { id:"2",  name:"Xbox",         img_url:null, tag:"Oferta",  amounts:[5,10,25,50],  category:"Consola", active:true },
  { id:"3",  name:"Game Pass",    img_url:null, tag:null,      amounts:[10,25,50],     category:"Consola", active:true },
  { id:"4",  name:"Nintendo",     img_url:null, tag:null,      amounts:[10,20,50],     category:"Consola", active:true },
  { id:"5",  name:"Steam",        img_url:null, tag:"Nuevo",   amounts:[5,10,20,50],   category:"PC",      active:true },
  { id:"6",  name:"Battle.net",   img_url:null, tag:null,      amounts:[10,20,50],     category:"PC",      active:true },
  { id:"7",  name:"Riot Games",   img_url:null, tag:null,      amounts:[5,10,25],      category:"PC",      active:true },
  { id:"8",  name:"Discord",      img_url:null, tag:null,      amounts:[5,10,25],      category:"PC",      active:true },
  { id:"9",  name:"Nord VPN",     img_url:null, tag:null,      amounts:[10,25,50],     category:"PC",      active:true },
  { id:"10", name:"Roblox",       img_url:null, tag:"Hot",     amounts:[5,10,25,50],   category:"Mobile",  active:true },
  { id:"11", name:"Free Fire",    img_url:null, tag:null,      amounts:[5,10,20],      category:"Mobile",  active:true },
  { id:"12", name:"Blood Strike", img_url:null, tag:null,      amounts:[5,10,20],      category:"Mobile",  active:true },
  { id:"13", name:"Apple",        img_url:null, tag:null,      amounts:[10,25,50],     category:"Mobile",  active:true },
];

// Global products store
let GLOBAL_PRODUCTS = [];
const productListeners = new Set();
function setGlobalProducts(p) { GLOBAL_PRODUCTS = p; productListeners.forEach(fn => fn(p)); }
function useProducts() {
  const [products, setProducts] = useState(GLOBAL_PRODUCTS);
  useEffect(() => {
    productListeners.add(setProducts);
    return () => productListeners.delete(setProducts);
  }, []);
  return products;
}

function getImg(p) {
  if (p.img_url) return p.img_url;
  if (p.name && LOCAL_IMGS[p.name]) return LOCAL_IMGS[p.name];
  if (p.original_name && LOCAL_IMGS[p.original_name]) return LOCAL_IMGS[p.original_name];
  return imgPlaystation;
}
function amountsToStr(amounts) { return (amounts||[]).map(a => `$${a}`); }
function getUsdt(card, amount) {
  if (!card?.usdt_prices) return null;
  const strKey = String(amount).replace("$","").trim();
  // exact match
  if (card.usdt_prices[strKey] != null) return parseFloat(card.usdt_prices[strKey]).toFixed(2);
  // case-insensitive match
  const lowerKey = strKey.toLowerCase();
  const found = Object.keys(card.usdt_prices).find(k => k.toLowerCase() === lowerKey);
  if (found != null && card.usdt_prices[found] != null) return parseFloat(card.usdt_prices[found]).toFixed(2);
  // numeric match
  const num = parseFloat(strKey);
  if (!isNaN(num) && card.usdt_prices[String(num)] != null) return parseFloat(card.usdt_prices[String(num)]).toFixed(2);
  return null;
}


const NEXUS_SUGGESTIONS = [
  "¿Qué juego debo comprar con $20?",
  "Top 5 RPGs del 2024",
  "¿Vale la pena el Game Pass?",
  "Recomiéndame un juego de terror",
];

function GlowDot() {
  return <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:COLORS.accent, boxShadow:"0 0 8px rgba(255,255,255,0.6)", marginRight:6, verticalAlign:"middle" }}/>;
}

function CartIcon({ count }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      {count > 0 && (
        <span style={{ position:"absolute", top:-6, right:-6, background:"linear-gradient(135deg,#7B6FFF,#4F8EFF)", color:"#fff", fontSize:9, fontWeight:800, fontFamily:F, width:17, height:17, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #08080E", boxShadow:"0 0 6px rgba(100,100,255,0.6)" }}>{count}</span>
      )}
    </span>
  );
}

/* ─── CART PANEL (slide-up modal) ─── */

function HomeIcon({ active }) {
  const c = active ? COLORS.accent : COLORS.textMuted;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
}
function StoreIcon({ active }) {
  const c = active ? COLORS.accent : COLORS.textMuted;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}
function NexusIcon({ active }) {
  const c = active ? COLORS.accent : COLORS.textMuted;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function ProfileIcon({ active, photo }) {
  const c = active ? COLORS.accent : COLORS.textMuted;
  if (photo) return <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${c}`, overflow:"hidden" }}><img src={photo} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function BottomNav({ active, setActive, profilePhoto, onProfilePhotoChange, cartCount, onCartClick }) {
  const fileRef = useRef(null);
  const items = [{ id:"home", label:"Inicio" }, { id:"store", label:"Tienda" }, { id:"nexus", label:"Nexus IA" }, { id:"profile", label:"Perfil" }];
  return (
    <div style={{ position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", background:"rgba(20,20,30,0.75)", backdropFilter:"blur(32px) saturate(180%)", WebkitBackdropFilter:"blur(32px) saturate(180%)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, display:"flex", justifyContent:"space-around", padding:"10px 0", zIndex:200, boxShadow:"0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f) onProfilePhotoChange(URL.createObjectURL(f)); }}/>
      {items.map(item => {
        const on = active === item.id;
        return (
          <button key={item.id} onClick={item.id==="profile"?(on?()=>fileRef.current?.click():()=>setActive("profile")):()=>setActive(item.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"4px 16px" }}>
            <span style={{ filter:on?`drop-shadow(0 0 6px ${COLORS.accent})`:"none", transition:"filter 0.2s", position:"relative" }}>
              {item.id==="home" && <HomeIcon active={on}/>}
              {item.id==="store" && <StoreIcon active={on}/>}
              {item.id==="nexus" && <NexusIcon active={on}/>}
              {item.id==="profile" && <ProfileIcon active={on} photo={profilePhoto}/>}
            </span>
            <span style={{ fontSize:10, fontFamily:F, letterSpacing:"0.05em", fontWeight:on?700:400, color:on?COLORS.accent:COLORS.textMuted }}>{item.label}</span>
            {on && <div style={{ width:4, height:4, borderRadius:"50%", background:COLORS.accent }}/>}
          </button>
        );
      })}
    </div>
  );
}
function CardDetailScreen({ card, onBack, onAddToCart, onBuyNow, cart, onCartClick, tasa }) {
  const [selectedAmount, setSelectedAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    const el = document.querySelector("[data-main-scroll]");
    if (el) el.scrollTop = 0;
  }, []);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const t = tasa || GLOBAL_TASA;
  const _raw = selectedAmount.replace("$","").trim();
  const isPureNumeric = selectedAmount && !isNaN(parseFloat(_raw)) && !/[a-zA-Z]/.test(_raw);
  const amountValue = isPureNumeric ? parseFloat(_raw) : 0;
  const selectedUsdt = selectedAmount ? getUsdt(card, _raw) : null;
  const total = amountValue * quantity;
  const totalUsdtCard = selectedUsdt ? (parseFloat(selectedUsdt) * quantity) : null;
  const handleAddToCart = () => {
    if (!selectedAmount) return;
    onAddToCart({ ...card, selectedAmount, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  const handleBuyNow = () => {
    if (!selectedAmount) return;
    const alreadyInCart = cart.some(i => i.id === card.id && i.selectedAmount === selectedAmount);
    if (!alreadyInCart) onAddToCart({ ...card, selectedAmount, quantity });
    if (onBuyNow) onBuyNow();
  };
  return (
    <div style={{ minHeight:"100vh", paddingBottom:120, background:COLORS.bg }}>
      <div style={{ padding:"20px 20px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:COLORS.text, cursor:"pointer", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>←</button>
        <div style={{ textAlign:"center" }}>

          <h2 style={{ color:COLORS.text, fontSize:17, fontWeight:800, margin:0, fontFamily:F }}>{card.name}</h2>
        </div>
        <button onClick={onCartClick} style={{ position:"relative", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <CartIcon count={cartCount}/>
        </button>
      </div>
      <div style={{ margin:"0 20px 24px", borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,0.10)", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
        <img src={getImg(card)} style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
      </div>
      <div style={{ padding:"0 20px" }}>
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:20, padding:"20px", marginBottom:16 }}>
          <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, fontWeight:700, letterSpacing:"0.12em", margin:"0 0 8px" }}>Monto:</p>
          <div style={{ position:"relative", marginBottom:20 }}>
            <select value={selectedAmount} onChange={e => setSelectedAmount(e.target.value)} style={{ width:"100%", padding:"14px 16px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:12, color: selectedAmount ? COLORS.text : COLORS.textMuted, fontSize:14, fontFamily:F, fontWeight:600, cursor:"pointer", outline:"none", appearance:"none", WebkitAppearance:"none" }}>
              <option value="" disabled style={{ background:"#1a1a2e", color:"#F0EDE8" }}>ELIGE UNA OPCIÓN</option>
              {(card.amounts||[]).map(a => {
                const str = String(a).trim();
                const isPureNum = !isNaN(parseFloat(str)) && !/[a-zA-Z]/.test(str);
                const val = isPureNum ? `$${parseFloat(str)}` : str;
                const label = isPureNum ? `$${parseFloat(str)} USD` : str;
                return <option key={a} value={val} style={{ background:"#1a1a2e", color:"#fff" }}>{label}</option>;
              })}
            </select>
            <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:COLORS.textMuted, fontSize:12, pointerEvents:"none" }}>▼</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:0 }}>Cantidad:</p>
            <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:10, overflow:"hidden" }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width:36, height:36, background:"none", border:"none", color:COLORS.text, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>−</button>
              <span style={{ minWidth:32, textAlign:"center", color:COLORS.text, fontSize:15, fontWeight:800, fontFamily:F }}>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} style={{ width:36, height:36, background:"none", border:"none", color:COLORS.text, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>+</button>
            </div>
          </div>
          <div style={{ height:1, background:"rgba(255,255,255,0.08)", marginBottom:16 }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ color:COLORS.textMuted, fontSize:13, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:0 }}>Total:</p>
            <div style={{ textAlign:"right" }}>
              {(() => {
                if (!selectedAmount) return <p style={{ color:COLORS.text, fontSize:22, fontWeight:900, fontFamily:F, margin:0 }}>Bs. 0,00</p>;
                const raw = selectedAmount.replace("$","").trim();
                const isPureNum = !isNaN(parseFloat(raw)) && !/[a-zA-Z]/.test(raw);
                // Has USDT price configured
                if (totalUsdtCard) return <>
                  <p style={{ color:COLORS.text, fontSize:22, fontWeight:900, fontFamily:F, margin:0 }}>{fmtBs(null, t, totalUsdtCard)}</p>
                  <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"2px 0 0" }}>{totalUsdtCard.toFixed(2)} USDT</p>
                </>;
                // Pure numeric amount (e.g. $10)
                if (isPureNum && total > 0) return <>
                  <p style={{ color:COLORS.text, fontSize:22, fontWeight:900, fontFamily:F, margin:0 }}>{fmtBs(total, t)}</p>
                  <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"2px 0 0" }}>${total} USD</p>
                </>;
                // Text amount without USDT (e.g. "400 Robux" with no price set)
                return <p style={{ color:COLORS.text, fontSize:22, fontWeight:900, fontFamily:F, margin:0 }}>{selectedAmount}</p>;
              })()}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleBuyNow} style={{ flex:1, padding:"15px 10px", background:"rgba(255,255,255,0.16)", border:"1px solid rgba(255,255,255,0.30)", borderRadius:14, color:COLORS.text, fontSize:13, fontWeight:800, fontFamily:F, cursor: !selectedAmount ? "not-allowed" : "pointer", letterSpacing:"0.04em", backdropFilter:"blur(16px)", opacity: !selectedAmount ? 0.5 : 1 }}>Comprar ahora</button>
          <button onClick={handleAddToCart} style={{ flex:1, padding:"15px 10px", background: added ? "rgba(120,220,120,0.18)" : "rgba(255,255,255,0.08)", border:`1px solid ${added ? "rgba(120,220,120,0.5)" : "rgba(255,255,255,0.18)"}`, borderRadius:14, color: added ? "rgba(120,220,120,1)" : COLORS.text, fontSize:13, fontWeight:800, fontFamily:F, cursor: !selectedAmount ? "not-allowed" : "pointer", backdropFilter:"blur(16px)", transition:"all 0.2s", opacity: !selectedAmount ? 0.5 : 1 }}>
            {added ? "✓ AGREGADO" : "AGREGAR AL CARRITO"}
          </button>
        </div>
        <p style={{ color:COLORS.textMuted, fontSize:10, textAlign:"center", fontFamily:F, marginTop:14 }}>🔒 Entrega digital segura · 0–10 minutos</p>
        {card.description && (
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px", marginTop:16 }}>
            <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 6px" }}>DESCRIPCIÓN</p>
            <p style={{ color:"#F0EDE8", fontSize:13, fontFamily:F, lineHeight:1.6, margin:0 }}>{card.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AutoScrollCards({ cards, onCardClick }) {
  const tasa = useTasa();
  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const pauseRef = useRef(null);
  const posRef = useRef(0);
  const touchXRef = useRef(null);

  const speedRef = useRef(0);
  const lastDxRef = useRef(0);

  const startAnim = () => {
    if (animRef.current) return;
    const step = () => {
      if (!scrollRef.current) { animRef.current = null; return; }
      speedRef.current += (0.44 - speedRef.current) * 0.04;
      posRef.current += speedRef.current;
      const half = scrollRef.current.scrollWidth / 2;
      if (posRef.current >= half) posRef.current = 0;
      scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };

  const stopAnim = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  };

  useEffect(() => { startAnim(); return stopAnim; }, []);

  const onTouchStart = (e) => {
    stopAnim();
    if (pauseRef.current) clearTimeout(pauseRef.current);
    touchXRef.current = e.touches[0].clientX;
    lastDxRef.current = 0;
    speedRef.current = 0;
  };
  const onTouchMove = (e) => {
    if (touchXRef.current === null) return;
    const dx = touchXRef.current - e.touches[0].clientX;
    touchXRef.current = e.touches[0].clientX;
    lastDxRef.current = dx;
    const half = scrollRef.current.scrollWidth / 2;
    posRef.current = Math.max(0, Math.min(posRef.current + dx, half - 1));
    scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };
  const onTouchEnd = () => {
    touchXRef.current = null;
    // Apply momentum from last drag delta
    speedRef.current = lastDxRef.current * 0.5;
    // Coast with deceleration, then resume auto
    const coast = () => {
      if (!scrollRef.current) return;
      speedRef.current *= 0.92;
      posRef.current += speedRef.current;
      const half = scrollRef.current.scrollWidth / 2;
      if (posRef.current >= half) posRef.current = 0;
      if (posRef.current < 0) posRef.current = 0;
      scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
      if (Math.abs(speedRef.current) > 0.1) {
        animRef.current = requestAnimationFrame(coast);
      } else {
        animRef.current = null;
        speedRef.current = 0;
        pauseRef.current = setTimeout(startAnim, 1000);
      }
    };
    animRef.current = requestAnimationFrame(coast);
  };

  const items = [...cards, ...cards];

  return (
    <div style={{ margin:"0 -20px", overflow:"hidden", paddingBottom:8 }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div ref={scrollRef} style={{ display:"flex", gap:12, width:"max-content", willChange:"transform" }}>
        {items.map((card, idx) => (
          <div key={idx} onClick={()=>onCardClick(card)}
            style={{ minWidth:110, background:COLORS.card, borderRadius:14, border:`1px solid ${COLORS.border}`, flexShrink:0, overflow:"hidden", cursor:"pointer", marginLeft:idx===0?20:0 }}>
            <img src={getImg(card)} style={{ width:"100%", height:70, objectFit:"cover" }}/>
            <div style={{ padding:"6px 12px 10px 12px" }}>
              <p style={{ color:COLORS.text, fontSize:11, fontWeight:700, margin:"0 0 2px", fontFamily:F }}>{card.name}</p>
              <p style={{ color:COLORS.textSub, fontSize:10, fontWeight:800, margin:0, fontFamily:F }}>
                {(() => {
                  const a = (card.amounts||[])[0];
                  const u = getUsdt(card, a);
                  const num = parseFloat(String(a));
                  if (u) return `Desde ${fmtBs(null, tasa, parseFloat(u))}`;
                  if (!isNaN(num)) return `Desde ${fmtBs(num, tasa)}`;
                  return a||"";
                })()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({ setScreen, onLogoTap, onAddToCart, onBuyNow, cart, onCartClick }) {
  const tasa = useTasa();
  const products = useProducts();
  const banner = useBanner();
  const active = products.filter(p => p.active !== false);
  const [detailCard, setDetailCard] = useState(null);
  if (detailCard) return <CardDetailScreen card={detailCard} onBack={()=>setDetailCard(null)} onAddToCart={onAddToCart} onBuyNow={onBuyNow} cart={cart} onCartClick={onCartClick} tasa={tasa}/>;
  return (
    <div style={{ padding:"24px 20px", paddingBottom:100, width:"100%", boxSizing:"border-box" }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <img src={logo} onClick={onLogoTap} style={{ height:60, width:"auto", objectFit:"contain", marginLeft:-8, cursor:"pointer" }}/>
          <div style={{ width:38, height:38, borderRadius:10, background:COLORS.card, border:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLORS.accent, boxShadow:`0 0 8px ${COLORS.accent}` }}/>
          </div>
        </div>
      </div>
      {banner.visible !== false && <div style={{ background:`linear-gradient(135deg,${COLORS.card} 0%,rgba(26,26,48,0.8) 100%)`, borderRadius:20, padding:"24px 20px", marginBottom:24, border:`1px solid ${COLORS.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(180,180,255,0.08)", filter:"blur(30px)" }}/>
        <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"0 0 6px" }}><GlowDot/>{banner.badge||"NEXUS IA DISPONIBLE"}</p>
        <h2 style={{ color:COLORS.text, fontSize:20, fontWeight:800, margin:"0 0 8px", lineHeight:1.2, fontFamily:F }}>{banner.title}</h2>
        <p style={{ color:COLORS.textMuted, fontSize:13, margin:"0 0 16px", fontFamily:F }}>{banner.subtitle}</p>
        <button onClick={()=>setScreen("nexus")} style={{ background:"rgba(255,255,255,0.15)", color:COLORS.text, border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:800, fontFamily:F, cursor:"pointer", letterSpacing:"0.05em", backdropFilter:"blur(10px)" }}>{banner.btn}</button>
      </div>}

      <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, marginBottom:12, letterSpacing:"0.1em" }}>POPULARES EN LA TIENDA</p>
      <AutoScrollCards cards={active.filter(p=>p.featured).slice(0,6)} onCardClick={setDetailCard}/>
    </div>
  );
}
function StoreScreen({ onAddToCart, onBuyNow, cart, onCartClick }) {
  const [filter, setFilter] = useState("Todos");
  const [detailCard, setDetailCard] = useState(null);
  const [search, setSearch] = useState("");
  const tasa = useTasa();
  const products = useProducts();
  const filters = ["Todos","Consola","PC","Mobile"];
  const active = products.filter(p => p.active !== false);
  if (detailCard) return <CardDetailScreen card={detailCard} onBack={()=>setDetailCard(null)} onAddToCart={onAddToCart} onBuyNow={onBuyNow} cart={cart} onCartClick={onCartClick} tasa={tasa}/>;
  const filtered = active.filter(c => {
    const cats = Array.isArray(c.category) ? c.category : [c.category].filter(Boolean);
    const matchCat = filter==="Todos" || cats.includes(filter);
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  return (
    <div style={{ padding:"24px 20px", paddingBottom:100 }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"0 0 4px", letterSpacing:"0.1em" }}>TIENDA</p>
        <h2 style={{ color:COLORS.text, fontSize:24, fontWeight:900, margin:0, fontFamily:F }}>Gift Cards<span style={{ color:"#F0EDE8" }}>.</span></h2>
      </div>
      <div style={{ background:COLORS.card, borderRadius:12, border:`1px solid ${COLORS.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ color:COLORS.textMuted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar plataforma..." style={{ background:"none", border:"none", outline:"none", color:COLORS.text, fontSize:14, fontFamily:F, flex:1 }}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto" }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.06)", color:filter===f?COLORS.text:COLORS.textMuted, border:`1px solid ${filter===f?"rgba(255,255,255,0.30)":"rgba(255,255,255,0.08)"}`, borderRadius:20, padding:"6px 16px", fontSize:12, fontWeight:filter===f?700:400, fontFamily:F, cursor:"pointer", whiteSpace:"nowrap" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {filtered.map(card=>(
          <div key={card.id} onClick={()=>setDetailCard(card)} style={{ background:COLORS.card, borderRadius:16, border:`1px solid ${COLORS.border}`, cursor:"pointer", overflow:"hidden", padding:4 }}>
            <div style={{ position:"relative" }}>
              <img src={getImg(card)} style={{ width:"100%", height:90, objectFit:"cover", display:"block", borderRadius:12 }}/>
              {card.tag && <span style={{ position:"absolute", top:8, right:8, background:card.tag==="Oferta"?COLORS.danger:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", color:"#fff", fontSize:9, fontFamily:F, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>{card.tag}</span>}
            </div>
            <div style={{ padding:"12px 14px" }}>
              <p style={{ color:COLORS.text, fontWeight:700, fontSize:13, margin:"0 0 2px", fontFamily:F }}>{card.name}</p>
              <p style={{ color:COLORS.textSub, fontSize:10, margin:"0 0 12px", fontFamily:F }}>
                {(() => {
                  const a = (card.amounts||[])[0];
                  const u = getUsdt(card, a);
                  const num = parseFloat(String(a));
                  if (u) return `Desde ${fmtBs(null, tasa, parseFloat(u))}`;
                  if (!isNaN(num)) return `Desde ${fmtBs(num, tasa)}`;
                  return `Desde ${a||""}`;
                })()}
              </p>
              <button style={{ width:"100%", background:"rgba(255,255,255,0.10)", color:COLORS.text, border:"1px solid rgba(255,255,255,0.20)", borderRadius:8, padding:"8px", fontSize:11, fontFamily:F, fontWeight:700, cursor:"pointer" }}>VER MONTOS →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function NexusScreen() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"#0a0a14", zIndex:0 }}>
      {!loaded && (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, zIndex:2, background:"#0a0a14" }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,#7B6FFF,#4F8EFF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>◈</div>
          <p style={{ color:"#F0EDE8", fontSize:15, fontFamily:F, margin:0, fontWeight:700 }}>Nexus IA</p>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12, fontFamily:F, margin:0 }}>Cargando tu agente...</p>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            {[0,1,2].map(i=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#7B6FFF", animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
          </div>
          <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.5);opacity:1}}`}</style>
        </div>
      )}
      <iframe
        src="https://nexusgaming.lat/dashboard"
        onLoad={() => setLoaded(true)}
        style={{ width:"100%", height:"100%", border:"none", opacity: loaded ? 1 : 0, transition:"opacity 0.4s", display:"block" }}
        allow="microphone *; camera *; clipboard-write *"
        title="Nexus IA"
      />
    </div>
  );
}


function ProfileScreen({ profilePhoto, setProfilePhoto, session, setSession }) {
  const fileRef = useRef(null);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const user = session ? { email: session.user?.email, name: session.user?.user_metadata?.full_name||session.user?.email?.split("@")[0], avatar: session.user?.user_metadata?.avatar_url } : null;

  const handleEmail = async () => {
    setAuthError(""); setAuthLoading(true);
    const res = authMode==="login" ? await sbAuth.signIn(email,password) : await sbAuth.signUp(email,password);
    setAuthLoading(false);
    if (res.access_token) {
      const s = { access_token:res.access_token, refresh_token:res.refresh_token, user:res.user };
      sbAuth.saveSession(s); setSession(s);
    } else if (res.error || res.msg) {
      setAuthError(res.error_description||res.msg||"Error al autenticar");
    } else if (authMode==="register") {
      setMsg("✅ Revisa tu email para confirmar tu cuenta");
    }
  };

  const handleLogout = async () => {
    if (session?.access_token) await sbAuth.signOut(session.access_token);
    sbAuth.clearSession(); setSession(null);
  };

  // Not logged in — show login/register screen
  if (!user) return (
    <div style={{ padding:"24px 20px", paddingBottom:100, width:"100%", boxSizing:"border-box" }}>
      <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"0 0 4px", letterSpacing:"0.1em" }}>CUENTA</p>
      <h2 style={{ color:COLORS.text, fontSize:24, fontWeight:900, margin:"0 0 24px", fontFamily:F }}>Perfil<span style={{ color:COLORS.accent }}>.</span></h2>
      <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:20, padding:"24px 20px", marginBottom:16 }}>
        <p style={{ color:COLORS.text, fontSize:15, fontWeight:800, fontFamily:F, margin:"0 0 4px" }}>{authMode==="login"?"Iniciar sesión":"Crear cuenta"}</p>
        <p style={{ color:COLORS.textMuted, fontSize:12, fontFamily:F, margin:"0 0 20px" }}>{authMode==="login"?"Accede a tu historial de pedidos":"Regístrate para guardar tus compras"}</p>
        {msg && <p style={{ color:"#4ade80", fontSize:12, fontFamily:F, margin:"0 0 12px" }}>{msg}</p>}
        {authError && <p style={{ color:"#ff6b6b", fontSize:12, fontFamily:F, margin:"0 0 12px" }}>{authError}</p>}
        <div style={{ marginBottom:12 }}>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, margin:"0 0 4px" }}>EMAIL</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email" style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:14, fontFamily:F, outline:"none" }}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, margin:"0 0 4px" }}>CONTRASEÑA</p>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password" style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:14, fontFamily:F, outline:"none" }}/>
        </div>
        <button disabled={authLoading||!email||!password} onClick={handleEmail} style={{ width:"100%", padding:"14px", background:(!authLoading&&email&&password)?"linear-gradient(135deg,#7B6FFF,#4F8EFF)":"rgba(255,255,255,0.05)", border:"none", borderRadius:12, color:(!authLoading&&email&&password)?"#fff":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:800, fontFamily:F, cursor:"pointer", marginBottom:12 }}>
          {authLoading?"Cargando...":(authMode==="login"?"Entrar":"Crear cuenta")}
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
          <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:0 }}>o</p>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
        </div>
        <button onClick={()=>sbAuth.signInWithGoogle()} style={{ width:"100%", padding:"14px", background:"#fff", border:"none", borderRadius:12, color:"#333", fontSize:14, fontWeight:700, fontFamily:F, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>
      </div>
      <button onClick={()=>{ setAuthMode(m=>m==="login"?"register":"login"); setAuthError(""); setMsg(""); }} style={{ width:"100%", padding:"12px", background:"none", border:"none", color:COLORS.textMuted, fontSize:13, fontFamily:F, cursor:"pointer" }}>
        {authMode==="login"?"¿No tienes cuenta? Regístrate":"¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );

  // Logged in
  return (
    <div style={{ padding:"24px 20px", paddingBottom:100, width:"100%", boxSizing:"border-box" }}>
      <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"0 0 4px", letterSpacing:"0.1em" }}>CUENTA</p>
      <h2 style={{ color:COLORS.text, fontSize:24, fontWeight:900, margin:"0 0 24px", fontFamily:F }}>Perfil<span style={{ color:COLORS.accent }}>.</span></h2>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
        <div style={{ width:64, height:64, borderRadius:20, overflow:"hidden", background:`linear-gradient(135deg,${COLORS.neon},${COLORS.accent})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(180,180,255,0.3)", flexShrink:0 }}>
          {user.avatar ? <img src={user.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        </div>
        <div>
          <h3 style={{ color:COLORS.text, fontWeight:800, margin:0, fontSize:18, fontFamily:F }}>{user.name}</h3>
          <p style={{ color:COLORS.textMuted, fontSize:12, margin:"4px 0 0", fontFamily:F }}><GlowDot/>{user.email}</p>
        </div>
      </div>
      {[{icon:"🎁",label:"Mis Gift Cards",sub:"Historial de compras"},{icon:"🔔",label:"Notificaciones",sub:"Ofertas y novedades"},{icon:"⚙️",label:"Ajustes",sub:"Cuenta y preferencias"},{icon:"❓",label:"Ayuda",sub:"Soporte Start Game"}].map((item,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:COLORS.card, borderRadius:14, border:`1px solid ${COLORS.border}`, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
          <span style={{ fontSize:22 }}>{item.icon}</span>
          <div style={{ flex:1 }}><p style={{ color:COLORS.text, fontWeight:700, fontSize:14, margin:0, fontFamily:F }}>{item.label}</p><p style={{ color:COLORS.textMuted, fontSize:11, margin:"2px 0 0", fontFamily:F }}>{item.sub}</p></div>
          <span style={{ color:COLORS.textMuted }}>›</span>
        </div>
      ))}
      <button onClick={handleLogout} style={{ width:"100%", marginTop:24, padding:"14px", background:"rgba(255,77,106,0.1)", border:"1px solid rgba(255,77,106,0.3)", borderRadius:12, color:"#FF4D6A", fontSize:14, fontWeight:700, fontFamily:F, cursor:"pointer" }}>
        Cerrar sesión
      </button>
      <div style={{ marginTop:16, padding:"16px", background:"rgba(255,255,255,0.04)", borderRadius:14, border:"1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ color:COLORS.text, fontFamily:F, fontSize:11, fontWeight:700, margin:"0 0 4px" }}>START GAME v1.0.0</p>
        <p style={{ color:COLORS.textMuted, fontSize:12, margin:0, fontFamily:F }}>Tu plataforma gaming.</p>
      </div>
    </div>
  );
}
function CartPanel({ cart, onClose, onRemove, onUpdateQty, onCheckout }) {
  const tasa = useTasa();
  const total = cart.reduce((sum, item) => { const val = parseFloat(item.selectedAmount.replace("$","")); return sum + (!isNaN(val) ? val * item.quantity : 0); }, 0);
  const totalUsdt = cart.reduce((sum, item) => { const r=item.selectedAmount.replace("$","").trim(); const u=getUsdt(item,r); return sum+(u?parseFloat(u)*item.quantity:0); }, 0);
  const useUsdt = totalUsdt > 0;
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:300, backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"fixed", bottom:0, left:0, width:"100%", background:"#12121E", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px 24px 0 0", zIndex:301, padding:"0 0 32px", maxHeight:"82vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}><div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)" }}/></div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><CartIcon count={0}/><h2 style={{ color:COLORS.text, fontSize:20, fontWeight:800, margin:0, fontFamily:F }}>Mi Carrito</h2></div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:COLORS.textMuted, cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✕</button>
        </div>
        <div style={{ height:1, background:"rgba(255,255,255,0.07)", marginBottom:16 }}/>
        {cart.length===0 && <div style={{ textAlign:"center", padding:"40px 20px" }}><div style={{ fontSize:48, marginBottom:12 }}>🛒</div><p style={{ color:COLORS.textMuted, fontFamily:F, fontSize:14 }}>Tu carrito está vacío</p></div>}
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>
          {cart.map((item,i) => {
            const rawAmt = item.selectedAmount.replace("$","").trim();
            const val = parseFloat(rawAmt);
            const isNumAmt = !isNaN(val);
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"12px" }}>
                <img src={getImg(item)} style={{ width:64, height:48, objectFit:"cover", borderRadius:10, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:COLORS.text, fontWeight:700, fontSize:13, margin:"0 0 4px", fontFamily:F, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</p>
                  {(() => { const usdt = getUsdt(item, rawAmt); return usdt
                    ? <p style={{ color:"rgba(180,180,255,0.9)", fontWeight:700, fontSize:12, margin:0, fontFamily:F }}>{isNumAmt ? `$${val} USD` : rawAmt}</p>
                    : <p style={{ color:"rgba(180,180,255,0.9)", fontWeight:700, fontSize:12, margin:0, fontFamily:F }}>{isNumAmt ? `$${val} USD` : rawAmt}</p>; })()}
                </div>
                <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                  <button onClick={()=>item.quantity===1?onRemove(i):onUpdateQty(i,item.quantity-1)} style={{ width:28, height:28, background:"none", border:"none", color:COLORS.text, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                  <span style={{ minWidth:22, textAlign:"center", color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F }}>{item.quantity}</span>
                  <button onClick={()=>onUpdateQty(i,item.quantity+1)} style={{ width:28, height:28, background:"none", border:"none", color:COLORS.text, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                  <p style={{ color:COLORS.text, fontWeight:800, fontSize:13, margin:0, fontFamily:F }}>
                    {(() => { const usdt = getUsdt(item, rawAmt); if (usdt) return fmtBs(null, tasa, parseFloat(usdt)*item.quantity); if (isNumAmt) return fmtBs(val*item.quantity, tasa); return "—"; })()}
                  </p>
                  <button onClick={()=>onRemove(i)} style={{ background:"rgba(255,77,106,0.15)", border:"1px solid rgba(255,77,106,0.3)", borderRadius:6, color:COLORS.danger, cursor:"pointer", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
        {cart.length>0 && (
          <div style={{ padding:"20px 16px 0" }}>
            <div style={{ height:1, background:"rgba(255,255,255,0.07)", marginBottom:16 }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ color:COLORS.textMuted, fontSize:14, fontFamily:F, fontWeight:600, margin:0 }}>Total</p>
              <div style={{ textAlign:"right" }}>
                <p style={{ color:COLORS.text, fontSize:20, fontWeight:900, fontFamily:F, margin:0 }}>{useUsdt ? fmtBs(null, tasa, totalUsdt) : fmtBs(total, tasa)}</p>
                {useUsdt && (
                  <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"2px 0 0" }}>
                    {totalUsdt.toFixed(2)} USDT
                  </p>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:"14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:14, color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F, cursor:"pointer" }}>Seguir comprando</button>
              <button onClick={onCheckout} style={{ flex:1.5, padding:"14px", background:"linear-gradient(135deg,#7B6FFF,#4F8EFF)", border:"none", borderRadius:14, color:"#fff", fontSize:14, fontWeight:800, fontFamily:F, cursor:"pointer", boxShadow:"0 4px 20px rgba(100,100,255,0.35)" }}>Checkout →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
function CheckoutScreen({ cart, onBack, onOrderCreated, session }) {
  const [method, setMethod] = useState(null);
  const [ref, setRef] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isGuest = !session?.user?.email;
  const customerEmail = isGuest ? guestEmail.trim() : session.user.email;
  const tasa = useTasa();
  const total = cart.reduce((s, i) => s + parseFloat(i.selectedAmount.replace("$","")) * i.quantity, 0);
  const totalUsdt = cart.reduce((s, i) => { const r=i.selectedAmount.replace("$","").trim(); const u=getUsdt(i,r); const n=parseFloat(r); return s+(u?parseFloat(u)*i.quantity:(!isNaN(n)?n*i.quantity:0)); }, 0);
  const useUsdt = cart.some(i => getUsdt(i, i.selectedAmount.replace("$","").trim()));

  const METHODS = [
    {
      id: "pagomovil",
      label: "Pago Móvil",
      icon: "📱",
      color: "#00C896",
      info: [
        { label: "Teléfono", value: "0424-3663119" },
        { label: "Cédula",   value: "28.236.056" },
        { label: "Banco",    value: "Mercantil" },
      ],
      fieldLabel: "Últimos 4 dígitos de la referencia",
      fieldPlaceholder: "Ej: 4821",
      maxLen: 4,
    },
    {
      id: "binance",
      label: "Binance Pay",
      icon: "🟡",
      color: "#F3BA2F",
      info: [{ label: "Pay ID", value: "62569716" }],
      fieldLabel: "ID de la orden",
      fieldPlaceholder: "Ej: 123456789",
      maxLen: 20,
    },
    {
      id: "zinli",
      label: "Zinli",
      icon: "💜",
      color: "#8B5CF6",
      info: [{ label: "Correo", value: "Gil751630@gmail.com" }],
      fieldLabel: "Nombre del remitente",
      fieldPlaceholder: "Ej: Juan Pérez",
      maxLen: 40,
    },
    {
      id: "googlepay",
      label: "Google Pay",
      icon: "🔵",
      color: "#4285F4",
      info: [],
      fieldLabel: "ID de la transacción",
      fieldPlaceholder: "Ej: TXN-XXXXXXX",
      maxLen: 30,
    },
  ];

  const selected = METHODS.find(m => m.id === method);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const canSubmit = method && ref.trim().length >= 3 && !loading && (!isGuest || isValidEmail);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const isManual = cart.some(i => i.manual_delivery);
      const totalBs = useUsdt ? parseFloat((totalUsdt * tasa).toFixed(2)) : parseFloat((total * tasa).toFixed(2));
      const result = await sb.insert("orders", {
        customer_ref: ref.trim(),
        customer_email: customerEmail,
        payment_method: method,
        items: cart.map(i => ({ name: i.name, amount: i.selectedAmount, quantity: i.quantity })),
        total,
        total_bs: totalBs,
        status: "pending",
        manual_delivery: isManual
      });
      if (result && result[0] && result[0].id) {
        onOrderCreated(result[0].id);
      } else if (result && result.code) {
        setError(`Error Supabase: ${result.message || result.code}`);
      } else {
        setError("Respuesta inesperada. Intenta de nuevo.");
        console.error("Supabase response:", JSON.stringify(result));
      }
    } catch(e) {
      setError(`Error: ${e.message}`);
      console.error("Fetch error:", e);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", paddingBottom:120, background:COLORS.bg }}>
      <div style={{ padding:"20px 20px 16px", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:COLORS.text, cursor:"pointer", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>←</button>
        <div>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, margin:0, letterSpacing:"0.12em" }}>CHECKOUT</p>
          <h2 style={{ color:COLORS.text, fontSize:17, fontWeight:800, margin:0, fontFamily:F }}>Método de pago</h2>
        </div>
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"16px", marginBottom:20 }}>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 12px" }}>RESUMEN DEL PEDIDO</p>
          {cart.map((item, i) => {
            const rawA = item.selectedAmount.replace("$","").trim();
            const val = parseFloat(rawA);
            const isNumA = !isNaN(val);
            const usdt = getUsdt(item, rawA);
            const itemBs = usdt ? fmtBs(null, tasa, parseFloat(usdt)*item.quantity) : (isNumA ? fmtBs(val*item.quantity, tasa) : "—");
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i < cart.length-1 ? 10 : 14 }}>
                <img src={getImg(item)} style={{ width:44, height:32, objectFit:"cover", borderRadius:6, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</p>
                  <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:0 }}>{item.selectedAmount} × {item.quantity}</p>
                </div>
                <p style={{ color:COLORS.text, fontSize:12, fontWeight:800, fontFamily:F, margin:0, flexShrink:0 }}>{itemBs}</p>
              </div>
            );
          })}
          <div style={{ height:1, background:"rgba(255,255,255,0.08)", marginBottom:12 }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ color:COLORS.textMuted, fontSize:13, fontFamily:F, fontWeight:600, margin:0 }}>Total a pagar</p>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:COLORS.text, fontSize:20, fontWeight:900, fontFamily:F, margin:0 }}>{useUsdt ? fmtBs(null, tasa, totalUsdt) : fmtBs(total, tasa)}</p>
              {useUsdt && <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"2px 0 0" }}>{totalUsdt.toFixed(2)} USDT</p>}
            </div>
          </div>
        </div>

        {isGuest && (
          <div style={{ marginBottom:20 }}>
            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, fontWeight:600, letterSpacing:"0.08em", margin:"0 0 8px" }}>CORREO ELECTRÓNICO</p>
            <input
              type="email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{ width:"100%", boxSizing:"border-box", padding:"14px 16px", background:"rgba(255,255,255,0.07)", border:`1px solid ${isValidEmail ? "#00C89688" : guestEmail.length > 0 ? "#FF4D4F88" : "rgba(255,255,255,0.18)"}`, borderRadius:12, color:COLORS.text, fontSize:14, fontFamily:F, outline:"none", transition:"border 0.2s" }}
            />
            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"6px 0 0" }}>Recibirás el código de tu compra en este correo</p>
          </div>
        )}
        <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, letterSpacing:"0.1em", fontWeight:600, margin:"0 0 10px" }}>SELECCIONA UN MÉTODO</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {METHODS.map(m => (
            <button key={m.id} onClick={()=>{ setMethod(m.id); setRef(""); setError(""); }} style={{ background: method===m.id ? `${m.color}22` : "rgba(255,255,255,0.05)", border:`1.5px solid ${method===m.id ? m.color : "rgba(255,255,255,0.10)"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.15s" }}>
              <span style={{ fontSize:22 }}>{m.icon}</span>
              <span style={{ color: method===m.id ? m.color : COLORS.textMuted, fontSize:12, fontWeight:700, fontFamily:F }}>{m.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{ marginBottom:16 }}>
            {selected.info.length > 0 && (
              <div style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${selected.color}44`, borderRadius:16, padding:"16px", marginBottom:14 }}>
                <p style={{ color:selected.color, fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 12px" }}>DATOS PARA TRANSFERIR {useUsdt ? fmtBs(null, tasa, totalUsdt) : fmtBs(total, tasa)}</p>
                {selected.info.map((row, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: i < selected.info.length-1 ? 10 : 0 }}>
                    <span style={{ color:COLORS.textMuted, fontSize:13, fontFamily:F }}>{row.label}</span>
                    <span style={{ color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, fontWeight:600, letterSpacing:"0.08em", margin:"0 0 8px" }}>COMPROBANTE</p>
            <input value={ref} onChange={e => setRef(e.target.value.slice(0, selected.maxLen))} placeholder={selected.fieldPlaceholder} style={{ width:"100%", boxSizing:"border-box", padding:"14px 16px", background:"rgba(255,255,255,0.07)", border:`1px solid ${ref.length > 0 ? selected.color+"88" : "rgba(255,255,255,0.18)"}`, borderRadius:12, color:COLORS.text, fontSize:14, fontFamily:F, outline:"none", transition:"border 0.2s" }}/>
            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:"6px 0 0" }}>{selected.fieldLabel}</p>
          </div>
        )}

        {error && <p style={{ color:COLORS.danger, fontSize:12, fontFamily:F, textAlign:"center", marginBottom:12 }}>{error}</p>}

        <button disabled={!canSubmit} onClick={handleConfirm} style={{ width:"100%", padding:"16px", background: !canSubmit ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#7B6FFF,#4F8EFF)", border:"none", borderRadius:16, color: !canSubmit ? COLORS.textMuted : "#fff", fontSize:15, fontWeight:800, fontFamily:F, cursor: !canSubmit ? "not-allowed" : "pointer", transition:"all 0.2s", boxShadow: !canSubmit ? "none" : "0 4px 20px rgba(100,100,255,0.35)" }}>
          {loading ? "Enviando pedido..." : "Confirmar pago"}
        </button>
        <p style={{ color:COLORS.textMuted, fontSize:10, textAlign:"center", fontFamily:F, marginTop:12 }}>🔒 Pago manual verificado por el equipo Start Game</p>
      </div>
    </div>
  );
}

/* ─── ORDER STATUS SCREEN ─── */
function OrderStatusScreen({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub;
    const load = async () => {
      const row = await sb.getOne("orders", orderId);
      setOrder(row);
      setLoading(false);
    };
    load();
    unsub = sb.subscribe("orders", orderId, (row) => {
      setOrder(row);
    });
    return () => { if (unsub) unsub(); };
  }, [orderId]);

  const STATUS = {
    pending: {
      icon: "⏳",
      color: "#FFFFFF",
      title: "Verificando pago",
      sub: "Estamos revisando tu comprobante. Esto toma menos de 10 minutos.",
      bg: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.12)",
    },
    verified: {
      icon: "🔍",
      color: "#4F8EFF",
      title: "Pago confirmado",
      sub: "Tu pago fue verificado. Estamos preparando tu gift card.",
      bg: "rgba(79,142,255,0.10)",
      border: "rgba(79,142,255,0.30)",
    },
    delivered: {
      icon: null,
      color: "#00C896",
      title: "¡Gift card entregada!",
      sub: "Tu pedido fue completado exitosamente.",
      bg: "rgba(0,200,150,0.10)",
      border: "rgba(0,200,150,0.30)",
    },
  };

  const st = order ? (STATUS[order.status] || STATUS.pending) : STATUS.pending;
  const WS_NUMBER = "584243663119";

  // Manual delivery screen
  if (!loading && order?.manual_delivery) return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:COLORS.text, cursor:"pointer", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>←</button>
        <div>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, margin:0, letterSpacing:"0.12em" }}>PEDIDO RECIBIDO</p>
          <h2 style={{ color:COLORS.text, fontSize:16, fontWeight:800, margin:0, fontFamily:F }}>#{orderId?.slice(0,8).toUpperCase()}</h2>
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ width:"100%", maxWidth:340 }}>
          <div style={{ background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:24, padding:"28px 24px", textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
            <h3 style={{ color:"#25D366", fontSize:20, fontWeight:800, fontFamily:F, margin:"0 0 8px" }}>Pedido registrado</h3>
            <p style={{ color:COLORS.textMuted, fontSize:13, fontFamily:F, margin:0, lineHeight:1.5 }}>Tu pedido fue recibido. Para completarlo, envía tu comprobante de pago por WhatsApp.</p>
          </div>
          {order.items && order.items.length > 0 && (
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"14px", marginBottom:20 }}>
              <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 10px" }}>TU PEDIDO</p>
              {order.items.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: i<order.items.length-1?8:0 }}>
                  <div>
                    <p style={{ color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F, margin:0 }}>{item.name}</p>
                    <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:0 }}>{item.amount} × {item.quantity}</p>
                  </div>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
                <p style={{ color:COLORS.textMuted, fontSize:12, fontFamily:F, margin:0 }}>Ref. pago</p>
                <p style={{ color:COLORS.text, fontSize:12, fontWeight:700, fontFamily:F, margin:0 }}>{order.customer_ref}</p>
              </div>
            </div>
          )}
          <a href={`https://wa.me/${WS_NUMBER}?text=${encodeURIComponent(
            `Hola, ya verifiqué mi pago:\nPedido: #${orderId?.slice(0,8).toUpperCase()}\nMonto en Bs: ${order.total_bs ? Number(order.total_bs).toLocaleString("es-VE", {minimumFractionDigits:0, maximumFractionDigits:0}) : "—"}\nNro. de referencia: ${order.customer_ref}\nMétodo de pago: ${{pagomovil:"Pago Móvil",binance:"Binance Pay",zinli:"Zinli",zelle:"Zelle"}[order.payment_method] || order.payment_method || "—"}\nProductos:\n${(order.items||[]).map(i => `- ${i.name} - ${i.amount.replace("$","").trim()}$ x${i.quantity}`).join("\n")}`
          )}`} target="_blank" rel="noreferrer"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", boxSizing:"border-box", padding:"16px", background:"#25D366", borderRadius:14, color:"#fff", fontSize:15, fontWeight:800, fontFamily:F, textDecoration:"none", boxShadow:"0 4px 20px rgba(37,211,102,0.35)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.855L0 24l6.29-1.49A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.37l-.36-.214-3.732.884.916-3.636-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
            Verificar pago por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", gap:14 }}>
        {order?.status !== "delivered" && <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:COLORS.text, cursor:"pointer", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>←</button>}
        <div>
          <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, margin:0, letterSpacing:"0.12em" }}>ESTADO DEL PEDIDO</p>
          <h2 style={{ color:COLORS.text, fontSize:16, fontWeight:800, margin:0, fontFamily:F }}>#{orderId?.slice(0,8).toUpperCase()}</h2>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
        {loading ? (
          <div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:COLORS.textMuted, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div>
        ) : (
          <>
            {/* Status card */}
            <div style={{ background:st.bg, border:`1px solid ${st.border}`, borderRadius:24, padding:"28px 24px", textAlign:"center", width:"100%", maxWidth:340, marginBottom:24 }}>
              {order?.status === "pending" ? (
                <>
                  <style>{`@keyframes spin{0%{stroke-dashoffset:150}100%{stroke-dashoffset:-150}}`}</style>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="24" stroke="rgba(79,142,255,0.2)" strokeWidth="5"/>
                      <circle cx="32" cy="32" r="24" stroke="#4F8EFF" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray="60 150" style={{ animation:"spin 1.4s linear infinite", transformOrigin:"center", transform:"rotate(-90deg)" }}/>
                    </svg>
                  </div>
                  <h3 style={{ color:st.color, fontSize:20, fontWeight:800, fontFamily:F, margin:"0 0 12px" }}>{st.title}</h3>
                  <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px", marginBottom:8 }}>
                    <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 4px" }}>MÉTODO DE PAGO</p>
                    <p style={{ color:"#fff", fontSize:15, fontWeight:800, fontFamily:F, margin:0 }}>
                      {{"pagomovil":"📱 Pago Móvil","binance":"🟡 Binance Pay","zinli":"💜 Zinli","googlepay":"🔵 Google Pay"}[order?.payment_method] || order?.payment_method}
                    </p>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px", marginBottom:8 }}>
                    <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 4px" }}>Monto pagado</p>
                    <p style={{ color:"#ffffff", fontSize:22, fontWeight:900, fontFamily:F, margin:0 }}>
                      {order?.total_bs ? `Bs. ${Number(order.total_bs).toLocaleString("es-VE",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—"}
                    </p>
                  </div>
                  {order?.items && order.items.length > 0 && (
                    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px" }}>
                      <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 8px" }}>TU PEDIDO</p>
                      {order.items.map((item,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: i < order.items.length-1 ? 6 : 0 }}>
                          <p style={{ color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, margin:0 }}>{item.name}</p>
                          <p style={{ color:"#F0EDE8", fontSize:12, fontFamily:F, margin:0 }}>{item.amount} × {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {order?.status === "delivered" ? (
                    <>
                      <style>{`
                        @keyframes circleIn{0%{stroke-dashoffset:188.5}100%{stroke-dashoffset:0}}
                        @keyframes checkIn{0%{stroke-dashoffset:50}100%{stroke-dashoffset:0}}
                        @keyframes popIn{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
                      `}</style>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:16, animation:"popIn 0.5s ease forwards" }}>
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                          <circle cx="36" cy="36" r="30" stroke="rgba(0,200,150,0.2)" strokeWidth="4"/>
                          <circle cx="36" cy="36" r="30" stroke="#00C896" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray="188.5" strokeDashoffset="188.5"
                            style={{ animation:"circleIn 0.7s ease forwards", transformOrigin:"center", transform:"rotate(-90deg)" }}/>
                          <polyline points="22,37 31,46 50,27" stroke="#00C896" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="50" strokeDashoffset="50"
                            style={{ animation:"checkIn 0.4s ease 0.5s forwards" }}/>
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize:48, marginBottom:16 }}>{st.icon}</div>
                  )}
                  <h3 style={{ color:st.color, fontSize:20, fontWeight:800, fontFamily:F, margin:"0 0 8px" }}>{st.title}</h3>
                  <p style={{ color:COLORS.textMuted, fontSize:13, fontFamily:F, margin:0, lineHeight:1.5 }}>{st.sub}</p>
                </>
              )}
            </div>

            {/* Gift code — shown only when delivered */}
            {order?.status === "delivered" && order?.gift_code && (
              <div style={{ width:"100%", maxWidth:340, marginBottom:20 }}>
                {/* Products summary */}
                {order.items && order.items.length > 0 && (
                  <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, padding:"14px", marginBottom:12 }}>
                    <p style={{ color:COLORS.textMuted, fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 10px" }}>TU PEDIDO</p>
                    {order.items.map((item, i) => {
                      const prod = GLOBAL_PRODUCTS.find(g => g.name === item.name) || {};
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i < order.items.length-1 ? 10 : 0 }}>
                          <img src={getImg(prod.img_url ? prod : { name: item.name })} style={{ width:44, height:32, objectFit:"cover", borderRadius:8, flexShrink:0 }}/>
                          <div style={{ flex:1 }}>
                            <p style={{ color:COLORS.text, fontSize:13, fontWeight:700, fontFamily:F, margin:0 }}>{item.name}</p>
                            <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, margin:0 }}>{item.amount} × {item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Code card */}
                <div style={{ background:"rgba(0,200,150,0.08)", border:"1px solid rgba(0,200,150,0.35)", borderRadius:16, padding:"20px", textAlign:"center" }}>
                  <p style={{ color:"rgba(0,200,150,1)", fontSize:11, fontFamily:F, fontWeight:700, letterSpacing:"0.12em", margin:"0 0 10px" }}>TU CÓDIGO</p>
                  <p style={{ color:COLORS.text, fontSize:22, fontWeight:900, fontFamily:F, margin:"0 0 12px", letterSpacing:"0.08em" }}>{order.gift_code}</p>
                  <button onClick={()=>navigator.clipboard?.writeText(order.gift_code)} style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.20)", borderRadius:10, color:COLORS.text, fontSize:12, fontFamily:F, fontWeight:700, padding:"8px 20px", cursor:"pointer" }}>📋 Copiar código</button>
                </div>
              </div>
            )}



            {order?.status === "delivered" ? (
              <button onClick={onBack} style={{ marginTop:20, padding:"14px 32px", background:"linear-gradient(135deg,#7B6FFF,#4F8EFF)", border:"none", borderRadius:14, color:"#fff", fontSize:14, fontWeight:800, fontFamily:F, cursor:"pointer" }}>Ir al inicio</button>
            ) : (
              <p style={{ color:COLORS.textMuted, fontSize:11, fontFamily:F, textAlign:"center", marginTop:20 }}>🔄 Actualizando automáticamente...</p>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.4);opacity:1}}`}</style>
    </div>
  );
}

/* ─── ADMIN PANEL ─── */
function AdminPanel({ onExit }) {
  const [tab, setTab] = useState("orders");
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A14", fontFamily:F }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 0", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ color:"#F0EDE8", fontSize:9, fontFamily:F, margin:0, letterSpacing:"0.15em" }}>PANEL ADMIN</p>
            <h2 style={{ color:"#FFFFFF", fontSize:17, fontWeight:800, margin:0, fontFamily:F }}>Start Game</h2>
          </div>
          <button onClick={onExit} style={{ background:"rgba(255,77,106,0.12)", border:"1px solid rgba(255,77,106,0.3)", borderRadius:10, color:"#FF4D6A", fontSize:12, fontFamily:F, padding:"7px 14px", cursor:"pointer" }}>Salir</button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:0 }}>
          {[{id:"orders",label:"Pedidos"},{id:"products",label:"Productos"},{id:"settings",label:"Ajustes"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 0", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?"#7B6FFF":"transparent"}`, color:tab===t.id?"#7B6FFF":"#F0EDE8", fontSize:12, fontWeight:700, fontFamily:F, cursor:"pointer", transition:"all 0.15s" }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowY:"auto", maxHeight:"calc(100vh - 100px)" }}>
        {tab==="orders"   && <AdminOrders/>}
        {tab==="products" && <AdminProducts/>}
        {tab==="settings" && <AdminSettings/>}
      </div>
    </div>
  );
}

/* ── Admin: Orders Tab ── */
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [giftCode, setGiftCode] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState({});
  const [collapsedDelivered, setCollapsedDelivered] = useState({});
  const tasa = useTasa();

  const load = async () => {
    const data = await sb.getAll("orders");
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); const iv = setInterval(load, 5000); return ()=>clearInterval(iv); }, []);

  const handleVerify = async (id) => { await sb.update("orders", id, { status:"verified" }); load(); };
  const handleDeliver = async () => {
    if (!giftCode.trim() || !selected) return;
    setSending(true);
    await sb.update("orders", selected.id, { status:"delivered", gift_code:giftCode.trim() });
    // Send email via EmailJS if customer has email
    if (selected.customer_email) {
      try {
        await sendGiftEmail({
          to_email: selected.customer_email,
          order_id: selected.id,
          gift_code: giftCode.trim(),
          items: selected.items,
          total: selected.total,
          payment_method: selected.payment_method,
        });
      } catch(e) { console.error("EmailJS error:", e); }
    }
    setSelected(null); setGiftCode(""); setSending(false); load();
  };

  const SL = { pending:"⏳ Pendiente", verified:"🔍 Verificado", delivered:"✅ Entregado" };
  const SC = { pending:"#F3BA2F", verified:"#4F8EFF", delivered:"#00C896" };
  const ML = { pagomovil:"📱 Pago Móvil", binance:"🟡 Binance", zinli:"💜 Zinli", googlepay:"🔵 Google Pay" };

  // Monthly filter for stats
  const now = new Date();
  const monthLabel = now.toLocaleDateString("es-VE", { month:"long", year:"numeric" });
  const monthOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Group orders by date
  const today = new Date().toDateString();
  const grouped = orders.reduce((acc, order) => {
    const d = new Date(order.created_at);
    const dateStr = d.toDateString();
    const isToday = dateStr === today;
    const label = isToday ? "Hoy" : d.toLocaleDateString("es-VE", { day:"2-digit", month:"2-digit", year:"numeric" });
    if (!acc[label]) acc[label] = { label, isToday, orders:[] };
    acc[label].orders.push(order);
    return acc;
  }, {});

  // Sort groups: today first, then by date descending
  const sortedGroups = Object.values(grouped).sort((a, b) => {
    if (a.isToday) return -1;
    if (b.isToday) return 1;
    const da = new Date(a.orders[0].created_at);
    const db = new Date(b.orders[0].created_at);
    return db - da;
  });

  const OrderCard = ({ order }) => (
    <div key={order.id} onClick={()=>{ setSelected(s => s?.id===order.id ? null : order); setGiftCode(""); }}
      style={{ background:selected?.id===order.id?"rgba(123,111,255,0.10)":"rgba(255,255,255,0.03)", border:`1px solid ${selected?.id===order.id?"rgba(123,111,255,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:14, padding:"13px", marginBottom:6, cursor:"pointer" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div>
          <p style={{ color:"#fff", fontSize:12, fontWeight:700, fontFamily:F, margin:"0 0 1px" }}>#{order.id?.slice(0,8).toUpperCase()}</p>
          <p style={{ color:"rgba(255,255,255,0.9)", fontSize:10, fontFamily:F, margin:0 }}>{new Date(order.created_at).toLocaleTimeString("es-VE", { hour:"2-digit", minute:"2-digit" })}</p>
        </div>
        <span style={{ background:`${SC[order.status]}22`, color:SC[order.status], fontSize:9, fontFamily:F, fontWeight:700, padding:"2px 8px", borderRadius:20, border:`1px solid ${SC[order.status]}44` }}>{SL[order.status]}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <p style={{ color:"#ffffff", fontSize:11, fontFamily:F, margin:"0 0 1px" }}>{ML[order.payment_method]||order.payment_method}</p>
          <p style={{ color:"rgba(255,255,255,0.9)", fontSize:10, fontFamily:F, margin:0 }}>Ref: {order.customer_ref}</p>
          {order.customer_email && <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"2px 0 0" }}>✉️ {order.customer_email}</p>}
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ color:"#fff", fontSize:14, fontWeight:800, fontFamily:F, margin:0 }}>{fmtBs(order.total||0, tasa)}</p>
          <p style={{ color:"rgba(255,255,255,0.9)", fontSize:10, fontFamily:F, margin:0 }}>${order.total} USD</p>
        </div>
      </div>
      {order.items && order.items.map((item,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"6px 10px", marginBottom:3 }}>
          <span style={{ fontSize:12 }}>🎁</span>
          <p style={{ color:"#ffffff", fontSize:11, fontFamily:F, fontWeight:600, margin:0, flex:1 }}>{item.name}</p>
          <span style={{ color:"rgba(255,255,255,0.9)", fontSize:10, fontFamily:F }}>{item.amount} × {item.quantity}</span>
        </div>
      ))}
      {selected?.id===order.id && order.status!=="delivered" && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.07)" }} onClick={e=>e.stopPropagation()}>
          {order.status==="pending" && (
            <button onClick={()=>handleVerify(order.id)} style={{ width:"100%", padding:"10px", background:"rgba(79,142,255,0.12)", border:"1px solid rgba(79,142,255,0.35)", borderRadius:10, color:"#4F8EFF", fontSize:12, fontWeight:700, fontFamily:F, cursor:"pointer" }}>🔍 Marcar como verificado</button>
          )}
          {order.status==="verified" && (
            <div>
              <input value={giftCode} onChange={e=>setGiftCode(e.target.value)} placeholder="Código gift card..." style={{ width:"100%", boxSizing:"border-box", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(0,200,150,0.4)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none", marginBottom:8 }}/>
              <button disabled={!giftCode.trim()||sending} onClick={handleDeliver} style={{ width:"100%", padding:"10px", background:giftCode.trim()?"linear-gradient(135deg,#00C896,#00A878)":"rgba(255,255,255,0.04)", border:"none", borderRadius:10, color:giftCode.trim()?"#fff":"rgba(255,255,255,0.25)", fontSize:13, fontWeight:800, fontFamily:F, cursor:giftCode.trim()?"pointer":"not-allowed" }}>
                {sending?"Enviando...":"✅ Entregar código"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding:"16px" }}>
      {/* Stats */}
      <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 8px", textTransform:"capitalize" }}>📊 {monthLabel}</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[{label:"Pendientes",count:monthOrders.filter(o=>o.status==="pending").length,color:"#F3BA2F"},
          {label:"Verificados",count:monthOrders.filter(o=>o.status==="verified").length,color:"#4F8EFF"},
          {label:"Entregados",count:monthOrders.filter(o=>o.status==="delivered").length,color:"#00C896"}
        ].map((s,i)=>(
          <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px", textAlign:"center" }}>
            <p style={{ color:s.color, fontSize:20, fontWeight:900, fontFamily:F, margin:"0 0 2px" }}>{s.count}</p>
            <p style={{ color:"rgba(255,255,255,0.9)", fontSize:9, fontFamily:F, margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.9)", textAlign:"center", padding:"40px 0", fontFamily:F }}>Cargando...</p>
      : orders.length===0 ? <p style={{ color:"#F0EDE8", textAlign:"center", padding:"40px 0", fontFamily:F }}>Sin pedidos aún</p>
      : sortedGroups.map(group => {
        const active = group.orders.filter(o => o.status !== "delivered");
        const delivered = group.orders.filter(o => o.status === "delivered");
        const isDayCollapsed = !group.isToday && collapsedDays[group.label];
        const isDeliveredCollapsed = collapsedDelivered[group.label] !== false; // collapsed by default

        return (
          <div key={group.label} style={{ marginBottom:16 }}>
            {/* Day header */}
            <div onClick={()=>{ if (!group.isToday) setCollapsedDays(p=>({...p,[group.label]:!p[group.label]})); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, cursor:group.isToday?"default":"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ height:1, width:12, background:"rgba(255,255,255,0.15)" }}/>
                <p style={{ color: group.isToday ? "#7B6FFF" : "#F0EDE8", fontSize:11, fontWeight:800, fontFamily:F, margin:0, letterSpacing:"0.08em" }}>
                  {group.isToday ? "📅 HOY" : `📅 ${group.label}`}
                </p>
                <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.15)" }}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:8 }}>
                <span style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"2px 8px", color:"rgba(255,255,255,0.9)", fontSize:9, fontFamily:F }}>{group.orders.length} pedidos</span>
                {!group.isToday && <span style={{ color:"#F0EDE8", fontSize:11 }}>{isDayCollapsed ? "▶" : "▼"}</span>}
              </div>
            </div>

            {!isDayCollapsed && (
              <>
                {/* Active orders (pending + verified) */}
                {active.map(order => <OrderCard key={order.id} order={order}/>)}

                {/* Delivered section — collapsible */}
                {delivered.length > 0 && (
                  <div style={{ marginTop: active.length > 0 ? 8 : 0 }}>
                    <div onClick={()=>setCollapsedDelivered(p=>({...p,[group.label]:!p[group.label]}))}
                      style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:6, padding:"7px 10px", background:"rgba(0,200,150,0.06)", border:"1px solid rgba(0,200,150,0.15)", borderRadius:10 }}>
                      <span style={{ color:"#00C896", fontSize:10, fontFamily:F, fontWeight:700, flex:1 }}>✅ Entregados ({delivered.length})</span>
                      <span style={{ color:"#F0EDE8", fontSize:11 }}>{isDeliveredCollapsed ? "▶" : "▼"}</span>
                    </div>
                    {!isDeliveredCollapsed && delivered.map(order => <OrderCard key={order.id} order={order}/>)}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductFormPanel({ form, setForm, editing, saving, saveProduct, onCancel }) {
  return (
    <div style={{ background:"rgba(123,111,255,0.08)", border:"1px solid rgba(123,111,255,0.25)", borderRadius:16, padding:"16px", marginBottom:16 }}>
      <p style={{ color:"#7B6FFF", fontSize:11, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 12px" }}>{editing?"EDITAR PRODUCTO":"NUEVO PRODUCTO"}</p>
      {[
        {label:"Nombre", key:"name", placeholder:"PlayStation"},
        {label:"Montos (separados por coma)", key:"amounts", placeholder:"5, 10, 25, 50 o Essential, Premium"},
        {label:"Tag (opcional)", key:"tag", placeholder:"Popular, Oferta, Hot, Nuevo"},
      ].map(f=>(
        <div key={f.key} style={{ marginBottom:10 }}>
          <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>{f.label}</p>
          <input value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
        </div>
      ))}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Descripción <span style={{ color:"rgba(255,255,255,0.3)" }}>(opcional)</span></p>
        <textarea value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe el producto, plataformas compatibles, beneficios..." rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none", resize:"vertical" }}/>
      </div>
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 6px" }}>IMAGEN DEL PRODUCTO</p>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {form.img_url && <img src={form.img_url} style={{ width:60, height:44, objectFit:"cover", borderRadius:8, border:"1px solid rgba(255,255,255,0.15)", flexShrink:0 }}/>}
          <div style={{ flex:1 }}>
            <label style={{ display:"block", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px dashed rgba(255,255,255,0.25)", borderRadius:10, color:"#F0EDE8", fontSize:12, fontFamily:F, cursor:"pointer", textAlign:"center" }}>
              📷 {form.img_url ? "Cambiar imagen" : "Subir imagen"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=ev=>setForm(p=>({...p,img_url:ev.target.result})); reader.readAsDataURL(file); }}/>
            </label>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:F, margin:"4px 0 0", textAlign:"center" }}>o pega una URL abajo</p>
          </div>
        </div>
        <input value={form.img_url||""} onChange={e=>setForm(p=>({...p,img_url:e.target.value}))} placeholder="https://... (URL de imagen)" style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#fff", fontSize:12, fontFamily:F, outline:"none", marginTop:6 }}/>
      </div>
      {form.amounts && form.amounts.split(",").map(a=>a.trim()).filter(a=>a.length>0).map(a => (
        <div key={`usdt_${a}`} style={{ marginBottom:10 }}>
          <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Precio USDT para <span style={{ color:"#F3BA2F" }}>{a}</span></p>
          <input value={form[`usdt_${a}`]||""} onChange={e=>setForm(p=>({...p,[`usdt_${a}`]:e.target.value}))} placeholder="Precio en USDT" style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(243,186,47,0.3)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
        </div>
      ))}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 6px" }}>Categoría <span style={{ color:"rgba(255,255,255,0.3)" }}>(máx. 2)</span></p>
        <div style={{ display:"flex", gap:8 }}>
          {["Consola","PC","Mobile"].map(c => {
            const cats = Array.isArray(form.category) ? form.category : [form.category].filter(Boolean);
            const selected = cats.includes(c);
            return (
              <button key={c} type="button" onClick={()=>{ const cur=Array.isArray(form.category)?form.category:[form.category].filter(Boolean); if(selected){setForm(p=>({...p,category:cur.filter(x=>x!==c)}));}else if(cur.length<2){setForm(p=>({...p,category:[...cur,c]}));} }} style={{ flex:1, padding:"9px 0", background:selected?"rgba(123,111,255,0.25)":"rgba(255,255,255,0.05)", border:`1px solid ${selected?"rgba(123,111,255,0.6)":"rgba(255,255,255,0.12)"}`, borderRadius:10, color:selected?"#A89FFF":"#F0EDE8", fontSize:12, fontWeight:selected?700:400, fontFamily:F, cursor:"pointer" }}>{c}</button>
            );
          })}
        </div>
        {(Array.isArray(form.category)?form.category:[form.category].filter(Boolean)).length===0 && <p style={{ color:"rgba(255,77,106,0.8)", fontSize:10, fontFamily:F, margin:"4px 0 0" }}>Selecciona al menos una categoría</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:0 }}>Activo</p>
        <button onClick={()=>setForm(p=>({...p,active:!p.active}))} style={{ width:40, height:22, borderRadius:11, background:form.active?"#7B6FFF":"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
          <span style={{ position:"absolute", top:3, left:form.active?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
        </button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:0 }}>⭐ Popular en la tienda</p>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:F, margin:"2px 0 0" }}>Aparece en "Populares" (máx. 6)</p>
        </div>
        <button onClick={()=>setForm(p=>({...p,featured:!p.featured}))} style={{ width:40, height:22, borderRadius:11, background:form.featured?"#F3BA2F":"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
          <span style={{ position:"absolute", top:3, left:form.featured?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
        </button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ flex:1 }}>
          <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:0 }}>Entrega manual</p>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:F, margin:"2px 0 0" }}>El cliente verifica por WhatsApp</p>
        </div>
        <button onClick={()=>setForm(p=>({...p,manual_delivery:!p.manual_delivery}))} style={{ width:40, height:22, borderRadius:11, background:form.manual_delivery?"#25D366":"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
          <span style={{ position:"absolute", top:3, left:form.manual_delivery?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
        </button>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#F0EDE8", fontSize:12, fontFamily:F, cursor:"pointer" }}>Cancelar</button>
        <button disabled={saving||!form.name||!form.amounts} onClick={saveProduct} style={{ flex:2, padding:"10px", background:(!saving&&form.name&&form.amounts)?"linear-gradient(135deg,#7B6FFF,#4F8EFF)":"rgba(255,255,255,0.05)", border:"none", borderRadius:10, color:(!saving&&form.name&&form.amounts)?"#fff":"rgba(255,255,255,0.3)", fontSize:12, fontWeight:800, fontFamily:F, cursor:(!saving&&form.name&&form.amounts)?"pointer":"not-allowed" }}>
          {saving?"Guardando...":"💾 Guardar"}
        </button>
      </div>
    </div>
  );
}

/* ── Admin: Products Tab ── */
function AdminProducts() {
  const products = useProducts();
  const tasa = useTasa();
  const [editing, setEditing] = useState(null); // null | product obj
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);

  const startEdit = (p) => {
    setEditing(p);
    setShowAdd(false);
    const usdtFields = {};
    (p.amounts||[]).forEach(a => { usdtFields[`usdt_${String(a)}`] = (p.usdt_prices||{})[String(a)]||""; });
    const cats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
    setForm({ _id: p.id, _original_name: p.name, name:p.name, category:cats, tag:p.tag||"", amounts:(p.amounts||[]).join(", "), active:p.active!==false, featured:p.featured||false, img_url:p.img_url||"", description:p.description||"", manual_delivery:p.manual_delivery||false, ...usdtFields });
  };

  const startAdd = () => {
    setEditing(null);
    setShowAdd(true);
    setForm({ name:"", category:[], tag:"", amounts:"", active:true, featured:false, img_url:"", description:"", manual_delivery:false });
  };

  const saveProduct = async () => {
    setSaving(true);
    const amountsArr = form.amounts.split(",").map(a=>a.trim()).filter(a=>a.length>0);
    const usdtPrices = {};
    amountsArr.forEach(a => { const v = parseFloat(form[`usdt_${a}`]); if (!isNaN(v)) usdtPrices[String(a)] = v; });
    const catsArr = Array.isArray(form.category) ? form.category : [form.category].filter(Boolean);
    const payload = { name:form.name, category:catsArr, tag:form.tag||null, amounts:amountsArr, usdt_prices:Object.keys(usdtPrices).length>0 ? usdtPrices : null, active:form.active, featured:form.featured||false, img_url:form.img_url||null, original_name: form._original_name||null, description:form.description||null, manual_delivery:form.manual_delivery||false };
    let result;
    const productId = form._id || (editing && editing.id);
    console.log("Saving with productId:", productId, "form._id:", form._id, "editing.id:", editing?.id);
    if (productId) {
      result = await sb.update("products", productId, payload);
    } else {
      result = await sb.insert("products", payload);
    }
    if (result && (result.code || result.error)) {
      alert("Error: " + (result.message || result.code || result.error));
      setSaving(false);
      return;
    }
    console.log("Save result:", JSON.stringify(result));
    // Update local state immediately from save result only
    if (Array.isArray(result) && result.length > 0) {
      const saved = result[0];
      console.log("Updating product in state:", saved.name, saved.id);
      setGlobalProducts(prev => {
        console.log("Prev products:", prev.map(p=>p.name));
        const exists = prev.find(p => p.id === saved.id);
        if (exists) return prev.map(p => p.id === saved.id ? saved : p);
        return [...prev, saved];
      });
    } else {
      console.log("No result array — result was:", result);
    }
    setSaving(false); setEditing(null); setShowAdd(false);
  };

  const toggleActive = async (p) => {
    const result = await sb.update("products", p.id, { active:!p.active });
    if (Array.isArray(result) && result.length > 0) {
      const saved = result[0];
      setGlobalProducts(prev => prev.map(x => x.id === saved.id ? saved : x));
    } else {
      setGlobalProducts(prev => prev.map(x => x.id === p.id ? {...x, active:!p.active} : x));
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`¿Eliminar ${p.name}?`)) return;
    await sb.delete("products", p.id);
    setGlobalProducts(prev => prev.filter(x => x.id !== p.id));
  };


  return (
    <div style={{ padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, letterSpacing:"0.1em", fontWeight:700, margin:0 }}>PRODUCTOS ({products.length})</p>
        <button onClick={startAdd} style={{ background:"rgba(123,111,255,0.15)", border:"1px solid rgba(123,111,255,0.35)", borderRadius:10, color:"#7B6FFF", fontSize:12, fontFamily:F, fontWeight:700, padding:"7px 14px", cursor:"pointer" }}>+ Nuevo</button>
      </div>
      {showAdd && <ProductFormPanel form={form} setForm={setForm} editing={editing} saving={saving} saveProduct={saveProduct} onCancel={()=>{ setEditing(null); setShowAdd(false); }}/>}
      {products.map(p=>(
        <div key={p.id}>
          {editing?.id===p.id && <ProductFormPanel form={form} setForm={setForm} editing={editing} saving={saving} saveProduct={saveProduct} onCancel={()=>{ setEditing(null); setShowAdd(false); }}/>}
          <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${p.active===false?"rgba(255,77,106,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:14, padding:"12px", marginBottom:8, opacity:p.active===false?0.6:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={getImg(p)} style={{ width:50, height:36, objectFit:"cover", borderRadius:8, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</p>
                <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:0 }}>
                  {(p.amounts||[]).join(", ")} · {Array.isArray(p.category)?p.category.join(", "):p.category}
                  {p.tag && <span style={{ color:"#F3BA2F", marginLeft:4 }}>· {p.tag}</span>}
                  {p.featured && <span style={{ color:"#F3BA2F", marginLeft:4 }}>· ⭐</span>}
                </p>
                <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, fontFamily:F, margin:"1px 0 0" }}>
                  {(() => {
                    const a = (p.amounts||[])[0];
                    const usdt = getUsdt(p, a);
                    const num = parseFloat(String(a));
                    if (usdt) return `desde ${fmtBs(null, tasa, parseFloat(usdt))}`;
                    if (!isNaN(num)) return `desde ${fmtBs(num, tasa)}`;
                    return `desde ${a||""}`;
                  })()}
                  {p.usdt_prices && Object.keys(p.usdt_prices).length>0 && <span style={{ color:"#F3BA2F", marginLeft:6 }}>· USDT ✓</span>}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}>
                <button onClick={()=>startEdit(p)} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:7, color:"#F0EDE8", fontSize:11, fontFamily:F, padding:"4px 10px", cursor:"pointer" }}>✏️</button>
                <button onClick={()=>toggleActive(p)} style={{ background:p.active===false?"rgba(0,200,150,0.12)":"rgba(255,77,106,0.12)", border:"none", borderRadius:7, color:p.active===false?"#00C896":"#FF4D6A", fontSize:10, fontFamily:F, padding:"4px 8px", cursor:"pointer" }}>{p.active===false?"Activar":"Ocultar"}</button>
                <button onClick={()=>deleteProduct(p)} style={{ background:"rgba(255,77,106,0.08)", border:"none", borderRadius:7, color:"#FF4D6A", fontSize:11, padding:"4px 8px", cursor:"pointer" }}>🗑</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Admin: Settings Tab ── */
function BannerEditor() {
  const [b, setB] = useState({ badge:"NEXUS IA DISPONIBLE", title:"Tu agente experto en videojuegos", subtitle:"Pregúntale cualquier cosa sobre gaming", btn:"HABLAR CON NEXUS →", visible:true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.banner&select=value`, { headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`} })
      .then(r=>r.json()).then(d=>{ if(d[0]?.value) setB(typeof d[0].value==="string"?JSON.parse(d[0].value):d[0].value); }).catch(()=>{});
  }, []);

  const save = async () => {
    setSaving(true);
    await sb.upsertSetting("banner", JSON.stringify(b));
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px", marginBottom:16 }}>
      <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 12px" }}>BANNER DE INICIO</p>
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Etiqueta (ej: NEXUS IA DISPONIBLE)</p>
        <input value={b.badge||""} onChange={e=>setB(p=>({...p,badge:e.target.value}))} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Título</p>
        <input value={b.title} onChange={e=>setB(p=>({...p,title:e.target.value}))} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:10 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Subtítulo</p>
        <input value={b.subtitle} onChange={e=>setB(p=>({...p,subtitle:e.target.value}))} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:14 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 4px" }}>Texto del botón</p>
        <input value={b.btn} onChange={e=>setB(p=>({...p,btn:e.target.value}))} style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:F, outline:"none" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:0 }}>Mostrar banner</p>
        <button onClick={()=>setB(p=>({...p,visible:!p.visible}))} style={{ width:40, height:22, borderRadius:11, background:b.visible?"#7B6FFF":"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", position:"relative" }}>
          <span style={{ position:"absolute", top:3, left:b.visible?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
        </button>
      </div>
      <button onClick={save} disabled={saving} style={{ width:"100%", padding:"10px", background:saved?"rgba(0,200,150,0.2)":"linear-gradient(135deg,#7B6FFF,#4F8EFF)", border:"none", borderRadius:10, color:"#fff", fontSize:12, fontWeight:800, fontFamily:F, cursor:"pointer" }}>
        {saving?"Guardando...":saved?"✓ Guardado":"💾 Guardar banner"}
      </button>
    </div>
  );
}

function AdminSettings() {
  const tasa = useTasa();
  const [tasaInput, setTasaInput] = useState(String(tasa));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveTasa = async () => {
    const val = parseFloat(tasaInput);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    setGlobalTasa(val);
    await sb.upsertSetting("tasa_dolar", String(val));
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px", marginBottom:16 }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 4px" }}>TASA DEL DÓLAR</p>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:F, margin:"0 0 14px" }}>Los precios de la tienda se actualizan al instante.</p>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, margin:"0 0 6px" }}>Tasa actual: <span style={{ color:"#F3BA2F", fontWeight:700 }}>Bs. {tasa}</span></p>
        <div style={{ display:"flex", gap:10 }}>
          <input
            value={tasaInput}
            onChange={e=>setTasaInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&saveTasa()}
            placeholder="Ej: 36.50"
            style={{ flex:1, padding:"12px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(243,186,47,0.4)", borderRadius:12, color:"#fff", fontSize:16, fontFamily:F, outline:"none", fontWeight:700 }}
          />
          <button onClick={saveTasa} disabled={saving} style={{ padding:"12px 18px", background:saved?"rgba(0,200,150,0.2)":"linear-gradient(135deg,#F3BA2F,#E5A800)", border:"none", borderRadius:12, color:"#000", fontSize:13, fontWeight:800, fontFamily:F, cursor:"pointer", minWidth:90 }}>
            {saving?"...":saved?"✓ Guardado":"Actualizar"}
          </button>
        </div>
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontFamily:F, marginTop:8 }}>
          Ejemplo: $10 USD = {fmtBs(10, parseFloat(tasaInput)||tasa)} con la tasa ingresada
        </p>
      </div>

      {/* Banner editor */}
      <BannerEditor/>

      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px" }}>
        <p style={{ color:"#F0EDE8", fontSize:10, fontFamily:F, fontWeight:700, letterSpacing:"0.1em", margin:"0 0 10px" }}>INFO DE PAGOS</p>
        {[
          {label:"📱 Pago Móvil", items:["0424-3663119","CI: 28.236.056","Mercantil"]},
          {label:"🟡 Binance Pay", items:["ID: 62569716"]},
          {label:"💜 Zinli", items:["Gil751630@gmail.com"]},
        ].map((m,i)=>(
          <div key={i} style={{ marginBottom:10, padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:10 }}>
            <p style={{ color:"#F0EDE8", fontSize:12, fontFamily:F, fontWeight:700, margin:"0 0 4px" }}>{m.label}</p>
            {m.items.map((item,j)=><p key={j} style={{ color:"#F0EDE8", fontSize:11, fontFamily:F, margin:0 }}>{item}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─── ADMIN LOGIN ─── */
function AdminLogin({ onSuccess }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const try_ = () => {
    if (pass === ADMIN_PASSWORD) { onSuccess(); }
    else { setError(true); setTimeout(()=>setError(false), 1500); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:"rgba(123,111,255,0.15)", border:"1px solid rgba(123,111,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:20 }}>🔐</div>
      <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, fontFamily:F, margin:"0 0 6px" }}>Panel Admin</h2>
      <p style={{ color:"#F0EDE8", fontSize:13, fontFamily:F, margin:"0 0 28px" }}>Start Game</p>
      <div style={{ width:"100%", maxWidth:300 }}>
        <input
          type="password"
          value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&try_()}
          placeholder="Contraseña de acceso"
          style={{ width:"100%", boxSizing:"border-box", padding:"14px 16px", background:error?"rgba(255,77,106,0.10)":"rgba(255,255,255,0.07)", border:`1px solid ${error?"rgba(255,77,106,0.5)":"rgba(255,255,255,0.15)"}`, borderRadius:12, color:"#fff", fontSize:14, fontFamily:F, outline:"none", marginBottom:12, transition:"all 0.2s" }}
        />
        <button onClick={try_} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#7B6FFF,#4F8EFF)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:800, fontFamily:F, cursor:"pointer" }}>
          Entrar
        </button>
        {error && <p style={{ color:"#FF4D6A", fontSize:12, fontFamily:F, textAlign:"center", marginTop:8 }}>Contraseña incorrecta</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen_] = useState("home");
  const setScreen = (s) => { setScreen_(s); setTimeout(()=>{ if(mainScrollRef.current) mainScrollRef.current.scrollTop=0; },0); };
  const [profilePhoto, setProfilePhoto] = useState(null);
  const mainScrollRef = useRef(null);
  const [session, setSession] = useState(() => {
    // Check for Google OAuth redirect
    const hash = sbAuth.parseHashSession();
    if (hash) { sbAuth.saveSession(hash); return hash; }
    return sbAuth.getSession();
  });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Load tasa + products on mount
  useEffect(() => {
    Promise.all([
      sb.getSetting("tasa_dolar"),
      sb.getAll("products"),
    ]).then(([tasa, rows]) => {
      if (tasa) setGlobalTasa(parseFloat(tasa));
      console.log("Supabase products:", JSON.stringify(rows));
      // Pure Supabase — no merging with defaults
      if (Array.isArray(rows) && rows.length > 0) {
        setGlobalProducts(rows);
      } else {
        console.log("Fallback to DEFAULT_PRODUCTS");
        setGlobalProducts(DEFAULT_PRODUCTS);
      }
      setAppReady(true);
      document.body.style.overflow = "";
      if(mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
    });
    document.body.style.overflow = "hidden";
  }, []);

  // Secret: tap logo 5 times to open admin
  const logoTaps = useRef(0);
  const logoTimer = useRef(null);
  const tapLogo = () => {
    logoTaps.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    if (logoTaps.current >= 5) {
      logoTaps.current = 0;
      setAdminMode(true);
      return;
    }
    logoTimer.current = setTimeout(() => { logoTaps.current = 0; }, 3000);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const idx = prev.findIndex(x => x.id === item.id && x.selectedAmount === item.selectedAmount);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (i) => setCart(prev => prev.filter((_,idx)=>idx!==i));
  const updateQty = (i, qty) => setCart(prev => prev.map((item, idx) => idx===i ? {...item, quantity:qty} : item));
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Loading screen
  if (!appReady) return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"#0a0a14", overflow:"hidden" }}>
      <style>{`@keyframes p{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.5);opacity:1}}`}</style>
      <img src={logo} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -60%)", height:300, width:"auto" }}/>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, 80px)", display:"flex", gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff", animation:"p 1.2s ease-in-out 0s infinite" }}/>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff", animation:"p 1.2s ease-in-out 0.2s infinite" }}/>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff", animation:"p 1.2s ease-in-out 0.4s infinite" }}/>
      </div>
    </div>
  );

  // Admin mode overlay
  if (adminMode) {
    if (!adminAuth) return <AdminLogin onSuccess={()=>setAdminAuth(true)}/>;
    return <AdminPanel onExit={()=>{ setAdminMode(false); setAdminAuth(false); }}/>;
  }

  // Order status screen
  if (orderId) {
    return (
      <div style={{ background:COLORS.bg, minHeight:"100vh", width:"100%", fontFamily:F, color:COLORS.text }}>
        <OrderStatusScreen orderId={orderId} onBack={()=>{ setOrderId(null); setCheckoutOpen(false); setCart([]); setScreen("home"); }} onOrderDelivered={()=>{ setCart([]); }}/>
      </div>
    );
  }

  return (
    <div style={{ background:COLORS.bg, minHeight:"100vh", width:"100%", position:"relative", fontFamily:F, color:COLORS.text }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, left:-80, width:320, height:320, borderRadius:"50%", background:"rgba(120,80,255,0.13)", filter:"blur(90px)" }}/>
        <div style={{ position:"absolute", top:250, right:-60, width:260, height:260, borderRadius:"50%", background:"rgba(60,140,255,0.09)", filter:"blur(70px)" }}/>
        <div style={{ position:"absolute", bottom:150, left:30, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.04)", filter:"blur(60px)" }}/>
      </div>
      <div ref={mainScrollRef} data-main-scroll style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1, overflowY:screen!=="nexus"?"auto":"hidden", paddingBottom:screen!=="nexus"?100:0 }}>
        {screen==="home"    && <HomeScreen setScreen={setScreen} onLogoTap={tapLogo} onAddToCart={addToCart} onBuyNow={()=>{ setCartOpen(false); setCheckoutOpen(true); }} cart={cart} onCartClick={()=>setCartOpen(true)}/>}
        {screen==="store"   && <StoreScreen onAddToCart={addToCart} onBuyNow={()=>{ setCartOpen(false); setCheckoutOpen(true); }} cart={cart} onCartClick={()=>setCartOpen(true)}/>}
        {screen==="nexus"   && <NexusScreen/>}
        {screen==="profile" && <ProfileScreen profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} session={session} setSession={setSession}/>}
      </div>
      {screen!=="nexus" && <BottomNav active={screen} setActive={setScreen} profilePhoto={profilePhoto} onProfilePhotoChange={setProfilePhoto} cartCount={cartCount} onCartClick={()=>setCartOpen(true)}/>}
      {screen==="nexus" && (
        <button onClick={()=>setScreen("home")} style={{ position:"fixed", bottom:80, left:16, zIndex:999, background:"rgba(10,10,20,0.55)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, color:"#F0EDE8", cursor:"pointer", fontSize:12, fontFamily:F, padding:"8px 16px", fontWeight:700 }}>← Volver</button>
      )}
      {cartOpen && <CartPanel cart={cart} onClose={()=>setCartOpen(false)} onRemove={removeFromCart} onUpdateQty={updateQty} onCheckout={()=>{ setCartOpen(false); setCheckoutOpen(true); }}/>}
      {checkoutOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:400, background:COLORS.bg, overflowY:"auto" }}>
          <CheckoutScreen cart={cart} onBack={()=>setCheckoutOpen(false)} onOrderCreated={(id)=>{ setOrderId(id); setCheckoutOpen(false); }} session={session}/>
        </div>
      )}
    </div>
  );
}

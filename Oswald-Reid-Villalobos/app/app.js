// Flujo de la demo: la PYME tokeniza su factura, un inversionista la financia
// en USDC y la PYME recibe colones por SINPE. Hacienda, SINPE y el contrato
// están simulados; la wallet es real (Freighter).
import { conectarWallet, leerSaldos, corta } from "./wallet.js";

const TIPO_CAMBIO = 510; // ₡ por USD (simulado)
const TASA_ANUAL = 0.18; // descuento que cobra el inversionista

const estado = { wallet: null, facturas: [] };
const $ = (id) => document.getElementById(id);

const colones = (n) => "₡" + Math.round(n).toLocaleString("es-CR");
const usdc = (n) => n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDC";
const hoy = () => new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });

function anotar(texto) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${hoy()}</span> · ${texto}`;
  $("bitacora").prepend(li);
}

// ---------- Wallet ----------

$("btn-wallet").addEventListener("click", async () => {
  $("btn-wallet").disabled = true;
  try {
    const { direccion, red } = await conectarWallet();
    estado.wallet = direccion;
    $("btn-wallet").textContent = corta(direccion);
    $("wallet-info").textContent = `Red: ${red} · consultando saldos…`;
    anotar(`Wallet conectada: <code>${direccion}</code>`);
    const s = await leerSaldos(direccion);
    $("wallet-info").textContent = s.cuentaNueva
      ? `Red: ${red} · cuenta sin fondos (usá Friendbot en Testnet)`
      : `Red: ${red} · ${s.xlm.toFixed(2)} XLM · ${s.usdc.toFixed(2)} USDC`;
  } catch (e) {
    $("wallet-info").textContent = e.message;
    $("btn-wallet").disabled = false;
  }
  pintarMercado();
});

// ---------- Paso 1: registrar y tokenizar ----------

$("btn-ejemplo").addEventListener("click", () => {
  $("clave").value = "50618112600310123456700100001010000000001100000001";
  $("emisor").value = "Panadería La Esquina S.A.";
  $("receptor").value = "Supermercados Grandes S.A.";
  $("monto").value = 2500000;
  $("dias").value = 60;
});

async function hashClave(clave) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clave));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Simulación de la consulta a Hacienda: una clave válida de Costa Rica
// tiene 50 dígitos y empieza con el código de país 506.
function verificarConHacienda(clave) {
  if (!/^\d{50}$/.test(clave)) return "La clave debe tener exactamente 50 dígitos.";
  if (!clave.startsWith("506")) return "La clave no es de Costa Rica (debe empezar con 506).";
  if (estado.facturas.some((f) => f.clave === clave)) return "Esa factura ya está tokenizada.";
  return null;
}

$("form-factura").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const clave = $("clave").value.trim();
  const error = verificarConHacienda(clave);
  if (error) {
    anotar(`❌ Hacienda rechazó la factura: ${error}`);
    return;
  }

  const monto = Number($("monto").value);
  const dias = Number($("dias").value);
  const descuento = monto * TASA_ANUAL * (dias / 365);
  const hash = await hashClave(clave);

  estado.facturas.push({
    clave,
    token: "FPV-" + hash.slice(0, 6).toUpperCase(),
    hash,
    emisor: $("emisor").value.trim(),
    receptor: $("receptor").value.trim(),
    monto,
    dias,
    adelanto: monto - descuento,
    estado: "Registrada",
    inversionista: null,
  });

  anotar(`✅ Hacienda validó la factura de ${$("emisor").value.trim()} por ${colones(monto)}.`);
  anotar(`🪙 Factura tokenizada en Soroban como <b>FPV-${hash.slice(0, 6).toUpperCase()}</b> (registrar).`);
  ev.target.reset();
  $("dias").value = 60;
  pintarMercado();
});

// ---------- Paso 2: mercado ----------

function pintarMercado() {
  const cont = $("mercado");
  if (!estado.facturas.length) {
    cont.innerHTML = '<p class="vacio">Todavía no hay facturas tokenizadas.</p>';
    return;
  }
  cont.innerHTML = "";
  for (const f of estado.facturas) {
    const ganancia = (f.monto - f.adelanto) / TIPO_CAMBIO;
    const rendimiento = ((f.monto / f.adelanto - 1) * 100).toFixed(2);
    const div = document.createElement("div");
    div.className = "factura";
    div.innerHTML = `
      <div class="top">
        <strong>${f.token} · ${f.emisor}</strong>
        <span class="estado ${f.estado}">${f.estado}</span>
      </div>
      <div class="datos">
        <div>Paga<b>${f.receptor}</b></div>
        <div>Monto factura<b>${colones(f.monto)}</b></div>
        <div>Vence en<b>${f.dias} días</b></div>
        <div>PYME recibe hoy<b>${colones(f.adelanto)}</b></div>
        <div>Inversionista pone<b>${usdc(f.adelanto / TIPO_CAMBIO)}</b></div>
        <div>Ganancia<b>${usdc(ganancia)} (${rendimiento}%)</b></div>
      </div>
      <code>hash de la clave: ${f.hash}</code>
      <div class="acciones"></div>`;
    const acciones = div.querySelector(".acciones");

    if (f.estado === "Registrada") {
      const b = boton("Financiar con USDC", () => financiar(f));
      if (!estado.wallet) {
        b.disabled = true;
        b.title = "Conectá tu wallet primero";
      }
      acciones.append(b);
    } else if (f.estado === "Financiada") {
      acciones.append(boton(`Simular vencimiento: ${f.receptor} paga`, () => pagar(f)));
    }
    cont.append(div);
  }
}

function boton(texto, accion) {
  const b = document.createElement("button");
  b.textContent = texto;
  b.addEventListener("click", accion);
  return b;
}

function financiar(f) {
  f.estado = "Financiada";
  f.inversionista = estado.wallet;
  anotar(`💸 ${corta(estado.wallet)} financió ${f.token} con ${usdc(f.adelanto / TIPO_CAMBIO)} (financiar).`);
  anotar(`🏦 ${f.emisor} recibió ${colones(f.adelanto)} por SINPE Móvil. ¡Flujo de caja resuelto hoy!`);
  pintarMercado();
}

function pagar(f) {
  f.estado = "Pagada";
  anotar(`📅 Venció ${f.token}: ${f.receptor} pagó ${colones(f.monto)} (pagar).`);
  anotar(`📈 ${corta(f.inversionista)} recibió ${usdc(f.monto / TIPO_CAMBIO)}, ganancia de ${usdc((f.monto - f.adelanto) / TIPO_CAMBIO)}.`);
  pintarMercado();
}

anotar("Listo. Conectá tu wallet y registrá una factura (o usá la de ejemplo).");

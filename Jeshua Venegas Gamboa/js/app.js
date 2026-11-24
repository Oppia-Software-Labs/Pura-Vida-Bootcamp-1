// Lógica de la interfaz: conecta botones con las funciones de wallet.js y stellar.js.
import { RED, RESERVA_MINIMA_XLM } from "./config.js";
import * as wallet from "./wallet.js";
import * as stellar from "./stellar.js";

const $ = (id) => document.getElementById(id);
const corta = (d) => (d ? `${d.slice(0, 6)}…${d.slice(-6)}` : "");
const enlaceCuenta = (d) => `${RED.explorador}/account/${d}`;
const enlaceTx = (h) => `${RED.explorador}/tx/${h}`;

/** Convierte texto en HTML seguro (evita que datos externos se ejecuten como código). */
const escapar = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Bitácora educativa: cada acción explica qué pasó en la red. */
function registrar(mensaje, tipo = "info") {
  const li = document.createElement("li");
  li.className = `log-${tipo}`;
  const hora = new Date().toLocaleTimeString("es-CR");
  li.innerHTML = `<time>${hora}</time> ${mensaje}`;
  $("bitacora").prepend(li);
}

async function conBoton(boton, tarea) {
  boton.disabled = true;
  const texto = boton.textContent;
  boton.textContent = "Procesando…";
  try {
    await tarea();
  } catch (e) {
    registrar(escapar(e.message || String(e)), "error"); // el error puede traer datos externos
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
}

function pintarWallet() {
  const { tipo, direccion } = wallet.walletActual();
  const conectada = Boolean(direccion);
  $("wallet-desconectada").hidden = conectada;
  $("wallet-conectada").hidden = !conectada;
  document.querySelectorAll("[data-requiere-wallet]").forEach((el) => (el.disabled = !conectada));
  if (conectada) {
    $("wallet-tipo").textContent = tipo;
    $("wallet-direccion").textContent = direccion;
    $("wallet-explorador").href = enlaceCuenta(direccion);
  }
}

async function refrescarSaldos() {
  const { direccion } = wallet.walletActual();
  if (!direccion) return;
  const saldos = await stellar.obtenerSaldos(direccion);
  const lista = $("saldos");
  lista.innerHTML = "";
  if (!saldos) {
    lista.innerHTML = `<li class="vacio">La cuenta todavía no existe en la red. En Stellar una cuenta "nace"
      cuando recibe al menos ${RESERVA_MINIMA_XLM} XLM. Usa Friendbot (paso 2).</li>`;
    return;
  }
  for (const s of saldos) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${Number(s.saldo).toLocaleString("es-CR", { maximumFractionDigits: 7 })}</strong> ${escapar(s.activo)}`;
    lista.append(li);
  }
  await refrescarHistorial();
}

async function refrescarHistorial() {
  const { direccion } = wallet.walletActual();
  const pagos = await stellar.ultimosPagos(direccion);
  const tbody = $("historial");
  tbody.innerHTML = "";
  if (!pagos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="vacio">Sin movimientos todavía.</td></tr>`;
    return;
  }
  for (const p of pagos) {
    const entrante = p.para === direccion;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(p.fecha).toLocaleString("es-CR")}</td>
      <td>${p.tipo === "create_account" ? "Creación de cuenta" : entrante ? "Recibido" : "Enviado"}</td>
      <td class="${entrante ? "mas" : "menos"}">${entrante ? "+" : "-"}${escapar(p.monto ?? "?")} ${escapar(p.activo)}</td>
      <td><a href="${enlaceTx(encodeURIComponent(p.hash))}" target="_blank" rel="noopener">ver</a></td>`;
    tbody.append(tr);
  }
}

function iniciar() {
  $("red-nombre").textContent = RED.nombre;

  $("btn-freighter").addEventListener("click", (e) =>
    conBoton(e.target, async () => {
      const w = await wallet.conectarFreighter();
      registrar(`Wallet Varial conectada: <code>${corta(w.direccion)}</code>. La app solo conoce tu
        <em>clave pública</em>; la secreta se queda en tu wallet.`, "ok");
      pintarWallet();
      await refrescarSaldos();
    })
  );

  $("btn-practica").addEventListener("click", (e) =>
    conBoton(e.target, async () => {
      const w = wallet.crearWalletPractica();
      registrar(`Se creó un par de claves nuevo (Keypair). Clave pública: <code>${corta(w.direccion)}</code>.
        Todavía NO existe en la red: falta fondearla.`, "ok");
      pintarWallet();
      await refrescarSaldos();
    })
  );

  $("btn-desconectar").addEventListener("click", () => {
    wallet.desconectar();
    $("saldos").innerHTML = "";
    $("historial").innerHTML = "";
    registrar("Wallet desconectada.");
    pintarWallet();
  });

  $("btn-friendbot").addEventListener("click", (e) =>
    conBoton(e.target, async () => {
      const { direccion } = wallet.walletActual();
      registrar("Pidiendo XLM de prueba a Friendbot…");
      const hash = await stellar.fondearConFriendbot(direccion);
      registrar(`Friendbot creó/fondeó tu cuenta con 10 000 XLM de prueba.
        <a href="${enlaceTx(hash)}" target="_blank" rel="noopener">Ver transacción</a>`, "ok");
      await refrescarSaldos();
    })
  );

  $("btn-saldos").addEventListener("click", (e) => conBoton(e.target, refrescarSaldos));

  $("form-pago").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const boton = $("btn-enviar");
    conBoton(boton, async () => {
      const { direccion } = wallet.walletActual();
      const destino = $("destino").value.trim();
      const monto = $("monto").value.trim();
      const memo = $("memo").value.trim();

      if (!stellar.direccionValida(destino)) throw new Error("La dirección de destino no es válida (debe empezar con G y tener 56 caracteres).");
      if (destino === direccion) throw new Error("No puedes enviarte a ti mismo.");

      registrar("1/3 Construyendo la transacción (todavía sin firmar)…");
      const { xdr, tipo } = await stellar.construirPago({ origen: direccion, destino, monto, memo });
      if (tipo === "createAccount") {
        registrar(`El destino no existía, así que se usa la operación <code>createAccount</code>
          (mínimo ${RESERVA_MINIMA_XLM} XLM).`);
      }
      registrar("2/3 Firmando con tu wallet…");
      const firmado = await wallet.firmar(xdr);
      registrar("3/3 Enviando a la red. Stellar confirma en unos 5 segundos…");
      const r = await stellar.enviarTransaccion(firmado);
      registrar(`¡Pago confirmado en el ledger ${r.ledger}! Comisión pagada: 0.00001 XLM.
        <a href="${enlaceTx(r.hash)}" target="_blank" rel="noopener">Ver transacción</a>`, "ok");
      $("form-pago").reset();
      await refrescarSaldos();
    });
  });

  pintarWallet();
  registrar(`App lista. Red: <strong>${RED.nombre}</strong> (dinero de prueba, sin valor real).`);
}

if (!window.StellarSdk) {
  document.body.insertAdjacentHTML("afterbegin",
    `<p class="aviso-error">No se pudo cargar el SDK de Stellar. Revisa tu conexión a internet y recarga.</p>`);
} else {
  iniciar();
}

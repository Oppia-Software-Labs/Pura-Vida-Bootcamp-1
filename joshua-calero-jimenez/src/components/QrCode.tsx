import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR del link de cobro. Fondo claro para que cualquier cámara lo lea aunque la app sea oscura. */
export default function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#08071a", light: "#ecebf5" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size]);

  return (
    <div className="shrink-0 rounded-xl bg-ink p-2.5" style={{ width: size + 20, height: size + 20 }}>
      {src ? (
        <img src={src} width={size} height={size} alt="Código QR del link de cobro" />
      ) : (
        <span className="grid h-full place-items-center text-sm text-void">Generando QR…</span>
      )}
    </div>
  );
}

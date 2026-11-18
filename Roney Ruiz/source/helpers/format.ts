import { formatStroops } from "@bloc/entity/money";

export function formatXlm(stroops: bigint): string {
  const [whole, fraction] = formatStroops(stroops).split(".");
  const grouped = BigInt(whole).toLocaleString("en-US");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function shortAddress(address: string): string {
  return address.length > 13 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
}

export function formatEpoch(epochSec: number): string {
  const date = new Date(epochSec * 1000);
  const time = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (date.toDateString() === new Date().toDateString()) return `hoy ${time}`;
  return `${date.toLocaleDateString("es", { day: "numeric", month: "short" })} ${time}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 120) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} días`;
}

export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(total % 60)}`;
  return `${pad(minutes)}:${pad(total % 60)}`;
}

export function avatarGradient(address: string): string {
  const hue = [...address].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg, hsl(${hue} 80% 65%), hsl(${(hue + 60) % 360} 80% 52%))`;
}

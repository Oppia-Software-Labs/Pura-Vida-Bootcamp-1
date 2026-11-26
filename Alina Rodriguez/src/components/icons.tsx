// Iconos minimalistas (trazo, un solo color) para grupos y gastos.
import {
  Baby, Beer, BedDouble, Briefcase, Bus, Car, Coffee, Dog, Dumbbell, Film, Fuel, Gift,
  GraduationCap, Heart, House, Mountain, PartyPopper, Pill, Pizza, Plane, Receipt, Shirt,
  ShoppingCart, TreePalm, Users, Utensils, WavesHorizontal, Wifi, Zap,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  users: { Icon: Users, label: "Personas" },
  house: { Icon: House, label: "Casa" },
  heart: { Icon: Heart, label: "Pareja" },
  baby: { Icon: Baby, label: "Hijos" },
  dog: { Icon: Dog, label: "Mascota" },
  briefcase: { Icon: Briefcase, label: "Trabajo" },
  graduation: { Icon: GraduationCap, label: "Estudio" },
  plane: { Icon: Plane, label: "Viaje" },
  palm: { Icon: TreePalm, label: "Playa" },
  waves: { Icon: WavesHorizontal, label: "Mar" },
  mountain: { Icon: Mountain, label: "Montaña" },
  utensils: { Icon: Utensils, label: "Comida" },
  pizza: { Icon: Pizza, label: "Pizza" },
  coffee: { Icon: Coffee, label: "Café" },
  beer: { Icon: Beer, label: "Bebidas" },
  cart: { Icon: ShoppingCart, label: "Súper" },
  car: { Icon: Car, label: "Carro" },
  fuel: { Icon: Fuel, label: "Gasolina" },
  bus: { Icon: Bus, label: "Transporte" },
  bed: { Icon: BedDouble, label: "Hospedaje" },
  zap: { Icon: Zap, label: "Luz y agua" },
  wifi: { Icon: Wifi, label: "Internet" },
  film: { Icon: Film, label: "Cine" },
  party: { Icon: PartyPopper, label: "Fiesta" },
  gift: { Icon: Gift, label: "Regalo" },
  dumbbell: { Icon: Dumbbell, label: "Deporte" },
  pill: { Icon: Pill, label: "Salud" },
  shirt: { Icon: Shirt, label: "Ropa" },
  receipt: { Icon: Receipt, label: "Otro" },
};

export const GROUP_ICONS = ["users", "house", "heart", "baby", "dog", "briefcase", "graduation", "plane", "palm", "waves", "mountain", "party"];
export const EXPENSE_ICONS = ["receipt", "utensils", "pizza", "coffee", "beer", "cart", "car", "fuel", "bus", "plane", "bed", "zap", "wifi", "film", "party", "gift", "dumbbell", "pill", "shirt", "house"];

export function TIcon({ name, size = 20 }: { name?: string; size?: number }) {
  const { Icon } = ICONS[name ?? ""] ?? ICONS.receipt;
  return <Icon size={size} strokeWidth={1.8} aria-hidden />;
}

/** Cuadro con el icono (tile). */
export function IconTile({ name, size = 44, dark }: { name?: string; size?: number; dark?: boolean }) {
  return (
    <span className={`icon-tile${dark ? " dark" : ""}`} style={{ width: size, height: size }}>
      <TIcon name={name} size={Math.round(size * 0.46)} />
    </span>
  );
}

export function IconPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Icono">
      {options.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === name}
          aria-label={ICONS[name].label}
          title={ICONS[name].label}
          className={`icon-option${value === name ? " on" : ""}`}
          onClick={() => onChange(name)}
        >
          <TIcon name={name} size={20} />
        </button>
      ))}
    </div>
  );
}

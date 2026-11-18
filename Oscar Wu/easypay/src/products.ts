// DEMO: catálogo e inventario de ejemplo, solo en memoria (se reinicia al recargar).
import { Apple, Coffee, CupSoda, Cookie, GlassWater, Package, Soup, UtensilsCrossed, Wheat, type LucideIcon } from 'lucide-react'

export type IconKey = 'coffee' | 'cookie' | 'plate' | 'wheat' | 'water' | 'apple' | 'soda' | 'soup' | 'other'

export const ICONS: Record<IconKey, LucideIcon> = {
  coffee: Coffee,
  cookie: Cookie,
  plate: UtensilsCrossed,
  wheat: Wheat,
  water: GlassWater,
  apple: Apple,
  soda: CupSoda,
  soup: Soup,
  other: Package,
}

export interface Product {
  id: string
  name: string
  /** Precio en colones. */
  price: number
  stock: number
  icon: IconKey
}

export interface CartItem {
  productId: string
  name: string
  qty: number
  price: number
}

/** Por debajo o igual a este stock se avisa "Bajo". */
export const LOW_STOCK = 5

export const SEED_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Café', price: 1200, stock: 24, icon: 'coffee' },
  { id: 'p2', name: 'Empanada', price: 1000, stock: 18, icon: 'cookie' },
  { id: 'p3', name: 'Gallo pinto', price: 2500, stock: 12, icon: 'plate' },
  { id: 'p4', name: 'Tortillas x3', price: 500, stock: 40, icon: 'wheat' },
  { id: 'p5', name: 'Agua', price: 800, stock: 30, icon: 'water' },
  { id: 'p6', name: 'Fruta de temporada', price: 1500, stock: 3, icon: 'apple' },
  { id: 'p7', name: 'Refresco', price: 1000, stock: 20, icon: 'soda' },
  { id: 'p8', name: 'Casado', price: 3500, stock: 9, icon: 'soup' },
]

export function stockState(stock: number): 'out' | 'low' | 'ok' {
  return stock <= 0 ? 'out' : stock <= LOW_STOCK ? 'low' : 'ok'
}

export function describeItems(items: CartItem[]) {
  return items.map((i) => `${i.qty}× ${i.name}`).join(', ')
}

// Posiciones de cada "parada" del viaje dentro de la galaxia.
// La galaxia está en el plano XZ, centrada en el origen, con radio ~9.

export type Vec3 = [number, number, number];

/**
 * Centro de la cadena de bloques del capítulo 1: fuera del disco y más allá
 * de la órbita de la cámara del inicio, para que no tape la vista general.
 */
export const CHAIN_POS: Vec3 = [12, 3.2, 15];
/** Punto hacia el que mira la cadena (de frente al capítulo 1, de espaldas a la galaxia). */
export const CHAIN_FACING: Vec3 = [12 + 3.5, 3.2, 15 + 5.9];

/** Tu estrella: en uno de los brazos de la galaxia. */
export const STAR_POS: Vec3 = [4.6, 0.5, -4.4];

/** Estrella de destino para el pago del capítulo 5. */
export const DEST_POS: Vec3 = [1.2, 0.7, -7.2];

/** Vista de cámara de un capítulo. */
export type View = {
  camera: Vec3;
  target: Vec3;
  /** Dónde se queda flotando la nave. */
  ship: Vec3;
  autoRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
};

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

export const VIEWS = {
  intro: {
    camera: [0, 7, 14],
    target: [0, 0, 0],
    ship: [4, 0.8, 9],
    autoRotate: true,
    minDistance: 3,
    maxDistance: 40,
  },
  // La cámara se desplaza a la izquierda de la cadena para que el panel de texto no la tape
  blockchain: {
    camera: add(CHAIN_POS, [3.68 - 1.38, 1.05, 6.2 + 0.82]),
    target: add(CHAIN_POS, [-1.38, 0, 0.82]),
    ship: add(CHAIN_POS, [-3.6, 1.4, 1.2]),
    minDistance: 3,
    maxDistance: 14,
  },
  // Desplazada a la izquierda para que la red quede a la derecha del panel
  network: {
    camera: [-3.8, 15.5, 14],
    target: [-3.8, 0, 0],
    ship: [-4, 3, 9],
    autoRotate: true,
    minDistance: 6,
    maxDistance: 40,
  },
  account: {
    camera: add(STAR_POS, [1.4, 1.1, 3.6]),
    target: STAR_POS,
    ship: add(STAR_POS, [1.9, 0.7, 1.0]),
    minDistance: 1.5,
    maxDistance: 12,
  },
  reserve: {
    camera: add(STAR_POS, [-1.9, 1.4, 3.2]),
    target: STAR_POS,
    ship: add(STAR_POS, [1.7, 0.7, 1.2]),
    minDistance: 1.5,
    maxDistance: 12,
  },
  // Cerca de las dos estrellas, desplazada para que el panel no las tape
  transaction: {
    camera: add(mid(STAR_POS, DEST_POS), [3.0 - 1.16, 3.2, 5.7 + 0.6]),
    target: add(mid(STAR_POS, DEST_POS), [-1.16, 0, 0.6]),
    ship: add(STAR_POS, [0.6, 0.5, 0.6]),
    minDistance: 2,
    maxDistance: 16,
  },
  // De frente a la cadena completa, incluido el ledger real que se une al final
  ledger: {
    camera: add(CHAIN_POS, [3.6, 1.4, 7.7]),
    target: add(CHAIN_POS, [-0.7, 0, 0.42]),
    ship: add(CHAIN_POS, [4.9, 1.4, -2.3]),
    minDistance: 3,
    maxDistance: 18,
  },
} satisfies Record<string, View>;

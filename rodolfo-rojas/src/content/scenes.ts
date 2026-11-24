import { box, fill, fromRows, scene, stamp, text, type PixelGrid } from './pixel'
import type { PersonaId } from './personas'
import { AVATARS, OBJECTS as O, RECOLOR } from './sprites'

export type SceneId =
  | 'testnet'
  | 'wallet'
  | 'transaccion'
  | 'fee'
  | 'token'
  | 'trustline'
  | 'mint-burn'
  | 'smart-contract'
  | 'level1'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'

const A = AVATARS

const stage = (g: PixelGrid) => {
  fill(g, 0, 26, 32, 6, 'H')
  fill(g, 0, 26, 32, 1, 'K')
}

const abuelita: Record<SceneId, PixelGrid> = {
  testnet: scene((g) => {
    stamp(g, A.abuelita, 0, 16)
    stamp(g, A.abuelita, 16, 16, RECOLOR.abuelo)
    stamp(g, O.bill, 6, 6)
    stamp(g, O.bill, 14, 3)
    stamp(g, O.bill, 21, 8)
  }),
  wallet: scene((g) => {
    stamp(g, O.purse, 11, 16)
    stamp(g, O.padlock, 13, 9)
    text(g, 'G', 14, 24, 'W')
    stamp(g, O.key, 2, 4)
    text(g, 'S', 11, 3, 'Y')
  }),
  transaccion: scene((g) => {
    stamp(g, A.abuelita, 0, 16)
    stamp(g, O.phone, 2, 2)
    stamp(g, O.arrow, 12, 6)
    stamp(g, A.abuelita, 16, 16, RECOLOR.rosa)
    box(g, 18, 2, 12, 12, 'W')
    fill(g, 23, 2, 1, 12, 'K')
    fill(g, 18, 7, 12, 1, 'K')
  }),
  fee: scene((g) => {
    stamp(g, O.bus, 8, 20)
    stamp(g, O.coin, 19, 9)
    stamp(g, O.arrowDown, 19, 14)
  }),
  token: scene((g) => {
    stamp(g, O.vale, 12, 8)
    stamp(g, O.vale, 8, 13)
    stamp(g, O.coin, 4, 24)
    stamp(g, O.coin, 23, 24)
  }),
  trustline: scene((g) => {
    stamp(g, O.shop, 8, 1)
    stamp(g, A.abuelita, 0, 16)
    stamp(g, A.dev, 16, 16, RECOLOR.chepe)
    stamp(g, O.handshake, 11, 25)
  }),
  'mint-burn': scene((g) => {
    stamp(g, O.press, 1, 12)
    stamp(g, O.vale, 1, 24)
    stamp(g, O.scissors, 22, 10)
    stamp(g, O.vale, 18, 20)
    fill(g, 24, 20, 1, 7, null)
  }),
  'smart-contract': scene((g) => {
    stamp(g, O.vending, 11, 9)
    stamp(g, O.coin, 3, 12)
    stamp(g, O.arrow, 4, 18)
  }),
  level1: scene((g) => {
    stamp(g, A.abuelita, 0, 16)
    stamp(g, O.phone, 2, 2)
    stamp(g, O.arrow, 12, 6)
    stamp(g, A.abuelita, 16, 16, RECOLOR.rosa)
    text(g, '1', 22, 4, 'B')
  }),
  step1: scene((g) => {
    stamp(g, O.shop, 8, 8)
    stamp(g, A.dev, 0, 16, RECOLOR.chepe)
  }),
  step2: scene((g) => {
    stamp(g, A.abuelita, 0, 16)
    stamp(g, A.dev, 16, 16, RECOLOR.chepe)
    stamp(g, O.handshake, 11, 25)
    stamp(g, O.vale, 10, 4)
  }),
  step3: scene((g) => {
    stamp(g, O.press, 10, 4)
    stamp(g, O.vale, 10, 16)
    text(g, '100', 10, 25, 'B')
  }),
  step4: scene((g) => {
    stamp(g, O.scissors, 13, 4)
    stamp(g, O.vale, 10, 14)
    fill(g, 16, 14, 1, 7, null)
    text(g, '-10', 10, 24, 'R')
  }),
}

const rapero: Record<SceneId, PixelGrid> = {
  testnet: scene((g) => {
    stage(g)
    box(g, 1, 1, 14, 7, 'W')
    fill(g, 3, 3, 10, 1, 'B')
    fill(g, 3, 5, 6, 1, 'B')
    stamp(g, O.mic, 5, 14)
    stamp(g, A.rapero, 15, 10)
  }),
  wallet: scene((g) => {
    stamp(g, A.rapero, 8, 1)
    fill(g, 15, 17, 2, 2, 'Y')
    stamp(g, O.padlock, 13, 19)
    stamp(g, O.key, 21, 27)
    text(g, 'S', 25, 20, 'Y')
  }),
  transaccion: scene((g) => {
    stamp(g, A.rapero, 0, 16)
    stamp(g, A.dev, 16, 8, RECOLOR.dj)
    stamp(g, O.console, 17, 24)
    stamp(g, O.bill, 10, 6)
    stamp(g, O.arrow, 11, 12)
    text(g, '5', 3, 3, 'B')
  }),
  fee: scene((g) => {
    box(g, 2, 4, 11, 27, 'H')
    fill(g, 10, 17, 1, 2, 'Y')
    stamp(g, A.rapero, 15, 16)
    stamp(g, O.ticketSmall, 14, 11)
  }),
  token: scene((g) => {
    stamp(g, O.vale, 12, 7, RECOLOR.blueTicket)
    stamp(g, O.vale, 8, 13, RECOLOR.blueTicket)
    fill(g, 10, 21, 8, 4, 'W')
    ;[10, 12, 13, 15, 17].forEach((x) => fill(g, x, 21, 1, 4, 'K'))
  }),
  trustline: scene((g) => {
    stamp(g, A.rapero, 0, 16)
    stamp(g, O.clipboard, 19, 6)
  }),
  'mint-burn': scene((g) => {
    stamp(g, O.vinyl, 2, 4)
    stamp(g, O.vinyl, 12, 4)
    stamp(g, O.vinyl, 20, 18)
    fill(g, 23, 18, 2, 8, null)
    stamp(g, O.arrow, 7, 18)
  }),
  'smart-contract': scene((g) => {
    stamp(g, O.jukebox, 11, 10)
    stamp(g, O.coin, 3, 13)
    stamp(g, O.arrow, 4, 19)
    stamp(g, O.note, 24, 3)
    stamp(g, O.note, 26, 12)
  }),
  level1: scene((g) => {
    stamp(g, A.rapero, 0, 16)
    stamp(g, A.dev, 16, 8, RECOLOR.dj)
    stamp(g, O.console, 17, 24)
    stamp(g, O.bill, 10, 6)
    stamp(g, O.arrow, 11, 12)
    text(g, '1', 3, 3, 'B')
  }),
  step1: scene((g) => {
    stage(g)
    ;[4, 14, 24].forEach((x) => {
      stamp(g, O.lamp, x, 1)
      fill(g, x + 1, 4, 2, 2, 'Y')
    })
    stamp(g, O.mic, 14, 14)
  }),
  step2: scene((g) => {
    stamp(g, O.clipboard, 11, 6)
    stamp(g, A.rapero, 0, 18)
  }),
  step3: scene((g) => {
    ;[3, 10, 17].forEach((y) => stamp(g, O.vale, 10, y, RECOLOR.blueTicket))
    text(g, '100', 10, 25, 'B')
  }),
  step4: scene((g) => {
    stamp(g, O.scissors, 13, 2)
    stamp(g, O.vale, 10, 12, RECOLOR.blueTicket)
    fill(g, 16, 12, 1, 7, null)
    text(g, '-10', 10, 23, 'R')
  }),
}

const dev: Record<SceneId, PixelGrid> = {
  testnet: scene((g) => {
    box(g, 2, 2, 12, 6, 'W')
    fill(g, 8, 3, 5, 4, 'B')
    text(g, 'T', 3, 2, 'H')
    stamp(g, O.coin, 20, 4)
    stamp(g, O.laptop, 9, 18)
  }),
  wallet: scene((g) => {
    stamp(g, O.key, 3, 8, { Y: 'B' })
    text(g, 'G', 13, 7, 'B')
    stamp(g, O.key, 3, 19, { Y: 'R' })
    text(g, 'S', 13, 18, 'R')
    stamp(g, O.shield, 21, 11)
  }),
  transaccion: scene((g) => {
    stamp(g, O.envelope, 2, 8)
    stamp(g, O.arrow, 13, 9)
    stamp(g, O.ledger, 20, 6)
    text(g, '5', 22, 16, 'B')
    stamp(g, A.dev, 0, 17)
  }),
  fee: scene((g) => {
    stamp(g, O.gate, 8, 19)
    text(g, '100', 10, 7, 'B')
    stamp(g, O.coin, 4, 22)
  }),
  token: scene((g) => {
    stamp(g, O.card, 10, 9)
    text(g, 'G', 12, 21, 'B')
    fill(g, 17, 22, 6, 1, 'H')
    fill(g, 17, 24, 4, 1, 'H')
  }),
  trustline: scene((g) => {
    stamp(g, O.checkbox, 5, 6)
    fill(g, 15, 8, 12, 2, 'H')
    box(g, 5, 17, 7, 7, 'W')
    fill(g, 15, 19, 8, 2, 'G')
  }),
  'mint-burn': scene((g) => {
    text(g, '+100', 2, 5, 'B')
    text(g, '-10', 2, 20, 'R')
    stamp(g, O.fire, 20, 19)
  }),
  'smart-contract': scene((g) => {
    stamp(g, O.fnbox, 10, 12)
    stamp(g, O.arrow, 3, 14)
    stamp(g, O.arrow, 24, 14)
    text(g, '1', 3, 6, 'B')
    text(g, '5', 26, 6, 'V')
  }),
  level1: scene((g) => {
    stamp(g, O.server, 3, 10)
    stamp(g, O.arrow, 13, 14)
    stamp(g, O.server, 21, 10)
    text(g, '1', 14, 3, 'B')
  }),
  step1: scene((g) => {
    stamp(g, O.server, 10, 10)
    text(g, '+', 21, 8, 'V')
    stamp(g, O.coin, 21, 16)
  }),
  step2: scene((g) => {
    stamp(g, O.checkbox, 12, 8)
    fill(g, 6, 20, 20, 2, 'H')
  }),
  step3: scene((g) => text(g, '+100', 8, 13, 'B')),
  step4: scene((g) => {
    stamp(g, O.fire, 13, 5)
    text(g, '-10', 10, 17, 'R')
  }),
}

export const SCENES: Record<PersonaId, Record<SceneId, PixelGrid>> = { abuelita, rapero, dev }

export const AVATAR_GRIDS: Record<PersonaId, PixelGrid> = {
  abuelita: fromRows(AVATARS.abuelita),
  rapero: fromRows(AVATARS.rapero),
  dev: fromRows(AVATARS.dev),
}

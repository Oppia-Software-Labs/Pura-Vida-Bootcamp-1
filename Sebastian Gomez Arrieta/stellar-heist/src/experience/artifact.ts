export function artifactAppearance(hash: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid verified transaction hash')
  return { hash, hue: parseInt(hash.slice(0, 4), 16) % 360, detail: parseInt(hash.slice(4, 6), 16) % 2, rotation: parseInt(hash.slice(6, 10), 16) / 65535 * Math.PI }
}

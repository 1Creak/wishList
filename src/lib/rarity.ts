// Item rarity tiers, colour-coded like loot in games.
export const RARITIES = [
  { level: 1, color: '#B0C3D9' }, // common
  { level: 2, color: '#4B69FF' }, // rare
  { level: 3, color: '#8847FF' }, // epic
  { level: 4, color: '#D32CE6' }, // legendary
  { level: 5, color: '#E4AE39' }, // mythic
] as const

export type RarityLevel = 1 | 2 | 3 | 4 | 5

export function rarityColor(level: number): string {
  return RARITIES.find((r) => r.level === level)?.color ?? RARITIES[0].color
}

// Keep generator versions available: saved worlds must never silently change terrain.
import { generateMap as generateVillage, newSeed } from './generator-v1.js';
import { generateRegion } from './regions.js';
export { newSeed, seededRandom } from './generator-v1.js';
export const GENERATOR_VERSION = 2;
export const SUPPORTED_GENERATORS = [1, 2];
export function generateMap(seed = newSeed(), version = GENERATOR_VERSION) {
  if (version === 1) return generateVillage(seed);
  if (version === 2) return generateRegion(seed);
  throw new Error(`Unsupported generator version: ${version}`);
}

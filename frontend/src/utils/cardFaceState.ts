/**
 * Card face art in `public/assets/1.png` … `19.png`.
 *
 * `getCardFaceIndex` maps Biosphere, Society, Economy (0–100) to image index 1–19.
 * State bands: Critical 0–30, Moderate 31–60, Healthy 61–100.
 */

/** Number of card-face PNGs in `public/assets/`. */
export const CARD_FACE_COUNT = 19;

/** Public URLs for each card face (`/assets/1.png` … `/assets/19.png`). */
export const CARD_FACE_URLS: readonly string[] = Array.from(
  { length: CARD_FACE_COUNT },
  (_, i) => `${process.env.PUBLIC_URL}/assets/${i + 1}.png`
);

export function getCardFaceIndex(
  biosphere: number,
  society: number,
  economy: number
): number {
  const b = biosphere;
  const s = society;
  const e = economy;
  const critical = (x: number) => x <= 30;
  const healthy = (x: number) => x >= 60;
  const moderate = (x: number) => x >= 35 && x <= 65;
  const recovering = (x: number) => x >= 31 && x <= 50;
  const otherTwoHealthy = (a: number, b: number) => a >= 50 && b >= 50;
  const otherTwoAtLeast40 = (a: number, b: number) => a >= 40 && b >= 40;
  const dominant = (x: number) => x >= 70;
  const below60 = (x: number) => x < 60;

  // 1. Total Collapse (all critical)
  if (critical(b) && critical(s) && critical(e)) return 13;

  // 2. Dual crises
  if (critical(b) && critical(s)) return 10;
  if (critical(b) && critical(e)) return 11;
  if (critical(s) && critical(e)) return 12;

  // 3. Unstable / Tipping (exactly one critical, other two ≥ 50)
  if (critical(b) && otherTwoHealthy(s, e)) return 17;
  if (critical(s) && otherTwoHealthy(b, e)) return 18;
  if (critical(e) && otherTwoHealthy(b, s)) return 19;

  // 4. Single crisis
  if (critical(b)) return 4;
  if (critical(s)) return 5;
  if (critical(e)) return 6;

  // 5. Thriving (all healthy)
  if (healthy(b) && healthy(s) && healthy(e)) return 1;

  // 6. Recovering (exactly one in 31-50, other two ≥ 40)
  if (recovering(b) && otherTwoAtLeast40(s, e)) return 14;
  if (recovering(s) && otherTwoAtLeast40(b, e)) return 15;
  if (recovering(e) && otherTwoAtLeast40(b, s)) return 16;

  // 7. Dominant (one ≥ 70, other two < 60)
  if (dominant(b) && below60(s) && below60(e)) return 7;
  if (dominant(s) && below60(b) && below60(e)) return 8;
  if (dominant(e) && below60(b) && below60(s)) return 9;

  // 8. Balanced (all moderate 35-65)
  if (moderate(b) && moderate(s) && moderate(e)) return 2;

  // 9. Neutral / Default
  return 3;
}

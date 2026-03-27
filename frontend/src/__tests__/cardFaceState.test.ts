import { getCardFaceIndex } from '../utils/cardFaceState';

/**
 * Unit tests for getCardFaceIndex(biosphere, society, economy) → 1..19.
 *
 * This function drives the card artwork shown to the player — the primary
 * environmental feedback mechanism in the game.
 *
 * Testing strategy: structure-based (one test per if-branch).
 *
 * Priority lookup order (first match wins):
 *   13 Total Collapse
 *   → 10 / 11 / 12 Dual Crises
 *   → 17 / 18 / 19 Unstable Tipping
 *   → 4 / 5 / 6  Single Crisis
 *   → 1           Thriving
 *   → 14 / 15 / 16 Recovering
 *   → 7 / 8 / 9  Dominant
 *   → 2           Balanced
 *   → 3           Default
 *
 * Each describe block targets one named branch. Input values are chosen so
 * that all earlier branches are skipped, with comments explaining why.
 */

describe('getCardFaceIndex', () => {

  // ── 1. Total Collapse ─────────────────────────────────────────────────────
  // Condition: critical(b) && critical(s) && critical(e)  where critical(x) = x <= 30
  describe('Total Collapse – all metrics critical (≤ 30)', () => {
    it('returns 13 when all metrics are well below the critical threshold', () => {
      expect(getCardFaceIndex(10, 10, 10)).toBe(13);
    });

    it('returns 13 when all metrics are exactly at the critical boundary (30)', () => {
      expect(getCardFaceIndex(30, 30, 30)).toBe(13);
    });
  });

  // ── 2. Dual Crises ────────────────────────────────────────────────────────
  // Conditions checked in order: bio+soc, bio+eco, soc+eco — all critical, third is not
  describe('Dual Crises – exactly two metrics critical', () => {
    it('returns 10 when biosphere AND society are critical (economy is healthy)', () => {
      // eco=70 > 30 → skips Total Collapse; bio=10 & soc=10 ≤ 30 → Dual bio+soc
      expect(getCardFaceIndex(10, 10, 70)).toBe(10);
    });

    it('returns 11 when biosphere AND economy are critical (society is healthy)', () => {
      // soc=70 > 30 → skips Total Collapse; bio=10 & eco=10 ≤ 30 → Dual bio+eco
      expect(getCardFaceIndex(10, 70, 10)).toBe(11);
    });

    it('returns 12 when society AND economy are critical (biosphere is healthy)', () => {
      // bio=70 > 30 → skips Total Collapse; soc=10 & eco=10 ≤ 30 → Dual soc+eco
      expect(getCardFaceIndex(70, 10, 10)).toBe(12);
    });
  });

  // ── 3. Unstable / Tipping ─────────────────────────────────────────────────
  // Condition: exactly one metric critical, the other two both ≥ 50 (otherTwoHealthy)
  describe('Unstable / Tipping – one metric critical, other two ≥ 50', () => {
    it('returns 17 when biosphere is critical and society + economy are ≥ 50', () => {
      // soc=55 & eco=55 are not critical → skips Total Collapse and Dual crises;
      // bio=10 ≤ 30 AND otherTwoHealthy(55, 55) → Unstable bio
      expect(getCardFaceIndex(10, 55, 55)).toBe(17);
    });

    it('returns 18 when society is critical and biosphere + economy are ≥ 50', () => {
      expect(getCardFaceIndex(55, 10, 55)).toBe(18);
    });

    it('returns 19 when economy is critical and biosphere + society are ≥ 50', () => {
      expect(getCardFaceIndex(55, 55, 10)).toBe(19);
    });
  });

  // ── 4. Single Crisis ──────────────────────────────────────────────────────
  // Condition: exactly one metric critical, but the other two are NOT both ≥ 50
  // (so Unstable is skipped because otherTwoHealthy returns false)
  describe('Single Crisis – one metric critical, others NOT both ≥ 50', () => {
    it('returns 4 when only biosphere is critical', () => {
      // soc=40 & eco=40 are not both ≥ 50 → skips Unstable; bio=20 ≤ 30 → Single bio
      expect(getCardFaceIndex(20, 40, 40)).toBe(4);
    });

    it('returns 5 when only society is critical', () => {
      expect(getCardFaceIndex(40, 20, 40)).toBe(5);
    });

    it('returns 6 when only economy is critical', () => {
      expect(getCardFaceIndex(40, 40, 20)).toBe(6);
    });
  });

  // ── 5. Thriving ───────────────────────────────────────────────────────────
  // Condition: healthy(b) && healthy(s) && healthy(e)  where healthy(x) = x >= 60
  describe('Thriving – all metrics healthy (≥ 60)', () => {
    it('returns 1 when all metrics are well above the healthy threshold', () => {
      expect(getCardFaceIndex(70, 70, 70)).toBe(1);
    });

    it('returns 1 when all metrics are exactly at the healthy boundary (60)', () => {
      expect(getCardFaceIndex(60, 60, 60)).toBe(1);
    });
  });

  // ── 6. Recovering ─────────────────────────────────────────────────────────
  // Condition: recovering(x) = x >= 31 && x <= 50; otherTwoAtLeast40(a,b) = a >= 40 && b >= 40
  // Use 55 for the non-recovering metrics: 55 > 50 (not recovering) and 55 ≥ 40
  describe('Recovering – one metric in [31, 50], other two ≥ 40', () => {
    it('returns 14 when biosphere is recovering and others are ≥ 40', () => {
      // bio=40 ∈ [31,50]; soc=55 & eco=55 ≥ 40 → Recovering bio
      expect(getCardFaceIndex(40, 55, 55)).toBe(14);
    });

    it('returns 15 when society is recovering and others are ≥ 40', () => {
      expect(getCardFaceIndex(55, 40, 55)).toBe(15);
    });

    it('returns 16 when economy is recovering and others are ≥ 40', () => {
      expect(getCardFaceIndex(55, 55, 40)).toBe(16);
    });
  });

  // ── 7. Dominant ───────────────────────────────────────────────────────────
  // Condition: dominant(x) = x >= 70; below60(x) = x < 60
  // Use 55 for non-dominant metrics: 55 > 50 skips Recovering, 55 < 60 skips Thriving
  describe('Dominant – one metric ≥ 70, other two < 60', () => {
    it('returns 7 when biosphere is dominant (≥ 70) and others are < 60', () => {
      // bio=75 ≥ 70; soc=55 & eco=55 < 60 AND > 50 (so not Recovering) → Dominant bio
      expect(getCardFaceIndex(75, 55, 55)).toBe(7);
    });

    it('returns 8 when society is dominant and others are < 60', () => {
      expect(getCardFaceIndex(55, 75, 55)).toBe(8);
    });

    it('returns 9 when economy is dominant and others are < 60', () => {
      expect(getCardFaceIndex(55, 55, 75)).toBe(9);
    });
  });

  // ── 8. Balanced ───────────────────────────────────────────────────────────
  // Condition: moderate(x) = x >= 35 && x <= 65  for all three metrics
  // Use 55: in [35,65] AND > 50 (skips Recovering) AND < 60 (skips Thriving)
  describe('Balanced – all metrics moderate (35–65)', () => {
    it('returns 2 when all metrics are 55 (moderate, above recovering range)', () => {
      expect(getCardFaceIndex(55, 55, 55)).toBe(2);
    });

    it('returns 2 when all metrics are 57 (moderate, below healthy threshold)', () => {
      expect(getCardFaceIndex(57, 57, 57)).toBe(2);
    });
  });

  // ── 9. Default / Neutral ──────────────────────────────────────────────────
  // Falls through all previous branches.
  // Use 31: in [31,50] (could be Recovering) but otherTwoAtLeast40(31,31) = false
  // because 31 < 40, so Recovering is skipped. Also 31 < 35 so Balanced is skipped.
  describe('Default / Neutral – no specific pattern matches', () => {
    it('returns 3 when all metrics are 31 (recovering range but others < 40)', () => {
      expect(getCardFaceIndex(31, 31, 31)).toBe(3);
    });
  });

  // ── Boundary / Edge cases ─────────────────────────────────────────────────
  describe('Boundary conditions', () => {
    it('returns 13 (Total Collapse) when all metrics are 0', () => {
      expect(getCardFaceIndex(0, 0, 0)).toBe(13);
    });

    it('returns 1 (Thriving) when all metrics are at maximum (100)', () => {
      expect(getCardFaceIndex(100, 100, 100)).toBe(1);
    });

    it('returns 4 (Single Crisis – bio) when bio=0 and others are 40', () => {
      // soc=40 & eco=40 are not both ≥ 50 → skips Unstable → Single bio
      expect(getCardFaceIndex(0, 40, 40)).toBe(4);
    });

    it('returns 17 (Unstable – bio) when bio=0 and others are at maximum', () => {
      // soc=100 & eco=100 are both ≥ 50 → Unstable bio
      expect(getCardFaceIndex(0, 100, 100)).toBe(17);
    });
  });
});

import { getCardFaceIndex } from "../utils/cardFaceState";

// Structure-based unit tests for getCardFaceIndex(biosphere, society, economy).
// One test per if-branch in the source, plus boundary values.
// Input values are picked so all higher-priority branches are skipped first.

describe("getCardFaceIndex", () => {
  describe("Total Collapse – all metrics critical (≤ 30)", () => {
    it("returns 13 when all metrics are below the critical threshold", () => {
      expect(getCardFaceIndex(10, 10, 10)).toBe(13);
    });

    it("returns 13 when all metrics are exactly at the critical boundary (30)", () => {
      expect(getCardFaceIndex(30, 30, 30)).toBe(13);
    });
  });

  describe("Dual Crises – exactly two metrics critical", () => {
    it("returns 10 when biosphere AND society are critical", () => {
      expect(getCardFaceIndex(10, 10, 70)).toBe(10);
    });

    it("returns 11 when biosphere AND economy are critical", () => {
      expect(getCardFaceIndex(10, 70, 10)).toBe(11);
    });

    it("returns 12 when society AND economy are critical", () => {
      expect(getCardFaceIndex(70, 10, 10)).toBe(12);
    });
  });

  describe("Unstable / Tipping – one metric critical, other two ≥ 50", () => {
    it("returns 17 when biosphere is critical and the other two are ≥ 50", () => {
      expect(getCardFaceIndex(10, 55, 55)).toBe(17);
    });

    it("returns 18 when society is critical and the other two are ≥ 50", () => {
      expect(getCardFaceIndex(55, 10, 55)).toBe(18);
    });

    it("returns 19 when economy is critical and the other two are ≥ 50", () => {
      expect(getCardFaceIndex(55, 55, 10)).toBe(19);
    });
  });

  describe("Single Crisis – one metric critical, others NOT both ≥ 50", () => {
    it("returns 4 when only biosphere is critical", () => {
      // soc=40 and eco=40 are below 50, so the Unstable branch is skipped
      expect(getCardFaceIndex(20, 40, 40)).toBe(4);
    });

    it("returns 5 when only society is critical", () => {
      expect(getCardFaceIndex(40, 20, 40)).toBe(5);
    });

    it("returns 6 when only economy is critical", () => {
      expect(getCardFaceIndex(40, 40, 20)).toBe(6);
    });
  });

  describe("Thriving – all metrics healthy (≥ 60)", () => {
    it("returns 1 when all metrics are above the healthy threshold", () => {
      expect(getCardFaceIndex(70, 70, 70)).toBe(1);
    });

    it("returns 1 when all metrics are exactly at the healthy boundary (60)", () => {
      expect(getCardFaceIndex(60, 60, 60)).toBe(1);
    });
  });

  describe("Recovering – one metric in [31, 50], other two ≥ 40", () => {
    it("returns 14 when biosphere is recovering and others are ≥ 40", () => {
      expect(getCardFaceIndex(40, 55, 55)).toBe(14);
    });

    it("returns 15 when society is recovering and others are ≥ 40", () => {
      expect(getCardFaceIndex(55, 40, 55)).toBe(15);
    });

    it("returns 16 when economy is recovering and others are ≥ 40", () => {
      expect(getCardFaceIndex(55, 55, 40)).toBe(16);
    });
  });

  describe("Dominant – one metric ≥ 70, other two < 60", () => {
    it("returns 7 when biosphere is dominant and others are < 60", () => {
      // 55 is used for the others: above 50 so Recovering is skipped, below 60 so Thriving is skipped
      expect(getCardFaceIndex(75, 55, 55)).toBe(7);
    });

    it("returns 8 when society is dominant and others are < 60", () => {
      expect(getCardFaceIndex(55, 75, 55)).toBe(8);
    });

    it("returns 9 when economy is dominant and others are < 60", () => {
      expect(getCardFaceIndex(55, 55, 75)).toBe(9);
    });
  });

  describe("Balanced – all metrics moderate (35–65)", () => {
    it("returns 2 when all metrics are 55", () => {
      // 55 is in [35,65] and above 50, so the Recovering branch is skipped
      expect(getCardFaceIndex(55, 55, 55)).toBe(2);
    });

    it("returns 2 when all metrics are 57", () => {
      expect(getCardFaceIndex(57, 57, 57)).toBe(2);
    });
  });

  describe("Default – no other pattern matches", () => {
    it("returns 3 when all metrics are 31", () => {
      // 31 is in the recovering range [31,50] but the other two are also 31,
      // which is below 40, so otherTwoAtLeast40 fails and Recovering is skipped.
      // 31 is also below 35 so Balanced is skipped. Falls through to default.
      expect(getCardFaceIndex(31, 31, 31)).toBe(3);
    });
  });

  describe("Boundary conditions", () => {
    it("returns 13 when all metrics are 0", () => {
      expect(getCardFaceIndex(0, 0, 0)).toBe(13);
    });

    it("returns 1 when all metrics are at maximum (100)", () => {
      expect(getCardFaceIndex(100, 100, 100)).toBe(1);
    });

    it("returns 4 when bio=0 and others are 40", () => {
      expect(getCardFaceIndex(0, 40, 40)).toBe(4);
    });

    it("returns 17 when bio=0 and others are at maximum", () => {
      expect(getCardFaceIndex(0, 100, 100)).toBe(17);
    });
  });
});

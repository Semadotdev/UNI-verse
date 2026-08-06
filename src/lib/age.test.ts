import { describe, expect, it } from "vitest";
import { ageFromBirthDate, isAdult } from "./age";

const days = (n: number) => n * 24 * 60 * 60 * 1000;

describe("ageFromBirthDate", () => {
  it("returns null when birthDate is null", () => {
    expect(ageFromBirthDate(null)).toBeNull();
  });

  it("computes an age from a birth date", () => {
    const now = Date.now();
    const birth = new Date(now - days(365.25 * 20));
    expect(ageFromBirthDate(birth)).toBe(20);
  });
});

describe("isAdult", () => {
  it("returns true at exactly 18", () => {
    const birth = new Date(Date.now() - days(365.25 * 18));
    expect(isAdult(birth)).toBe(true);
  });

  it("returns false just under 18", () => {
    const birth = new Date(Date.now() - days(365.25 * 17));
    expect(isAdult(birth)).toBe(false);
  });

  it("returns false for null birthDate (fail closed)", () => {
    expect(isAdult(null)).toBe(false);
  });
});

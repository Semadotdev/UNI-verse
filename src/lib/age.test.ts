import { describe, expect, it } from "vitest";
import { ageFromBirthDate, isAdult } from "./age";

describe("ageFromBirthDate", () => {
  it("returns null when birthDate is null", () => {
    expect(ageFromBirthDate(null)).toBeNull();
  });

  it("computes an age from a birth date", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 20);
    expect(ageFromBirthDate(birth)).toBe(20);
  });

  it("returns 18 on the 18th birthday (calendar-exact)", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 18);
    expect(ageFromBirthDate(birth)).toBe(18);
  });

  it("returns 17 the day before the 18th birthday", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 18);
    birth.setDate(birth.getDate() + 1);
    expect(ageFromBirthDate(birth)).toBe(17);
  });

  it("returns 18 the day after the 18th birthday", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 18);
    birth.setDate(birth.getDate() - 1);
    expect(ageFromBirthDate(birth)).toBe(18);
  });
});

describe("isAdult", () => {
  it("returns true on the 18th birthday", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 18);
    expect(isAdult(birth)).toBe(true);
  });

  it("returns false just under 18", () => {
    const now = new Date();
    const birth = new Date(now);
    birth.setFullYear(now.getFullYear() - 18);
    birth.setDate(birth.getDate() + 1);
    expect(isAdult(birth)).toBe(false);
  });

  it("returns false for null birthDate (fail closed)", () => {
    expect(isAdult(null)).toBe(false);
  });
});

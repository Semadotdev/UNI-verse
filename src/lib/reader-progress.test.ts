import { describe, expect, it } from "vitest";
import { computeReaderProgress } from "./reader-progress";

describe("computeReaderProgress", () => {
  it("marks an intermediate page as incomplete with correct percentage", () => {
    expect(computeReaderProgress(0, 10)).toEqual({ progress: 10, completed: false });
    expect(computeReaderProgress(4, 10)).toEqual({ progress: 50, completed: false });
  });

  it("marks the last page as complete at 100 percent", () => {
    expect(computeReaderProgress(9, 10)).toEqual({ progress: 100, completed: true });
  });

  it("treats a single-page chapter as complete immediately", () => {
    expect(computeReaderProgress(0, 1)).toEqual({ progress: 100, completed: true });
  });

  it("returns safe defaults when there are no pages", () => {
    expect(computeReaderProgress(0, 0)).toEqual({ progress: 0, completed: false });
  });
});

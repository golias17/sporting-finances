import { describe, it, expect, vi } from "vitest";
import { debounce } from "../../src/utils/utils";

describe("debounce", () => {
  it("delays execution", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("cancels previous pending calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("passes arguments to the original function", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced("a", 1);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("a", 1);
    vi.useRealTimers();
  });
});

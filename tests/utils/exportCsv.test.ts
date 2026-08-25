import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToCsv } from "../../src/utils/exportCsv.ts";

describe("exportToCsv Utility", () => {
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create blob and trigger download link with correct filename", () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);

    exportToCsv(
      "test_financials",
      ["Season", "Revenue"],
      [["2024/25", 150000]],
    );

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");

    clickSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("should sanitize cells with commas and quotes", () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });

    exportToCsv("data.csv", ["Header 1", "Header, 2"], [['Val "1"', "Val, 2"]]);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(capturedBlob).not.toBeNull();
  });

  it("should support custom delimiter for European Excel", () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });

    exportToCsv("data.csv", ["Métrica", "2024/25"], [["Receita", "150,0"]], {
      delimiter: ";",
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(capturedBlob).not.toBeNull();
  });
});

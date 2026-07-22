import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { TabLoader } from "../../src/components/TabLoader";

describe("TabLoader Component", () => {
  it("renders the skeleton loader correctly", () => {
    const { container } = render(<TabLoader />);
    
    // Check main container
    const skeleton = container.querySelector(".tab-loading-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");

    // Check header and cards
    expect(container.querySelector(".skeleton-title")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-subtitle")).toBeInTheDocument();
    
    const cards = container.querySelectorAll(".skeleton-card");
    expect(cards).toHaveLength(3);

    expect(container.querySelector(".skeleton-chart")).toBeInTheDocument();
  });
});

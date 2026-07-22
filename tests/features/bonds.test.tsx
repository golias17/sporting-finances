import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { state, useAppState } from "../../src/core/state";
import { VmocCost, UsppTerms, LionFinance } from "../../src/features/Bonds";

describe("Bonds", () => {
  beforeEach(() => {
    state.setIsPt(false);
    const data = [
      { label: "2014/15", financial_result: -10000 },
      { label: "2015/16", financial_result: -12000 },
      { label: "2023/24", financial_result: -5000 },
    ];
    state.setDataset({ annual_data: data } as any);
    useAppState.setState({ fullAnnual: data } as any);
  });

  describe("VmocCost", () => {
    it("should render VMOC cost KPIs and table", () => {
      render(<VmocCost />);
      expect(screen.getByText(/Total net financing cost/i)).toBeInTheDocument();
      expect(screen.getAllByText("€−22.0M").length).toBeGreaterThan(0); // Sum of 14/15 and 15/16

      expect(screen.getByText("2014/15")).toBeInTheDocument();
      expect(screen.getAllByText(/VMOC active/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText("€−10.0M").length).toBeGreaterThan(0);
    });

    it("should render VMOC cost localized when state.isPt is true", () => {
      state.setIsPt(true);
      render(<VmocCost />);
      expect(
        screen.getByText(/Acumulado · Era VMOC \(2014\/15–2021\/22\)/i),
      ).toBeInTheDocument();
    });
  });

  describe("VmocCost — computed values", () => {
    beforeEach(() => {
      const data = [
        { label: "2014/15", financial_result: -1000 },
        { label: "2015/16", financial_result: -2000 },
        { label: "2016/17", financial_result: -3000 },
        { label: "2017/18", financial_result: -4000 },
        { label: "2018/19", financial_result: -5000 },
        { label: "2019/20", financial_result: -6000 },
        { label: "2020/21", financial_result: -7000 },
        { label: "2021/22", financial_result: -8000 },
        { label: "2023/24", financial_result: -2000 },
      ];
      state.setDataset({ annual_data: data } as any);
      useAppState.setState({ fullAnnual: data } as any);
    });

    it("computes the VMOC-era average by dividing the total by all 8 VMOC-period seasons", () => {
      render(<VmocCost />);
      expect(screen.getAllByText(/€−4\.5M/i).length).toBeGreaterThan(0);
    });

    it("computes the post-conversion saving as postConvResult minus the VMOC-era average", () => {
      render(<VmocCost />);
      expect(screen.getByText(/Saving of ~€2\.5M\/yr/i)).toBeInTheDocument();
      const text = screen.getByText(/Saving of ~/i).textContent;
      expect(text).not.toContain("€−2.5M/yr");
    });

    it("scales each row's cost bar proportionally to the peak absolute financing cost", () => {
      const { container } = render(<VmocCost />);
      expect(container.innerHTML).toContain('style="width: 100%;"');
      expect(container.innerHTML).toContain('style="width: 12.5%;"');
    });
  });

  describe("UsppTerms", () => {
    it("should render USPP terms in a grid", () => {
      render(<UsppTerms />);
      expect(screen.getByText("USPP Bond")).toBeInTheDocument();
      expect(screen.getByText("BBB−")).toBeInTheDocument();
      expect(
        screen.getByText(/Estádio Alvalade transformation/i),
      ).toBeInTheDocument();
    });

    it("should render localized USPP terms when state.isPt is true", () => {
      state.setIsPt(true);
      render(<UsppTerms />);
      expect(
        screen.getByText(/Transformação do Estádio Alvalade/i),
      ).toBeInTheDocument();
    });
  });

  describe("LionFinance", () => {
    it("should render Lion Finance cards and switcher", () => {
      render(<LionFinance />);
      expect(screen.getAllByText("Lion Finance No. 1").length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText("Lion Finance No. 2").length).toBeGreaterThan(
        0,
      );
      expect(screen.getByText("Compare Both")).toBeInTheDocument();
    });

    it("should render localized Lion Finance cards when state.isPt is true", () => {
      state.setIsPt(true);
      render(<LionFinance />);
      expect(screen.getByText("Comparar Ambas")).toBeInTheDocument();
      expect(
        screen.getAllByText("Entidade Emitente (SPV)").length,
      ).toBeGreaterThan(0);
    });

    it("should switch tabs when clicked", () => {
      const { container } = render(<LionFinance />);

      const btnNo1 = screen.getByRole("button", {
        name: /Lion Finance No\. 1/i,
      });
      fireEvent.click(btnNo1);

      expect(useAppState.getState().activeLionTab).toBe("no1");
      expect(container.innerHTML).toContain("show-no1");

      const btnNo2 = screen.getByRole("button", {
        name: /Lion Finance No\. 2/i,
      });
      fireEvent.click(btnNo2);

      expect(useAppState.getState().activeLionTab).toBe("no2");
      expect(container.innerHTML).toContain("show-no2");
    });
  });
});

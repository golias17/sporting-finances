import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../src/state.js";
import {
  renderVmocCost,
  renderUsppTerms,
  renderLionFinance,
} from "../src/bonds.js";

describe("bonds.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="vmocCostKpis"></div>
      <div id="vmocCostTable"></div>
      <div id="usppTerms"></div>
      <div id="lionFinanceCards"></div>
    `;

    state.isPt = false;
    state.DATASET = {
      annual_data: [
        { label: "2014/15", financial_result: -10000 },
        { label: "2015/16", financial_result: -12000 },
        { label: "2023/24", financial_result: -5000 },
      ],
    };
  });

  describe("renderVmocCost", () => {
    it("should render VMOC cost KPIs and table", () => {
      renderVmocCost();

      const kpis = document.getElementById("vmocCostKpis");
      expect(kpis.innerHTML).toContain("Total net financing cost");
      expect(kpis.innerHTML).toContain("€−22.0M"); // Sum of 2014/15 and 2015/16

      const table = document.getElementById("vmocCostTable");
      expect(table.innerHTML).toContain("2014/15");
      expect(table.innerHTML).toContain("VMOC active");
      expect(table.innerHTML).toContain("€−10.0M");
    });

    it("should render VMOC cost localized when state.isPt is true", () => {
      state.isPt = true;
      renderVmocCost();

      const table = document.getElementById("vmocCostTable");
      expect(table.innerHTML).toContain("Acumulado · Era VMOC (2014/15–2021/22)");
    });

    it("does nothing (no throw) when the KPI or table container is missing from the page", () => {
      document.getElementById("vmocCostKpis").remove();
      expect(() => renderVmocCost()).not.toThrow();
      // The table container is untouched too — this is a genuine early
      // return, not a partial render.
      expect(document.getElementById("vmocCostTable").innerHTML).toBe("");
    });
  });

  describe("renderVmocCost — computed values", () => {
    beforeEach(() => {
      // A richer mock than the file-level one above, covering all 8
      // VMOC-era seasons plus the post-conversion season with distinct
      // values, so the averaging/scaling/saving math is independently
      // verifiable — not just "some formatted number appears somewhere".
      state.DATASET = {
        annual_data: [
          { label: "2014/15", financial_result: -1000 },
          { label: "2015/16", financial_result: -2000 },
          { label: "2016/17", financial_result: -3000 },
          { label: "2017/18", financial_result: -4000 },
          { label: "2018/19", financial_result: -5000 },
          { label: "2019/20", financial_result: -6000 },
          { label: "2020/21", financial_result: -7000 },
          { label: "2021/22", financial_result: -8000 },
          { label: "2023/24", financial_result: -2000 },
        ],
      };
    });

    it("computes the VMOC-era average by dividing the total by all 8 VMOC-period seasons", () => {
      renderVmocCost();
      const kpis = document.getElementById("vmocCostKpis").innerHTML;
      // Total: -1000-2000-3000-4000-5000-6000-7000-8000 = -36000
      // Average: -36000 / 8 = -4500 -> €−4.5M
      expect(kpis).toContain("€−4.5M");
    });

    it("computes the post-conversion saving as postConvResult minus the VMOC-era average, not the other way around", () => {
      // Regression test: this used to compute vmocAvg - postConvResult,
      // which is negative in every realistic case (a less-negative
      // post-conversion cost minus a more-negative era average) — verified
      // against the real dataset, where it rendered "Saving of ~€−6.3M/yr".
      // The correct framing is postConvResult - vmocAvg: (-2000) - (-4500)
      // = +2500 -> a genuinely positive €2.5M/yr saving.
      renderVmocCost();
      const kpis = document.getElementById("vmocCostKpis").innerHTML;
      expect(kpis).toContain("Saving of ~€2.5M/yr");
      expect(kpis).not.toContain("Saving of ~€−2.5M/yr");
    });

    it("scales each row's cost bar proportionally to the peak absolute financing cost across all rows", () => {
      renderVmocCost();
      const table = document.getElementById("vmocCostTable").innerHTML;
      // Peak absolute cost among the mocked seasons is 2021/22's €8000 ->
      // its bar should be exactly 100%.
      expect(table).toContain('style="width: 100.0%"');
      // 2014/15's €1000 is 1/8th of the €8000 peak -> 12.5%.
      expect(table).toContain('style="width: 12.5%"');
    });
  });

  describe("renderUsppTerms", () => {
    it("should render USPP terms in a grid", () => {
      renderUsppTerms();

      const terms = document.getElementById("usppTerms");
      expect(terms.innerHTML).toContain("USPP Bond");
      expect(terms.innerHTML).toContain("BBB−");
      expect(terms.innerHTML).toContain("Estádio Alvalade transformation");
    });

    it("should render localized USPP terms when state.isPt is true", () => {
      state.isPt = true;
      renderUsppTerms();

      const terms = document.getElementById("usppTerms");
      expect(terms.innerHTML).toContain("Transformação do Estádio Alvalade");
    });

    it("does nothing (no throw) when the usppTerms container is missing from the page", () => {
      document.getElementById("usppTerms").remove();
      expect(() => renderUsppTerms()).not.toThrow();
    });
  });

  describe("renderLionFinance", () => {
    it("should render Lion Finance cards and switcher", () => {
      renderLionFinance();

      const cards = document.getElementById("lionFinanceCards");
      expect(cards.innerHTML).toContain("Lion Finance No. 1");
      expect(cards.innerHTML).toContain("Lion Finance No. 2");
      expect(cards.innerHTML).toContain("Compare Both");
    });

    it("should render localized Lion Finance cards when state.isPt is true", () => {
      state.isPt = true;
      renderLionFinance();

      const cards = document.getElementById("lionFinanceCards");
      expect(cards.innerHTML).toContain("Comparar Ambas");
      expect(cards.innerHTML).toContain("Emitente");
    });

    it("should switch tabs when clicked", () => {
      renderLionFinance();

      const btnNo1 = document.querySelector('[data-view="no1"]');
      btnNo1.click();

      expect(state.activeLionTab).toBe("no1");

      const cards = document.getElementById("lionFinanceCards");
      expect(cards.innerHTML).toContain("show-no1");

      const btnNo2 = document.querySelector('[data-view="no2"]');
      btnNo2.click();

      expect(state.activeLionTab).toBe("no2");
      expect(cards.innerHTML).toContain("show-no2");
    });
  });
});

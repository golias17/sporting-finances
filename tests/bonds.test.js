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

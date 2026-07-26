import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useAppState } from "../../core/state.ts";
import { fmtMillions } from "../../charts/chartUtils.ts";
import type { FinancialRecord } from "../../core/types.ts";
import { useTranslation } from "../../hooks/useTranslation.js";

export function VmocCost() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const fullAnnual = useAppState((s) => s.fullAnnual);

  if (!fullAnnual || fullAnnual.length === 0) return null;

  const rows = [
    {
      season: "2012/13",
      period: "pre",
      note: isPt
        ? "Dívida bancária de curto prazo (BCP, Novo Banco, BES) — linhas de crédito rotativo elevadas, sem estrutura de longo prazo"
        : "Short-term bank debt (BCP, Novo Banco, BES) — high revolving credit lines, no long-term structure",
    },
    {
      season: "2013/14",
      period: "pre",
      note: isPt
        ? "Último ano da estrutura antiga; clube à beira de uma crise de liquidez"
        : "Final year of the old structure; club on the brink of liquidity crisis",
    },
    {
      season: "2014/15",
      period: "vmoc",
      note: isPt
        ? "VMOCs emitidos em Nov 2014 (€135M nominais, ~8% cupão) — custo inferior aos anos anteriores devido à conversão da antiga dívida bancária na reestruturação"
        : "VMOCs issued Nov 2014 (€135M nominal, ~8% coupon) — cost lower than prior years because old bank debt was converted at restructuring",
    },
    {
      season: "2015/16",
      period: "vmoc",
      note: isPt
        ? "VMOCs + obrigações públicas Sporting 2010 e 2014 ativas; contrato NOS assinado em Dez 2015"
        : "VMOCs + Sporting 2010 and 2014 public bonds outstanding; NOS TV contract signed Dec 2015",
    },
    {
      season: "2016/17",
      period: "vmoc",
      note: isPt
        ? "VMOCs + obrigações públicas; época do ataque a Alcochete — sem eventos financeiros extraordinários"
        : "VMOCs + public bonds; Alcochete attack season — no unusual financial items",
    },
    {
      season: "2017/18",
      period: "vmoc",
      note: isPt
        ? "VMOCs + obrigações públicas; estrutura estável, sem novos instrumentos"
        : "VMOCs + public bonds; stable structure, no new instruments",
    },
    {
      season: "2018/19",
      period: "vmoc",
      note: isPt
        ? "Lançamento da Lion Finance Nº 1 em Mar 2019 (titularização de €64M) — adiciona custos de titularização aos juros das VMOCs nas últimas semanas do exercício"
        : "Lion Finance No. 1 launched Mar 2019 (€64M securitization) — adds securitization cost on top of VMOC interest in final weeks of FY",
    },
    {
      season: "2019/20",
      period: "vmoc",
      note: isPt
        ? "Ano de custo máximo da era VMOC — VMOCs (€135M) + titularização Lion Finance Nº 1 ativos em simultâneo em ano completo (a era USPP, a partir de 2024/25, ultrapassa este valor)"
        : "Peak cost year of the VMOC era — VMOCs (€135M) + Lion Finance No. 1 securitization in full force simultaneously (the USPP era, from 2024/25, exceeds this)",
    },
    {
      season: "2020/21",
      period: "vmoc",
      note: isPt
        ? "VMOCs + titularização; época COVID — sem novos instrumentos materiais"
        : "VMOCs + securitization; COVID season — no material new instruments",
    },
    {
      season: "2021/22",
      period: "vmoc",
      note: isPt
        ? "Aumento da LF Nº 1 em +€38,5M (Mar 2022) e depois +€11,5M; última época completa com os €135M de VMOCs em circulação"
        : "LF No. 1 topped up +€38.5M (Mar 2022) then +€11.5M; last full season with all €135M VMOCs outstanding",
    },
    {
      season: "2022/23",
      period: "conv1",
      note: isPt
        ? "Ago 2022: conversão de €83,6M de VMOCs em ações — os juros acumulados até à conversão inflamam o custo deste ano; LF Nº 1 ainda ativa"
        : "Aug 2022: €83.6M of VMOCs converted into shares — accrued interest at conversion inflates this year's cost; LF No. 1 still active",
    },
    {
      season: "2023/24",
      period: "conv2",
      note: isPt
        ? "Dez 2023: conversão dos restantes €51,4M de VMOCs + substituição da LF Nº 1 pela LF Nº 2 (€113,9M) no mesmo dia — VMOCs totalmente extintas; queda acentuada de custos reflete a ausência de juros de VMOCs"
        : "Dec 2023: remaining €51.4M VMOCs converted + LF No. 1 replaced by LF No. 2 (€113.9M) same day — VMOCs fully gone; sharp cost drop reflects absence of VMOC interest",
    },
    {
      season: "2024/25",
      period: "uspp",
      note: isPt
        ? "LF Nº 2 + obrigações públicas (2024-2027 e 2024-2028) — USPP emitido em Out 2025, após o fecho desta época; o custo anual do USPP (≈ €12,9M/ano) surgirá a partir de 2025/26"
        : "LF No. 2 + public bonds (2024-2027 and 2024-2028) — USPP issued Oct 2025, after this FY ended; USPP annual cost ≈ €12.9M/yr will appear from 2025/26 onward",
    },
  ];

  const vmocRows = rows.filter((r) => r.period === "vmoc");
  const vmocTotal = vmocRows.reduce(
    (s, r) =>
      s + (fullAnnual.find((d) => d.label === r.season)?.financial_result ?? 0),
    0,
  );
  const vmocAvg = vmocTotal / vmocRows.length;

  const periodClass: Record<string, string> = {
    pre: "",
    vmoc: "period-vmoc",
    conv1: "period-conv1",
    conv2: "period-conv2",
    uspp: "period-uspp",
  };

  const periodLabel: Record<string, string> = {
    pre: isPt ? "Pré-VMOC" : "Pre-VMOC",
    vmoc: isPt ? "VMOC ativo" : "VMOC active",
    conv1: isPt ? "Conversão 1" : "Conversion 1",
    conv2: isPt ? "Conversão 2" : "Conversion 2",
    uspp: isPt ? "Era USPP" : "USPP era",
  };

  const postConvResult =
    fullAnnual.find((d) => d.label === "2023/24")?.financial_result ?? 0;

  const peakFinancingCost = Math.max(
    1,
    ...rows.map((r) => {
      const d = fullAnnual.find((fd) => fd.label === r.season);
      return d ? Math.abs(d.financial_result) : 0;
    }),
  );
  const peakFmtLabel = fmtMillions(peakFinancingCost);
  const tableCaption = isPt
    ? "Custo de financiamento líquido por época, 2010/11–2024/25"
    : "Net financing cost by season, 2010/11–2024/25";

  return (
    <>
      <div className="vmoc-kpi-strip">
        <div className="vmoc-kpi-item">
          <div className="vk-label">
            {isPt
              ? "Custo finan. líquido total · Era VMOC (2014/15–2021/22)"
              : "Total net financing cost · VMOC era (2014/15–2021/22)"}
          </div>
          <div className="vk-value neg">{fmtMillions(vmocTotal)}</div>
          <div className="vk-note">
            {isPt
              ? "Acumulado em 8 épocas — VMOCs como instrumento dominante, mas inclui também custos de titularização e obrigações públicas"
              : "Cumulative across 8 seasons — VMOCs the dominant instrument but also includes securitization and public bond costs"}
          </div>
        </div>
        <div className="vmoc-kpi-item">
          <div className="vk-label">
            {isPt
              ? "Custo médio anual de financiamento · Era VMOC"
              : "Average annual financing cost · VMOC era"}
          </div>
          <div className="vk-value neg">
            {fmtMillions(vmocAvg)}
            {isPt ? "/ano" : "/yr"}
          </div>
          <div className="vk-note">
            {isPt
              ? "Custo misto de todos os instrumentos ativos em cada ano"
              : "Blended cost across all instruments active in each year"}
          </div>
        </div>
        <div className="vmoc-kpi-item">
          <div className="vk-label">
            {isPt
              ? "Custo finan. líquido após conversão das VMOCs (2023/24)"
              : "Net financing cost after VMOC conversion (2023/24)"}
          </div>
          <div className="vk-value neg">{fmtMillions(postConvResult)}</div>
          <div className="vk-note">
            {isPt
              ? `Poupança de ~${fmtMillions(postConvResult - vmocAvg)}/ano face à média da era VMOC — antes do impacto do USPP`
              : `Saving of ~${fmtMillions(postConvResult - vmocAvg)}/yr vs the VMOC era average — before USPP kicks in`}
          </div>
        </div>
      </div>

      <div className="vmoc-table-legend">
        <span>
          <span className="vtl-bar vtl-bar--info"></span>{" "}
          {isPt ? "VMOC ativo" : "VMOC active"}
        </span>
        <span>
          <span className="vtl-bar vtl-bar--gold"></span>{" "}
          {isPt ? "Ano de conversão" : "Conversion year"}
        </span>
        <span>
          <span className="vtl-bar vtl-bar--green"></span>{" "}
          {isPt ? "Era USPP" : "USPP era"}
        </span>
      </div>

      <div className="scroll-x">
        <table className="vmoc-cost">
          <caption className="sr-only">{tableCaption}</caption>
          <thead>
            <tr>
              <th>{isPt ? "Época" : "Season"}</th>
              <th>{isPt ? "Período" : "Period"}</th>
              <th>{isPt ? "Custo de finan. líquido" : "Net financing cost"}</th>
              <th>{isPt ? "Escala" : "Scale"}</th>
              <th>
                {isPt ? "Composição deste valor" : "What's inside this number"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = fullAnnual.find((fd) => fd.label === r.season);
              if (!d) return null;
              const val = d.financial_result;
              const cls = periodClass[r.period];
              const pct = Math.min(
                100,
                Math.max(0, (Math.abs(val) / peakFinancingCost) * 100),
              );

              return (
                <tr key={r.season} className={cls}>
                  <td>{r.season}</td>
                  <td>{periodLabel[r.period]}</td>
                  <td className="cost-neg">
                    <div className="vmoc-cost-cell">
                      <span>{fmtMillions(val)}</span>
                    </div>
                  </td>
                  <td>
                    <div
                      className="cost-bar-container"
                      title={
                        isPt
                          ? `Proporcional ao custo máximo de ${peakFmtLabel}`
                          : `Proportional to peak cost of ${peakFmtLabel}`
                      }
                    >
                      <div
                        className={`cost-bar ${r.period === "pre" ? "pre" : "period-" + r.period}`}
                        style={{ width: `${pct.toFixed(1)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>{r.note}</td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td colSpan={2}>
                {isPt
                  ? "Acumulado · Era VMOC (2014/15–2021/22)"
                  : "Cumulative · VMOC era (2014/15–2021/22)"}
              </td>
              <td className="cost-neg">{fmtMillions(vmocTotal)}</td>
              <td></td>
              <td>
                {isPt
                  ? `Média de ${fmtMillions(vmocAvg)}/ano · todos os instrumentos combinados`
                  : `Avg ${fmtMillions(vmocAvg)}/yr · all instruments combined`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}


function renderVmocCost() {
  const kpisContainer = document.getElementById("vmocCostKpis");
  const tableContainer = document.getElementById("vmocCostTable");

  // We'll render both parts inside their respective containers,
  // but we can just render the entire VmocCost in one place and let React structure it.
  // Wait, the HTML has `<div id="vmocCostKpis"></div>` and `<div id="vmocCostTable"></div>` side-by-side.
  // Let's render the entire thing into a wrapper if we want, or just render it into `vmocCostKpis` and leave `vmocCostTable` empty.

  if (kpisContainer) {
    if (!vmocCostKpisRoot) vmocCostKpisRoot = createRoot(kpisContainer);
    vmocCostKpisRoot.render(<VmocCost />);

    // Clear out the old table container since VmocCost renders both
    if (tableContainer) tableContainer.innerHTML = "";
  }
}


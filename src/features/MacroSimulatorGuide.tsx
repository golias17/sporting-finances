import React, { useState } from "react";
import { useAppState } from "../core/state.js";
import { useTranslation } from "../hooks/useTranslation.js";

export function MacroSimulatorGuide() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [guideTab, setGuideTab] = useState<"howToUse" | "methodology">(
    "howToUse",
  );
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className="card simulator-guide-card"
      style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}
    >
      <div
        className="card-head"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.25rem" }}>💡</span>
          <div>
            <h3 style={{ margin: 0 }}>
              {isPt
                ? "Guia do Simulador Orçamental Macro (CFO)"
                : "Macro CFO Budget Simulator User Guide"}
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              {isPt
                ? "Instruções de utilização, mecânica de receitas/custos e impacto nos Capitais Próprios"
                : "Usage instructions, revenue/cost dynamics, and balance sheet solvency mechanics"}
            </span>
          </div>
        </div>
        <button type="button" className="pill-btn" style={{ flexShrink: 0 }}>
          {isExpanded
            ? isPt
              ? "Minimizar Guia"
              : "Minimize Guide"
            : isPt
              ? "Expandir Guia"
              : "Expand Guide"}
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: "1.25rem",
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "1.25rem",
          }}
        >
          {/* Sub-selector inside Guide */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            <button
              type="button"
              className={`pill-btn ${guideTab === "howToUse" ? "active" : ""}`}
              onClick={() => setGuideTab("howToUse")}
            >
              {isPt
                ? "🚀 Como Usar o Simulador Macro"
                : "🚀 How to Use the Macro Simulator"}
            </button>
            <button
              type="button"
              className={`pill-btn ${guideTab === "methodology" ? "active" : ""}`}
              onClick={() => setGuideTab("methodology")}
            >
              {isPt
                ? "⚙️ Metodologia & Nuances do Modelo"
                : "⚙️ Methodology & Model Dynamics"}
            </button>
          </div>

          {/* TAB 1: HOW TO USE */}
          {guideTab === "howToUse" && (
            <div
              className="grid-2"
              style={{ gap: "1rem", alignItems: "stretch" }}
            >
              {/* Step 1 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--pos)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    1
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    {isPt
                      ? "Escolha um Cenário Estratégico (1-Clique)"
                      : "Pick a Strategic Preset (1-Click)"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Comece por clicar num dos cenários rápidos no topo do painel esquerdo: 'Caso Base', 'Conservador', 'Otimista', 'UCL (Suíço)', 'Super Venda (Gyökeres)' ou 'Austeridade' para carregar pressupostos orçamentais automáticos."
                    : "Start by picking a 1-click strategic preset: 'Base Case', 'Conservative', 'Optimistic', 'UCL (Swiss)', 'Super Sale (Gyökeres)', or 'Austerity' to load pre-configured financial assumptions."}
                </p>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--pos)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    2
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    {isPt
                      ? "Ajuste as 4 Dimensões Orçamentais"
                      : "Calibrate the 4 Budgetary Levers"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Refine as hipóteses deslizando os controlos: 💰 Receitas (Fase UCL e Bilhética/Comercial), 💼 Custos (Massa Salarial e FSEs), ⚽ Plantel (Vendas e Reinvestimento em Compras) e 🏦 Dívida (Amortização extraordinária)."
                    : "Fine-tune assumptions with the sliders: 💰 Revenues (UCL stage & Commercial), 💼 Costs (Wage Bill & Operating Expenses), ⚽ Squad (Sales & Purchase Reinvestment), and 🏦 Debt (Extraordinary Amortization)."}
                </p>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--pos)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    3
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    {isPt
                      ? "Avalie o Diagnóstico e a Demonstração de Resultados"
                      : "Inspect Diagnosis & Live Statement"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Verifique nos KPIs o Resultado Líquido, EBITDA, Rácio Salarial e Caixa. Consulte a caixa de veredito executivo e examine a tabela linha a linha comparando a situação real auditada com o seu cenário projetado."
                    : "Check headline KPIs (Net Profit, EBITDA, Wage Ratio, Cash). Read the executive verdict box and review the live statement table comparing audited baseline figures against projected variances."}
                </p>
              </div>

              {/* Step 4 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--pos)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    4
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    {isPt
                      ? "Fixe para Comparar & Partilhe o Link"
                      : "Pin to Compare & Share URL Link"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Use 'Fixar para Comparar' para memorizar um cenário de referência e ver as diferenças nos gráficos, ou clique em 'Copiar Link' para gerar uma URL partilhável com todos os parâmetros que configurou."
                    : "Use 'Pin to Compare' to freeze a reference scenario on charts, or click 'Copy Link' to generate a shareable URL encoding your exact configuration."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: METHODOLOGY */}
          {guideTab === "methodology" && (
            <div
              className="grid-2"
              style={{ gap: "1rem", alignItems: "stretch" }}
            >
              {/* Item 1 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}
                >
                  <span>🏛️</span>
                  <span>
                    {isPt
                      ? "1. Linha de Base Auditada (2024/25)"
                      : "1. Audited Baseline (2024/25)"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "O motor parte das demonstrações consolidadas oficiais do Sporting CP no fecho do exercício 2024/25. Todas as simulações calculam os desvios incrementais face a esta base auditada."
                    : "The simulation engine starts from official audited consolidated statements of Sporting CP at 2024/25 fiscal year-end. All adjustments calculate incremental variances relative to this baseline."}
                </p>
              </div>

              {/* Item 2 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}
                >
                  <span>🏆</span>
                  <span>
                    {isPt
                      ? "2. Premiação UCL & Atrito Contratual (~15%)"
                      : "2. UCL Prize Money & Bonus Drag (~15%)"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Receitas da Liga dos Campeões integram prémios de qualificação, direitos televisivos e bilhética. O modelo orçamental abate automaticamente ~15% em prémios contratuais devidos ao plantel."
                    : "Champions League prize money combines participation distribution, TV pool, and matchday ticket sales. The engine automatically deducts ~15% in contractual performance bonuses."}
                </p>
              </div>

              {/* Item 3 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}
                >
                  <span>⚽</span>
                  <span>
                    {isPt
                      ? "3. Mecânica Contabilística de Passes"
                      : "3. Transfer Accounting Mechanics"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "As vendas geram encaixe e mais-valia imediata a 100% no exercício. As compras são capitalizadas no Ativo Intangível e amortizadas linearmente a 5 anos (20%/ano)."
                    : "Player sales generate immediate 100% accounting profit in the fiscal year. Purchases are capitalized as intangible assets and amortized straight-line over 5 years (20%/yr)."}
                </p>
              </div>

              {/* Item 4 */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: "1px solid var(--rule, rgba(0,0,0,0.06))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}
                >
                  <span>🏦</span>
                  <span>
                    {isPt
                      ? "4. Desalavancagem e Poupança de Juros (~2%)"
                      : "4. Debt Deleveraging & Interest Savings (~2%)"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {isPt
                    ? "Amortizações extraordinárias de dívida bancária reduzem custos financeiros líquidos a uma taxa média de ~2%/ano. O Resultado Líquido projetado transita diretamente para o Capital Próprio."
                    : "Extraordinary debt repayments reduce net financial expenses by an estimated ~2%/yr. The projected Net Result feeds directly into Shareholders' Equity."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

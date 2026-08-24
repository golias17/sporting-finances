import React, { useState } from "react";
import { useAppState } from "../core/state.js";
import { useTranslation } from "../hooks/useTranslation.js";

export function SquadCostCalculatorGuide() {
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
                ? "Guia do Calculador de Contratações (UEFA Squad Cost Rule)"
                : "UEFA Squad Cost Rule Transfer Impact Calculator User Guide"}
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              {isPt
                ? "Como simular o impacto de um jogador, regras UEFA FSR de 70% e projeção a 3 anos"
                : "How to simulate player deal impact, UEFA FSR 70% rule, and 3-year multi-year horizon"}
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
                ? "🚀 Como Usar o Calculador de Contratações"
                : "🚀 How to Use the Transfer Calculator"}
            </button>
            <button
              type="button"
              className={`pill-btn ${guideTab === "methodology" ? "active" : ""}`}
              onClick={() => setGuideTab("methodology")}
            >
              {isPt
                ? "🛡️ Regras Regulamentares da UEFA FSR"
                : "🛡️ UEFA FSR Regulatory Rules"}
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
                      ? "Escolha a Época & Janela de Mercado"
                      : "Select Season & Transfer Window"}
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
                    ? "Defina a época alvo (2025/26 com teto de 70% ou 2024/25 com teto de 80%) e a janela: Verão (impacto fiscal a 12 meses) ou Inverno (impacto pro-rata de 6 meses no 1.º exercício)."
                    : "Set the target season (2025/26 with 70% cap or 2024/25 with 80% cap) and window: Summer (12-month full year impact) or Winter (6-month pro-rata impact in Year 1)."}
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
                      ? "Configure os Custos do Jogador"
                      : "Configure Player Deal Terms"}
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
                    ? "Introduza o Custo do Passe (€M), a Duração do Contrato (máx. 5 anos UEFA), o Salário Bruto Anual (€M) e as Comissões de Intermediação / Prémio de Assinatura."
                    : "Enter Transfer Fee (€M), Contract Duration (max 5 yrs UEFA), Annual Gross Wage (€M), and Agent / Sign-on Intermediation Fees."}
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
                      ? "Simule uma Saída Compensatória (Opcional)"
                      : "Simulate Outgoing Sale Offset (Optional)"}
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
                    ? "Para operações avultadas, teste o efeito de vender um jogador em simultâneo (encaixe e salário poupado) para absorver o impacto da nova contratação no rácio regulamentar."
                    : "For major signings, simulate an outgoing player sale (fee and wage saved) to generate immediate relief and buffer the Squad Cost ratio."}
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
                      ? "Analise o Horizonte a 3 Anos & Diagnóstico"
                      : "Examine 3-Year Horizon & Verdict"}
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
                    ? "Observe a projeção plurianual para confirmar se a contratação é sustentável no Ano 2 (quando a mais-valia da venda cai para 0€ e os encargos estruturais continuam a 100%)."
                    : "Review the 3-year multi-year horizon to verify if the deal remains sustainable in Year 2 (when the one-off sale windfall ends while recurring wages and amortization continue)."}
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
                  <span>🛡️</span>
                  <span>
                    {isPt
                      ? "1. Teto Regulamentar de 70% (Squad Cost Rule)"
                      : "1. 70% Squad Cost Regulatory Cap"}
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
                    ? "A UEFA exige que os custos totais com plantel desportivo (salários + amortizações de passes + comissões) não excedam 70% das receitas elegíveis do clube (receitas operacionais + mais-valias líquidas de passes)."
                    : "UEFA mandates that total squad costs (wages + amortizations + agent fees) must not exceed 70% of eligible revenue (operating revenues + net transfer profits)."}
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
                  <span>⏳</span>
                  <span>
                    {isPt
                      ? "2. Teto de Amortização Máxima de 5 Anos"
                      : "2. 5-Year Maximum Amortization Cap"}
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
                    ? "Para efeitos do rácio da UEFA, qualquer custo de transferência é dividido no máximo por 5 anos fiscais, mesmo que o jogador assine um contrato por 6, 7 ou 8 temporadas."
                    : "For UEFA FSR purposes, transfer fees are amortized over a maximum of 5 fiscal years, regardless of longer contract agreements (e.g. 6 to 8-year contracts)."}
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
                  <span>☀️❄️</span>
                  <span>
                    {isPt
                      ? "3. Janelas e Efeito Pro-Rata (Verão vs Inverno)"
                      : "3. Window Timing & Pro-Rata Effect"}
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
                    ? "Contratações no mercado de inverno (janeiro) registam apenas metade da amortização e metade do encargo salarial no 1.º exercício fiscal (6 meses até 30 de junho)."
                    : "Winter window signings (January) register only 50% of annual amortization and wages in Year 1 (6 months until the June 30 financial close)."}
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
                  <span>📈</span>
                  <span>
                    {isPt
                      ? "4. O Efeito Bipolar Plurianual (Ano 1 vs Ano 2)"
                      : "4. Multi-Year Windfall Lag (Year 1 vs Year 2)"}
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
                    ? "A mais-valia imediata de uma venda absorve os custos no Ano 1. No Ano 2, a mais-valia cessa, mas o salário e a amortização do reforço continuam a pesar no rácio."
                    : "The immediate transfer profit of a sale masks costs in Year 1. In Year 2, that gain expires, while the new player's wages and amortization continue at full weight."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

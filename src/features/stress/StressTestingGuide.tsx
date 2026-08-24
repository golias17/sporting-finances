import React, { useState } from "react";
import { useAppState } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export function StressTestingGuide() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [guideTab, setGuideTab] = useState<"howToUse" | "methodology">("howToUse");
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
          <span style={{ fontSize: "1.25rem" }}>🛡️</span>
          <div>
            <h3 style={{ margin: 0 }}>
              {isPt
                ? "Guia de Testes de Esforço & Resiliência de Tesouraria"
                : "Stress Testing & Treasury Resilience User Guide"}
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              {isPt
                ? "Metodologia de stress testing, métricas de autonomia (runway) e limites do Artigo 35.º CSC"
                : "Stress testing methodology, runway liquidity metrics, and Article 35 CSC solvency limits"}
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
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--rule)", paddingTop: "1rem" }}>
          {/* Sub-tabs */}
          <div className="filter-toolbar" style={{ marginBottom: "1rem" }}>
            <div className="filter-toolbar-group">
              <button
                type="button"
                className={`btn-preset ${guideTab === "howToUse" ? "active" : ""}`}
                onClick={() => setGuideTab("howToUse")}
              >
                {isPt ? "📖 Como Utilizar os Cenários" : "📖 How to Use Scenarios"}
              </button>
              <button
                type="button"
                className={`btn-preset ${guideTab === "methodology" ? "active" : ""}`}
                onClick={() => setGuideTab("methodology")}
              >
                {isPt ? "📐 Metodologia & Risco" : "📐 Methodology & Risk"}
              </button>
            </div>
          </div>

          {guideTab === "howToUse" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--green)" }}>
                  {isPt ? "1. Seleção de Presets" : "1. Preset Selection"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "Escolha um cenário de choque pré-definido (Base, Sem UCL, Inverno Europeu ou Tempestade Perfeita) para avaliar instantaneamente a resposta financeira da SAD."
                    : "Choose a predefined stress scenario (Base, No UCL, European Winter, or Perfect Storm) to evaluate the SAD instantaneous financial response."}
                </p>
              </div>

              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--gold)" }}>
                  {isPt ? "2. Ajuste Fino dos Parâmetros" : "2. Fine-Tuning Shocks"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "Modifique os sliders de quebra de receitas UEFA, estagnação de mercado, inflação de fornecedores ou agravamento da Euribor para testar choques personalizados."
                    : "Adjust UEFA revenue drops, player trading drops, operating inflation, or Euribor hikes to stress-test tailored economic shocks."}
                </p>
              </div>

              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--info)" }}>
                  {isPt ? "3. Leitura do Runway e Capital Próprio" : "3. Reading Runway & Equity"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "Verifique o número de meses de liquidez autónoma (Runway) e se os Capitais Próprios mantêm saldo positivo sem violar o Artigo 35.º do Código das Sociedades Comerciais."
                    : "Check months of cash runway and confirm if Equity remains safely in positive territory without triggering Article 35 Portuguese Companies Code limits."}
                </p>
              </div>
            </div>
          )}

          {guideTab === "methodology" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--green)" }}>
                  {isPt ? "Mecânica da Sazonalidade de Caixa" : "Monthly Cash Seasonality"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "A modelação de 24 meses incorpora a sazonalidade real do futebol: picos de liquidez em Julho/Agosto (Gamebox e fecho da janela de verão) e Janeiro, com períodos de menor entrada em Maio/Junho."
                    : "The 24-month model captures real football seasonality: cash inflows peak in July/August (season tickets & summer transfer window) and January, with lower receipts in May/June."}
                </p>
              </div>

              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--gold)" }}>
                  {isPt ? "Reserva Prudencial (€10M)" : "Prudential Cash Buffer (€10M)"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "A linha de segurança de €10M representa a almofada mínima recomendada para cobrir despesas correntes de salários e amortizações sem dependência de descobertos bancários."
                    : "The €10M threshold represents the minimum recommended buffer to fund monthly operations and payroll smoothly without overdraft dependency."}
                </p>
              </div>

              <div style={{ background: "var(--paper)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rule)" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--info)" }}>
                  {isPt ? "Artigo 35.º do CSC & Solvência" : "Article 35 CSC & Solvency"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {isPt
                    ? "Quando o Capital Próprio fica inferior a metade do Capital Social (ou negativo), a lei exige medidas de recapitalização. A SAD do Sporting recuperou de CP negativos para +€40.9M em 2024/25."
                    : "Under Portuguese law, if equity drops below half of nominal share capital, corrective recapitalization is required. Sporting SAD successfully recovered to +€40.9M in 2024/25."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

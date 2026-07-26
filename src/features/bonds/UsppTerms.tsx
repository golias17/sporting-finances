import React from "react";
import { useAppState } from "../../core/state.ts";
import { useTranslation } from "../../hooks/useTranslation.js";

export function UsppTerms() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);

  const terms = [
    {
      label: isPt ? "Instrumento" : "Instrument",
      value: "USPP Bond",
      note: isPt
        ? "US Private Placement — vendido a investidores institucionais, não cotado publicamente"
        : "US Private Placement — sold to institutional investors, not listed publicly",
      highlight: false,
    },
    {
      label: isPt ? "Emitente" : "Issuer",
      value: "Sporting Entertainment",
      note: isPt
        ? "Subsidiária detida a 100% pela SAD — isola a dívida do estádio das operações do futebol"
        : "Wholly-owned SAD subsidiary — ring-fences stadium debt from football operations",
      highlight: false,
    },
    {
      label: isPt ? "Montante" : "Amount",
      value: "€225M",
      note: isPt
        ? "Maior financiamento individual da história da Sporting SAD"
        : "Largest single financing in Sporting SAD history",
      highlight: true,
    },
    {
      label: isPt ? "Prazo" : "Tenor",
      value: isPt ? "28 anos" : "28 years",
      note: isPt
        ? "Vence em 2053. A maioria da dívida dos clubes tem maturidade de 3 a 7 anos"
        : "Matures circa 2053. Most football club debt runs 3–7 years",
      highlight: true,
    },
    {
      label: isPt ? "Cupão" : "Coupon",
      value: "5.75%",
      note: isPt
        ? "Taxa fixa; spread de 2,85% sobre as Mid-Swaps"
        : "Fixed rate; spread of 2.85% over Mid-Swaps",
      highlight: false,
    },
    {
      label: isPt ? "Custos de estrutura" : "Structure costs",
      value: "0.16%/yr",
      note: isPt
        ? "Custo total de comissões financeiras, legais e de estruturação sobre 225 M€"
        : "All-in cost of financial, legal and structuring fees on €225M",
      highlight: false,
    },
    {
      label: isPt ? "Rating Fitch" : "Fitch rating",
      value: "BBB−",
      note: isPt
        ? "Nível de entrada no grau de investimento — pioneiro para um clube de futebol português"
        : "Lowest investment-grade tier — first ever for a Portuguese football club",
      highlight: true,
    },
    {
      label: isPt ? "Rating DBRS" : "DBRS rating",
      value: "BBB (low)",
      note: isPt
        ? "Equivalente a grau de investimento pela DBRS Morningstar"
        : "Investment grade equivalent from DBRS Morningstar",
      highlight: true,
    },
    {
      label: isPt ? "Procura" : "Demand",
      value: "~€2bn (8.5×)",
      note: isPt
        ? "Procura 8,5 vezes superior à oferta — sinal de forte confiança institucional"
        : "Oversubscribed 8.5× — signals deep institutional confidence",
      highlight: true,
    },
    {
      label: isPt ? "Data de fecho" : "Closing date",
      value: isPt ? "22 Out 2025" : "Oct 22, 2025",
      note: isPt
        ? "Agendado após confirmação de capitais próprios de +41 M€ nos resultados anuais de 24/25"
        : "Timed after 24/25 annual results confirmed equity at +€41M",
      highlight: false,
    },
  ];

  const uses = [
    {
      icon: "🏟️",
      title: isPt
        ? "Transformação do Estádio Alvalade"
        : "Estádio Alvalade transformation",
      desc: isPt
        ? "Objetivo principal — financiar a remodelação completa do Estádio José Alvalade num hub global de entretenimento e lifestyle."
        : "Primary purpose — fund the full redevelopment of José Alvalade into a global entertainment and lifestyle hub.",
    },
    {
      icon: "↩️",
      title: isPt
        ? "Reembolso de Capex anterior à SAD"
        : "Reimburse SAD for prior capex",
      desc: isPt
        ? "Reembolsar a Sporting SAD pelos investimentos na renovação do estádio já realizados antes do fecho da emissão."
        : "Repay Sporting SAD for stadium renovation investment already spent before the bond closed.",
    },
    {
      icon: "⚙️",
      title: isPt
        ? "Operações da Sporting Entertainment"
        : "Sporting Entertainment operations",
      desc: isPt
        ? "Financiar os custos operacionais contínuos da Sporting Entertainment, S.A. na gestão do negócio do estádio."
        : "Finance the ongoing operational costs of Sporting Entertainment, S.A. as it manages the stadium business.",
    },
    {
      icon: "✅",
      title: isPt
        ? "Reembolso da Lion Finance Nº 2"
        : "Repay Lion Finance No. 2",
      desc: isPt
        ? "Liquidou a titularização de direitos de TV da NOS (€68.792.338,48), libertando as receitas — concluído a 23 de Out de 2025."
        : "Retire the NOS TV-rights securitization (€68,792,338.48), freeing the receivables — completed Oct 23, 2025.",
    },
  ];

  return (
    <>
      <div className="uspp-grid">
        {terms.map((t, i) => {
          const isRating = t.value === "BBB−" || t.value === "BBB (low)";
          return (
            <div className="uspp-term" key={i}>
              <div className="ut-label">{t.label}</div>
              <div
                className={`ut-value${t.highlight && !t.value.includes("BBB") ? " highlight" : ""}`}
              >
                {isRating ? (
                  <span className="rating-badge investment-grade">
                    {t.value}
                  </span>
                ) : (
                  t.value
                )}
              </div>
              <div className="ut-note">{t.note}</div>
            </div>
          );
        })}
      </div>
      <div className="uspp-uses">
        <div className="uspp-uses-title">
          {isPt ? "Utilização dos fundos" : "Use of proceeds"}
        </div>
        {uses.map((u, i) => (
          <div className="uspp-use-row" key={i}>
            <div className="uspp-use-num">{i + 1}</div>
            <div className="uspp-use-icon">{u.icon}</div>
            <div className="uspp-use-body">
              <div className="uspp-use-title">{u.title}</div>
              <div className="uspp-use-desc">{u.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


function renderUsppTerms() {
  const container = document.getElementById("usppTerms");
  if (!container) return;
  if (!usppTermsRoot) usppTermsRoot = createRoot(container);
  usppTermsRoot.render(<UsppTerms />);
}


import React, { useState } from "react";
import { useAppState } from "../../core/state.ts";
import { useTranslation } from "../../hooks/useTranslation.js";

export function LionFinance() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const activeTab = useAppState((s) => s.activeLionTab) || "both";
  const setActiveLionTab = useAppState((s) => s.setActiveLionTab);

  const handleTabClick = (view: "both" | "no1" | "no2") => {
    setActiveLionTab(view);
  };

  const LfRow = ({
    label,
    value,
    sub,
    accentClass,
  }: {
    label: string;
    value: string;
    sub?: string;
    accentClass?: string;
  }) => (
    <div className="lf-row">
      <span className="lf-key">{label}</span>
      <div className="lf-row-block">
        <span className={`lf-val ${accentClass || ""}`.trim()}>{value}</span>
        {sub && <span className="lf-sub">{sub}</span>}
      </div>
    </div>
  );

  return (
    <>
      <div className="lf-switcher">
        <button
          className={`lf-switch-btn${activeTab === "both" ? " active" : ""}`}
          onClick={() => handleTabClick("both")}
        >
          {isPt ? "Comparar Ambas" : "Compare Both"}
        </button>
        <button
          className={`lf-switch-btn${activeTab === "no1" ? " active" : ""}`}
          onClick={() => handleTabClick("no1")}
        >
          Lion Finance No. 1
        </button>
        <button
          className={`lf-switch-btn${activeTab === "no2" ? " active" : ""}`}
          onClick={() => handleTabClick("no2")}
        >
          Lion Finance No. 2
        </button>
      </div>
      <div
        className={`lf-grid${activeTab === "no1" ? " show-no1" : activeTab === "no2" ? " show-no2" : ""}`}
      >
        <div className="lf-card">
          <div className="lf-card-head no1">
            <h4>Lion Finance No. 1</h4>
            <span className="lf-dates">
              {isPt ? "Mar 2019 → Dez 2023" : "Mar 2019 → Dec 2023"}
            </span>
          </div>
          <LfRow
            label={isPt ? "Entidade Emitente (SPV)" : "SPV"}
            value="Sagasta Finance STC"
          />
          <LfRow
            label={isPt ? "Garantia" : "Collateral"}
            value={isPt ? "Contrato de TV da NOS" : "NOS TV contract"}
            sub={
              isPt
                ? "Direitos de TV, multimédia, Sporting TV, publicidade no estádio, direitos de patrocinador principal"
                : "TV, multimedia, Sporting TV, stadium ads, main sponsor rights"
            }
          />
          <LfRow
            label={isPt ? "Fundos originais" : "Original proceeds"}
            value="€64.0M"
            sub={
              isPt
                ? "~52,9 M€ para a Sporting SAD; 11,1 M€ para a Sporting Comunicação e Plataformas"
                : "~€52.9M to Sporting SAD; €11.1M to Sporting Comunicação e Plataformas"
            }
          />
          <LfRow
            label={isPt ? "Aumento (Mar 2022)" : "Top-up (Mar 2022)"}
            value="+€38.5M"
            sub={
              isPt
                ? "Mesmo contrato da NOS; eliminou a dívida bancária ao Millennium BCP"
                : "Same NOS contract; eliminated Millennium BCP bank debt"
            }
          />
          <LfRow
            label={isPt ? "Aumento adicional" : "Further increase"}
            value="+€11.5M"
            sub={
              isPt
                ? "Preço de compra adicional para créditos de direitos de TV/multimédia"
                : "Additional purchase price for TV/multimedia rights credits"
            }
          />
          <LfRow
            label={isPt ? "Exposição bancária residual" : "Bank exposure after"}
            value="Sagasta + Novo Banco"
            sub={
              isPt
                ? "Saída total do Millennium BCP"
                : "Millennium BCP fully exited"
            }
          />
          <LfRow
            label={isPt ? "Reembolsado" : "Repaid"}
            value={isPt ? "22 Dez 2023" : "Dec 22, 2023"}
            sub={
              isPt
                ? "Voto unânime dos obrigacionistas; imediatamente substituído pela LF Nº 2"
                : "Unanimous bondholder vote; immediately replaced by LF No. 2"
            }
            accentClass="warn"
          />
        </div>
        <div className="lf-card">
          <div className="lf-card-head no2">
            <h4>Lion Finance No. 2</h4>
            <span className="lf-dates">
              {isPt ? "Dez 2023 → Out 2025" : "Dec 2023 → Oct 2025"}
            </span>
          </div>
          <LfRow
            label={isPt ? "Entidade Emitente (SPV)" : "SPV"}
            value="Sagasta Finance STC"
          />
          <LfRow
            label={isPt ? "Garantia" : "Collateral"}
            value={isPt ? "Contrato de TV da NOS" : "NOS TV contract"}
            sub={
              isPt
                ? "Mesmo contrato de Dez 2015 da LF Nº 1"
                : "Same Dec 2015 contract as LF No. 1"
            }
          />
          <LfRow
            label={isPt ? "Total emitido" : "Total issued"}
            value="€113.9M"
            sub={
              isPt
                ? "Dividido entre a Sporting SAD e a Sporting Comunicação e Plataformas"
                : "Split between Sporting SAD and Sporting Comunicação e Plataformas"
            }
          />
          <LfRow
            label={
              isPt
                ? "Aumento face à emissão original da LF Nº 1 (2019)"
                : "Increase over LF No. 1's original 2019 issuance"
            }
            value="~€50.1M"
            sub={
              isPt
                ? "Face aos €64,0M originais de 2019, antes dos aumentos de 2022; maior montante libertado pelo melhor perfil de crédito e maior maturidade do contrato NOS"
                : "Vs. LF No. 1's original €64.0M from 2019, before the 2022 top-ups; larger pool unlocked by stronger credit profile and longer NOS contract runway"
            }
          />
          <LfRow
            label={isPt ? "Exposição bancária residual" : "Bank exposure after"}
            value={isPt ? "Apenas Sagasta" : "Sagasta only"}
            sub={
              isPt
                ? 'Saída total do Novo Banco; fim de todos os "banking covenants"'
                : "Novo Banco fully exited; all banking covenants ended"
            }
          />
          <LfRow
            label={isPt ? "Reembolsado" : "Repaid"}
            value={isPt ? "23 Out 2025" : "Oct 23, 2025"}
            sub={
              isPt
                ? "68.792.338,48 € — voto unânime dos obrigacionistas"
                : "€68,792,338.48 — unanimous bondholder vote"
            }
            accentClass="warn"
          />
          <LfRow
            label={isPt ? "Origem do reembolso" : "Source of repayment"}
            value={isPt ? "Fundos obtidos com o USPP" : "USPP proceeds"}
            sub={
              isPt
                ? "Obrigações USPP emitidas a 22 Out 2025 — LF Nº 2 reembolsada no dia seguinte"
                : "USPP bond closed Oct 22, 2025 — repaid LF No. 2 the following day"
            }
            accentClass="accent"
          />
        </div>
      </div>
    </>
  );
}

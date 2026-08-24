import React, { useState } from "react";
import { Playground } from "../Playground.js";
import { SquadCostCalculator } from "../SquadCostCalculator.js";
import { MacroSimulatorGuide } from "../MacroSimulatorGuide.js";
import { SquadCostCalculatorGuide } from "../SquadCostCalculatorGuide.js";
import { PlayerRoiCalculator } from "../squad/PlayerRoiCalculator.js";
import { StressTestingSimulator } from "../stress/StressTestingSimulator.js";
import { StressTestingGuide } from "../stress/StressTestingGuide.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export const PlaygroundTab = React.memo(function PlaygroundTab() {
  const { t, T } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<
    "macro" | "transfers" | "player_roi" | "stress"
  >("macro");

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch13-num" />
        <div>
          <T as="h2" i18nKey="ch13-h2" />
          <T as="p" className="lede" i18nKey="ch13-lede" />
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="sub-tabs-container" style={{ marginBottom: "1.5rem" }}>
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "macro" ? "active" : ""}`}
          onClick={() => setActiveSubTab("macro")}
          i18nKey="pg_sub_macro"
        />
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "transfers" ? "active" : ""}`}
          onClick={() => setActiveSubTab("transfers")}
          i18nKey="pg_sub_transfers"
        />
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "player_roi" ? "active" : ""}`}
          onClick={() => setActiveSubTab("player_roi")}
          i18nKey="pg_sub_player_roi"
        />
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "stress" ? "active" : ""}`}
          onClick={() => setActiveSubTab("stress")}
          i18nKey="pg_sub_stress"
        />
      </div>

      {activeSubTab === "macro" && (
        <>
          <Playground />
          <MacroSimulatorGuide />
        </>
      )}

      {activeSubTab === "transfers" && (
        <>
          <SquadCostCalculator />
          <SquadCostCalculatorGuide />
        </>
      )}

      {activeSubTab === "player_roi" && (
        <>
          <PlayerRoiCalculator />
        </>
      )}

      {activeSubTab === "stress" && (
        <>
          <StressTestingSimulator />
          <StressTestingGuide />
        </>
      )}
    </>
  );
});

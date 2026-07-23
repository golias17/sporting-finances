import React, { useEffect, useState, useRef } from "react";
import { useAppState, state } from "../core/state.ts";
import { STORY_STEPS } from "./storySteps.ts";

import { syncStateToUrl } from "../utils/urlSync.ts";
import { useTranslation } from "../hooks/useTranslation.js";

export function startStory(startIndex = 0) {
  const idx = Math.min(Math.max(0, startIndex), STORY_STEPS.length - 1);
  state.setStoryIndex(idx);
  state.setIsStoryVisible(true);
  updateStoryStep();
}

export function exitStory() {
  state.setIsStoryVisible(false);
  syncStateToUrl();
  syncStateToUrl();
}

function updateStoryStep() {
  // Chart highlight logic (syncs with the React render)
  const idx = useAppState.getState().storyIndex;
  const step = STORY_STEPS[idx];

  syncStateToUrl();
  syncStateToUrl();
}

export function nextStory() {
  const currentIndex = useAppState.getState().storyIndex;
  if (currentIndex >= STORY_STEPS.length - 1) {
    exitStory();
    return;
  }
  state.setStoryIndex(currentIndex + 1);
  updateStoryStep();
}

export function prevStory() {
  const currentIndex = useAppState.getState().storyIndex;
  if (currentIndex > 0) {
    state.setStoryIndex(currentIndex - 1);
    updateStoryStep();
  }
}

import { createRoot } from "react-dom/client";

// Kept for backwards compatibility with main.ts if needed, but not strictly required

export function Story() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const storyIndex = useAppState((s) => s.storyIndex);
  const isStoryVisible = useAppState((s) => s.isStoryVisible);
  const total = STORY_STEPS.length;

  const [fadeClass, setFadeClass] = useState("story-fade-in");
  const prevIndex = useRef(storyIndex);
  const [displayIndex, setDisplayIndex] = useState(storyIndex);

  useEffect(() => {
    if (storyIndex !== prevIndex.current) {
      setFadeClass("story-fade-out");
      const timer = setTimeout(() => {
        setDisplayIndex(storyIndex);
        setFadeClass("story-fade-in");
      }, 220);
      prevIndex.current = storyIndex;
      return () => clearTimeout(timer);
    } else {
      setDisplayIndex(storyIndex);
    }
  }, [storyIndex]);

  useEffect(() => {
    function storyKeyHandler(e: KeyboardEvent) {
      if (!isStoryVisible) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStory();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStory();
      } else if (e.key === "Escape") {
        exitStory();
      }
    }
    document.addEventListener("keydown", storyKeyHandler);
    return () => document.removeEventListener("keydown", storyKeyHandler);
  }, [isStoryVisible]);

  const step = STORY_STEPS[displayIndex];
  if (!step) return null;

  const tTitle = step.title[isPt ? "pt" : "en"];
  const tNarrative = step.narrative[isPt ? "pt" : "en"];

  const btnPrevText = isPt ? "← Ant" : "← Prev";
  const btnPrevAria =
    t("story-prev-aria") ||
    (isPt ? "Passo anterior da história" : "Previous story step");

  const isLast = storyIndex === total - 1;
  const btnNextText = isLast
    ? isPt
      ? "Concluir"
      : "Finish"
    : isPt
      ? "Seguinte →"
      : "Next →";
  const btnNextAria = isLast
    ? t("story-finish-aria") ||
      (isPt ? "Concluir e fechar a história" : "Finish and close story")
    : t("story-next-aria") ||
      (isPt ? "Passo seguinte da história" : "Next story step");

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = clickX / width;
    const newIndex = Math.min(
      total - 1,
      Math.max(0, Math.floor(ratio * total)),
    );
    startStory(newIndex);
  };

  return (
    <div className="card" id="storyLaunchCard">
      {!isStoryVisible && (
        <div className="story-launch">
          <div className="launch-text">
            <T as="p" className="launch-quote" i18nKey="auto-txt-p-4" />
            <T as="span" className="launch-cite" i18nKey="ch01-story-cite" />
          </div>
          <T
            as="button"
            className="btn-start-story"
            id="btnStartStory"
            i18nKey="ch01-story-play"
            onClick={() => startStory(0)}
          />
        </div>
      )}

      {isStoryVisible && (
        <div className="story-body" id="storyCard">
          <div
            className={`story-content-wrap ${fadeClass}`}
            id="storyContentWrap"
          >
            <div className="story-header">
              <div className="story-season" id="storySeason">
                {step.season}
              </div>
              <div className="story-title" id="storyTitle">
                {tTitle}
              </div>
            </div>
            <p className="story-narrative" id="storyNarrative">
              {tNarrative}
            </p>
          </div>
          <div className="story-footer">
            <div className="story-controls">
              <T
                as="button"
                className="story-btn"
                id="btnPrevStory"
                disabled={storyIndex === 0}
                onClick={prevStory}
                aria-label={btnPrevAria}
                i18nKey="story-prev"
              />
              <span className="story-counter" id="storyCounter">
                {storyIndex + 1} / {total}
              </span>
              <T
                as="button"
                className="story-btn primary"
                id="btnNextStory"
                onClick={nextStory}
                aria-label={btnNextAria}
                i18nKey="story-next"
              />
              <T
                as="button"
                className="story-btn exit"
                id="btnExitStory"
                onClick={exitStory}
                i18nKey="auto-txt-button-7"
              />
            </div>
            <div
              className="story-track"
              id="storyTrack"
              onClick={handleTrackClick}
            >
              <div
                className="story-fill"
                id="storyFill"
                style={{ width: `${((storyIndex + 1) / total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

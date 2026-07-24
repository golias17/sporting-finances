import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { state, useAppState } from "../../src/core/state.ts";
import {
  Story,
  startStory,
  exitStory,
  nextStory,
  prevStory,
} from "../../src/features/Story.tsx";

describe("Story Component", () => {
  beforeEach(() => {
    act(() => {
      useAppState.setState({
        isPt: false,
        storyIndex: 0,
        isStoryVisible: false,
        DATASET: null as any,
      });
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize story mode events and show launch card", () => {
    render(<Story />);
    expect(screen.getByText(/ch01-story-play/i)).toBeInTheDocument();
  });

  it("should open story card on play button click", () => {
    render(<Story />);
    const startBtn = screen.getByText(/ch01-story-play/i);
    act(() => {
      fireEvent.click(startBtn);
    });
    expect(useAppState.getState().isStoryVisible).toBe(true);
  });

  it("should navigate through story steps", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true });
    });
    render(<Story />);

    expect(useAppState.getState().storyIndex).toBe(0);

    const nextBtn = screen.getByText(/story-next/i);
    act(() => {
      fireEvent.click(nextBtn);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(useAppState.getState().storyIndex).toBe(1);

    const prevBtn = screen.getByText(/story-prev/i);
    act(() => {
      fireEvent.click(prevBtn);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(useAppState.getState().storyIndex).toBe(0);
  });

  it("should handle keyboard navigation", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true });
    });
    render(<Story />);

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });
    expect(useAppState.getState().storyIndex).toBe(1);

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowLeft" });
    });
    expect(useAppState.getState().storyIndex).toBe(0);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(useAppState.getState().isStoryVisible).toBe(false);
  });

  it("should handle clicks on the story track to jump to steps", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true });
    });
    render(<Story />);

    const track = document.querySelector(".story-track");
    if (track) {
      track.getBoundingClientRect = () => ({
        left: 0,
        width: 1000,
        top: 0,
        height: 10,
        right: 1000,
        bottom: 10,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
    }

    act(() => {
      if (track) fireEvent.click(track, { clientX: 500 });
    });
    expect(useAppState.getState().storyIndex).toBe(5);
  });

  it("should handle startStory with custom index", () => {
    act(() => {
      startStory(2);
    });
    expect(useAppState.getState().storyIndex).toBe(2);
    expect(useAppState.getState().isStoryVisible).toBe(true);
  });

  it("should handle startStory with index exceeding max", () => {
    act(() => {
      startStory(100);
    });
    // Should clamp to max index
    expect(useAppState.getState().storyIndex).toBeLessThan(100);
    expect(useAppState.getState().isStoryVisible).toBe(true);
  });

  it("should handle nextStory at the end", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true });
    });
    render(<Story />);

    // Navigate to the end
    for (let i = 0; i < 20; i++) {
      act(() => {
        nextStory();
      });
    }

    // Should exit story when reaching the end
    expect(useAppState.getState().isStoryVisible).toBe(false);
  });

  it("should handle prevStory at the beginning", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true, storyIndex: 0 });
    });
    render(<Story />);

    act(() => {
      prevStory();
    });

    // Should stay at index 0
    expect(useAppState.getState().storyIndex).toBe(0);
  });

  it("should handle keyboard navigation when story is not visible", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: false });
    });
    render(<Story />);

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });

    // Should not change index when story is not visible
    expect(useAppState.getState().storyIndex).toBe(0);
  });
});

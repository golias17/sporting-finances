import { describe, it, expect, beforeEach } from "vitest";
import { trapFocusWithin } from "../../src/utils/focusTrap.js";

// trapFocusWithin()'s core Tab-wrap algorithm had zero test coverage
// anywhere in the suite — app.test.js explicitly documents why it can't
// exercise this path: jsdom doesn't implement layout, so `offsetParent`
// (the "is this element actually visible" check the function filters on)
// is always null for every element regardless of real visibility, which
// makes the function treat every candidate as hidden and no-op.
//
// Overriding offsetParent's getter (via defineProperty — it's normally
// read-only, jsdom-computed) to a truthy value on the elements we want
// treated as visible sidesteps that limitation and lets these tests
// actually drive the wrap-around logic, instead of only confirming (as
// app.test.js does) that the modals built on top of it open/close/restore
// focus correctly.
function markVisible(...els) {
  els.forEach((el) =>
    Object.defineProperty(el, "offsetParent", {
      value: document.body,
      configurable: true,
    }),
  );
}

describe("trapFocusWithin()", () => {
  let container, first, middle, last;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      </div>
    `;
    container = document.getElementById("modal");
    first = document.getElementById("first");
    middle = document.getElementById("middle");
    last = document.getElementById("last");
    markVisible(first, middle, last);
  });

  it("wraps Tab on the last focusable element back to the first", () => {
    trapFocusWithin(container);
    last.focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "shiftKey", { value: false });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab on the first focusable element back to the last", () => {
    trapFocusWithin(container);
    first.focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "shiftKey", { value: true });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("does not intercept Tab from a middle element (browser handles it natively)", () => {
    trapFocusWithin(container);
    middle.focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores non-Tab keys entirely", () => {
    trapFocusWithin(container);
    last.focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(last);
  });

  it("does nothing (no throw) when there are no visible focusable elements", () => {
    // None of the buttons were marked visible — offsetParent stays jsdom's
    // real (always-null) value, so the filtered candidate list is empty.
    document.body.innerHTML = `<div id="empty"><button>Hidden</button></div>`;
    const empty = document.getElementById("empty");
    trapFocusWithin(empty);
    const event = new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    expect(() => empty.dispatchEvent(event)).not.toThrow();
    expect(event.defaultPrevented).toBe(false);
  });

  it("stops trapping once the returned cleanup function is called", () => {
    const release = trapFocusWithin(container);
    release();

    last.focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "shiftKey", { value: false });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(last);
  });
});

// Shared jsdom mocks for tests that build *real* Chart.js instances (via
// charts.js's mkChart() or health.js's raw `new Chart()`), rather than a
// fake Chart.js double — mkChart() imports the real chart.js/auto module and
// relies on its module-level Chart.register(...) calls, which a stub class
// without a static `.register()` would break. jsdom itself doesn't provide a
// working canvas 2D context or ResizeObserver, so both need mocking before
// any chart can be constructed without throwing.
//
// This exact mock used to be copy-pasted across chart.test.js,
// playground.test.js, and squadAnalytics.chart.test.js — consolidated here
// so the three copies can't drift out of sync.
export function mockChartEnvironment() {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const mockContext = {
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    closePath: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 0, height: 0 }),
    setTransform: () => {},
    resetTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => {},
    createRadialGradient: () => {},
    canvas: null, // will be set per element
  };

  if (global.CanvasRenderingContext2D) {
    Object.setPrototypeOf(
      mockContext,
      global.CanvasRenderingContext2D.prototype,
    );
  }

  HTMLCanvasElement.prototype.getContext = function () {
    mockContext.canvas = this;
    return mockContext;
  };
}

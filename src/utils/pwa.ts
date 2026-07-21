import { state } from "../core/state.js";

export function showUpdateToast(onConfirm) {
  let toast = document.getElementById("pwa-update-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.className = "pwa-toast";
    // Without this, screen reader users have no way to know this toast
    // appeared at all — it's inserted well after page load, off in a
    // corner, with nothing pointing focus at it. role="status" + polite
    // aria-live means assistive tech announces the text as soon as it's
    // set below, without interrupting whatever the user is doing.
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  const isPt = state.isPt;
  const msg = isPt
    ? "Nova versão disponível! Atualize para obter as últimas novidades."
    : "New version available! Refresh to get the latest features.";
  const btnTxt = isPt ? "Atualizar" : "Update";

  toast.innerHTML = `
    <div class="toast-body">
      <span>${msg}</span>
      <button id="pwa-update-btn" class="toast-btn">${btnTxt}</button>
    </div>
  `;

  // Entrance slide animation
  setTimeout(() => toast.classList.add("visible"), 100);

  document.getElementById("pwa-update-btn").addEventListener("click", () => {
    toast.classList.remove("visible");
    onConfirm();
  });
}

export function showOfflineReadyToast() {
  let toast = document.getElementById("pwa-offline-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pwa-offline-toast";
    toast.className = "pwa-toast";
    // See the matching comment in showUpdateToast() above.
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  const isPt = state.isPt;
  const msg = isPt
    ? "Aplicação pronta para funcionar offline!"
    : "App is ready to work offline!";
  const btnTxt = isPt ? "Ok" : "Dismiss";

  toast.innerHTML = `
    <div class="toast-body">
      <span>${msg}</span>
      <button id="pwa-offline-btn" class="toast-btn">${btnTxt}</button>
    </div>
  `;

  setTimeout(() => toast.classList.add("visible"), 100);

  document.getElementById("pwa-offline-btn").addEventListener("click", () => {
    toast.classList.remove("visible");
  });
}

export function initPWA() {
  // Register service worker if supported and not in test mode.
  // Note: "virtual:pwa-register" is a virtual module injected dynamically at build-time
  // by vite-plugin-pwa. We bypass it in tests (Vitest) to avoid resolution errors.
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    import.meta.env.MODE !== "test"
  ) {
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            showUpdateToast(() => updateSW(true));
          },
          onOfflineReady() {
            console.info("App ready to work offline.");
            showOfflineReadyToast();
          },
        });
      })
      .catch((err) => {
        console.error("Failed to load virtual:pwa-register", err);
      });
  }
}

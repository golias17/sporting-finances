import { useState, useCallback, useEffect } from "react";
import { useAppState } from "../core/state.js";

interface PWAToastState {
  showUpdate: boolean;
  showOfflineReady: boolean;
  updateSW: (() => Promise<void>) | null;
}

/**
 * Manages PWA service worker registration and update/offline toasts.
 * Replaces the imperative initPWA() + showUpdateToast() + showOfflineReadyToast().
 */
export function usePWA() {
  const isPt = useAppState((s) => s.isPt);
  const [state, setState] = useState<PWAToastState>({
    showUpdate: false,
    showOfflineReady: false,
    updateSW: null,
  });

  // Register service worker
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      import.meta.env.MODE === "test"
    ) {
      return;
    }

    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            setState((prev) => ({ ...prev, showUpdate: true, updateSW: () => updateSW(true) }));
          },
          onOfflineReady() {
            setState((prev) => ({ ...prev, showOfflineReady: true }));
          },
        });
      })
      .catch((err) => {
      });
  }, []);

  const dismissUpdate = useCallback(() => {
    setState((prev) => ({ ...prev, showUpdate: false }));
  }, []);

  const applyUpdate = useCallback(() => {
    state.updateSW?.();
    setState((prev) => ({ ...prev, showUpdate: false, updateSW: null }));
  }, [state.updateSW]);

  const dismissOfflineReady = useCallback(() => {
    setState((prev) => ({ ...prev, showOfflineReady: false }));
  }, []);

  // Auto-dismiss offline ready toast after 5 seconds
  useEffect(() => {
    if (!state.showOfflineReady) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, showOfflineReady: false }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [state.showOfflineReady]);

  const updateMsg = isPt
    ? "Nova versão disponível! Atualize para obter as últimas novidades."
    : "New version available! Refresh to get the latest features.";
  const updateBtnTxt = isPt ? "Atualizar" : "Update";

  const offlineMsg = isPt
    ? "Aplicação pronta para funcionar offline!"
    : "App is ready to work offline!";
  const offlineBtnTxt = isPt ? "Ok" : "Dismiss";

  return {
    showUpdate: state.showUpdate,
    showOfflineReady: state.showOfflineReady,
    updateMsg,
    updateBtnTxt,
    offlineMsg,
    offlineBtnTxt,
    applyUpdate,
    dismissUpdate,
    dismissOfflineReady,
  };
}

import React, { createContext, useContext } from "react";

interface LightboxContextValue {
  open: (
    img: HTMLImageElement,
    options?: {
      frontSrc?: string;
      backSrc?: string;
      frontAlt?: string;
      backAlt?: string;
    },
  ) => void;
}

const LightboxContext = createContext<LightboxContextValue>({
  open: () => {},
});

export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({
  children,
  open,
}: {
  children: React.ReactNode;
  open: LightboxContextValue["open"];
}) {
  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
    </LightboxContext.Provider>
  );
}

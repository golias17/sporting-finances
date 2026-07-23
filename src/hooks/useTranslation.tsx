import React from "react";
import { useAppState } from "../core/state.js";

export function useTranslation() {
  const translations = useAppState((s) => s.translations);

  // Fallback for simple string attributes (e.g. placeholders, aria-labels)
  const t = (key: string): string => {
    return translations[key]?.text || key;
  };

  // Component wrapper for injecting translations safely (supports HTML if flagged in dict)
  const T = ({
    i18nKey,
    as: Component = "span",
    className,
    children,
    ...props
  }: {
    i18nKey: string;
    as?: any;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }) => {
    const entry = translations[i18nKey];

    // If not loaded or missing, just render the key to make it obvious
    if (!entry) {
      return (
        <Component className={className} {...props}>
          {children || i18nKey}
        </Component>
      );
    }

    if (entry.innerHTML) {
      return (
        <Component
          className={className}
          dangerouslySetInnerHTML={{ __html: entry.text }}
          {...props}
        />
      );
    }

    // Default text rendering
    return (
      <Component className={className} {...props}>
        {entry.text}
      </Component>
    );
  };

  return { t, T };
}

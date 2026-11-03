"use client";

import { useEffect, useRef } from "react";
// The next-intl navigation helpers need its provider, which this file replaces.
import { usePathname } from "next/navigation";

import { GLOBAL_ERROR_MESSAGES } from "@/app/global-error/global-error-messages";
import { globalErrorStyles as styles } from "@/app/global-error/global-error-styles";
import { localeFromPath, localePath } from "@/i18n/locale-path";
import { captureBoundaryError } from "@/lib/sentry/capture-boundary-error";

interface IGlobalErrorProps {
  error: unknown;
  retry: () => void;
}

export default function GlobalError({ error, retry }: IGlobalErrorProps) {
  const locale = localeFromPath(usePathname() ?? "/");
  const t = GLOBAL_ERROR_MESSAGES[locale];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    captureBoundaryError(error);
  }, [error]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <html lang={locale}>
      <body style={styles.body}>
        <title>{t.title}</title>

        <main style={styles.card}>
          <h1 ref={headingRef} tabIndex={-1} style={styles.heading}>
            {t.title}
          </h1>

          <p style={styles.description}>{t.description}</p>

          <div style={styles.actions}>
            <button type="button" onClick={retry} style={styles.retryButton}>
              {t.retry}
            </button>

            {/* A full page load, since the layout that runs client navigation crashed. */}
            <a href={localePath(locale, "/")} style={styles.homeLink}>
              {t.home}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

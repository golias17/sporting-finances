export type SocialCardFormat = "1:1" | "16:9" | "9:16";
export type SocialCardTheme = "emerald" | "dark" | "light";

export interface SocialCardKpi {
  label: string;
  value: string;
}

export interface SocialCardOptions {
  title: string;
  subtitle?: string;
  format: SocialCardFormat;
  theme?: SocialCardTheme;
  kpis?: SocialCardKpi[];
  customNote?: string;
  isPt?: boolean;
}

export async function generateSocialCardCanvas(
  chartRef: React.RefObject<any> | { current: any },
  options: SocialCardOptions,
): Promise<HTMLCanvasElement | null> {
  if (typeof document === "undefined") return null;

  const {
    title,
    subtitle,
    format,
    theme = "emerald",
    kpis = [],
    customNote,
    isPt = true,
  } = options;

  let width = 1200;
  let height = 1200;

  if (format === "16:9") {
    width = 1200;
    height = 675;
  } else if (format === "9:16") {
    width = 1080;
    height = 1920;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Background Theme
  if (theme === "emerald") {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#063b25");
    bgGrad.addColorStop(0.5, "#042819");
    bgGrad.addColorStop(1, "#02160d");
    ctx.fillStyle = bgGrad;
  } else if (theme === "dark") {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#181f1c");
    bgGrad.addColorStop(1, "#0d1210");
    ctx.fillStyle = bgGrad;
  } else {
    // Light
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#f4f8f5");
    bgGrad.addColorStop(1, "#e6efe9");
    ctx.fillStyle = bgGrad;
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Gold Accent Top Bar
  const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
  goldGrad.addColorStop(0, "#c8a951");
  goldGrad.addColorStop(0.5, "#e5cf87");
  goldGrad.addColorStop(1, "#c8a951");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, width, 6);

  // 3. Header Section
  const paddingX = format === "9:16" ? 60 : 60;
  const headerTop = format === "9:16" ? 70 : 45;

  // Brand Name & Shield
  ctx.fillStyle = theme === "light" ? "#0a5d3a" : "#e5cf87";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("SPORTING CP  •  FINANÇAS & SUSTENTABILIDADE", paddingX, headerTop);

  // Official Audit Tag
  const tagText = isPt
    ? "RELATÓRIO & CONTAS • CMVM"
    : "OFFICIAL REPORT • CMVM AUDITED";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
  const tagWidth = ctx.measureText(tagText).width + 24;
  const tagX = width - paddingX - tagWidth;

  ctx.fillStyle =
    theme === "light" ? "rgba(10, 93, 58, 0.08)" : "rgba(200, 169, 81, 0.15)";
  ctx.strokeStyle =
    theme === "light" ? "rgba(10, 93, 58, 0.25)" : "rgba(200, 169, 81, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tagX, headerTop - 18, tagWidth, 26, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme === "light" ? "#0a5d3a" : "#e5cf87";
  ctx.fillText(tagText, tagX + 12, headerTop);

  // Chart Title
  ctx.fillStyle = theme === "light" ? "#0f172a" : "#ffffff";
  const titleSize = format === "9:16" ? 38 : format === "1:1" ? 32 : 26;
  ctx.font = `bold ${titleSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.letterSpacing = "-0.5px";
  const titleY = headerTop + (format === "9:16" ? 56 : format === "1:1" ? 48 : 42);

  // Truncate title if too wide
  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > width - paddingX * 2) {
    while (
      ctx.measureText(displayTitle + "...").width > width - paddingX * 2 &&
      displayTitle.length > 0
    ) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += "...";
  }
  ctx.fillText(displayTitle, paddingX, titleY);

  // Optional Subtitle or Custom Note
  const subText = customNote || subtitle;
  if (subText && (format === "1:1" || format === "9:16")) {
    ctx.fillStyle =
      theme === "light" ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.75)";
    ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(
      subText.slice(0, 100) + (subText.length > 100 ? "..." : ""),
      paddingX,
      titleY + 28,
    );
  }

  // 4. Main Chart Container Box
  const chartBoxTop = format === "9:16" ? 220 : format === "1:1" ? 160 : 115;
  let chartBoxBottom = height - (format === "9:16" ? 240 : format === "1:1" ? 160 : 75);

  if (kpis.length === 0 && format !== "16:9") {
    chartBoxBottom = height - (format === "9:16" ? 140 : 90);
  }

  const chartBoxHeight = chartBoxBottom - chartBoxTop;
  const chartBoxWidth = width - paddingX * 2;

  // Glass card background for chart
  ctx.fillStyle = theme === "light" ? "#ffffff" : "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(paddingX, chartBoxTop, chartBoxWidth, chartBoxHeight, 14);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtle card border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw Chart Image
  if (chartRef && chartRef.current) {
    try {
      let base64 = "";
      if (typeof chartRef.current.toBase64Image === "function") {
        base64 = chartRef.current.toBase64Image();
      } else if (
        chartRef.current.canvas &&
        typeof chartRef.current.canvas.toDataURL === "function"
      ) {
        base64 = chartRef.current.canvas.toDataURL();
      }

      if (base64) {
        const img = new Image();
        img.src = base64;
        const chartPadding = 20;
        const drawX = paddingX + chartPadding;
        const drawY = chartBoxTop + chartPadding;
        const drawW = chartBoxWidth - chartPadding * 2;
        const drawH = chartBoxHeight - chartPadding * 2;

        if (img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
          await new Promise<void>((resolve) => {
            const timer = setTimeout(() => resolve(), 100);
            img.onload = () => {
              clearTimeout(timer);
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timer);
              resolve();
            };
          });
        }
      }
    } catch {
      // Fallback
    }
  }

  // 5. KPI Badges Row (if available & format is 1:1 or 9:16)
  if (kpis.length > 0 && (format === "1:1" || format === "9:16")) {
    const kpiY = chartBoxBottom + 20;
    const kpiCardWidth = (chartBoxWidth - (kpis.length - 1) * 16) / kpis.length;
    const kpiCardHeight = format === "9:16" ? 90 : 64;

    kpis.forEach((kpi, idx) => {
      const kpiX = paddingX + idx * (kpiCardWidth + 16);

      ctx.fillStyle =
        theme === "light" ? "rgba(10, 93, 58, 0.08)" : "rgba(255, 255, 255, 0.07)";
      ctx.strokeStyle =
        theme === "light" ? "rgba(10, 93, 58, 0.2)" : "rgba(200, 169, 81, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(kpiX, kpiY, kpiCardWidth, kpiCardHeight, 10);
      ctx.fill();
      ctx.stroke();

      // KPI Label
      ctx.fillStyle =
        theme === "light" ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.75)";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(kpi.label, kpiX + 16, kpiY + 22);

      // KPI Value
      ctx.fillStyle = theme === "light" ? "#0a5d3a" : "#e5cf87";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(kpi.value, kpiX + 16, kpiY + (format === "9:16" ? 62 : 48));
    });
  }

  // 6. Footer Bar
  const footerY = height - (format === "9:16" ? 50 : format === "1:1" ? 40 : 30);
  ctx.fillStyle =
    theme === "light" ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.65)";
  ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("sportingfinances.pt", paddingX, footerY);

  const centerText = isPt
    ? "Dados Oficiais Auditados • Época 2024/25"
    : "Official Audited Financial Data • 2024/25 Season";
  const centerWidth = ctx.measureText(centerText).width;
  ctx.fillText(centerText, (width - centerWidth) / 2, footerY);

  const rightText = "Sporting Clube de Portugal - Futebol, SAD";
  const rightWidth = ctx.measureText(rightText).width;
  ctx.fillText(rightText, width - paddingX - rightWidth, footerY);

  return canvas;
}

export function downloadSocialCard(
  canvas: HTMLCanvasElement,
  fileName: string,
): void {
  if (typeof window === "undefined" || !canvas) return;
  const link = document.createElement("a");
  link.download = `${fileName}_infographic.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function copySocialCardToClipboard(
  canvas: HTMLCanvasElement,
): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.clipboard || !canvas)
    return false;
  return new Promise<boolean>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, "image/png");
  });
}

export async function shareSocialCardNative(
  canvas: HTMLCanvasElement,
  title: string,
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !navigator.share ||
    !navigator.canShare ||
    !canvas
  ) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        const file = new File([blob], "sporting_finances_card.png", {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: title || "Sporting Finances",
            text: `${title} • Dados Oficiais Sporting CP SAD • https://sportingfinances.pt`,
            files: [file],
          });
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    }, "image/png");
  });
}

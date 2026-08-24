import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAppState } from "../core/state.js";
import { config } from "../core/config.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { exportFinancialsExcel } from "../utils/exportExcel.js";
import { TABS } from "./TabsNavigation.js";

export interface CommandItem {
  id: string;
  category: "tabs" | "players" | "metrics" | "news" | "actions";
  title: string;
  subtitle?: string;
  icon: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfModal?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenPdfModal,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const ledger = useAppState((s) => s.TRANSFER_LEDGER);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<
    Array<{ id: string; title: string; date?: string; category?: string }>
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch news items when palette opens
  useEffect(() => {
    if (!isOpen) return;
    fetch(config.newsPath)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setNewsItems(
            data.items.slice(0, 30).map((n: { id?: string; title: string; pubDate?: string; date?: string; category?: string }, idx: number) => ({
              id: n.id || `news-${idx}`,
              title: n.title,
              date: n.pubDate || n.date,
              category: n.category || "CMVM",
            })),
          );
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build command index
  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Navigation Tabs
    (TABS || []).forEach((tab) => {
      const rawTranslated = isPt ? t(tab.i18n) : tab.label;
      const tabLabel =
        rawTranslated && rawTranslated !== tab.i18n ? rawTranslated : tab.label;
      const displayTitle = `${tab.num}. ${tabLabel}`;
      items.push({
        id: `tab-${tab.id}`,
        category: "tabs",
        title: displayTitle,
        subtitle: isPt ? `Navegar para ${tabLabel}` : `Navigate to ${tabLabel} tab`,
        icon: "📑",
        keywords: [
          tab.id,
          tab.num,
          tab.label.toLowerCase(),
          tabLabel.toLowerCase(),
          "tab",
          "separador",
          "capitulo",
        ],
        action: () => {
          useAppState.getState().setActiveTab(tab.id);
          onClose();
        },
      });
    });

    // 2. Quick Actions
    items.push({
      id: "action-theme",
      category: "actions",
      title: isPt ? "Alternar Modo Claro / Escuro" : "Toggle Dark / Light Theme",
      subtitle: isPt
        ? "Mudar a aparência visual da plataforma"
        : "Switch platform visual appearance",
      icon: "🌓",
      keywords: ["tema", "escuro", "claro", "dark", "light", "mode", "theme"],
      action: () => {
        const theme = useAppState.getState().theme;
        const newTheme = theme === "dark" ? "light" : "dark";
        useAppState.getState().setTheme(newTheme);
        if (typeof document !== "undefined") {
          if (newTheme === "dark") {
            document.body.classList.add("dark");
          } else {
            document.body.classList.remove("dark");
          }
        }
        onClose();
      },
    });

    items.push({
      id: "action-lang",
      category: "actions",
      title: isPt
        ? "Mudar Idioma (English / Português)"
        : "Switch Language (Portuguese / English)",
      subtitle: isPt
        ? "Alternar entre Português e Inglês"
        : "Toggle Portuguese and English",
      icon: "🌐",
      keywords: [
        "idioma",
        "lingua",
        "language",
        "english",
        "portugues",
        "translation",
        "i18n",
      ],
      action: () => {
        useAppState.getState().setIsPt(!isPt);
        onClose();
      },
    });

    items.push({
      id: "action-excel",
      category: "actions",
      title: isPt
        ? "Descarregar Livro de Cálculo Excel (.xlsx)"
        : "Download Formatted Excel Workbook (.xlsx)",
      subtitle: isPt
        ? "Exportar todas as 5 abas financeiras formatadas"
        : "Export all 5 formatted financial statement sheets",
      icon: "📊",
      keywords: [
        "excel",
        "xlsx",
        "exportar",
        "download",
        "tabelas",
        "sheet",
        "relatorio",
      ],
      action: () => {
        exportFinancialsExcel(useAppState.getState().isPt);
        onClose();
      },
    });

    if (onOpenPdfModal) {
      items.push({
        id: "action-pdf",
        category: "actions",
        title: isPt
          ? "Gerar Relatório Executivo em PDF (7 Páginas)"
          : "Generate Executive 7-Page PDF Report",
        subtitle: isPt
          ? "Exportar dossier completo de apresentação executiva"
          : "Export formatted multi-page institutional dossier",
        icon: "📄",
        keywords: [
          "pdf",
          "relatorio",
          "report",
          "imprimir",
          "exportar",
          "dossier",
          "executive",
        ],
        action: () => {
          onClose();
          onOpenPdfModal();
        },
      });
    }

    items.push({
      id: "action-story",
      category: "actions",
      title: isPt
        ? "Iniciar Modo História Editorial (Story Mode)"
        : "Start Interactive Story Mode",
      subtitle: isPt
        ? "Jornada cronológica comentada da recuperação da SAD"
        : "Chronological guided narrative of the turnaround",
      icon: "📖",
      keywords: ["historia", "story", "modo", "narrativa", "jornada", "tour"],
      action: () => {
        useAppState.getState().setIsStoryVisible(true);
        useAppState.getState().setStoryIndex(0);
        onClose();
      },
    });

    // 3. Financial Metrics & Key Charts
    const metricsDef = [
      {
        id: "m-ebitda",
        titlePt: "EBITDA & Rentabilidade Operacional",
        titleEn: "EBITDA & Operating Margin",
        tab: "overview",
        icon: "📈",
        kw: ["ebitda", "lucro", "rentabilidade", "margem"],
      },
      {
        id: "m-equity",
        titlePt: "Capitais Próprios & Património Líquido",
        titleEn: "Shareholders' Equity & Net Worth",
        tab: "balance-sheet",
        icon: "🏛️",
        kw: [
          "capital",
          "proprio",
          "patrimonio",
          "insolvencia",
          "equity",
          "falencia",
        ],
      },
      {
        id: "m-net-debt",
        titlePt: "Dívida Financeira Líquida",
        titleEn: "Net Financial Debt",
        tab: "balance-sheet",
        icon: "📉",
        kw: ["divida", "liquida", "passivo", "bancaria", "debt", "borrowings"],
      },
      {
        id: "m-uspp",
        titlePt: "Empréstimo Obrigacionista USPP (€225M)",
        titleEn: "USPP Senior Secured Notes (€225M)",
        tab: "bonds",
        icon: "🇺🇸",
        kw: [
          "uspp",
          "obrigacoes",
          "bonds",
          "225",
          "rating",
          "bbb",
          "dbrs",
          "fitch",
          "2034",
        ],
      },
      {
        id: "m-dmt",
        titlePt: "Calendário de Vencimentos & Serviço da Dívida (2025 → 2035)",
        titleEn: "Debt Maturity Tracker & Repayment Schedule",
        tab: "bonds",
        icon: "📅",
        kw: [
          "vencimentos",
          "maturidade",
          "amortizacao",
          "dscr",
          "juros",
          "cupoes",
          "repayment",
          "schedule",
          "debt",
        ],
      },
      {
        id: "m-vmoc",
        titlePt: "Recompra & Extinção de VMOCs",
        titleEn: "VMOCs Repurchase & Extinction",
        tab: "bonds",
        icon: "🤝",
        kw: ["vmoc", "vmocs", "bcp", "novo banco", "recompra", "maioria"],
      },
      {
        id: "m-player-roi",
        titlePt: "Ficha Contabilística de Jogadores & Simulador de Mais-Valias",
        titleEn: "Player Net Book Value & Sale ROI Calculator",
        tab: "playground",
        icon: "💎",
        kw: [
          "mais-valia",
          "mais valia",
          "capital gain",
          "roi",
          "gyokeres",
          "hjulmand",
          "debast",
          "diomande",
          "quenda",
          "inacio",
          "book value",
          "valor contabilistico",
          "passe",
          "clausula",
        ],
      },
      {
        id: "m-efficiency",
        titlePt: "Índice de Eficiência: Custo por Ponto & Retorno por Título",
        titleEn: "Financial Efficiency: Cost per Point & Title ROI",
        tab: "competitive",
        icon: "🏆",
        kw: [
          "eficiencia",
          "custo por ponto",
          "cost per point",
          "titulos",
          "trofeus",
          "trophies",
          "pontos",
          "points",
          "roi",
          "campeonatos",
        ],
      },
      {
        id: "m-stress-test",
        titlePt: "Simulador de Testes de Esforço & Cash Runway",
        titleEn: "Stress Testing & Cash Runway Simulator",
        tab: "playground",
        icon: "⚡",
        kw: [
          "stress",
          "esforco",
          "testes de esforco",
          "runway",
          "liquidez",
          "falencia",
          "artigo 35",
          "crise",
          "resiliencia",
        ],
      },
      {
        id: "m-uefa-fsr",
        titlePt: "Radar UEFA Squad Cost Rule (70% Cap)",
        titleEn: "UEFA Squad Cost Rule Radar (70% Cap)",
        tab: "healthcheck",
        icon: "🛡️",
        kw: [
          "uefa",
          "fsr",
          "radar",
          "squad cost",
          "70",
          "sustentabilidade",
          "fair play",
        ],
      },
      {
        id: "m-rivals",
        titlePt: "Benchmark Três Grandes (Sporting vs Benfica vs Porto)",
        titleEn: "Big Three Benchmark (Sporting vs Benfica vs Porto)",
        tab: "competitive",
        icon: "🏆",
        kw: [
          "rivais",
          "benfica",
          "porto",
          "comparacao",
          "benchmark",
          "tres grandes",
        ],
      },
      {
        id: "m-cfo-sim",
        titlePt: "Simulador Orçamental Macro (CFO)",
        titleEn: "Macro CFO Budget Simulator",
        tab: "playground",
        icon: "🎛️",
        kw: ["simulador", "cfo", "playground", "cenarios", "ucl", "orcamento"],
      },
      {
        id: "m-squad-sim",
        titlePt: "Calculador de Impacto de Contratações (UEFA FSR)",
        titleEn: "Transfer Impact Calculator (UEFA FSR)",
        tab: "playground",
        icon: "🧮",
        kw: [
          "contratacoes",
          "transferencias",
          "calculador",
          "amortizacao",
          "salario",
          "reforco",
        ],
      },
      {
        id: "m-tv-rev",
        titlePt: "Receitas de Direitos Audiovisuais (TV)",
        titleEn: "Broadcasting Rights Revenue (TV)",
        tab: "revenue",
        icon: "📺",
        kw: ["tv", "audiovisual", "nos", "direitos", "transmissao"],
      },
      {
        id: "m-matchday",
        titlePt: "Receitas de Bilhética & Gamebox (Matchday)",
        titleEn: "Matchday & Ticket Sales Revenue",
        tab: "revenue",
        icon: "🏟️",
        kw: ["bilhetica", "gamebox", "estadio", "matchday", "bilhetes"],
      },
    ];

    metricsDef.forEach((m) => {
      items.push({
        id: `metric-${m.id}`,
        category: "metrics",
        title: isPt ? m.titlePt : m.titleEn,
        subtitle: isPt
          ? `Abrir análise em ${m.titlePt}`
          : `View ${m.titleEn} analysis`,
        icon: m.icon,
        keywords: [...m.kw, m.titlePt.toLowerCase(), m.titleEn.toLowerCase()],
        action: () => {
          useAppState.getState().setActiveTab(m.tab);
          onClose();
        },
      });
    });

    // 4. Players & Transfer Ledger
    const seenPlayers = new Set<string>();
    (ledger || []).forEach((seasonObj) => {
      const seasonName = seasonObj.season;
      const purchases = seasonObj.purchases || [];
      const sales = seasonObj.sales || [];

      purchases.forEach((tx) => {
        if (!tx.player || seenPlayers.has(tx.player.toLowerCase())) return;
        seenPlayers.add(tx.player.toLowerCase());
        const feeFormatted = `€${(tx.fee || 0).toFixed(1)}M`;
        const typeLabel = isPt ? "Compra" : "Purchase";

        items.push({
          id: `player-${tx.player}`,
          category: "players",
          title: tx.player,
          subtitle: `${typeLabel} (${seasonName}) • ${feeFormatted} • ${tx.club || ""}`,
          icon: "⚽",
          keywords: [
            tx.player.toLowerCase(),
            seasonName,
            tx.club ? tx.club.toLowerCase() : "",
            "compra",
            "purchase",
            "jogador",
            "player",
            "transferencia",
          ],
          action: () => {
            useAppState.getState().setActiveTab("squad");
            onClose();
          },
        });
      });

      sales.forEach((tx) => {
        if (!tx.player || seenPlayers.has(tx.player.toLowerCase())) return;
        seenPlayers.add(tx.player.toLowerCase());
        const feeFormatted = `€${(tx.fee || 0).toFixed(1)}M`;
        const typeLabel = isPt ? "Venda" : "Sale";

        items.push({
          id: `player-${tx.player}`,
          category: "players",
          title: tx.player,
          subtitle: `${typeLabel} (${seasonName}) • ${feeFormatted} • ${tx.club || ""}`,
          icon: "⚽",
          keywords: [
            tx.player.toLowerCase(),
            seasonName,
            tx.club ? tx.club.toLowerCase() : "",
            "venda",
            "sale",
            "jogador",
            "player",
            "transferencia",
          ],
          action: () => {
            useAppState.getState().setActiveTab("squad");
            onClose();
          },
        });
      });
    });

    // 5. News & Official Press Releases
    newsItems.forEach((n) => {
      items.push({
        id: `news-${n.id}`,
        category: "news",
        title: n.title,
        subtitle: `${n.date || ""} • ${n.category || "CMVM"}`,
        icon: "📰",
        keywords: [
          n.title.toLowerCase(),
          n.date ? n.date.toLowerCase() : "",
          n.category ? n.category.toLowerCase() : "",
          "noticia",
          "comunicado",
          "cmvm",
        ],
        action: () => {
          useAppState.getState().setActiveTab("news");
          onClose();
        },
      });
    });

    return items;
  }, [isPt, ledger, newsItems, onClose, onOpenPdfModal, t]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Return top priority items by default
      return allItems.slice(0, 18);
    }

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);

    return allItems
      .filter((item) => {
        const titleMatch = item.title.toLowerCase();
        const subtitleMatch = item.subtitle ? item.subtitle.toLowerCase() : "";
        const keywordsMatch = item.keywords ? item.keywords.join(" ") : "";
        const combined = `${titleMatch} ${subtitleMatch} ${keywordsMatch}`;

        return words.every((word) => combined.includes(word));
      })
      .slice(0, 25);
  }, [allItems, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev + 1 < filteredItems.length ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredItems, selectedIndex, onClose],
  );

  // Auto-scroll selected element into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selectedEl = list.children[selectedIndex] as HTMLElement | undefined;
    if (selectedEl && typeof selectedEl.scrollIntoView === "function") {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels = {
    tabs: isPt ? "Separadores" : "Tabs",
    actions: isPt ? "Ações Rápidas" : "Quick Actions",
    metrics: isPt ? "Métricas & Gráficos" : "Metrics & Charts",
    players: isPt ? "Jogadores" : "Players",
    news: isPt ? "Comunicados CMVM" : "Press Releases",
  };

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="cmd-palette-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="cmd-palette-search-row">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cmd-palette-search-icon"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder={
              isPt
                ? "Pesquisar jogadores, métricas, comunicados ou ações (ex: Gyökeres, USPP, EBITDA)..."
                : "Search players, metrics, releases or actions (e.g., Gyökeres, USPP, EBITDA)..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="cmd-palette-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <span className="cmd-palette-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="cmd-palette-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="cmd-palette-empty">
              <span style={{ fontSize: "1.5rem", marginBottom: "6px" }}>🔍</span>
              <div>
                {isPt
                  ? "Nenhum resultado encontrado para"
                  : "No results found for"}{" "}
                "{query}"
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  marginTop: "4px",
                }}
              >
                {isPt
                  ? "Tente pesquisar por 'Gyökeres', 'Balanço', 'USPP', 'EBITDA' ou 'Excel'"
                  : "Try searching for 'Gyökeres', 'Balance Sheet', 'USPP', 'EBITDA' or 'Excel'"}
              </span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-palette-item ${isSelected ? "selected" : ""}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-palette-item-icon">{item.icon}</div>
                  <div className="cmd-palette-item-content">
                    <div className="cmd-palette-item-title">{item.title}</div>
                    {item.subtitle && (
                      <div className="cmd-palette-item-subtitle">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <span className={`cmd-palette-item-tag tag-${item.category}`}>
                    {categoryLabels[item.category]}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Navigation Footer */}
        <div className="cmd-palette-footer">
          <div className="cmd-palette-footer-item">
            <span className="cmd-key">↑</span>
            <span className="cmd-key">↓</span>
            <span>{isPt ? "Navegar" : "Navigate"}</span>
          </div>
          <div className="cmd-palette-footer-item">
            <span className="cmd-key">↵</span>
            <span>{isPt ? "Selecionar" : "Select"}</span>
          </div>
          <div className="cmd-palette-footer-item">
            <span className="cmd-key">ESC</span>
            <span>{isPt ? "Fechar" : "Close"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

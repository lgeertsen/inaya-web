"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PreviewController,
  type KeyLocation,
  type ScanInput,
} from "./preview-controller";

interface PreviewFrameProps {
  /** Public page path (with locale prefix) shown in the iframe. */
  src: string;
  viewport: "desktop" | "mobile";
  /** Called by the scanner to read the latest messages/prefixes without re-creating it. */
  getScanInput: () => ScanInput;
  /** Unsaved edits to show live, keyed by message key. */
  drafts: Record<string, string>;
  selectedKey: string | null;
  /** Scroll the page to the selected text (true when selection came from the panel). */
  scrollToSelected: boolean;
  hoveredKey: string | null;
  showAll: boolean;
  /** Bumped to reload the page (after a save). */
  reloadToken: number;
  badgeLabel: string;
  loadingLabel: string;
  onLocated: (locations: Record<string, KeyLocation>) => void;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
}

/** How long to let the public page hydrate before scanning it. */
const SCAN_DELAY_MS = 700;

/**
 * The desktop preview always renders the site at this width and scales it down
 * to fit, so the admin sees the real desktop layout (not the tablet layout the
 * site would switch to inside a ~750px-wide iframe).
 */
const DESKTOP_WIDTH = 1200;
const MOBILE_WIDTH = 390;
const FRAME_PADDING = 12;
const DESKTOP_BORDER = 1;
const MOBILE_BORDER = 7;

export function PreviewFrame(props: PreviewFrameProps) {
  const { src, viewport, drafts, selectedKey, scrollToSelected, hoveredKey, showAll, reloadToken } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controllerRef = useRef<PreviewController | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const latest = useRef(props);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(0);
  const [available, setAvailable] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    latest.current = props;
  });

  const teardown = useCallback(() => {
    window.clearTimeout(timerRef.current);
    controllerRef.current?.destroy();
    controllerRef.current = null;
  }, []);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;

    teardown();
    setLoading(true);

    timerRef.current = window.setTimeout(() => {
      const current = iframeRef.current?.contentDocument;
      if (!current?.body) return;

      const controller = new PreviewController(
        current,
        () => latest.current.getScanInput(),
        {
          onLocated: (locations) => {
            // A client-side navigation inside the preview (e.g. a router.push from a
            // button) would leave the page being edited — bring it back.
            const expected = new URL(latest.current.src, window.location.origin).pathname;
            const actual = iframeRef.current?.contentWindow?.location.pathname;
            if (actual && actual !== expected && iframeRef.current) {
              iframeRef.current.src = latest.current.src;
              return;
            }
            latest.current.onLocated(locations);
          },
          onSelect: (key) => latest.current.onSelect(key),
          onHover: (key) => latest.current.onHover(key),
        },
        latest.current.badgeLabel,
      );
      controllerRef.current = controller;
      controller.scan();
      setLoading(false);
      setReady((count) => count + 1);
    }, SCAN_DELAY_MS);
  }, [teardown]);

  useEffect(() => teardown, [teardown]);

  // Reload after a save.
  const lastReloadToken = useRef(reloadToken);
  useEffect(() => {
    if (lastReloadToken.current === reloadToken) return;
    lastReloadToken.current = reloadToken;
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      if (iframeRef.current) iframeRef.current.src = src;
    }
  }, [reloadToken, src]);

  useEffect(() => {
    controllerRef.current?.setDrafts(drafts);
  }, [drafts, ready]);

  useEffect(() => {
    controllerRef.current?.select(selectedKey, scrollToSelected);
  }, [selectedKey, scrollToSelected, ready]);

  useEffect(() => {
    controllerRef.current?.hover(hoveredKey);
  }, [hoveredKey, ready]);

  useEffect(() => {
    controllerRef.current?.setShowAll(showAll);
  }, [showAll, ready]);
  // Track the space available for the preview.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const width = Math.max(0, container.clientWidth - FRAME_PADDING * 2);
      const height = Math.max(0, container.clientHeight - FRAME_PADDING * 2);
      setAvailable((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Desktop: render at a fixed virtual width and scale down to fit. Mobile: real phone width.
  const isMobile = viewport === "mobile";
  const virtualWidth = isMobile ? MOBILE_WIDTH : DESKTOP_WIDTH;
  // The border sits outside the content box, so it is subtracted from the measured space on both
  // axes: a frame even slightly larger than its container would overflow, and the resulting
  // scrollbars change the measurement, which flips the layout back and forth.
  const border = isMobile ? MOBILE_BORDER : DESKTOP_BORDER;
  const innerWidth = available ? Math.max(0, available.width - border * 2) : virtualWidth;
  const innerHeight = available ? Math.max(0, available.height - border * 2) : 0;
  const scale = available ? Math.min(1, innerWidth / virtualWidth) : 1;
  const frameWidth = available && scale === 1 && !isMobile ? innerWidth : virtualWidth;
  const frameHeight = available ? innerHeight / scale : 600;
  return (
    <div
      ref={containerRef}
      // Absolutely positioned so its size never depends on its content (see the measuring effect).
      className="absolute inset-0 flex justify-center overflow-hidden bg-ink/[0.05]"
      style={{ padding: FRAME_PADDING }}
    >
      <div
        className={`flex-none overflow-hidden bg-white ${
          isMobile ? "rounded-[26px] border-[7px] border-ink shadow-card-hover" : "rounded-[10px] border border-ink/12 shadow-card"
        }`}
        style={{
          width: frameWidth * scale,
          height: available ? innerHeight : "100%",
          boxSizing: "content-box",
        }}
      >
        <div style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <iframe
            ref={iframeRef}
            src={src}
            title={props.badgeLabel}
            onLoad={handleLoad}
            className="block h-full w-full border-0 bg-white"
          />
        </div>
      </div>
      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
          <span className="flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-[12.5px] font-bold text-white shadow-card">
            <Loader2 size={15} className="animate-spin" />
            {props.loadingLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

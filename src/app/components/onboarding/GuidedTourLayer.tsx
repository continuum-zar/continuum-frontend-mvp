import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";

import { useAuthStore } from "@/store/authStore";
import {
  readWorkspaceTourPersisted,
  useWorkspaceTourStore,
} from "@/store/workspaceTourStore";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

import { GuidedTourStepPanel, GUIDED_TOUR_ARROW_SIZE_PX } from "./GuidedTourStepPanel";
import { WORKSPACE_TOUR_STEPS } from "./workspaceTourSteps";

const PANEL_GAP_PX = 10;

function urlMatches(pathname: string, search: string, ensureUrl: string): boolean {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = new URL(ensureUrl, base);
  const np = pathname.replace(/\/$/, "") || "/";
  const up = u.pathname.replace(/\/$/, "") || "/";
  if (np !== up) return false;
  const want = new URLSearchParams(u.search);
  if ([...want.keys()].length === 0) return true;
  const have = new URLSearchParams(search);
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false;
  }
  return true;
}

export function GuidedTourLayer() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const userId = useAuthStore((s) => s.user?.id?.toString() ?? null);
  const reduceMotion = usePrefersReducedMotion();

  const active = useWorkspaceTourStore((s) => s.active);
  const stepIndex = useWorkspaceTourStore((s) => s.stepIndex);
  const pendingFromWelcome = useWorkspaceTourStore((s) => s.pendingFromWelcome);
  const hydrate = useWorkspaceTourStore((s) => s.hydrate);
  const startTour = useWorkspaceTourStore((s) => s.startTour);
  const nextStep = useWorkspaceTourStore((s) => s.nextStep);
  const prevStep = useWorkspaceTourStore((s) => s.prevStep);
  const skipTour = useWorkspaceTourStore((s) => s.skipTour);
  const clearPendingFromWelcome = useWorkspaceTourStore((s) => s.clearPendingFromWelcome);
  const setTimeLogsActivityView = useWorkspaceTourStore((s) => s.setTimeLogsActivityView);
  const setSettingsPanelSection = useWorkspaceTourStore((s) => s.setSettingsPanelSection);
  const setTourSettingsModalOpen = useWorkspaceTourStore((s) => s.setTourSettingsModalOpen);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const tourPanelRef = useRef<HTMLDivElement | null>(null);
  const resumeLock = useRef(false);

  const steps = WORKSPACE_TOUR_STEPS;
  const step = steps[stepIndex];
  const total = steps.length;

  useEffect(() => {
    hydrate(userId);
  }, [hydrate, userId]);

  useEffect(() => {
    if (!userId || resumeLock.current) return;
    if (!pathname.startsWith("/workspace")) return;
    const p = readWorkspaceTourPersisted(userId);
    if (p?.status === "active") {
      resumeLock.current = true;
      startTour(p.stepIndex);
    }
  }, [userId, pathname, startTour]);

  useEffect(() => {
    if (!pendingFromWelcome || !userId) return;
    startTour(0);
    clearPendingFromWelcome();
  }, [pendingFromWelcome, userId, startTour, clearPendingFromWelcome]);

  const applyStepSideEffects = useCallback(() => {
    if (!step) return;
    if (step.activityView != null) {
      setTimeLogsActivityView(step.activityView);
    } else {
      setTimeLogsActivityView(null);
    }
    if (step.openSettings && step.settingsSection) {
      setSettingsPanelSection(step.settingsSection);
      setTourSettingsModalOpen(true);
    } else {
      setSettingsPanelSection(null);
      setTourSettingsModalOpen(false);
    }
  }, [step, setTimeLogsActivityView, setSettingsPanelSection, setTourSettingsModalOpen]);

  useEffect(() => {
    if (!active || !step) return;
    applyStepSideEffects();
  }, [active, step, applyStepSideEffects]);

  useEffect(() => {
    if (active) return;
    setTourSettingsModalOpen(null);
    setSettingsPanelSection(null);
  }, [active, setTourSettingsModalOpen, setSettingsPanelSection]);

  const navigateIfNeeded = useCallback(() => {
    if (!step?.ensureUrl) return;
    if (urlMatches(pathname, search, step.ensureUrl)) return;
    navigate(`${step.ensureUrl}`, { replace: true });
  }, [step, pathname, search, navigate]);

  useEffect(() => {
    if (!active || !step) return;
    navigateIfNeeded();
  }, [active, step, navigateIfNeeded]);

  const measure = useCallback(() => {
    if (!active || !step) {
      setTargetRect(null);
      setPanelPos(null);
      return;
    }
    const run = () => {
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (!el) {
        setTargetRect(null);
        setPanelPos(null);
        return;
      }
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setTargetRect(r);
        const panelW = Math.min(380, window.innerWidth - 24);
        const bottomReserve = step.panelBottomReservePx ?? 160;
        const gap = PANEL_GAP_PX + 8;
        const placement = step.panelPlacement ?? "below";

        let left: number;
        let top: number;

        if (placement === "left") {
          const estTotalW = panelW + GUIDED_TOUR_ARROW_SIZE_PX;
          const estH = 200;
          left = Math.max(12, r.left - gap - estTotalW);
          top = Math.max(12, Math.min(r.top + r.height / 2 - estH / 2, window.innerHeight - estH - 12));
        } else if (placement === "right") {
          const estTotalW = panelW + GUIDED_TOUR_ARROW_SIZE_PX;
          const estH = 200;
          left = Math.max(12, Math.min(r.right + gap, window.innerWidth - estTotalW - 12));
          top = Math.max(12, Math.min(r.top + r.height / 2 - estH / 2, window.innerHeight - estH - 12));
        } else {
          left = Math.min(
            Math.max(12, r.left + r.width / 2 - panelW / 2),
            window.innerWidth - panelW - 12,
          );
          if (placement === "above") {
            const estPanelH = 200;
            top = Math.max(12, r.top - estPanelH - gap);
          } else {
            top = Math.max(12, Math.min(r.bottom + gap, window.innerHeight - bottomReserve));
          }
        }
        setPanelPos({ top, left });
      });
    };
    const delay = step.openSettings ? 420 : step.id.startsWith("activity-") ? 120 : 0;
    if (delay > 0) {
      window.setTimeout(run, delay);
    } else {
      run();
    }
  }, [active, step, reduceMotion]);

  useLayoutEffect(() => {
    if (!active || !step) return undefined;
    const t = window.setTimeout(measure, 0);
    const t2 = window.setTimeout(measure, 320);
    const t3 = window.setTimeout(measure, 700);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", measure);
    };
  }, [active, step, pathname, search, measure]);

  useLayoutEffect(() => {
    if (!active || !step || !tourPanelRef.current) return;
    const placement = step.panelPlacement ?? "below";
    if (placement !== "above" && placement !== "left" && placement !== "right") return;
    const target = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (!target) return;
    const r = target.getBoundingClientRect();
    const pr = tourPanelRef.current.getBoundingClientRect();
    const gap = PANEL_GAP_PX + 8;

    if (placement === "above") {
      const top = Math.max(12, r.top - pr.height - gap);
      setPanelPos((prev) => (prev ? { ...prev, top } : null));
      return;
    }

    if (placement === "left") {
      let left = Math.max(12, r.left - gap - pr.width);
      let top = r.top + r.height / 2 - pr.height / 2;
      top = Math.max(12, Math.min(top, window.innerHeight - pr.height - 12));
      setPanelPos((prev) => (prev ? { ...prev, top, left } : null));
      return;
    }

    let left = Math.max(12, Math.min(r.right + gap, window.innerWidth - pr.width - 12));
    let top = r.top + r.height / 2 - pr.height / 2;
    top = Math.max(12, Math.min(top, window.innerHeight - pr.height - 12));
    setPanelPos((prev) => (prev ? { ...prev, top, left } : null));
  }, [active, step, stepIndex, targetRect]);

  const panelStyle = useMemo(() => {
    if (!panelPos) return { top: "20%", left: "50%", transform: "translateX(-50%)" } as const;
    return { top: panelPos.top, left: panelPos.left, transform: "none" } as const;
  }, [panelPos]);

  const onNext = () => {
    nextStep(total);
    setTargetRect(null);
  };
  const onBack = () => {
    prevStep();
    setTargetRect(null);
  };
  const onSkip = () => {
    skipTour();
    setTargetRect(null);
    setTimeLogsActivityView(null);
    setSettingsPanelSection(null);
  };

  if (typeof document === "undefined" || !active || !step) return null;

  const settingsStep = Boolean(step.openSettings);

  return createPortal(
    <>
      {!settingsStep ? (
        <div
          className="pointer-events-auto fixed inset-0 z-[110] bg-black/45"
          aria-hidden
          onMouseDown={(e) => e.preventDefault()}
        />
      ) : null}
      {targetRect ? (
        <div
          className="pointer-events-none fixed z-[115] rounded-[10px] ring-2 ring-[#24B5F8] ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      ) : null}
      <div className="pointer-events-none fixed inset-0 z-[118]">
        <GuidedTourStepPanel
          ref={tourPanelRef}
          title={step.title}
          stepLabel={`Step ${stepIndex + 1} of ${total}`}
          style={panelStyle}
          reduceMotion={reduceMotion}
          placement={step.panelPlacement ?? "below"}
          canGoBack={stepIndex > 0}
          isLast={stepIndex >= total - 1}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
        >
          {step.body}
        </GuidedTourStepPanel>
      </div>
    </>,
    document.body,
  );
}

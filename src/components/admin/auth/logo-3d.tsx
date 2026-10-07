"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MARK_SRC = "/vitamind-mark-3d.png";
const FALLBACK_SRC = "/vitamind-logo-3d.jpeg";
const MAX_TILT = 14;

/**
 * Interactive 3D brand mark for the sign-in screen.
 *
 * The rendered 3D asset is tilted with a CSS perspective transform that follows
 * the pointer (rAF-throttled, GPU-composited, no extra runtime dependency). It
 * shows a shimmer while the image loads, fades in once decoded, falls back to
 * the flat SVG logo if the asset fails, and stays still for users who prefer
 * reduced motion or use a touch device.
 */
export function Logo3D({ size = 280, className }: { size?: number; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Follow the pointer anywhere over the panel, not only over the mark itself.
  useEffect(() => {
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!motionOk || !finePointer) return;
    const host = stage.current?.closest("aside") ?? stage.current?.parentElement;
    if (!host) return;
    const move = (e: globalThis.PointerEvent) => {
      const el = stage.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width * 1.5);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height * 1.5);
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const tx = Math.max(-1, Math.min(1, x)) * MAX_TILT;
        const ty = Math.max(-1, Math.min(1, y)) * MAX_TILT;
        if (card.current) card.current.style.transform = `rotateY(${tx}deg) rotateX(${-ty}deg)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame.current);
      if (card.current) card.current.style.transform = "";
    };
    host.addEventListener("pointermove", move as EventListener);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move as EventListener);
      host.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const onPointerDown = (e: PointerEvent) => e.preventDefault();

  return (
    <div
      ref={stage}
      className={cn("relative mx-auto select-none [perspective:900px]", className)}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      role="img"
      aria-label="SynQ logo"
    >
      {/* Soft brand glow and contact shadow give the mark depth on the dark panel. */}
      <div className="pointer-events-none absolute inset-6 rounded-full bg-primary/40 blur-3xl" aria-hidden />
      <div
        className="pointer-events-none absolute -bottom-2 left-1/2 h-4 w-3/5 -translate-x-1/2 rounded-full bg-black/40 blur-xl motion-safe:animate-[logo-shadow_6s_ease-in-out_infinite]"
        aria-hidden
      />

      {!loaded && !failed && (
        <div className="absolute inset-8 animate-pulse rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10" aria-hidden />
      )}

      <div
        ref={card}
        className="relative size-full transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform"
      >
        <div className="size-full motion-safe:animate-[logo-float_6s_ease-in-out_infinite]">
          <Image
            src={failed ? FALLBACK_SRC : MARK_SRC}
            alt=""
            width={size}
            height={size}
            priority
            sizes={`${size}px`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(true);
            }}
            className={cn(
              "size-full object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.45)] transition-opacity duration-700",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
    </div>
  );
}

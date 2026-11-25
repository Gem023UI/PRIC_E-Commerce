"use client";

import * as React from "react";

const W = 600;
const H = 180;

/** A small drawing area. Reports a PNG data URL after each stroke, or null when cleared. */
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = React.useState(false);

  const paint = React.useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  React.useEffect(() => {
    paint();
  }, [paint]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const line = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setHasInk(true);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="Signature drawing area (optional)"
        className="w-full touch-none rounded-lg border border-white/20 bg-white"
        style={{ aspectRatio: `${W} / ${H}`, cursor: "crosshair" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = pos(e);
          last.current = p;
          line(p, p);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const p = pos(e);
          line(last.current, p);
          last.current = p;
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-white/55">
        <span>Sign with your finger or mouse.</span>
        <button
          type="button"
          onClick={() => {
            paint();
            setHasInk(false);
            onChange(null);
          }}
          disabled={!hasInk}
          className="rounded-full border border-white/25 px-3 py-1 font-semibold text-white/80 transition-colors hover:border-white/50 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
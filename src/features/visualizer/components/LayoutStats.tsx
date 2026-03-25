import { useState, useEffect, useRef } from "react";
import type { StructLayout } from "../../../shared/types";

interface LayoutStatsProps {
  layout: StructLayout;
}

/** Animate a number from 0 to `target` over `duration` ms. */
function useAnimatedNumber(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animFrame = useRef(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [target, duration]);

  return value;
}

export default function LayoutStats({ layout }: LayoutStatsProps) {
  const paddingBytes = layout.fields
    .filter((f) => f.is_padding)
    .reduce((sum, f) => sum + f.size, 0);
  const usefulBytes = layout.size - paddingBytes;
  const efficiencyNum =
    layout.size > 0 ? (usefulBytes / layout.size) * 100 : 100;

  const animSize = useAnimatedNumber(layout.size);
  const animAlign = useAnimatedNumber(layout.alignment);
  const animPadding = useAnimatedNumber(paddingBytes);
  const animEfficiency = useAnimatedNumber(Math.round(efficiencyNum));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total Size" value={`${animSize} B`} />
      <StatCard label="Alignment" value={`${animAlign} B`} />
      <StatCard
        label="Padding"
        value={`${animPadding} B`}
        highlight={paddingBytes > 0}
      />
      <StatCard
        label="Efficiency"
        value={`${animEfficiency}%`}
        efficiency={efficiencyNum}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  efficiency,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  efficiency?: number;
}) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 relative overflow-hidden group hover:border-gray-500 transition-colors">
      {/* Subtle gradient shine on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-xs text-gray-400 uppercase tracking-wide relative z-10">
        {label}
      </div>
      <div
        className={`text-xl font-bold mt-1 relative z-10 ${highlight ? "text-red-400" : "text-white"}`}
      >
        {value}
      </div>
      {/* Efficiency bar */}
      {efficiency !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${efficiency}%`,
              backgroundColor:
                efficiency >= 90
                  ? "#22c55e"
                  : efficiency >= 70
                    ? "#eab308"
                    : "#ef4444",
            }}
          />
        </div>
      )}
    </div>
  );
}

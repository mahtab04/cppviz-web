import type { StructLayout } from "../../../shared/types";

interface LayoutStatsProps {
  layout: StructLayout;
}

export default function LayoutStats({ layout }: LayoutStatsProps) {
  const paddingBytes = layout.fields
    .filter((f) => f.is_padding)
    .reduce((sum, f) => sum + f.size, 0);
  const usefulBytes = layout.size - paddingBytes;
  const efficiency =
    layout.size > 0 ? ((usefulBytes / layout.size) * 100).toFixed(1) : "100";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total Size" value={`${layout.size} B`} />
      <StatCard label="Alignment" value={`${layout.alignment} B`} />
      <StatCard
        label="Padding"
        value={`${paddingBytes} B`}
        highlight={paddingBytes > 0}
      />
      <StatCard label="Efficiency" value={`${efficiency}%`} />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
      <div className="text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-xl font-bold mt-1 ${highlight ? "text-red-400" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}

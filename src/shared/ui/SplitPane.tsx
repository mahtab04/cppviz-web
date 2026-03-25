import { useState, useRef, useEffect, ReactNode } from "react";

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  initialLeftWidthPercent?: number;
}

export default function SplitPane({ left, right, initialLeftWidthPercent = 50 }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidthPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      percent = Math.min(Math.max(percent, 20), 80); // Clamp between 20% and 80%
      setLeftWidth(percent);
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
      }
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const onMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  };

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 w-full">
      <div style={{ width: `${leftWidth}%` }} className="flex flex-col min-w-[20%] border-r border-gray-700">
        {left}
      </div>
      <div 
        onMouseDown={onMouseDown} 
        className="w-1.5 -ml-[0.75px] cursor-col-resize bg-transparent hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-10"
        title="Drag to resize pane"
      />
      <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col min-w-[20%]">
        {right}
      </div>
    </div>
  );
}

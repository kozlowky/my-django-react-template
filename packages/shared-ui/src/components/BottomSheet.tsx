import { useEffect, useState } from "react";
import type { ReactNode, MouseEvent } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);

  // Анимация: сначала рендерим, потом сдвигаем в видимую позицию
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-end transition-all duration-300 ${
        visible ? "bg-black/50" : "bg-black/0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full rounded-t-3xl bg-white px-6 pb-10 pt-5 shadow-2xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />
        {children}
      </div>
    </div>
  );
}

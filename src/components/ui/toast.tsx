'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-5 py-3 rounded-2xl
      bg-[#1e1e1e] border border-[#2a2a2a] text-[#e8e8e8] text-sm
      shadow-xl transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <CheckCircle size={17} weight="duotone" className="text-[#6abf4a]" />
      {message}
    </div>
  );
}

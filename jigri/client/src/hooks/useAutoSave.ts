import { useEffect, useRef, useState } from 'react';

export const useAutoSave = (saveFn: () => void, delay: number = 2000) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerSave = () => {
    setStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn();
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        setStatus('error');
      }
    }, delay);
  };

  return { status, triggerSave };
};
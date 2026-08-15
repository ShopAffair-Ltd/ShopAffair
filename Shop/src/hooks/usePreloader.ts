import { useState, useEffect } from 'react';

export function usePreloader(delayMs: number = 2200) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return {
    loading,
    setLoading
  };
}

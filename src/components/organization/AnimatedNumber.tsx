import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number; // Tagal ng bilang sa milliseconds (default: 1000ms)
  prefix?: string;   // Para sa pera (e.g., '₱')
  isCurrency?: boolean;
}

export default function AnimatedNumber({ 
  value, 
  duration = 1000, 
  prefix = '',
  isCurrency = false 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Kung string (tulad ng "₱0"), i-parse natin para makuha yung number
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0 
      : value;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function para swabe ang bilis (easeOutExpo)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(Math.floor(easeOut * numericValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  // I-format pabalik sa string kung pera
  const formatted = isCurrency 
    ? new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
      }).format(displayValue)
    : displayValue.toLocaleString();

  return <>{prefix}{formatted}</>;
}
import { useState, useEffect, useCallback, useRef } from 'react';

type TimerStatus = 'idle' | 'running' | 'paused';

interface UseTimerOptions {
  initialSeconds?: number;
  autoStart?: boolean;
}

export function useTimer({ initialSeconds = 0, autoStart = false }: UseTimerOptions = {}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState<TimerStatus>(autoStart ? 'running' : 'idle');
  const intervalRef = useRef<number | null>(null);

  const formatTime = useCallback(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      raw: {
        hours,
        minutes,
        seconds: secs,
        totalSeconds: seconds
      }
    };
  }, [seconds]);

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const restart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  // Calculate cost based on time
  const calculateCost = useCallback(() => {
    // First hour: 500 yen
    // Additional time: 8 yen per minute
    // Max daily charge: 2000 yen
    let cost = 500; // First hour
    
    if (seconds > 3600) {
      const additionalMinutes = Math.ceil((seconds - 3600) / 60);
      cost += additionalMinutes * 8;
    }
    
    // Cap at max daily charge
    return Math.min(cost, 2000);
  }, [seconds]);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  return {
    ...formatTime(),
    status,
    start,
    pause,
    reset,
    restart,
    calculateCost
  };
}

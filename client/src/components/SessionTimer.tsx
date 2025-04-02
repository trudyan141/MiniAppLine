import { useEffect } from "react";
import { useTimer } from "@/lib/useTimer";
import { Card } from "./ui/card";
import { Session } from "@shared/schema";
import { useSession } from "@/contexts/SessionContext";

interface SessionTimerProps {
  session: Session;
  onTimeUpdate?: (seconds: number, cost: number) => void;
}

export default function SessionTimer({ session, onTimeUpdate }: SessionTimerProps) {
  const { totalOrderAmount } = useSession();
  const startTime = new Date(session.checkInTime);
  const initialSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
  
  const timer = useTimer({
    initialSeconds,
    autoStart: true,
  });

  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(timer.raw.totalSeconds, timer.calculateCost());
    }
  }, [timer.raw.totalSeconds, timer.calculateCost, onTimeUpdate]);

  const formattedStartTime = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <Card className="bg-white p-4 rounded-xl shadow-md">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-[#06C755]/10 flex items-center justify-center text-[#06C755]">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Session in Progress</p>
          <h2 className="text-lg font-bold text-gray-900">
            {timer.hours}:{timer.minutes}:{timer.seconds}
          </h2>
        </div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-gray-600">Current Cost</p>
          <p className="font-medium">¥{timer.calculateCost()}</p>
        </div>
        <div>
          <p className="text-gray-600">Started At</p>
          <p className="font-medium">{formattedStartTime}</p>
        </div>
        <div>
          <p className="text-gray-600">Orders</p>
          <p className="font-medium">+ ¥{totalOrderAmount}</p>
        </div>
      </div>
    </Card>
  );
}

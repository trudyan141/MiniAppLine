import React, { useEffect, useState } from 'react';
import { useTimer } from "@/lib/useTimer";
import { Card } from "./ui/card";
import { Session } from "@shared/schema";
import { useSession } from "@/contexts/SessionContext";
import { format, parseISO, differenceInSeconds } from 'date-fns';

interface SessionTimerProps {
  session: Session;
  onTimeUpdate?: (seconds: number, cost: number) => void;
  duration: number;
}

export default function SessionTimer({ session, onTimeUpdate, duration }: SessionTimerProps) {
  const { totalOrderAmount } = useSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    console.log("============== DEBUG SESSION TIMER ==============");
    console.log("Full session object:", session);
    
    // Tính toán tổng thời gian đã trôi qua
    const updateElapsedTime = () => {
      try {
        // Kiểm tra và chuyển đổi kiểu của checkInTime
        let checkInTimeStr: string;
        if (typeof session.checkInTime === 'string') {
          checkInTimeStr = session.checkInTime;
        } else if (session.checkInTime instanceof Date) {
          checkInTimeStr = session.checkInTime.toISOString();
        } else {
          // Fallback nếu kiểu dữ liệu không xác định
          console.error("Unknown checkInTime type:", typeof session.checkInTime);
          checkInTimeStr = new Date().toISOString();
        }
        
        console.log("CheckInTime after conversion:", checkInTimeStr);
        
        // Parse thời gian check-in
        const startTime = parseISO(checkInTimeStr);
        const now = new Date();
        
        // Tính toán thời gian đã trôi qua bằng date-fns
        const secondsElapsed = differenceInSeconds(now, startTime);
        
        console.log("Check-in time string:", checkInTimeStr);
        console.log("Parsed start time:", startTime);
        console.log("Current time:", now);
        console.log("Elapsed seconds:", secondsElapsed);
        
        setElapsedSeconds(secondsElapsed > 0 ? secondsElapsed : 0);
      } catch (error) {
        console.error("Error calculating elapsed time:", error);
      }
    };

    // Cập nhật ngay lập tức và sau đó mỗi giây
    updateElapsedTime();
    const id = setInterval(updateElapsedTime, 1000);
    setIntervalId(id);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [session]);
  
  const timer = useTimer({
    initialSeconds: elapsedSeconds,
    autoStart: true,
  });
  
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(timer.raw.totalSeconds, timer.calculateCost());
    }
  }, [timer.raw.totalSeconds, timer.calculateCost, onTimeUpdate]);
  
  // Format thời gian bắt đầu phiên
  let formattedStartTime = "00:00";
  try {
    // Kiểm tra và chuyển đổi kiểu của checkInTime
    let checkInTimeStr: string;
    if (typeof session.checkInTime === 'string') {
      checkInTimeStr = session.checkInTime;
    } else if (session.checkInTime instanceof Date) {
      checkInTimeStr = session.checkInTime.toISOString();
    } else {
      // Fallback nếu kiểu dữ liệu không xác định
      console.error("Unknown checkInTime type for formatting:", typeof session.checkInTime);
      checkInTimeStr = new Date().toISOString();
    }
    
    console.log("Formatting checkInTime:", checkInTimeStr);
    
    // Parse và format thời gian
    const startTime = parseISO(checkInTimeStr);
    formattedStartTime = format(startTime, 'HH:mm');
    
    console.log("Raw checkInTime:", session.checkInTime);
    console.log("Converted to string:", checkInTimeStr);
    console.log("Parsed with date-fns:", startTime);
    console.log("Formatted with date-fns:", formattedStartTime);
  } catch (error) {
    console.error("Error formatting start time:", error);
  }

  // Định dạng thời gian trôi qua
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Tính giá trị phần trăm cho thanh tiến trình
  const maxSeconds = duration * 3600; // Chuyển đổi giờ thành giây
  const progress = Math.min((elapsedSeconds / maxSeconds) * 100, 100);

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
          <h2 className="text-xl font-bold text-gray-900">
            {timer.hours}:{timer.minutes}:{timer.seconds}
          </h2>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Current Cost</p>
          <p className="font-semibold text-lg">¥{timer.calculateCost()}</p>
        </div>
        <div>
          <p className="text-gray-600">Started At</p>
          <p className="font-semibold text-lg">{formattedStartTime}</p>
        </div>
        <div>
          <p className="text-gray-600">Orders</p>
          <p className="font-semibold text-lg">+ ¥{totalOrderAmount}</p>
        </div>
      </div>
    </Card>
  );
}

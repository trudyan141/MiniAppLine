import { useEffect, useState } from "react";
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
  const [initialSeconds, setInitialSeconds] = useState<number>(0);
  
  useEffect(() => {
    // Xử lý an toàn chuỗi thời gian
    try {
      // Lấy chuỗi thời gian từ session
      const checkInTimeStr = session.checkInTime;
      console.log("Raw checkInTime:", checkInTimeStr);
      
      // Tạo đối tượng Date từ chuỗi thời gian
      let startTime: Date;
      
      if (typeof checkInTimeStr === 'string') {
        // Nếu là chuỗi ISO, sử dụng trực tiếp
        startTime = new Date(checkInTimeStr);
        console.log("Parsed date:", startTime);
        
        // Kiểm tra xem date có hợp lệ không
        if (isNaN(startTime.getTime())) {
          console.error("Invalid date from checkInTime:", checkInTimeStr);
          // Sử dụng thời gian hiện tại làm fallback
          startTime = new Date();
        }
      } else {
        // Nếu không phải chuỗi, sử dụng thời gian hiện tại
        console.error("checkInTime is not a string:", checkInTimeStr);
        startTime = new Date();
      }
      
      // Tính thời gian đã trôi qua tính bằng giây
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      console.log("Calculated seconds:", seconds);
      
      // Đảm bảo số giây là số dương
      const validSeconds = seconds > 0 ? seconds : 0;
      setInitialSeconds(validSeconds);
    } catch (error) {
      console.error("Error parsing session time:", error);
      // Trong trường hợp lỗi, sử dụng 0 làm giá trị mặc định
      setInitialSeconds(0);
    }
  }, [session.checkInTime]);
  
  const timer = useTimer({
    initialSeconds,
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
    const startTime = new Date(session.checkInTime);
    if (!isNaN(startTime.getTime())) {
      formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  } catch (error) {
    console.error("Error formatting start time:", error);
  }

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

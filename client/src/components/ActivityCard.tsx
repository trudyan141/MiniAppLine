import { Card } from "./ui/card";
import { Session } from "@shared/schema";

interface ActivityCardProps {
  session: Session;
  orderTotal?: number;
}

export default function ActivityCard({ session, orderTotal = 0 }: ActivityCardProps) {
  if (!session.checkOutTime || !session.totalTime || !session.totalCost) {
    return null;
  }

  const date = new Date(session.checkOutTime);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Calculate hours and minutes from totalTime (in seconds)
  const hours = Math.floor(session.totalTime / 3600);
  const minutes = Math.floor((session.totalTime % 3600) / 60);
  const timeFormat = `${hours}h ${minutes}m`;
  
  // Calculate cost from time
  const timeCost = session.totalCost - orderTotal;

  return (
    <Card className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">Time Cafe Visit</h3>
          <p className="text-sm text-gray-600">{formattedDate}</p>
        </div>
        <span className="text-[#06C755] font-medium">¥{session.totalCost}</span>
      </div>
      
      <div className="flex items-center text-xs text-gray-600">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-3 w-3 mr-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {timeFormat} (¥{timeCost})
          {orderTotal > 0 && ` + Orders (¥${orderTotal})`}
        </span>
      </div>
    </Card>
  );
}

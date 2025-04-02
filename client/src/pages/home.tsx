import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import ActivityCard from "@/components/ActivityCard";
import { Session } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { activeSession } = useSession();
  const [, navigate] = useLocation();

  // Fetch user's session history
  const { data: sessionHistory } = useQuery<Session[]>({
    queryKey: ['/api/sessions/history'],
    enabled: !!user,
  });

  // Fetch active coupon information
  const { data: coupons } = useQuery({
    queryKey: ['/api/coupons'],
    enabled: !!user,
  });

  const firstName = user?.fullName?.split(' ')[0] || '';

  return (
    <div className="min-h-screen">
      <div className="bg-[#06C755] px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Time Cafe</h1>
            <p className="text-white/80 text-sm">Welcome back, {firstName}</p>
          </div>
          <Link href="/profile">
            <div className="relative">
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {coupons && coupons.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFC107] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {coupons.length}
                </span>
              )}
            </div>
          </Link>
        </div>
        
        <Card className="bg-white p-4 rounded-xl shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-[#06C755]/10 flex items-center justify-center text-[#06C755]">
              {activeSession ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-gray-600 text-sm">Current Status</p>
              <h2 className="text-lg font-bold text-gray-900">
                {activeSession && activeSession.status === "active" ? (
                  <Link href="/active-session">
                    <span className="text-[#06C755]">In Session</span>
                  </Link>
                ) : "Not Checked In"}
              </h2>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="p-5 -mt-3 bg-white rounded-t-3xl mb-20">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card 
            className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (activeSession && activeSession.status === "active") {
                navigate("/active-session");
              } else {
                navigate("/check-in");
              }
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#06C755] mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="font-medium text-center">
              {activeSession && activeSession.status === "active" ? "Current Session" : "Check In"}
            </p>
            <p className="text-xs text-gray-600 text-center">
              {activeSession && activeSession.status === "active" ? "View your time" : "Start your session"}
            </p>
          </Card>
          
          <Card 
            className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => navigate("/menu")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#06C755] mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="font-medium text-center">Order Food</p>
            <p className="text-xs text-gray-600 text-center">Browse our menu</p>
          </Card>
        </div>
        
        <h2 className="font-bold text-lg mb-3">Your Activity</h2>
        
        <div className="space-y-4">
          {sessionHistory && sessionHistory.length > 0 ? (
            sessionHistory
              .filter(session => session.status === "completed")
              .slice(0, 3)
              .map(session => (
                <ActivityCard 
                  key={session.id} 
                  session={session} 
                />
              ))
          ) : (
            <Card className="border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600">No activity yet. Check in to start your first session!</p>
            </Card>
          )}
        </div>
        
        {coupons && coupons.length > 0 && (
          <div className="mt-6 bg-[#4285F4]/10 p-4 rounded-lg flex items-start">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#4285F4] mr-3 mt-0.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <div>
              <h3 className="font-medium text-[#4285F4]">Birthday Special!</h3>
              <p className="text-sm text-gray-600">Visit us on your birthday and get 2 hours free! Offer valid within 7 days of your birthday.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

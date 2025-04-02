import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";

interface MainLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export default function MainLayout({ children, showNavigation = true }: MainLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { activeSession } = useSession();

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative pb-16">
      {children}

      {showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-20 max-w-md mx-auto">
          <div className="flex justify-around">
            <Link href="/">
              <div className={`flex flex-col items-center px-3 py-1 ${location === "/" ? "text-[#06C755]" : "text-gray-500"}`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs mt-1">Home</span>
              </div>
            </Link>
            
            {activeSession ? (
              <Link href="/active-session">
                <div className={`flex flex-col items-center px-3 py-1 ${location === "/active-session" ? "text-[#06C755]" : "text-gray-500"}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs mt-1">Session</span>
                </div>
              </Link>
            ) : (
              <Link href="/check-in">
                <div className={`flex flex-col items-center px-3 py-1 ${location === "/check-in" ? "text-[#06C755]" : "text-gray-500"}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs mt-1">Check In</span>
                </div>
              </Link>
            )}
            
            <Link href="/menu">
              <div className={`flex flex-col items-center px-3 py-1 ${location === "/menu" ? "text-[#06C755]" : "text-gray-500"}`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs mt-1">Menu</span>
              </div>
            </Link>
            
            <Link href="/profile">
              <div className={`flex flex-col items-center px-3 py-1 ${location === "/profile" ? "text-[#06C755]" : "text-gray-500"}`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs mt-1">Profile</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

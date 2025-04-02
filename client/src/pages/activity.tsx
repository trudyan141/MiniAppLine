import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import ActivityCard from "@/components/ActivityCard";
import { Session } from "@shared/schema";

export default function ActivityPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch user's session history
  const { data: sessionHistory, isLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions/history'],
    enabled: !!user,
  });

  // Function to group sessions by month
  const groupSessionsByMonth = (sessions: Session[]) => {
    if (!sessions) return {};
    
    const completedSessions = sessions.filter(session => 
      session.status === "completed" && session.checkOutTime
    );
    
    return completedSessions.reduce((groups: Record<string, Session[]>, session) => {
      const date = new Date(session.checkOutTime!);
      const month = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[month]) {
        groups[month] = [];
      }
      
      groups[month].push(session);
      return groups;
    }, {});
  };

  const sessionsByMonth = groupSessionsByMonth(sessionHistory || []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#06C755] px-5 pt-10 pb-5">
        <div className="flex items-center mb-4">
          <button 
            className="text-white"
            onClick={() => navigate("/")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold mx-auto text-white">Activity History</h1>
        </div>
      </div>
      
      <div className="p-5 mb-20">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your activity...</p>
          </div>
        ) : (
          <>
            {Object.keys(sessionsByMonth).length === 0 ? (
              <Card className="rounded-lg shadow-sm text-center p-8">
                <CardContent className="p-0">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mx-auto text-gray-400 mb-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-medium text-lg mb-2">No activity yet</h3>
                  <p className="text-gray-600 mb-4">Check in to start your first session!</p>
                  
                  <LineButton
                    variant="primary"
                    onClick={() => navigate("/check-in")}
                  >
                    Check In Now
                  </LineButton>
                </CardContent>
              </Card>
            ) : (
              <>
                {Object.entries(sessionsByMonth).map(([month, sessions]) => (
                  <div key={month} className="mb-6">
                    <h2 className="font-bold text-lg mb-3">{month}</h2>
                    <div className="space-y-4">
                      {sessions.map(session => (
                        <ActivityCard 
                          key={session.id} 
                          session={session} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

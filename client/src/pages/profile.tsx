import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch active coupons
  const { data: coupons } = useQuery({
    queryKey: ['/api/coupons'],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/onboarding");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#06C755] px-5 pt-10 pb-16">
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
          <h1 className="text-xl font-bold mx-auto text-white">Profile</h1>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold">{user.fullName}</h2>
          <p className="text-white/80">{user.email}</p>
        </div>
      </div>
      
      <div className="p-5 -mt-10">
        <Card className="rounded-xl shadow-md mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Account Information</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{user.phoneNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium">{formatDate(user.registeredAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {coupons && coupons.length > 0 && (
          <Card className="rounded-xl shadow-md mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Your Coupons</h3>
              
              <div className="space-y-3">
                {coupons.map((coupon: any) => (
                  <div 
                    key={coupon.id} 
                    className="border border-[#06C755]/30 rounded-lg p-3 bg-[#06C755]/5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-[#06C755]">
                          {coupon.type === 'birthday' ? 'Birthday Special' : 'Special Offer'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {coupon.type === 'birthday' 
                            ? `${coupon.value} hours free time` 
                            : `¥${coupon.value} discount`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-600">
                        Expires: {formatDate(coupon.expiryDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="rounded-xl shadow-md mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Payment Method</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 text-[#4285F4]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <p className="font-medium">Credit Card</p>
                  <p className="text-sm text-gray-600">Ending with ****</p>
                </div>
              </div>
              <LineButton
                variant="outline"
                className="text-sm"
                onClick={() => navigate("/payment-registration")}
              >
                Update
              </LineButton>
            </div>
          </CardContent>
        </Card>
        
        <LineButton
          variant="outline"
          fullWidth
          className="py-3 text-gray-600 border-gray-300"
          onClick={handleLogout}
        >
          Log Out
        </LineButton>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { loginWithLINE } from "@/lib/line";

export default function OnboardingPage({ liff }: { liff: any }) {
  const [, navigate] = useLocation();

  const handleLoginWithLINE = async () => {
    await loginWithLINE(liff);
    // After LINE login, navigate to register
    navigate("/register");
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-64 bg-[#06C755] flex items-center justify-center">
        <img 
          src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
          alt="Time Cafe Interior" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/10"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white">Time Cafe</h1>
          <p className="text-white mt-2">Pay only for the time you spend</p>
        </div>
      </div>
      
      <Card className="p-5 bg-white rounded-t-3xl -mt-6 shadow-lg border-none">
        <CardContent className="p-0">
          <h2 className="text-xl font-bold mb-4">Welcome to Time Cafe</h2>
          <p className="text-gray-600 mb-6">
            Register to enjoy our space and pay only for the time you spend. Order food and drinks directly from the app.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#06C755] mr-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium">Pay-per-minute</h3>
                <p className="text-sm text-gray-600">Only pay for the time you spend</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#06C755] mr-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <div>
                <h3 className="font-medium">Self Check-in/out</h3>
                <p className="text-sm text-gray-600">Easy QR code scanning</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#06C755] mr-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h3 className="font-medium">Self-ordering</h3>
                <p className="text-sm text-gray-600">Order food without leaving your seat</p>
              </div>
            </div>
          </div>
          
          <Link href="/register">
            <LineButton
              variant="primary"
              fullWidth
              className="py-3 mb-3"
            >
              Register Now
            </LineButton>
          </Link>
          
          <Link href="/check-in">
            <LineButton
              variant="secondary"
              fullWidth
              className="py-3"
            >
              Scan QR to Check-in
            </LineButton>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

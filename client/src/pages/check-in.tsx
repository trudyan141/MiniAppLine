import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import QRScanner from "@/components/QRScanner";
import { LineButton } from "@/components/ui/line-button";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isLINELoggedIn } from "@/lib/line";
import { AlertCircle, Check } from "lucide-react";

export default function CheckInPage({ liff }: { liff: any }) {
  const [, navigate] = useLocation();
  const { checkIn } = useSession();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLineConnected, setIsLineConnected] = useState(false);

  // Check LINE connection status when component mounts
  useEffect(() => {
    if (liff) {
      setIsLineConnected(isLINELoggedIn(liff));
    }
  }, [liff]);

  const handleScan = async (data: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Verify LINE connection first if it's required
      if (!isLineConnected) {
        toast({
          title: "LINE connection required",
          description: "Please make sure you're logged in with your LINE account before checking in.",
          variant: "destructive",
        });
        return;
      }
      
      // In a real-world application, we would validate the QR code data
      // For demo, accept any QR code that contains CAFE-CHECKIN or our demo codes
      if (data && (data.startsWith("CAFE-CHECKIN") || data.includes("CHECKIN"))) {
        console.log("Valid QR code scanned:", data);
        await checkIn();
        
        toast({
          title: "Checked in successfully",
          description: "Your session has started. Enjoy your time at Time Cafe!",
        });
        
        navigate("/active-session");
      } else {
        console.log("Invalid check-in QR code:", data);
        throw new Error("Invalid QR code. Please scan a valid check-in QR code.");
      }
    } catch (error) {
      console.error("Failed to check in:", error);
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Failed to start your session",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-5 py-4 border-b border-gray-200">
        <button 
          className="text-gray-900"
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
        <h1 className="text-xl font-bold mx-auto">Check In</h1>
      </div>
      
      <div className="p-5 h-[calc(100vh-72px)] flex flex-col">
        {!isLineConnected && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">LINE Account Required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              You need to be logged in with your LINE account to check in. 
              Please return to login and connect your LINE account first.
            </AlertDescription>
          </Alert>
        )}
        
        {isLineConnected && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">LINE Account Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              Your LINE account is connected. You can proceed to scan the QR code.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-center mb-6">
          <p className="text-gray-600">Scan the QR code at the entrance to start your session</p>
          <p className="text-xs text-gray-500 mt-1">Allow camera access to scan QR codes</p>
        </div>
        
        {/* QR Code Scanner Component */}
        <QRScanner 
          onScan={handleScan}
          scanning={scanning}
          onStartScan={() => setScanning(true)}
          onStopScan={() => setScanning(false)}
        />
        
        <Card className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Today's Rate</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex justify-between">
              <span>First hour</span>
              <span className="font-medium text-gray-900">¥500</span>
            </li>
            <li className="flex justify-between">
              <span>Additional time</span>
              <span className="font-medium text-gray-900">¥8/minute</span>
            </li>
            <li className="flex justify-between">
              <span>Max daily charge</span>
              <span className="font-medium text-gray-900">¥2,000</span>
            </li>
          </ul>
        </Card>
        
        <div className="mt-4 text-center">
          <LineButton
            variant="primary"
            onClick={() => navigate("/")}
            className="mt-4"
          >
            Cancel
          </LineButton>
        </div>
      </div>
    </div>
  );
}

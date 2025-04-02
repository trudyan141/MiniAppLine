import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import QRScanner from "@/components/QRScanner";
import { LineButton } from "@/components/ui/line-button";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutScanPage() {
  const [, navigate] = useLocation();
  const { checkOut } = useSession();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (data: string) => {
    console.log("🚀 ~ handleScan ~ data:", data)
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // In a real implementation, we would validate the QR code data
      // For the demo, accept any QR code 
      if (data) {
        await checkOut();
        
        toast({
          title: "Checked out successfully",
          description: "Your session has ended. Proceeding to payment...",
          variant: "success",
        });
        
        navigate("/checkout");
      } else {
        // If the QR code doesn't match our expected format
        console.log("Invalid QR code format:", data);
        toast({
          title: "Invalid QR code",
          description: "Please scan the checkout QR code located at the exit",
          variant: "error",
        });
        setScanning(false);
      }
    } catch (error) {
      console.error("Failed to check out:", error);
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Failed to end your session",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-5 py-4 border-b border-gray-200">
        <button 
          className="text-gray-900"
          onClick={() => navigate("/active-session")}
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
        <h1 className="text-xl font-bold mx-auto">Checkout</h1>
      </div>
      
      <div className="p-5 h-[calc(100vh-72px)] flex flex-col">
        <div className="text-center mb-6">
          <p className="text-gray-600">Scan the QR code at the exit to check out</p>
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
          <h3 className="font-medium mb-2">Session Information</h3>
          <p className="text-sm text-gray-600 mb-2">
            Your time will continue to be tracked until you scan the checkout QR code.
          </p>
          <p className="text-sm text-gray-600">
            After checkout, you'll see your complete bill including time charges and any food or drinks ordered.
          </p>
        </Card>
        
        <div className="mt-4 text-center">
          <LineButton
            variant="primary"
            onClick={() => navigate("/active-session")}
            className="mt-4"
          >
            Back to Session
          </LineButton>
          
          {/* Manual checkout option for testing/debugging */}
          <button 
            className="mt-3 text-sm text-gray-500 underline"
            onClick={async () => {
              try {
                await checkOut();
                navigate("/checkout");
              } catch (error) {
                toast({
                  title: "Check-out failed",
                  description: error instanceof Error ? error.message : "Failed to end your session",
                  variant: "error",
                });
              }
            }}
          >
            Manual Checkout (For Testing)
          </button>
        </div>
      </div>
    </div>
  );
}
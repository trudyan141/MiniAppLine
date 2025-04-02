import { useQRScanner } from "@/lib/qrScanner";
import { Button } from "./ui/button";
import { useEffect } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
  scanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
}

export default function QRScanner({ 
  onScan, 
  scanning, 
  onStartScan, 
  onStopScan 
}: QRScannerProps) {
  const { 
    scanning: isScanning,
    scannedData,
    hasCamera,
    flashlightOn,
    startScanner,
    stopScanner,
    toggleFlashlight
  } = useQRScanner();

  useEffect(() => {
    let isMounted = true;
    
    if (scanning && hasCamera && isMounted) {
      startScanner();
    } else if (isMounted) {
      stopScanner();
    }
    
    return () => {
      isMounted = false;
      stopScanner(); // Ensure scanner is stopped when component unmounts
    };
  }, [scanning, hasCamera, startScanner, stopScanner]);

  useEffect(() => {
    if (scannedData) {
      onScan(scannedData);
    }
  }, [scannedData, onScan]);

  if (!hasCamera) {
    return (
      <div className="p-5 text-center">
        <div className="mb-4 text-red-500">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-medium text-lg mt-2">Camera Not Available</h3>
        </div>
        <p className="text-gray-600 mb-4">
          We were unable to access your camera. Please ensure that you have granted camera permissions to this app.
        </p>
        <Button
          className="bg-[#06C755] text-white"
          onClick={onStartScan}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center mb-6">
      <div className="relative w-64 h-64 mb-6 flex items-center justify-center rounded-lg overflow-hidden bg-gray-100">
        {/* For demo, show a simpler QR code scanning UI to avoid HTML5QRCode issues */}
        <div className="w-full h-full relative">
          {!isScanning ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <button 
                onClick={onStartScan}
                className="bg-[#06C755] text-white px-4 py-2 rounded-lg shadow-md font-medium"
              >
                Tap to Scan QR Code
              </button>
            </div>
          ) : (
            <>
              {/* Simulated camera view for demo */}
              <div className="absolute inset-0 bg-black/80"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-white/70 rounded-lg"></div>
              </div>
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#06C755] animate-pulse"></div>
              
              {/* For real implementation, this div would host the camera */}
              <div id="qr-reader" className="absolute inset-0 opacity-0 pointer-events-none"></div>
            </>
          )}
        </div>
        
        {/* Scanning indicator */}
        {isScanning && (
          <div className="absolute z-10 bottom-0 left-0 right-0 bg-[#06C755] text-white px-4 py-2 text-center">
            Scanning...
          </div>
        )}
      </div>
      
      <Button
        onClick={toggleFlashlight}
        className="bg-[#06C755] text-white px-6 py-2 rounded-lg font-medium"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {flashlightOn ? 'Turn off flashlight' : 'Turn on flashlight'}
      </Button>
    </div>
  );
}

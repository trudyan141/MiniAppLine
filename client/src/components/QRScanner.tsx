import React from 'react';
import { Button } from './ui/button';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useQRScanner } from '../lib/qrScanner';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onScanError?: (error: string) => void;
  onStartScan: () => void;
  onStopScan: () => void;
  scanning: boolean;
}

export function QRScanner({ onScan, onScanError, onStartScan, onStopScan, scanning }: QRScannerProps) {
  const { scannedData, error, flashlightOn, toggleFlashlight } = useQRScanner();

  // Khi có kết quả quét, gọi callback để xử lý
  React.useEffect(() => {
    if (scannedData) {
      onScan(scannedData);
    }
  }, [scannedData, onScan]);

  // Xử lý lỗi nếu có
  React.useEffect(() => {
    if (error && onScanError) {
      onScanError(error);
    }
  }, [error, onScanError]);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      onScan(detectedCodes[0].rawValue);
    }
  };

  const handleError = (error: unknown) => {
    if (onScanError) {
      onScanError(typeof error === 'string' ? error : 'Scanner error occurred');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center mb-6">
      <div className="relative w-64 h-64 mb-6 rounded-lg overflow-hidden">
        {!scanning ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
            <button 
              onClick={onStartScan}
              className="bg-[#06C755] text-white px-4 py-2 rounded-lg shadow-md font-medium"
            >
              Tap to Scan QR Code
            </button>
          </div>
        ) : (
          <div className="w-full h-full">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' }
              }}
              scanDelay={500}
              constraints={{
                facingMode: 'environment'
              }}
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-white/70 rounded-lg"></div>
              </div>
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#06C755] animate-pulse"></div>
            </div>
          </div>
        )}
        
        {/* Scanning indicator */}
        {scanning && (
          <div className="absolute z-10 bottom-0 left-0 right-0 bg-[#06C755] text-white px-4 py-2 text-center">
            Scanning...
          </div>
        )}
      </div>
      
      {scanning && (
        <div className="flex flex-col gap-3">
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

          <Button 
            onClick={onStopScan} 
            className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium"
          >
            Cancel Scanning
          </Button>
        </div>
      )}
    </div>
  );
}

// Cung cấp export mặc định cho tương thích ngược với code hiện tại
export default QRScanner;

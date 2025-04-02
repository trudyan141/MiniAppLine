// This file provides a wrapper around the QR code scanner library
import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function useQRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrBoxSize = 250; // Size of scanning box in pixels

  // Stop the scanner
  const stopScanner = useCallback(() => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }

      const qrElement = document.getElementById('qr-reader');
      if (qrElement) {
        // Hide the QR reader element
        qrElement.style.display = 'none';
        // Clear any child elements that might have been added by Html5Qrcode
        qrElement.innerHTML = '';
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    setScanning(false);
  }, []);

  // Function to use demo scanner when real scanner fails
  const useDemoScanner = useCallback(() => {
    if (scanning) {
      const timer = setTimeout(() => {
        const checkInCode = `CAFE-CHECKIN-${Date.now()}`;
        setScannedData(checkInCode);
        setScanning(false);
        console.log('Demo QR Code generated:', checkInCode);
        
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [scanning]);

  // Start the scanner
  const startScanner = useCallback(() => {
    setScanning(true);
    setScannedData(null);
    setError(null);

    try {
      const qrElement = document.getElementById('qr-reader');
      if (!qrElement) {
        console.error('Error: HTML Element with id=qr-reader not found');
        setError('Scanner element not found');
        setScanning(false);
        useDemoScanner();
        return;
      }

      // Ensure qrElement has dimensions
      if (qrElement.clientWidth === 0 || qrElement.clientHeight === 0) {
        qrElement.style.width = '100%';
        qrElement.style.height = '100%';
        qrElement.style.minWidth = '320px';
        qrElement.style.minHeight = '320px';
      }

      // First clean up any existing scanner to avoid conflicts
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Error stopping existing scanner:", err));
          }
          scannerRef.current.clear();
        } catch (err) {
          console.error("Error clearing existing scanner:", err);
        }
        // Set to null to ensure garbage collection
        scannerRef.current = null;
      }

      // Give time for cleanup and DOM updates
      setTimeout(() => {
        try {
          // Clear any previous content
          qrElement.innerHTML = '';
          
          // Create a new scanner instance
          console.log('Creating new Html5Qrcode instance');
          scannerRef.current = new Html5Qrcode('qr-reader');
          
          // Simplified config to reduce errors
          const config = {
            fps: 5, // Lower FPS to reduce CPU usage
            qrbox: Math.min(qrElement.clientWidth, qrElement.clientHeight) * 0.8,
            aspectRatio: window.innerWidth > window.innerHeight ? 1.777 : 0.555,
            formatsToSupport: [0], // QR Code only (format 0)
          };
          
          console.log('Starting scanner with config:', config);
          scannerRef.current
            .start(
              { facingMode: { exact: "environment" } },
              config,
              (decodedText) => {
                console.log('QR Code scanned:', decodedText);
                setScannedData(decodedText);
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }
                // Stop scanning after successful scan
                stopScanner();
              },
              (errorMessage) => {
                // Log but don't display all scan errors to user (these are normal during scanning)
                if (!errorMessage.includes('QR code parse error')) {
                  console.log('QR Scan error:', errorMessage);
                }
              }
            )
            .catch((err) => {
              console.error('Error starting scanner:', err);
              
              // If "exact" environment camera failed, try without "exact"
              if (err.toString().includes('exact')) {
                console.log('Retrying with any available camera');
                if (scannerRef.current) {
                  scannerRef.current
                    .start(
                      { facingMode: "environment" },
                      config,
                      (decodedText) => {
                        console.log('QR Code scanned:', decodedText);
                        setScannedData(decodedText);
                        if (navigator.vibrate) {
                          navigator.vibrate(200);
                        }
                        stopScanner();
                      },
                      (errorMessage) => {
                        if (!errorMessage.includes('QR code parse error')) {
                          console.log('QR Scan error:', errorMessage);
                        }
                      }
                    )
                    .catch((secondErr) => {
                      console.error('Error starting scanner with fallback:', secondErr);
                      setError('Failed to start camera');
                      setScanning(false);
                      useDemoScanner();
                    });
                }
              } else {
                setError('Failed to start camera');
                setScanning(false);
                useDemoScanner();
              }
            });
        } catch (err) {
          console.error('Error initializing scanner:', err);
          setError('Failed to initialize scanner');
          setScanning(false);
          useDemoScanner();
        }
      }, 100);
    } catch (err) {
      console.error('Error in start scanner:', err);
      setError('Failed to initialize scanner');
      setScanning(false);
      useDemoScanner();
    }
  }, [qrBoxSize, stopScanner, useDemoScanner]);

  // Toggle the flashlight/torch
  const toggleFlashlight = useCallback(() => {
    setFlashlightOn(prev => !prev);
    console.log("Flashlight toggled:", !flashlightOn);
    // In a real implementation, you'd interact with the MediaTrack capabilities
  }, [flashlightOn]);

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoInput);
        if (!hasVideoInput) {
          setError("No camera found on this device");
        }
      } catch (err) {
        console.error('Error checking camera:', err);
        setHasCamera(false);
        setError("Failed to access camera permissions");
      }
    };

    checkCamera();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      try {
        if (scannerRef.current) {
          // First check if it's scanning and try to stop it
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Error stopping scanner on cleanup:", err));
          }
          
          // Clear the scanner instance to prevent DOM manipulation after unmount
          scannerRef.current = null;
          
          // Clean up the QR reader element content
          const qrElement = document.getElementById('qr-reader');
          if (qrElement) {
            // Clear children safely
            while (qrElement.firstChild) {
              qrElement.removeChild(qrElement.firstChild);
            }
          }
        }
      } catch (err) {
        console.error("Error during QR scanner cleanup:", err);
      }
    };
  }, []);

  // Fallback for demo/development where camera might not be available
  useEffect(() => {
    if (scanning && !hasCamera) {
      useDemoScanner();
    }
  }, [scanning, hasCamera, useDemoScanner]);

  return {
    scanning,
    scannedData,
    error,
    hasCamera,
    flashlightOn,
    startScanner,
    stopScanner,
    toggleFlashlight,
  };
}

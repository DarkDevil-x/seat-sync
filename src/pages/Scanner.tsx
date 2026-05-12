import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const cleanedUpRef = useRef(false);
  const hasScannedRef = useRef(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);

  const cleanupScanner = async () => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        
        try {
          await scanner.stop();
        } catch (e) {
          // Scanner may already be stopped - ignore
        }
        
        try {
          await scanner.clear();
        } catch (e) {
          // Element may already be cleared - ignore
        }
      }
    } catch (err) {
      console.warn("Scanner cleanup skipped:", err);
    }
  };

  const handleSuccessfulScan = async (url: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    
    // Clean up scanner before redirect
    await cleanupScanner();
    
    // Small delay to allow camera stream to stop cleanly
    setTimeout(() => {
      window.location.href = url;
    }, 100);
  };

  useEffect(() => {
    const scannerId = "qr-scanner";
    
    const startScanner = async () => {
      if (cleanedUpRef.current) return;
      
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        };
        
        await html5QrCode.start(
          config.videoConstraints,
          config,
          (decodedText) => {
            console.log("Scanned QR:", decodedText);
            
            // Dynamic URL validation - works with any domain
            try {
              const url = new URL(decodedText);
              if (url.pathname.startsWith("/validate/")) {
                handleSuccessfulScan(decodedText);
              } else {
                console.warn("Invalid SeatSync QR - not a validation URL");
              }
            } catch (err) {
              console.error("Invalid QR code format");
            }
          },
          (errorMessage) => {
            // Ignore scan errors during normal operation
            console.debug("Scan error:", errorMessage);
          }
        );
        
        setLoading(false);
        
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
        setLoading(false);
        setScanning(false);
        console.error("Scanner error:", err);
      }
    };

    startScanner();

    return () => {
      cleanupScanner();
    };
  }, []);

  const handleManualEntry = () => {
    const bookingId = prompt("Enter booking ID:");
    if (bookingId && /^[a-f0-9]{24}$/i.test(bookingId)) {
      navigate(`/validate/${bookingId}`);
    } else {
      setError("Invalid booking ID format");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#18181B",
          border: "1px solid #E85D4E40",
          borderRadius: "20px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#E4E4E7",
            marginBottom: "8px",
          }}
        >
          Scan Ticket
        </h1>
        <p style={{ color: "#A1A1AA", fontSize: "14px", marginBottom: "20px" }}>
          Point camera at attendee's QR code
        </p>

        <div
          id="qr-scanner"
          ref={videoContainerRef}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1",
            maxWidth: "280px",
            margin: "0 auto 20px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#27272A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading && (
            <div style={{ color: "#A1A1AA", fontSize: "14px" }}>
              Initializing camera...
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "#EF4444", fontSize: "14px", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleManualEntry}
          style={{
            backgroundColor: "transparent",
            color: "#E85D4E",
            border: "1px solid #E85D4E",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Enter Booking ID Manually
        </button>

        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "#71717A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          SEATSYNC
        </p>
      </div>
    </div>
  );
}

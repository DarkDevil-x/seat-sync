import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

export default function Scanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const scannerId = "qr-scanner";
    
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            console.log("Scanned QR:", decodedText);
            
            // Check if it's a SeatSync validation URL
            const isValidSeatSyncQR = 
              decodedText.startsWith("https://seat-sync-five.vercel.app/validate/") ||
              decodedText.startsWith("http://localhost:8080/validate/");
            
            if (isValidSeatSyncQR) {
              // Stop scanning and redirect
              html5QrCode.stop().then(() => {
                setScanning(false);
                window.location.href = decodedText;
              });
            } else {
              setError("Invalid SeatSync QR - scan a ticket QR code");
              setTimeout(() => setError(""), 2000);
            }
          },
          (errorMessage) => {
            // Ignore scan errors during normal operation
            // Only log if it's a critical error
            console.debug("Scan error:", errorMessage);
          }
        );
        
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
        setScanning(false);
        console.error("Scanner error:", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error stopping scanner:", err);
        });
      }
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
          }}
        />

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

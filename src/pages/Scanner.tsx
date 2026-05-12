import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    const scannerId = "qr-scanner";
    
    const onScanSuccess = (decodedText: string) => {
      console.log("Scanned QR:", decodedText);
      setScanSuccess(true);
      
      const isValidSeatSyncQR = 
        decodedText.startsWith("https://seat-sync-five.vercel.app/validate/") ||
        decodedText.startsWith("http://localhost:8080/validate/");
      
      if (isValidSeatSyncQR) {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        window.location.href = decodedText;
      } else {
        setError("Invalid SeatSync QR - scan a ticket QR code");
        setTimeout(() => setError(""), 2000);
        setScanSuccess(false);
      }
    };

    const onScanError = (errorMessage: string) => {
      // Ignore scan errors during normal operation
      console.debug("Scan attempt:", errorMessage);
    };

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current = scanner;
      scanner.render(onScanSuccess, onScanError);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err.message || "Camera access denied");
      setScanning(false);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
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
            height: "280px",
            maxWidth: "280px",
            margin: "0 auto 20px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#27272A",
            border: scanSuccess ? "2px solid #22C55E" : "2px solid #E85D4E40",
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

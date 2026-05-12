import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;
    let scanInterval: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
        setScanning(false);
      }
    };

    startCamera();

    const scanCode = () => {
      if (!videoRef.current || !canvasRef.current || !scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple QR code detection - look for SeatSync validation URLs
        const data = new Uint8ClampedArray(imageData.data);
        const qrPattern = /validate\/[a-f0-9]+/i;
        
        // Check center region for QR-like patterns
        const centerX = Math.floor(canvas.width / 4);
        const centerY = Math.floor(canvas.height / 4);
        const centerW = Math.floor(canvas.width / 2);
        const centerH = Math.floor(canvas.height / 2);
        
        // For now, we'll use a simpler approach - check if there's a URL-like pattern
        // In production, you'd use a proper QR library like jsQR
        // This is a placeholder that detects high-contrast patterns
        
        // Try to detect validation URL pattern in the page
        // Since we can't easily decode QR without a library, we'll prompt for manual input
        // or use a detection heuristic
      }
    };

    // Simple scan - check every second
    scanInterval = setInterval(scanCode, 1000);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      clearInterval(scanInterval);
      cancelAnimationFrame(animationId);
    };
  }, [scanning]);

  const handleManualEntry = () => {
    const bookingId = prompt("Enter booking ID:");
    if (bookingId && /^[a-f0-9]+$/i.test(bookingId)) {
      navigate(`/validate/${bookingId}`);
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
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          {/* Scan overlay */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              height: "70%",
              border: "2px solid #E85D4E",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                height: "20px",
                borderTop: "2px solid #22C55E",
                borderLeft: "2px solid #22C55E",
                borderRight: "2px solid #22C55E",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                left: "-2px",
                right: "-2px",
                height: "20px",
                borderBottom: "2px solid #22C55E",
                borderLeft: "2px solid #22C55E",
                borderRight: "2px solid #22C55E",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            />
          </div>
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

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface BookingData {
  _id: string;
  event: {
    title: string;
    date: string;
    location: string;
    price: number;
    is_free: boolean;
  };
  seats: { row: string; number: number }[];
  total_price: number;
  checked_in: boolean;
  checked_in_at: string;
  created_at: string;
}

type ValidationState = "loading" | "valid" | "already_used" | "invalid" | "error";

export default function ValidateTicket() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [state, setState] = useState<ValidationState>("loading");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setState("invalid");
      return;
    }

    const validate = async () => {
      try {
        // First, try to GET the booking status
        const getRes = await fetch(`/api/validate/${bookingId}`);
        const getData = await getRes.json();

        if (!getData.valid && getData.reason === "NOT_FOUND") {
          setState("invalid");
          return;
        }

        if (getData.valid && getData.reason === "ALREADY_USED") {
          setBooking(getData.booking);
          setState("already_used");
          return;
        }

        // Not yet checked in - POST to mark as used
        const postRes = await fetch(`/api/validate/${bookingId}`, {
          method: "POST",
        });
        const postData = await postRes.json();

        if (!postData.valid && postData.reason === "NOT_FOUND") {
          setState("invalid");
          return;
        }

        if (!postData.valid && postData.reason === "ALREADY_USED") {
          setBooking(postData.booking);
          setState("already_used");
          return;
        }

        if (postData.valid && postData.reason === "SUCCESS") {
          setBooking(postData.booking);
          setState("valid");
          return;
        }

        setState("error");
        setError("Unexpected response");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    validate();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} | ${d.getMonth() + 1} | ${d.getFullYear()}`;
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString();
  };

  if (state === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#09090B",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid #27272A",
            borderTopColor: "#E85D4E",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: "#A1A1AA", fontSize: "14px" }}>Validating ticket...</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#09090B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "#18181B",
            border: "1px solid #F59E0B40",
            borderRadius: "20px",
            padding: "32px 24px",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#F59E0B20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#F59E0B",
              marginBottom: "8px",
            }}
          >
            Invalid Ticket
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: "14px" }}>
            This ticket could not be found.
          </p>
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

  if (state === "already_used") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#09090B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "#18181B",
            border: "1px solid #EF444440",
            borderRadius: "20px",
            padding: "32px 24px",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#EF444420",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#EF4444",
              marginBottom: "8px",
            }}
          >
            Already Used
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: "14px", marginBottom: "20px" }}>
            This ticket has already been scanned.
          </p>
          {booking?.event && (
            <div
              style={{
                backgroundColor: "#27272A",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "16px",
              }}
            >
              <p style={{ color: "#E4E4E7", fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>
                {booking.event.title}
              </p>
              <p style={{ color: "#A1A1AA", fontSize: "13px" }}>
                Seats: {booking.seats.map((s) => `${s.row}${s.number}`).join(", ")}
              </p>
            </div>
          )}
          {booking?.checked_in_at && (
            <p style={{ color: "#EF4444", fontSize: "13px" }}>
              First scanned at: {formatTime(booking.checked_in_at)}
            </p>
          )}
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

  if (state === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#09090B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "#18181B",
            border: "1px solid #EF444440",
            borderRadius: "20px",
            padding: "32px 24px",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#EF4444",
              marginBottom: "8px",
            }}
          >
            Error
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: "14px", marginBottom: "20px" }}>
            {error || "Something went wrong"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#E85D4E",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Try Again
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

  // Valid state
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#18181B",
          border: "1px solid #22C55E40",
          borderRadius: "20px",
          padding: "32px 24px",
          maxWidth: "360px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#22C55E20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#22C55E",
            marginBottom: "8px",
          }}
        >
          Valid Ticket
        </h1>
        <p style={{ color: "#A1A1AA", fontSize: "14px", marginBottom: "20px" }}>
          Entry granted. Check-in successful.
        </p>
        {booking?.event && (
          <div
            style={{
              backgroundColor: "#27272A",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "left",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "#E4E4E7",
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "12px",
              }}
            >
              {booking.event.title}
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717A", fontSize: "12px" }}>DATE</span>
                <span style={{ color: "#E4E4E7", fontSize: "13px" }}>
                  {formatDate(booking.event.date)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717A", fontSize: "12px" }}>VENUE</span>
                <span style={{ color: "#E4E4E7", fontSize: "13px" }}>
                  {booking.event.location}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717A", fontSize: "12px" }}>SEATS</span>
                <span style={{ color: "#E4E4E7", fontSize: "13px" }}>
                  {booking.seats.map((s) => `${s.row}${s.number}`).join(", ")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717A", fontSize: "12px" }}>AMOUNT</span>
                <span style={{ color: "#E4E4E7", fontSize: "13px" }}>
                  {booking.event.is_free ? "Free" : `$${booking.total_price.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        )}
        {booking?.checked_in_at && (
          <p style={{ color: "#22C55E", fontSize: "12px" }}>
            Checked in at: {formatTime(booking.checked_in_at)}
          </p>
        )}
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

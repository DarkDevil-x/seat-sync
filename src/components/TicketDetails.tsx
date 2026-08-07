
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Ticket } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type TicketProps = {
  booking: {
    id: string;
    event_id: string;
    total_price: number;
    is_free: boolean;
    status: string;
    created_at: string;
    event: {
      title: string;
      date: string;
      location: string;
    };
    seats: {
      row: string;
      number: number;
    }[];
  };
};

const TicketDetails = ({ booking }: TicketProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  const formatSeats = (seats: { row: string; number: number }[]) => {
    if (!seats.length) return "No seat information";
    
    return seats
      .sort((a, b) => {
        if (a.row === b.row) {
          return a.number - b.number;
        }
        return a.row.localeCompare(b.row);
      })
      .map((seat) => `${seat.row}${seat.number}`)
      .join(", ");
  };

  return (
    <Card key={booking.id}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Ticket size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">
                {booking.event?.title || "Unknown Event"}
              </h3>
            </div>
            {booking.event?.date && (
              <p className="text-sm text-muted-foreground">
                {formatDate(booking.event.date)}
              </p>
            )}
            {booking.event?.location && (
              <p className="text-sm text-muted-foreground">
                {booking.event.location}
              </p>
            )}
          </div>
          <div className="text-right">
            <Badge
              className={
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>

            {/* Price — hide for free events */}
            {booking.is_free ? (
              <p className="text-sm font-semibold mt-2 text-green-600 dark:text-green-400">🎫 Free</p>
            ) : booking.total_price > 0 ? (
              <p className="font-semibold mt-2">{formatPrice(booking.total_price)}</p>
            ) : null}
            
            <p className="text-xs text-muted-foreground mt-1">
              Booked on {formatDate(booking.created_at)}
            </p>
          </div>
        </div>
        <Separator className="my-3" />
        <div>
          <p className="text-sm">
            <span className="font-medium">Seats:</span>{" "}
            {formatSeats(booking.seats)}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${booking.event_id}`)}
          >
            View Event
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/generate-ticket/${booking.id}`)}
          >
            Generate Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(TicketDetails);

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Production } from "@/types/database";

interface PlantingCalendarProps {
  productions: Production[];
}

export function PlantingCalendar({ productions }: PlantingCalendarProps) {
  const today = new Date();
  const next30Days = addDays(today, 30);

  type CalendarEvent = {
    id: string;
    date: string;
    commodity: string;
    type: "harvest" | "planting";
    status: string;
  };

  const harvestEvents: CalendarEvent[] = productions
    .filter((p) => {
      if (p.estimated_harvest_date) {
        const harvestDate = new Date(p.estimated_harvest_date);
        return isWithinInterval(harvestDate, {
          start: startOfDay(today),
          end: endOfDay(next30Days),
        });
      }
      return false;
    })
    .map((p) => ({
      id: p.id,
      date: p.estimated_harvest_date!,
      commodity: p.commodity,
      type: "harvest" as const,
      status: p.status,
    }));

  const plantingEvents: CalendarEvent[] = productions
    .filter((p) => {
      const plantingDate = new Date(p.planting_date);
      return isWithinInterval(plantingDate, {
        start: startOfDay(today),
        end: endOfDay(next30Days),
      });
    })
    .map((p) => ({
      id: p.id,
      date: p.planting_date,
      commodity: p.commodity,
      type: "planting" as const,
      status: p.status,
    }));

  const upcomingEvents = [...harvestEvents, ...plantingEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Planting Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming events in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    event.type === "harvest" ? "bg-primary" : "bg-secondary-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.commodity}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {event.type === "harvest" ? "Expected Harvest" : "Planting Date"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {format(new Date(event.date), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.date), "yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

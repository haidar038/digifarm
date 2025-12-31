import { Card, CardContent } from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeatherIcon } from "@/components/weather/WeatherIcon";

export function WeatherCard() {
    const { data: weather, isLoading, error, refetch } = useWeather();

    if (isLoading) {
        return (
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-center h-24">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !weather) {
        return (
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Cuaca Hari Ini</p>
                            <p className="text-xs sm:text-sm text-destructive">Gagal memuat data cuaca</p>
                            <button onClick={() => refetch()} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Coba lagi
                            </button>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                            <WeatherIcon iconType="unknown" size="md" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formatUpdateTime = (date: Date) => {
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up", "bg-white dark:bg-gray-950")}>
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Cuaca Hari Ini</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{weather.current.temperature}°C</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 sm:mt-2">
                            <span className="text-xs sm:text-sm font-medium text-secondary-foreground truncate">{weather.current.condition}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
                            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>Update: {formatUpdateTime(weather.lastUpdated)}</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <WeatherIcon weatherCode={weather.current.weatherCode} size="md" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

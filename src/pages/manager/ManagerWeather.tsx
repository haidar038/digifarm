import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useWeather, getFarmingRecommendations } from "@/hooks/useWeather";
import { WeatherIcon, RecommendationIcon } from "@/components/weather/WeatherIcon";
import { Eye, Wind, Thermometer, CalendarDays, Leaf, RefreshCw, Droplets, Cloud } from "lucide-react";

const ManagerWeather = () => {
    const { data: weather, isLoading, error, refetch } = useWeather();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatHour = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <ManagerLayout title="Prakiraan Cuaca" description="Cuaca di Kota Ternate">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </ManagerLayout>
        );
    }

    if (error || !weather) {
        return (
            <ManagerLayout title="Prakiraan Cuaca" description="Cuaca di Kota Ternate">
                <Card className="p-8 text-center">
                    <p className="text-destructive mb-4">Gagal memuat data cuaca</p>
                    <button onClick={() => refetch()} className="text-primary hover:underline flex items-center gap-2 justify-center mx-auto">
                        <RefreshCw className="w-4 h-4" />
                        Coba lagi
                    </button>
                </Card>
            </ManagerLayout>
        );
    }

    const recommendations = getFarmingRecommendations(weather);
    const todayForecast = weather.daily[0];

    return (
        <ManagerLayout title="Prakiraan Cuaca" description="Pantau cuaca untuk memberikan rekomendasi tepat">
            <div className="space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
                {/* Current Weather - Main Card */}
                <Card className="overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col gap-4 sm:gap-6">
                            {/* Top - Main Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-sky-100 text-xs sm:text-sm mb-1">{formatDate(weather.current.time)}</p>
                                    <p className="text-sky-100 text-xs sm:text-sm mb-3 sm:mb-4">Update: {formatTime(weather.current.time)}</p>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <WeatherIcon weatherCode={weather.current.weatherCode} size="2xl" className="drop-shadow-lg" withColor={false} />
                                        <div>
                                            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold">{weather.current.temperature}°C</p>
                                            <p className="text-base sm:text-lg lg:text-xl text-sky-100 mt-1">{weather.current.condition}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom - Weather Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] sm:text-xs text-sky-200">Jarak Pandang</p>
                                        <p className="text-xs sm:text-sm md:text-base font-semibold">{weather.current.visibility} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] sm:text-xs text-sky-200">Angin</p>
                                        <p className="text-xs sm:text-sm md:text-base font-semibold">{weather.current.windSpeed} km/h</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] sm:text-xs text-sky-200">Kelembaban</p>
                                        <p className="text-xs sm:text-sm md:text-base font-semibold">{weather.current.humidity}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] sm:text-xs text-sky-200">Hujan</p>
                                        <p className="text-xs sm:text-sm md:text-base font-semibold">{todayForecast.precipitationProbability}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Hourly Forecast */}
                <Card className="overflow-hidden w-full">
                    <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Prakiraan Hari Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        {/* Mobile/Tablet: Scrollable flex container with shadcn ScrollArea */}
                        <ScrollArea className="lg:hidden w-full whitespace-nowrap">
                            <div className="flex w-max gap-2 pb-3">
                                {weather.hourly.slice(0, 12).map((hour, index) => (
                                    <div key={index} className="flex flex-col items-center shrink-0 w-[60px] sm:w-[72px] bg-muted/50 rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all hover:bg-muted">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{formatHour(hour.time)}</span>
                                        <WeatherIcon weatherCode={hour.weatherCode} size="md" className="my-1 sm:my-1.5" />
                                        <span className="text-xs sm:text-sm font-semibold">{hour.temperature}°</span>
                                        <div className="flex items-center gap-0.5 mt-0.5">
                                            <Droplets className="w-2.5 h-2.5 text-blue-400" />
                                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">{hour.precipitationProbability}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        {/* Desktop: Full-width grid */}
                        <div className="hidden lg:grid grid-cols-12 gap-2">
                            {weather.hourly.slice(0, 12).map((hour, index) => (
                                <div key={index} className="flex flex-col items-center bg-muted/50 rounded-xl p-3 transition-all hover:bg-muted">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatHour(hour.time)}</span>
                                    <WeatherIcon weatherCode={hour.weatherCode} size="md" className="my-1.5" />
                                    <span className="text-sm font-semibold">{hour.temperature}°</span>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                        <Droplets className="w-2.5 h-2.5 text-blue-400" />
                                        <span className="text-[10px] text-muted-foreground">{hour.precipitationProbability}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 3-Day Forecast */}
                <Card>
                    <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Prakiraan 3 Hari Kedepan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                            {weather.daily.slice(1, 4).map((day, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:bg-muted">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <WeatherIcon weatherCode={day.weatherCode} size="lg" className="shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{formatShortDate(day.date)}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{day.condition}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="font-semibold text-base sm:text-lg">{day.temperatureMax}°</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{day.temperatureMin}°</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Farming Recommendations */}
                <Card>
                    <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Rekomendasi Pertanian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <div className="space-y-2 sm:space-y-3">
                            {recommendations.map((rec, index) => (
                                <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl">
                                    <RecommendationIcon type={rec.type} size="md" className="shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-sm leading-relaxed">{rec.text}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ManagerLayout>
    );
};

export default ManagerWeather;

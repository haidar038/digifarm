import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WeatherContent } from "@/components/weather/WeatherContent";
import { useWeather } from "@/hooks/useWeather";

const Weather = () => {
    const { data: weather, isLoading, error, refetch } = useWeather();

    return (
        <DashboardLayout title="Prakiraan Cuaca" description="Cuaca di Kota Ternate">
            <WeatherContent weather={weather} isLoading={isLoading} error={error} refetch={refetch} />
        </DashboardLayout>
    );
};

export default Weather;

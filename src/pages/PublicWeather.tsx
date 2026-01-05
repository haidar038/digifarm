import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WeatherContent } from "@/components/weather/WeatherContent";
import { useWeather } from "@/hooks/useWeather";

const PublicWeather = () => {
    const { data: weather, isLoading, error, refetch } = useWeather();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">Prakiraan Cuaca</h1>
                        <p className="text-muted-foreground mt-2">Informasi cuaca terkini dan rekomendasi pertanian untuk wilayah Ternate dan sekitarnya.</p>
                    </div>

                    <WeatherContent weather={weather} isLoading={isLoading} error={error} refetch={refetch} />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PublicWeather;

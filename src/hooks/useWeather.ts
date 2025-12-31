import { useQuery } from "@tanstack/react-query";

// Koordinat Kota Ternate
const TERNATE_LATITUDE = 0.89618;
const TERNATE_LONGITUDE = 127.31016;

// WMO Weather interpretation codes - conditions only (icons handled by WeatherIcon component)
const weatherCodeConditions: Record<number, string> = {
    0: "Cerah",
    1: "Cerah Berawan",
    2: "Berawan Sebagian",
    3: "Berawan",
    45: "Berkabut",
    48: "Berkabut Tebal",
    51: "Gerimis Ringan",
    53: "Gerimis",
    55: "Gerimis Lebat",
    56: "Gerimis Beku Ringan",
    57: "Gerimis Beku",
    61: "Hujan Ringan",
    63: "Hujan",
    65: "Hujan Lebat",
    66: "Hujan Beku Ringan",
    67: "Hujan Beku",
    71: "Salju Ringan",
    73: "Salju",
    75: "Salju Lebat",
    77: "Butiran Salju",
    80: "Hujan Lebat Sesaat",
    81: "Hujan Lebat",
    82: "Hujan Sangat Lebat",
    85: "Hujan Salju Ringan",
    86: "Hujan Salju Lebat",
    95: "Badai Petir",
    96: "Badai Petir Hujan Es Ringan",
    99: "Badai Petir Hujan Es",
};

export interface CurrentWeather {
    temperature: number;
    humidity: number;
    weatherCode: number;
    condition: string;
    windSpeed: number;
    visibility: number;
    time: string;
}

export interface HourlyForecast {
    time: string;
    temperature: number;
    weatherCode: number;
    condition: string;
    precipitationProbability: number;
}

export interface DailyForecast {
    date: string;
    weatherCode: number;
    condition: string;
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
}

export interface WeatherData {
    current: CurrentWeather;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    lastUpdated: Date;
}

interface OpenMeteoResponse {
    current: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        visibility: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        precipitation_probability: number[];
    };
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
    };
}

export function getWeatherCondition(code: number): string {
    return weatherCodeConditions[code] || "Tidak Diketahui";
}

async function fetchWeatherData(): Promise<WeatherData> {
    const params = new URLSearchParams({
        latitude: TERNATE_LATITUDE.toString(),
        longitude: TERNATE_LONGITUDE.toString(),
        current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility",
        hourly: "temperature_2m,weather_code,precipitation_probability",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "Asia/Jayapura",
        forecast_days: "4",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
        throw new Error("Failed to fetch weather data");
    }

    const data: OpenMeteoResponse = await response.json();

    // Parse current weather
    const current: CurrentWeather = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        condition: getWeatherCondition(data.current.weather_code),
        windSpeed: Math.round(data.current.wind_speed_10m),
        visibility: Math.round(data.current.visibility / 1000), // Convert to km
        time: data.current.time,
    };

    // Parse hourly forecast (next 24 hours from current hour)
    const currentHour = new Date().getHours();
    const hourly: HourlyForecast[] = data.hourly.time.slice(currentHour, currentHour + 24).map((time, index) => {
        const actualIndex = currentHour + index;
        return {
            time,
            temperature: Math.round(data.hourly.temperature_2m[actualIndex]),
            weatherCode: data.hourly.weather_code[actualIndex],
            condition: getWeatherCondition(data.hourly.weather_code[actualIndex]),
            precipitationProbability: data.hourly.precipitation_probability[actualIndex] || 0,
        };
    });

    // Parse daily forecast (today + 3 days)
    const daily: DailyForecast[] = data.daily.time.slice(0, 4).map((date, index) => {
        return {
            date,
            weatherCode: data.daily.weather_code[index],
            condition: getWeatherCondition(data.daily.weather_code[index]),
            temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
            temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
            precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
        };
    });

    return {
        current,
        hourly,
        daily,
        lastUpdated: new Date(),
    };
}

export function useWeather() {
    return useQuery({
        queryKey: ["weather", "ternate"],
        queryFn: fetchWeatherData,
        staleTime: 1000 * 60 * 15, // 15 minutes
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
        retry: 3,
    });
}

// Recommendation types for icon mapping
export type RecommendationType = "rain-high" | "no-spray" | "rain-medium" | "sunny" | "hot" | "cold" | "humid" | "dry" | "windy" | "ideal" | "normal";

export interface Recommendation {
    type: RecommendationType;
    text: string;
}

// Helper function to generate farming recommendations based on weather
export function getFarmingRecommendations(weather: WeatherData): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { current, daily } = weather;
    const todayForecast = daily[0];

    // Rain probability recommendations
    if (todayForecast.precipitationProbability > 70) {
        recommendations.push({
            type: "rain-high",
            text: "Kemungkinan hujan tinggi. Hindari penyiraman dan pastikan drainase lahan baik.",
        });
        recommendations.push({
            type: "no-spray",
            text: "Tunda penyemprotan pestisida/pupuk - akan tercuci oleh hujan.",
        });
    } else if (todayForecast.precipitationProbability > 40) {
        recommendations.push({
            type: "rain-medium",
            text: "Kemungkinan hujan sedang. Siapkan perlindungan untuk tanaman sensitif.",
        });
    } else if (todayForecast.precipitationProbability < 20) {
        recommendations.push({
            type: "sunny",
            text: "Cuaca cerah. Pastikan penyiraman cukup, terutama siang hari.",
        });
    }

    // Temperature recommendations
    if (current.temperature > 32) {
        recommendations.push({
            type: "hot",
            text: "Suhu tinggi. Tingkatkan frekuensi penyiraman dan berikan naungan untuk tanaman muda.",
        });
    } else if (current.temperature < 20) {
        recommendations.push({
            type: "cold",
            text: "Suhu rendah. Monitor tanaman tropis yang sensitif terhadap dingin.",
        });
    }

    // Humidity recommendations
    if (current.humidity > 85) {
        recommendations.push({
            type: "humid",
            text: "Kelembaban tinggi. Waspada terhadap penyakit jamur, pastikan sirkulasi udara baik.",
        });
    } else if (current.humidity < 50) {
        recommendations.push({
            type: "dry",
            text: "Kelembaban rendah. Pertimbangkan mulsa untuk menjaga kelembaban tanah.",
        });
    }

    // Wind recommendations
    if (current.windSpeed > 30) {
        recommendations.push({
            type: "windy",
            text: "Angin kencang. Pasang penopang untuk tanaman tinggi, hindari penyemprotan.",
        });
    }

    // General activity recommendations
    if (todayForecast.precipitationProbability < 30 && current.temperature >= 20 && current.temperature <= 30) {
        recommendations.push({
            type: "ideal",
            text: "Kondisi ideal untuk pemupukan dan penyemprotan pagi hari (06:00-09:00).",
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            type: "normal",
            text: "Kondisi cuaca normal. Lanjutkan aktivitas pertanian seperti biasa.",
        });
    }

    return recommendations;
}

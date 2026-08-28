import { NextResponse } from 'next/server';

// In-memory cache (5 min TTL)
let cachedWeather: {
  data: {
    weather: string;
    weatherFactor: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    icon: string;
    description: string;
    city: string;
  };
  fetchedAt: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const API_KEY = 'c6941dd3e3ff4942bdd164638261906';
const LAT = 19.076; // Mumbai
const LON = 72.8777;

// Map OpenWeatherMap condition codes to human-readable labels + delay factors
function parseWeatherCondition(code: number, description: string): { label: string; factor: number } {
  // Thunderstorm
  if (code >= 200 && code < 300) return { label: 'Thunderstorm', factor: 1.35 };
  // Drizzle
  if (code >= 300 && code < 400) return { label: 'Drizzle', factor: 1.15 };
  // Rain
  if (code >= 500 && code < 600) return { label: 'Rain', factor: 1.25 };
  // Snow
  if (code >= 600 && code < 700) return { label: 'Snow', factor: 1.40 };
  // Fog / Mist / Haze
  if (code >= 700 && code < 800) {
    if (description.toLowerCase().includes('fog')) return { label: 'Dense Fog', factor: 1.30 };
    if (description.toLowerCase().includes('haze')) return { label: 'Haze', factor: 1.20 };
    return { label: 'Mist', factor: 1.15 };
  }
  // Clear
  if (code === 800) return { label: 'Clear Sky', factor: 1.0 };
  // Clouds
  if (code > 800 && code < 900) {
    if (code <= 802) return { label: 'Partly Cloudy', factor: 1.05 };
    return { label: 'Overcast', factor: 1.10 };
  }
  return { label: description || 'Unknown', factor: 1.05 };
}

export async function GET() {
  // Return cached data if still valid
  if (cachedWeather && Date.now() - cachedWeather.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cachedWeather.data);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // Next.js cache for 5 min

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenWeatherMap API error:', res.status, errorText);
      // Fallback to mock data if API fails
      return NextResponse.json({
        weather: 'Partly Cloudy',
        weatherFactor: 1.05,
        temperature: 32,
        humidity: 70,
        windSpeed: 12,
        icon: '02d',
        description: 'scattered clouds',
        city: 'Mumbai',
      });
    }

    const data = await res.json();
    const condition = data.weather?.[0];
    const parsed = parseWeatherCondition(condition?.id ?? 800, condition?.description ?? '');

    const result = {
      weather: parsed.label,
      weatherFactor: parsed.factor,
      temperature: Math.round(data.main?.temp ?? 32),
      humidity: data.main?.humidity ?? 70,
      windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6), // m/s to km/h
      icon: condition?.icon ?? '02d',
      description: condition?.description ?? '',
      city: data.name ?? 'Mumbai',
    };

    // Update cache
    cachedWeather = { data: result, fetchedAt: Date.now() };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Weather fetch error:', error);
    // Fallback
    return NextResponse.json({
      weather: 'Partly Cloudy',
      weatherFactor: 1.05,
      temperature: 32,
      humidity: 70,
      windSpeed: 12,
      icon: '02d',
      description: 'scattered clouds',
      city: 'Mumbai',
    });
  }
}

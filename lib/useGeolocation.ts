import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export type LocationStatus = 'idle' | 'checking' | 'in_range' | 'out_of_range' | 'denied' | 'unsupported' | 'error';

interface GeolocationSettings {
    is_geolocation_enabled: boolean;
    target_latitude: number;
    target_longitude: number;
    max_distance_meters: number;
}

// Helper Function: Haversine formula to calculate distance between two points on Earth
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

export const useGeolocation = () => {
    const [settings, setSettings] = useState<GeolocationSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<LocationStatus>('idle');
    const [distance, setDistance] = useState<number | null>(null);

    // Fetch geolocation settings from the database
    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
                console.error("Error fetching geolocation settings:", error);
            }
            
            setSettings(data);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const checkLocation = useCallback(() => {
        if (!settings) {
            // Can't check if settings are not loaded
            return;
        }

        setStatus('checking');
        setDistance(null);

        if (!navigator.geolocation) {
            setStatus('unsupported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const dist = haversineDistance(latitude, longitude, settings.target_latitude, settings.target_longitude);
                
                setDistance(dist);

                if (dist <= settings.max_distance_meters) {
                    setStatus('in_range');
                } else {
                    setStatus('out_of_range');
                }
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setStatus('denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                    case error.TIMEOUT:
                    default:
                        setStatus('error');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, [settings]);

    return {
        isLoading,
        isEnabled: settings?.is_geolocation_enabled ?? false,
        isInRange: status === 'in_range',
        status,
        distance,
        checkLocation,
        settings
    };
};

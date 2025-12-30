import React, { useEffect } from 'react';
import { MapPinIcon } from './icons/MapPinIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { useGeolocation, LocationStatus } from '../lib/useGeolocation';

const LockScreen: React.FC<{ status: LocationStatus; distance: number | null; onRetry: () => void, maxDistance: number }> = ({ status, distance, onRetry, maxDistance }) => {
    let title = "Akses Dibatasi";
    let message = "Terjadi kesalahan saat memeriksa lokasi Anda.";
    let iconColor = "text-red-500";

    switch (status) {
        case 'out_of_range':
            title = "Anda Berada di Luar Jangkauan";
            message = `Aplikasi ini hanya dapat diakses dalam radius ${maxDistance} meter dari lokasi yang ditentukan. Jarak Anda saat ini sekitar ${distance?.toFixed(0)} meter.`;
            iconColor = "text-yellow-500";
            break;
        case 'denied':
            title = "Izin Lokasi Ditolak";
            message = "Anda telah menolak izin akses lokasi. Aplikasi ini memerlukan lokasi Anda untuk memverifikasi Anda berada di area yang benar. Mohon aktifkan izin lokasi di pengaturan browser Anda.";
            iconColor = "text-red-500";
            break;
        case 'unsupported':
            title = "Browser Tidak Mendukung";
            message = "Browser yang Anda gunakan tidak mendukung fitur Geolocation. Silakan gunakan browser modern seperti Chrome atau Firefox.";
            iconColor = "text-gray-500";
            break;
        case 'error':
             title = "Gagal Mendapatkan Lokasi";
             message = "Tidak dapat mengambil lokasi Anda saat ini. Pastikan GPS atau layanan lokasi Anda aktif dan coba lagi.";
             iconColor = "text-red-500";
             break;
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 -my-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center animate-fade-in">
                <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 ${iconColor}`}>
                    <MapPinIcon className="w-10 h-10" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
                <p className="mt-2 text-gray-600">{message}</p>
                <button
                    onClick={onRetry}
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors"
                >
                    <ArrowPathIcon className="w-5 h-5"/>
                    Coba Lagi
                </button>
            </div>
        </div>
    );
};

const GeolocationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoading, isEnabled, isInRange, status, distance, checkLocation, settings } = useGeolocation();

    useEffect(() => {
        // This wrapper is a hard gate. Always check location when it's active.
        if (!isLoading && isEnabled) {
            checkLocation();
        }
    }, [isLoading, isEnabled, checkLocation]);


    if (isLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen p-4 -my-8">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold">Memuat pengaturan...</p>
                </div>
            </div>
        );
    }
    
    // If feature is disabled from admin, render the app immediately.
    if (!isEnabled) {
        return <>{children}</>;
    }
    
    // --- Feature is enabled, proceed with location checks ---
    
    // If user is in range, show the content
    if (isInRange) {
        return <>{children}</>;
    }

    // If still checking, show spinner
    if (status === 'checking' || status === 'idle') {
        return (
             <div className="flex items-center justify-center min-h-screen p-4 -my-8">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold">Memeriksa lokasi Anda...</p>
                    <p className="text-slate-300">Harap tunggu sebentar.</p>
                </div>
            </div>
        );
    }
    
    // Otherwise, user is out of range, denied, etc. Show the lock screen.
    return <LockScreen status={status} distance={distance} onRetry={checkLocation} maxDistance={settings?.max_distance_meters ?? 0} />;
};

export default GeolocationWrapper;
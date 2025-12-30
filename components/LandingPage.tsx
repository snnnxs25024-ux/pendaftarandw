import React, { useState, useEffect } from 'react';
import Card from './Card';
import { CheckIcon } from './icons/CheckIcon';
import { useGeolocation } from '../lib/useGeolocation';
import { MapPinIcon } from './icons/MapPinIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface LandingPageProps {
  onContinue: () => void;
}

const jobDescriptions = [
  {
    title: 'SORTER',
    description: 'Bertanggung jawab untuk menyortir paket Shopee secara teliti berdasarkan kode destinasi dan label pengiriman untuk memastikan alokasi yang akurat dan efisien ke rute pengiriman yang benar.',
  },
  {
    title: 'BAGGER',
    description: 'Melakukan pemindaian (scan) setiap paket yang telah disortir untuk memperbarui statusnya dalam sistem pelacakan sebelum dimasukkan ke dalam karung (bagging) untuk tahap pengiriman selanjutnya.',
  },
  {
    title: 'INBOUND',
    description: 'Menangani proses pembongkaran kiriman yang masuk dari truk pengiriman (CDD/Wingbox), memastikan semua barang diterima dan dicatat dengan benar di gudang.',
  },
  {
    title: 'OUTBOUND',
    description: 'Mengelola proses pemuatan paket yang sudah disortir dan dikantongi dari gudang ke dalam truk outbound untuk didistribusikan ke hub atau kurir pengiriman.',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onContinue }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { isLoading, isEnabled, status, checkLocation } = useGeolocation();

  useEffect(() => {
    // Trigger location check on mount if the feature is enabled in settings.
    // This check is non-blocking for the UI.
    if (!isLoading && isEnabled) {
      checkLocation();
    }
  }, [isLoading, isEnabled, checkLocation]);

  const isOutOfRange = isEnabled && status !== 'checking' && status !== 'in_range' && status !== 'idle';

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Geolocation Notification Banner */}
      {isEnabled && status !== 'idle' && (
        <div className={`
          p-4 rounded-lg shadow-md mb-6 flex items-start gap-4 transition-all duration-300 
          ${isOutOfRange ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}
        `}>
          <div className="shrink-0 pt-1">
            {isOutOfRange ? (
              <MapPinIcon className="w-6 h-6 text-red-600"/>
            ) : status === 'in_range' ? (
              <CheckIcon className="w-6 h-6 text-green-600"/>
            ) : (
              <ArrowPathIcon className="w-6 h-6 text-slate-500 animate-spin"/>
            )}
          </div>
          <div>
            <h4 className={`
              font-bold text-lg
              ${isOutOfRange ? 'text-red-800' : 'text-green-800'}
            `}>
              { isOutOfRange ? 'Anda Berada di Luar Jangkauan' : status === 'in_range' ? 'Lokasi Anda Sesuai' : 'Memeriksa Lokasi...' }
            </h4>
            <p className={`
              text-sm mt-1
              ${isOutOfRange ? 'text-red-700' : 'text-green-700'}
            `}>
               { isOutOfRange ? 'Pendaftaran hanya bisa dilakukan di area yang telah ditentukan. Anda tidak dapat melanjutkan proses pendaftaran.' : status === 'in_range' ? 'Anda dapat melanjutkan ke proses pendaftaran.' : 'Harap tunggu, sistem sedang memverifikasi lokasi Anda...' }
            </p>
          </div>
        </div>
      )}


      <section className="text-center p-6 bg-white rounded-lg shadow flex flex-col items-center">
        <img 
            src="https://i.imgur.com/fF8ZWc7.png" 
            alt="Logo Nexus" 
            className="h-24 w-auto mb-4 mix-blend-multiply" 
        />
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">DAILY WORKER SHOPEE XPRESS</h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Selamat datang calon Daily Worker! Berikut adalah informasi penting terkait pekerjaan, benefit, dan persyaratan yang perlu Anda ketahui sebelum melanjutkan proses pendaftaran.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md">Deskripsi Pekerjaan (Jobdesk)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobDescriptions.map((job) => (
            <Card key={job.title} title={job.title}>
              <p className="text-gray-600">{job.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Informasi Kerja & Benefit">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start"><span className="font-semibold w-32 shrink-0">Jam Kerja:</span><span>9 Jam (termasuk 1 jam istirahat)</span></li>
            <li className="flex items-start"><span className="font-semibold w-32 shrink-0">Benefit:</span><span className="font-bold text-green-600">Rp 202.000 / hari</span></li>
            <li className="flex flex-col"><span className="font-semibold mb-1">Sistem Penggajian:</span>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Periode 1-15 dibayarkan pada tanggal 25.</li>
                <li>Periode 16-31 dibayarkan pada tanggal 10 bulan berikutnya.</li>
                <li>Perhitungan gaji sesuai total hari masuk kerja.</li>
              </ul>
            </li>
          </ul>
        </Card>
        <Card title="Persyaratan & Seragam">
          <ul className="space-y-3 text-gray-700">
            <li className="flex flex-col"><span className="font-semibold mb-1">Persyaratan Wajib:</span>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>KTP Asli (Wajib dibawa saat bekerja)</li>
                    <li>Rekening Bank atas nama pribadi</li>
                    <li>Usia maksimal 35 tahun</li>
                </ul>
            </li>
            <li className="flex flex-col"><span className="font-semibold mb-1">Seragam Kerja:</span>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Celana pendek (tidak berkantung)</li>
                    <li>Kaos (lengan pendek, tidak berkerah)</li>
                    <li>Sepatu bertali (safety atau sneakers)</li>
                </ul>
            </li>
          </ul>
        </Card>
      </section>

      <section className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col items-center">
          <label htmlFor="confirmation" className="flex items-center space-x-3 cursor-pointer mb-4">
            <input
              id="confirmation"
              type="checkbox"
              checked={isConfirmed}
              onChange={() => setIsConfirmed(!isConfirmed)}
              className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-lg font-medium text-slate-800">Saya telah membaca dan memahami semua informasi di atas.</span>
          </label>
          <button
            onClick={onContinue}
            disabled={!isConfirmed || isOutOfRange || status === 'checking'}
            className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 flex items-center justify-center space-x-2"
          >
            <CheckIcon className="w-6 h-6" />
            <span>Lanjut ke Pendaftaran</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
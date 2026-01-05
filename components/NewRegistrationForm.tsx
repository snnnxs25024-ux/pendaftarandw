import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Modal from './Modal';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { supabase } from '../lib/supabaseClient';
import { CameraIcon } from './icons/CameraIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { useNotification } from '../contexts/NotificationContext';

type CameraMode = 'selfie' | 'ktp' | null;

interface NewRegistrationFormProps {
  onBack: () => void;
}

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-2 md:gap-4 py-4 border-b border-gray-200">{children}</div>
);

const Label: React.FC<{ htmlFor: string; children: React.ReactNode, required?: boolean }> = ({ htmlFor, children, required }) => (
    <label htmlFor={htmlFor} className="font-semibold text-slate-700 pt-2">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`md:col-span-2 w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${props.className}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="md:col-span-2 w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500">
        {props.children}
    </select>
);

const initialFormData = {
    fullName: '',
    nationalId: '',
    religion: '',
    phoneNumber: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    contractType: 'Daily Worker Vendor - NEXUS',
    agency: 'NEXUS',
    department: 'SOC Operator',
    stationId: 'Sunter DC',
    infoSource: '',
    ktpPhoto: null as string | null, // as data URL
    selfiePhoto: null as string | null, // as data URL
};

// Helper to convert data URL to File
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// SVG overlay component for the Selfie camera
const FaceFrame: React.FC<{ status: 'good' | 'bad' | 'neutral' }> = ({ status }) => {
    const strokeColor = status === 'good' ? '#22c55e' : status === 'bad' ? '#ef4444' : 'white';
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <mask id="faceMask">
                    <rect width="100" height="100" fill="white" />
                    <ellipse cx="50" cy="45" rx="25" ry="32" fill="black" />
                </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0, 0, 0, 0.6)" mask="url(#faceMask)" />
            <ellipse
                cx="50"
                cy="45"
                rx="25"
                ry="32"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1"
                strokeDasharray="4 2"
                className="transition-all duration-300"
            />
        </svg>
    );
};

// SVG overlay component for the KTP camera
const KtpFrame: React.FC<{ status: 'good' | 'bad' | 'neutral' }> = ({ status }) => {
    const strokeColor = status === 'good' ? '#4ade80' : status === 'bad' ? '#f87171' : 'white';
    // Aspect ratio of KTP is approx 85.6 : 54, which simplifies to ~1.585
    const frameWidth = 90;
    const frameHeight = frameWidth / 1.585;
    const cornerRadius = 4;

    return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
                <mask id="ktpMask">
                    <rect width="100" height="100" fill="white" />
                    <rect 
                        x={(100 - frameWidth) / 2} 
                        y={(100 - frameHeight) / 2} 
                        width={frameWidth} 
                        height={frameHeight} 
                        rx={cornerRadius} 
                        fill="black" 
                    />
                </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0,0,0,0.7)" mask="url(#ktpMask)" />
            <rect 
                x={(100 - frameWidth) / 2} 
                y={(100 - frameHeight) / 2} 
                width={frameWidth} 
                height={frameHeight} 
                rx={cornerRadius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="0.5"
                strokeDasharray="3 3"
                className="transition-all duration-300"
            />
        </svg>
    );
};


const NewRegistrationForm: React.FC<NewRegistrationFormProps> = ({ onBack }) => {
    const [formData, setFormData] = useState(initialFormData);
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [activeCamera, setActiveCamera] = useState<CameraMode>(null);
    const [cameraFeedback, setCameraFeedback] = useState('');
    const [isCaptureReady, setIsCaptureReady] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analysisFrameId = useRef<number | null>(null);
    const lastAnalysisTimeRef = useRef(0);
    const ANALYSIS_INTERVAL_MS = 250; 

    const handleStream = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
             if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                startAnalysisLoop();
            }
        }
      }
    };
  
    const stopStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };
    
    const analyzeSelfieFrame = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const area = { x: canvas.width * 0.25, y: canvas.height * 0.13, width: canvas.width * 0.5, height: canvas.height * 0.64 };
        const imageData = context.getImageData(area.x, area.y, area.width, area.height).data;
        let totalBrightness = 0, brightnessValues = [];
        for (let i = 0; i < imageData.length; i += 4) {
            const brightness = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
            totalBrightness += brightness;
            brightnessValues.push(brightness);
        }
        const avgBrightness = totalBrightness / (imageData.length / 4);
        const mean = avgBrightness;
        const stdDev = Math.sqrt(brightnessValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / brightnessValues.length);
        
        if (avgBrightness < 60) return { feedback: 'Terlalu Gelap', ready: false };
        if (stdDev < 15) return { feedback: 'Posisikan Wajah di Tengah', ready: false };
        return { feedback: 'Bagus! Silakan ambil foto.', ready: true };
    };

    const analyzeKtpFrame = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const frameWidth = 0.9, frameHeight = frameWidth / 1.585;
        const area = { x: canvas.width * (1-frameWidth)/2, y: canvas.height * (1-frameHeight)/2, width: canvas.width * frameWidth, height: canvas.height * frameHeight };
        const imageData = context.getImageData(area.x, area.y, area.width, area.height).data;
        let totalBrightness = 0, laplacianSum = 0, glarePixels = 0;
        const pixelCount = imageData.length / 4;

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += brightness;
            if (brightness > 245) glarePixels++;
            // Simple Laplacian for focus detection
            if (i > 4 && i < imageData.length - 4) {
                const prev = 0.299*imageData[i-4] + 0.587*imageData[i-3] + 0.114*imageData[i-2];
                const next = 0.299*imageData[i+4] + 0.587*imageData[i+5] + 0.114*imageData[i+6];
                laplacianSum += Math.abs(prev - 2 * brightness + next);
            }
        }
        const avgBrightness = totalBrightness / pixelCount;
        const focusScore = laplacianSum / pixelCount;
        const glarePercent = (glarePixels / pixelCount) * 100;

        if (avgBrightness < 70) return { feedback: 'Terlalu Gelap', ready: false };
        if (glarePercent > 3) return { feedback: 'Terdeteksi Silau, ubah sudut KTP', ready: false };
        if (focusScore < 3.0) return { feedback: 'Gambar buram, coba stabilkan posisi', ready: false };
        return { feedback: 'Bagus! Silakan ambil foto.', ready: true };
    };

    const startAnalysisLoop = () => {
        const analyzeFrame = (timestamp: number) => {
            if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended || !activeCamera) return;
            if (timestamp - lastAnalysisTimeRef.current < ANALYSIS_INTERVAL_MS) {
                analysisFrameId.current = requestAnimationFrame(analyzeFrame); return;
            }
            lastAnalysisTimeRef.current = timestamp;
            const video = videoRef.current, canvas = canvasRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (context) {
                const isMirrored = activeCamera === 'selfie';
                context.save();
                if (isMirrored) { context.translate(canvas.width, 0); context.scale(-1, 1); }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                context.restore();
                
                const result = activeCamera === 'selfie' ? analyzeSelfieFrame(context, canvas) : analyzeKtpFrame(context, canvas);
                setCameraFeedback(result.feedback);
                setIsCaptureReady(result.ready);
            }
            analysisFrameId.current = requestAnimationFrame(analyzeFrame);
        };
        analysisFrameId.current = requestAnimationFrame(analyzeFrame);
    };

    const stopAnalysisLoop = () => { if (analysisFrameId.current) cancelAnimationFrame(analysisFrameId.current); };

    const openCamera = async (mode: CameraMode) => {
        const isSelfie = mode === 'selfie';
        const constraints: MediaStreamConstraints = {
            video: {
                facingMode: isSelfie ? 'user' : 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                aspectRatio: { ideal: 16 / 9 }
            }
        };
        setCameraFeedback(isSelfie ? 'Posisikan wajah Anda...' : 'Posisikan KTP Anda...');
        setIsCaptureReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setActiveCamera(mode);
            setTimeout(() => handleStream(stream), 100);
        } catch (err) {
            console.error("Camera access failed:", err);
            showNotification("Gagal mengakses kamera. Pastikan Anda memberikan izin.", 'error');
        }
    };

    const closeCamera = () => {
        stopAnalysisLoop();
        stopStream();
        setActiveCamera(null);
        setIsCaptureReady(false);
    };
    
    const captureImage = () => {
        if (videoRef.current && canvasRef.current && activeCamera) {
            const video = videoRef.current, canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                const isMirrored = activeCamera === 'selfie';
                context.save();
                if (isMirrored) { context.translate(canvas.width, 0); context.scale(-1, 1); }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                context.restore();
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                if (activeCamera === 'selfie') setFormData(prev => ({ ...prev, selfiePhoto: dataUrl }));
                else setFormData(prev => ({ ...prev, ktpPhoto: dataUrl }));
            }
            closeCamera();
        }
    };
    
    const retakeSelfie = () => { setFormData(prev => ({ ...prev, selfiePhoto: null })); openCamera('selfie'); };
    const retakeKtp = () => { setFormData(prev => ({ ...prev, ktpPhoto: null })); openCamera('ktp'); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'nationalId' || name === 'phoneNumber' || name === 'bankAccountNumber') {
            setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.nationalId.length !== 16) { showNotification('NIK KTP wajib 16 digit.', 'error'); return; }
        if (!formData.ktpPhoto) { showNotification('Foto KTP wajib diambil.', 'error'); return; }
        if (!formData.selfiePhoto) { showNotification('Foto Selfie wajib diambil.', 'error'); return; }
        setIsSubmitting(true);
        try {
            const { data: existingData } = await supabase.from('registrants').select('id').eq('nik', formData.nationalId).single();
            if (existingData) throw new Error('NIK ini sudah terdaftar.');

            const timestamp = Date.now();
            const ktpFile = dataURLtoFile(formData.ktpPhoto, `ktp-${formData.nationalId}-${timestamp}.jpg`);
            const selfieFile = dataURLtoFile(formData.selfiePhoto, `selfie-${formData.nationalId}-${timestamp}.jpg`);

            const [ktpUploadResult, selfieUploadResult] = await Promise.all([
                supabase.storage.from('registrant-documents').upload(`public/ktp-${ktpFile.name}`, ktpFile),
                supabase.storage.from('registrant-documents').upload(`public/selfie-${selfieFile.name}`, selfieFile)
            ]);

            if (ktpUploadResult.error) throw new Error(`Gagal upload KTP: ${ktpUploadResult.error.message}`);
            if (selfieUploadResult.error) throw new Error(`Gagal upload Selfie: ${selfieUploadResult.error.message}`);
            
            const { data: { publicUrl: ktpPublicUrl } } = supabase.storage.from('registrant-documents').getPublicUrl(ktpUploadResult.data.path);
            const { data: { publicUrl: selfiePublicUrl } } = supabase.storage.from('registrant-documents').getPublicUrl(selfieUploadResult.data.path);

            const { error: insertError } = await supabase.from('registrants').insert([{
                full_name: formData.fullName, nik: formData.nationalId, religion: formData.religion, phone: formData.phoneNumber,
                bank_name: formData.bankName, bank_account_name: formData.bankAccountName, bank_account_number: formData.bankAccountNumber,
                contract_type: formData.contractType, agency: formData.agency, department: formData.department, station_id: formData.stationId,
                info_source: formData.infoSource, ktp_image_url: ktpPublicUrl, selfie_image_url: selfiePublicUrl,
            }]);
            if (insertError) throw insertError;
            setIsModalOpen(true);
        } catch (err: any) {
            showNotification(`Gagal menyimpan data: ${err.message || 'Terjadi kesalahan'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsAppRedirect = (targetPhoneNumber: string) => {
        const message = `Halo Pak Korlap,\nSaya sudah mendaftar sebagai Daily Worker baru melalui form online.\n\nBerikut data saya:\n- *Nama Lengkap*: ${formData.fullName}\n- *National ID (NIK)*: ${formData.nationalId}\n- *Info Dari*: ${formData.infoSource}\n\nDokumen KTP dan Selfie sudah di-upload melalui sistem.\nMohon untuk diproses lebih lanjut. Terima kasih.`.trim();
        window.open(`https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleCloseModal = () => { setIsModalOpen(false); setFormData(initialFormData); onBack(); };

  return (
    <>
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md animate-fade-in">
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Formulir Pendaftaran DW Baru</h2>
      <p className="text-gray-600 mb-8 text-center">Pastikan semua data diisi dengan benar dan sesuai dengan dokumen Anda.</p>
      
      <form onSubmit={handleSubmit}>
        <FormRow>
            <Label htmlFor="fullName" required>Nama Lengkap</Label>
            <Input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="nationalId" required>NIK KTP (wajib 16 digit)</Label>
            <Input id="nationalId" name="nationalId" type="text" value={formData.nationalId} onChange={handleChange} maxLength={16} minLength={16} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="religion" required>Agama</Label>
            <Select id="religion" name="religion" value={formData.religion} onChange={handleChange} required>
                <option value="" disabled>Pilih Agama</option>
                <option value="Buddha">Buddha</option>
                <option value="Catholic">Catholic</option>
                <option value="Christian">Christian</option>
                <option value="Confucianism">Confucianism</option>
                <option value="Islam">Islam</option>
                <option value="Hindu">Hindu</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="phoneNumber" required>Nomor WhatsApp</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="infoSource" required>Dapat Info Lowongan Dari?</Label>
            <Select id="infoSource" name="infoSource" value={formData.infoSource} onChange={handleChange} required>
                <option value="" disabled>Pilih Sumber Informasi</option>
                <option value="Facebook">Facebook</option><option value="Instagram">Instagram</option><option value="WhatsApp Status/Group">WhatsApp Status/Group</option>
                <option value="Teman/Kerabat">Teman/Kerabat</option><option value="Lainnya">Lainnya</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="bankName" required>Nama Bank</Label>
            <Select id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required>
                <option value="" disabled>Pilih Bank</option>
                <option value="ANZ Panin">ANZ Panin</option>
                <option value="ANZ Panin Bank">ANZ Panin Bank</option>
                <option value="Allo Bank">Allo Bank</option>
                <option value="BCA">BCA</option>
                <option value="BCA Digital">BCA Digital</option>
                <option value="BCA Syariah">BCA Syariah</option>
                <option value="BJB">BJB</option>
                <option value="BJB Syariah">BJB Syariah</option>
                <option value="BNI">BNI</option>
                <option value="BNP PARIBAS Indonesia">BNP PARIBAS Indonesia</option>
                <option value="BPD Aceh">BPD Aceh</option>
                <option value="BPD Aceh UUS">BPD Aceh UUS</option>
                <option value="BPD Bali">BPD Bali</option>
                <option value="BPD Bengkulu">BPD Bengkulu</option>
                <option value="BPD DIY">BPD DIY</option>
                <option value="BPD DIY Syariah">BPD DIY Syariah</option>
                <option value="BPD Jambi">BPD Jambi</option>
                <option value="BPD Jateng">BPD Jateng</option>
                <option value="BPD Jateng UUS">BPD Jateng UUS</option>
                <option value="BPD Jatim">BPD Jatim</option>
                <option value="BPD Kalbar">BPD Kalbar</option>
                <option value="BPD Kalsel">BPD Kalsel</option>
                <option value="BPD Kalsel UUS">BPD Kalsel UUS</option>
                <option value="BPD Kalteng">BPD Kalteng</option>
                <option value="BPD Kaltim">BPD Kaltim</option>
                <option value="BPD Kaltim UUS">BPD Kaltim UUS</option>
                <option value="BPD Lampung">BPD Lampung</option>
                <option value="BPD Maluku">BPD Maluku</option>
                <option value="BPD NTB">BPD NTB</option>
                <option value="BPD NTT">BPD NTT</option>
                <option value="BPD Papua">BPD Papua</option>
                <option value="BPD Riau">BPD Riau</option>
                <option value="BPD Sulteng">BPD Sulteng</option>
                <option value="BPD Sultra">BPD Sultra</option>
                <option value="BPD Sumbar UUS">BPD Sumbar UUS</option>
                <option value="BPD Sumsel Dan Babel">BPD Sumsel Dan Babel</option>
                <option value="BPD Sumsel dan BABEL Syariah">BPD Sumsel dan BABEL Syariah</option>
                <option value="BPD Sumut">BPD Sumut</option>
                <option value="BPD Sumut Syariah">BPD Sumut Syariah</option>
                <option value="BRI">BRI</option>
                <option value="BTN">BTN</option>
                <option value="BTN UUS">BTN UUS</option>
                <option value="BTPN">BTPN</option>
                <option value="BTPN Syariah">BTPN Syariah</option>
                <option value="Bangkok Bank Public CO">Bangkok Bank Public CO</option>
                <option value="Bank Agris">Bank Agris</option>
                <option value="Bank Aladin Syariah">Bank Aladin Syariah</option>
                <option value="Bank Antar Daerah">Bank Antar Daerah</option>
                <option value="Bank Artha Graha INT">Bank Artha Graha INT</option>
                <option value="Bank Bisnis International">Bank Bisnis International</option>
                <option value="Bank Bumi Arta">Bank Bumi Arta</option>
                <option value="Bank Capital Indonesia">Bank Capital Indonesia</option>
                <option value="Bank China Trust Indonesia">Bank China Trust Indonesia</option>
                <option value="Bank Commonwealth">Bank Commonwealth</option>
                <option value="Bank DBS Indonesia">Bank DBS Indonesia</option>
                <option value="Bank DKI">Bank DKI</option>
                <option value="Bank DKI UUS">Bank DKI UUS</option>
                <option value="Bank Danamon IND. UU Syariah">Bank Danamon IND. UU Syariah</option>
                <option value="Bank Fama International">Bank Fama International</option>
                <option value="Bank Ganesha">Bank Ganesha</option>
                <option value="Bank HSBC Indonesia">Bank HSBC Indonesia</option>
                <option value="Bank Hana">Bank Hana</option>
                <option value="Bank ICBC Indonesia">Bank ICBC Indonesia</option>
                <option value="Bank INA Perdana">Bank INA Perdana</option>
                <option value="Bank Index Selindo">Bank Index Selindo</option>
                <option value="Bank Jago">Bank Jago</option>
                <option value="Bank Jasa Jakarta">Bank Jasa Jakarta</option>
                <option value="Bank Jatim Unit Usaha Syariah">Bank Jatim Unit Usaha Syariah</option>
                <option value="Bank Jtrust Indonesia">Bank Jtrust Indonesia</option>
                <option value="Bank KEB Hana Indonesia">Bank KEB Hana Indonesia</option>
                <option value="Bank Kalbar UUS">Bank Kalbar UUS</option>
                <option value="Bank MNC Internasional">Bank MNC Internasional</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="Bank Mandiri Taspen">Bank Mandiri Taspen</option>
                <option value="Bank Maspion Indonesia">Bank Maspion Indonesia</option>
                <option value="Bank Mayapada International">Bank Mayapada International</option>
                <option value="Bank Mayapada International T">Bank Mayapada International T</option>
                <option value="Bank Mayora Indonesia">Bank Mayora Indonesia</option>
                <option value="Bank Mestika Dharma">Bank Mestika Dharma</option>
                <option value="Bank Mitraniaga">Bank Mitraniaga</option>
                <option value="Bank Mizuho Indonesia">Bank Mizuho Indonesia</option>
                <option value="Bank Muamalat Indonesia">Bank Muamalat Indonesia</option>
                <option value="Bank Multiarta Sentosa">Bank Multiarta Sentosa</option>
                <option value="Bank Nagari">Bank Nagari</option>
                <option value="Bank National NOBU">Bank National NOBU</option>
                <option value="Bank Neo Commerce">Bank Neo Commerce</option>
                <option value="Bank Nusantara Parahyangan">Bank Nusantara Parahyangan</option>
                <option value="Bank OCBC NISP">Bank OCBC NISP</option>
                <option value="Bank OCBC NISP Syariah">Bank OCBC NISP Syariah</option>
                <option value="Bank OKE Indonesia">Bank OKE Indonesia</option>
                <option value="Bank Of America">Bank Of America</option>
                <option value="Bank Of China Limited">Bank Of China Limited</option>
                <option value="Bank Panin">Bank Panin</option>
                <option value="Bank Panin Syariah">Bank Panin Syariah</option>
                <option value="Bank Pembangunan Daerah Banten (BPDB)">Bank Pembangunan Daerah Banten (BPDB)</option>
                <option value="Bank Permata">Bank Permata</option>
                <option value="Bank Permata Syariah">Bank Permata Syariah</option>
                <option value="Bank QNB Indonesia">Bank QNB Indonesia</option>
                <option value="Bank Raya Indonesia">Bank Raya Indonesia</option>
                <option value="Bank Resona Perdania">Bank Resona Perdania</option>
                <option value="Bank SBI Indonesia">Bank SBI Indonesia</option>
                <option value="Bank Sahabat Sampoerna">Bank Sahabat Sampoerna</option>
                <option value="Bank Shinhan Indonesia">Bank Shinhan Indonesia</option>
                <option value="Bank Sinarmas">Bank Sinarmas</option>
                <option value="Bank Sinarmas Syariah">Bank Sinarmas Syariah</option>
                <option value="Bank Sulselbar">Bank Sulselbar</option>
                <option value="Bank Sulselbar Syariah">Bank Sulselbar Syariah</option>
                <option value="Bank Sulut">Bank Sulut</option>
                <option value="Bank Sumitomo Mitsui Indonesia">Bank Sumitomo Mitsui Indonesia</option>
                <option value="Bank Swadesi">Bank Swadesi</option>
                <option value="Bank Syariah Bukopin">Bank Syariah Bukopin</option>
                <option value="Bank Syariah Indonesia">Bank Syariah Indonesia</option>
                <option value="Bank Syariah Mega Indonesia">Bank Syariah Mega Indonesia</option>
                <option value="Bank UOB Indonesia">Bank UOB Indonesia</option>
                <option value="Bank Victoria International">Bank Victoria International</option>
                <option value="Bank Victoria Syariah">Bank Victoria Syariah</option>
                <option value="Bank Windu Kentjana">Bank Windu Kentjana</option>
                <option value="Bank Woori Indonesia">Bank Woori Indonesia</option>
                <option value="Bukopin">Bukopin</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="CITIBANK">CITIBANK</option>
                <option value="Centratama Nasional Bank">Centratama Nasional Bank</option>
                <option value="Cimb Niaga UUS">Cimb Niaga UUS</option>
                <option value="Danamon">Danamon</option>
                <option value="Deutsche Bank AG">Deutsche Bank AG</option>
                <option value="HSBC">HSBC</option>
                <option value="JPMorgan Chase Bank NA">JPMorgan Chase Bank NA</option>
                <option value="MUFG Bank">MUFG Bank</option>
                <option value="Maybank">Maybank</option>
                <option value="Mega">Mega</option>
                <option value="Prima Master Bank">Prima Master Bank</option>
                <option value="RABOBANK International IND">RABOBANK International IND</option>
                <option value="SeaBank">SeaBank</option>
                <option value="Standard Chartered Bank">Standard Chartered Bank</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="bankAccountName" required>Nama Penerima</Label>
            <Input id="bankAccountName" name="bankAccountName" type="text" value={formData.bankAccountName} onChange={handleChange} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="bankAccountNumber" required>Nomor Rekening</Label>
            <Input id="bankAccountNumber" name="bankAccountNumber" type="text" value={formData.bankAccountNumber} onChange={handleChange} required />
        </FormRow>
        
        <FormRow>
            <Label htmlFor="ktpPhoto" required>Foto KTP</Label>
            <div className="md:col-span-2 space-y-3">
                {formData.ktpPhoto ? (
                    <div className="flex items-center gap-4">
                        <img src={formData.ktpPhoto} alt="KTP Preview" className="h-20 w-auto rounded-md border p-1 object-contain" />
                        <button type="button" onClick={retakeKtp} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-semibold">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                            Ulangi Foto KTP
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => openCamera('ktp')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold shadow">
                       <IdentificationIcon className="w-5 h-5"/>
                       Ambil Foto KTP
                    </button>
                )}
            </div>
        </FormRow>
        
        <FormRow>
            <Label htmlFor="selfiePhoto" required>Foto Selfie</Label>
             <div className="md:col-span-2 space-y-3">
                {formData.selfiePhoto ? (
                    <div className="flex items-center gap-4">
                        <img src={formData.selfiePhoto} alt="Selfie Preview" className="h-20 w-auto rounded-md border p-1" />
                        <button type="button" onClick={retakeSelfie} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-semibold">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                            Ulangi Selfie
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => openCamera('selfie')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold shadow">
                       <CameraIcon className="w-5 h-5"/>
                       Buka Kamera untuk Selfie
                    </button>
                )}
            </div>
        </FormRow>

        <FormRow>
            <Label htmlFor="contractType">Contract Type</Label>
            <Input id="contractType" name="contractType" value={formData.contractType} readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="agency">Agency</Label>
            <Input id="agency" name="agency" value={formData.agency} readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" value={formData.department} readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="stationId">Attendance Station ID</Label>
            <Input id="stationId" name="stationId" value={formData.stationId} readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            <button type="button" onClick={onBack} disabled={isSubmitting} className="w-full md:w-auto px-6 py-2 text-orange-600 font-semibold border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                <ArrowLeftIcon className="w-5 h-5" /><span>Kembali</span>
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors disabled:bg-gray-400">
                {isSubmitting ? 'Sedang Memproses...' : 'Kirim Pendaftaran'}
            </button>
        </div>
      </form>
    </div>
    
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Pendaftaran Siap Dikonfirmasi">
        <p className="text-gray-600 mb-2 text-center">Data dan dokumen Anda telah berhasil disimpan. Silakan pilih salah satu Korlap untuk konfirmasi melalui WhatsApp.</p>
        <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-6 text-center">
             <p className="text-sm text-orange-800 font-medium italic">Note: wa aja ya jangan telepon pasti di bales</p>
        </div>
        <div className="flex flex-col gap-3">
            <button onClick={() => handleWhatsAppRedirect('6287787460647')} className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-3">
                <WhatsappIcon className="w-6 h-6" /><span>Hubungi Pak Korlap 1</span>
            </button>
            <button onClick={() => handleWhatsAppRedirect('6285890285218')} className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-3">
                <WhatsappIcon className="w-6 h-6" /><span>Hubungi Pak Korlap 2</span>
            </button>
            <button onClick={handleCloseModal} className="w-full px-6 py-2 mt-2 text-slate-700 font-semibold hover:bg-slate-100 transition-colors rounded-lg">Tutup dan Kembali</button>
        </div>
    </Modal>
    
    <Modal isOpen={!!activeCamera} onClose={closeCamera} title={activeCamera === 'selfie' ? 'Ambil Foto Selfie' : 'Ambil Foto KTP'}>
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-full">
            <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${activeCamera === 'selfie' ? 'transform -scale-x-100' : ''}`} />
            <canvas ref={canvasRef} className="hidden" />
            
            {activeCamera === 'selfie' && <FaceFrame status={isCaptureReady ? 'good' : cameraFeedback.includes('Gelap') ? 'bad' : 'neutral'} />}
            {activeCamera === 'ktp' && <KtpFrame status={isCaptureReady ? 'good' : !cameraFeedback.includes('Bagus') ? 'bad' : 'neutral'} />}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-center">
                 <p className={`font-semibold text-lg drop-shadow-md transition-colors ${isCaptureReady ? 'text-green-400' : 'text-white'}`}>{cameraFeedback}</p>
            </div>
        </div>
        <button 
            onClick={captureImage} 
            className="w-full mt-4 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center space-x-3"
        >
            <CameraIcon className="w-6 h-6" />
            <span>Ambil Foto</span>
        </button>
    </Modal>
    </>
  );
};

export default NewRegistrationForm;
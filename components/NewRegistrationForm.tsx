import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Modal from './Modal';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { supabase } from '../lib/supabaseClient';
import { CameraIcon } from './icons/CameraIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { useNotification } from '../contexts/NotificationContext';


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
    ktpPhoto: null as File | null,
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

const NewRegistrationForm: React.FC<NewRegistrationFormProps> = ({ onBack }) => {
    const [formData, setFormData] = useState(initialFormData);
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleStream = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
             if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
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

    const openCamera = async () => {
        // --- CAMERA CALIBRATION: Request HD resolution and proper aspect ratio ---
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                aspectRatio: { ideal: 16 / 9 }
            }
        };

        try {
            // Try with ideal constraints first
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setIsCameraOpen(true);
            setTimeout(() => handleStream(stream), 100);
        } catch (err) {
            console.warn("Ideal camera constraints failed, trying default:", err);
            try {
                // Fallback to default if HD is not supported
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                setIsCameraOpen(true);
                setTimeout(() => handleStream(stream), 100);
            } catch (fallbackErr) {
                console.error("Camera access denied:", fallbackErr);
                showNotification("Gagal mengakses kamera. Pastikan Anda memberikan izin.", 'error');
            }
        }
    };

    const closeCamera = () => {
        stopStream();
        setIsCameraOpen(false);
    };
    
    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // --- CAMERA CALIBRATION: Flip context horizontally to un-mirror the selfie ---
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Reset transform to avoid affecting other canvas operations if any
                context.setTransform(1, 0, 0, 1, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use 0.9 for better quality
                setFormData(prev => ({ ...prev, selfiePhoto: dataUrl }));
            }
            closeCamera();
        }
    };
    
    const retakeSelfie = () => {
        setFormData(prev => ({ ...prev, selfiePhoto: null }));
        openCamera();
    };

    const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, ktpPhoto: file }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'nationalId' || name === 'phoneNumber' || name === 'bankAccountNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (formData.nationalId.length !== 16) {
            showNotification('NIK KTP wajib 16 digit.', 'error');
            return;
        }
        if (!formData.ktpPhoto) {
            showNotification('Foto KTP wajib di-upload.', 'error');
            return;
        }
        if (!formData.selfiePhoto) {
            showNotification('Foto Selfie wajib diambil.', 'error');
            return;
        }
        
        setIsSubmitting(true);
    
        try {
            // 1. Cek Duplikat NIK
            const { data: existingData, error: checkError } = await supabase
                .from('registrants')
                .select('id')
                .eq('nik', formData.nationalId)
                .single();
    
            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existingData) {
                throw new Error('NIK ini sudah terdaftar. Hubungi admin jika ada kesalahan.');
            }
    
            // 2. Upload KTP Photo
            const ktpFileName = `ktp-${formData.nationalId}-${Date.now()}.jpg`;
            const ktpFilePath = `public/${ktpFileName}`;
            const { error: ktpUploadError } = await supabase.storage
                .from('registrant-documents')
                .upload(ktpFilePath, formData.ktpPhoto);
            if (ktpUploadError) throw new Error(`Gagal upload KTP: ${ktpUploadError.message}`);
            const { data: { publicUrl: ktpPublicUrl } } = supabase.storage
                .from('registrant-documents')
                .getPublicUrl(ktpFilePath);
            
            // 3. Upload Selfie Photo
            const selfieFile = dataURLtoFile(formData.selfiePhoto, `selfie-${formData.nationalId}-${Date.now()}.jpg`);
            const selfieFilePath = `public/selfie-${formData.nationalId}-${Date.now()}.jpg`;
            const { error: selfieUploadError } = await supabase.storage
                .from('registrant-documents')
                .upload(selfieFilePath, selfieFile);
            if (selfieUploadError) throw new Error(`Gagal upload Selfie: ${selfieUploadError.message}`);
             const { data: { publicUrl: selfiePublicUrl } } = supabase.storage
                .from('registrant-documents')
                .getPublicUrl(selfieFilePath);
    
            // 4. Insert Data to DB
            const { error: insertError } = await supabase
              .from('registrants')
              .insert([{
                  full_name: formData.fullName,
                  nik: formData.nationalId,
                  religion: formData.religion,
                  phone: formData.phoneNumber,
                  bank_name: formData.bankName,
                  bank_account_name: formData.bankAccountName,
                  bank_account_number: formData.bankAccountNumber,
                  contract_type: formData.contractType,
                  agency: formData.agency,
                  department: formData.department,
                  station_id: formData.stationId,
                  info_source: formData.infoSource,
                  ktp_image_url: ktpPublicUrl,
                  selfie_image_url: selfiePublicUrl,
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
        const message = `
Halo Pak Korlap,
Saya sudah mendaftar sebagai Daily Worker baru melalui form online.

Berikut data saya:
- *Nama Lengkap*: ${formData.fullName}
- *National ID (NIK)*: ${formData.nationalId}
- *Info Dari*: ${formData.infoSource}

Dokumen KTP dan Selfie sudah di-upload melalui sistem.
Mohon untuk diproses lebih lanjut. Terima kasih.
        `.trim();

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${targetPhoneNumber}?text=${encodedMessage}`, '_blank');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormData); // Reset form
        onBack();
    };

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
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp Status/Group">WhatsApp Status/Group</option>
                <option value="Teman/Kerabat">Teman/Kerabat</option>
                <option value="Lainnya">Lainnya</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="bankName" required>Nama Bank</Label>
            <Select id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required>
                <option value="" disabled>Pilih Bank</option>
                <option value="BCA">BCA</option><option value="BNI">BNI</option><option value="BRI">BRI</option><option value="Mandiri">Mandiri</option>
                <option value="BSI">BSI</option><option value="CIMB Niaga">CIMB Niaga</option><option value="Danamon">Danamon</option><option value="Permata">Permata</option>
                <option value="BCA Digital">BCA Digital</option><option value="Bank Jago">Bank Jago</option><option value="SeaBank">SeaBank</option>
                <option value="Lainnya">Bank Lainnya</option>
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
                        <img src={URL.createObjectURL(formData.ktpPhoto)} alt="KTP Preview" className="h-20 w-auto rounded-md border p-1" />
                        <div className="text-sm">
                            <p className="font-semibold text-green-700">File Terpilih:</p>
                            <p className="text-slate-600 truncate">{formData.ktpPhoto.name}</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500">
                       <IdentificationIcon className="w-8 h-8 mr-2" /> Preview akan muncul di sini
                    </div>
                )}
                <label htmlFor="ktp-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-semibold">
                     <CloudArrowUpIcon className="w-5 h-5"/>
                    {formData.ktpPhoto ? 'Ganti File KTP' : 'Pilih File KTP'}
                </label>
                <input id="ktp-upload" type="file" accept="image/*" className="hidden" onChange={handleKtpChange} />
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
                    <button type="button" onClick={openCamera} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold shadow">
                       <CameraIcon className="w-5 h-5"/>
                       Buka Kamera untuk Selfie
                    </button>
                )}
            </div>
        </FormRow>
        <FormRow>
            <Label htmlFor="contractType" required>Contract Type</Label>
            <Input id="contractType" name="contractType" value={formData.contractType} onChange={handleChange} required readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="agency" required>Agency</Label>
            <Input id="agency" name="agency" value={formData.agency} onChange={handleChange} required readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="department" required>Department</Label>
            <Input id="department" name="department" value={formData.department} onChange={handleChange} required readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>
        <FormRow>
            <Label htmlFor="stationId" required>Attendance Station ID</Label>
            <Input id="stationId" name="stationId" value={formData.stationId} onChange={handleChange} required readOnly className="bg-slate-200 text-slate-500"/>
        </FormRow>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-2 text-orange-600 font-semibold border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Kembali</span>
            </button>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors disabled:bg-gray-400"
            >
                {isSubmitting ? 'Sedang Memproses...' : 'Kirim Pendaftaran'}
            </button>
        </div>
      </form>
    </div>
    
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Pendaftaran Siap Dikonfirmasi">
        <p className="text-gray-600 mb-2 text-center">
            Data dan dokumen Anda telah berhasil disimpan. Silakan pilih salah satu Korlap untuk konfirmasi melalui WhatsApp.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-6 text-center">
             <p className="text-sm text-orange-800 font-medium italic">
                Note: wa aja ya jangan telepon pasti di bales
            </p>
        </div>
       
        <div className="flex flex-col gap-3">
            <button
                onClick={() => handleWhatsAppRedirect('6287787460647')}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-3"
            >
                <WhatsappIcon className="w-6 h-6" />
                <span>Hubungi Pak Korlap 1</span>
            </button>
            <button
                onClick={() => handleWhatsAppRedirect('6285890285218')}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-3"
            >
                <WhatsappIcon className="w-6 h-6" />
                <span>Hubungi Pak Korlap 2</span>
            </button>
            <button
                onClick={handleCloseModal}
                className="w-full px-6 py-2 mt-2 text-slate-700 font-semibold hover:bg-slate-100 transition-colors rounded-lg"
            >
                Tutup dan Kembali
            </button>
        </div>
    </Modal>
    
    <Modal isOpen={isCameraOpen} onClose={closeCamera} title="Ambil Foto Selfie">
        {/* Container with fixed aspect ratio to prevent distortion */}
        <div className="bg-black rounded-lg overflow-hidden aspect-video w-full">
            {/* Video element is mirrored and covers the container */}
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
        <button
            onClick={captureSelfie}
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
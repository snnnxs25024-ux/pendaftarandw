
import React, { useState } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Modal from './Modal';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { supabase } from '../lib/supabaseClient';

interface NewRegistrationFormProps {
  onBack: () => void;
}

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4 py-3 border-b border-gray-200">{children}</div>
);

const Label: React.FC<{ htmlFor: string; children: React.ReactNode, required?: boolean }> = ({ htmlFor, children, required }) => (
    <label htmlFor={htmlFor} className="font-semibold text-slate-700">
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
};

const NewRegistrationForm: React.FC<NewRegistrationFormProps> = ({ onBack }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setError('National ID wajib 16 digit.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        // 1. Cek Duplikat NIK
        try {
            const { data: existingData, error: checkError } = await supabase
                .from('registrants')
                .select('id')
                .eq('nik', formData.nationalId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found (which is good)
                 throw checkError;
            }

            if (existingData) {
                setError('NIK ini sudah terdaftar. Mohon periksa kembali atau hubungi admin jika ada kesalahan.');
                setIsSubmitting(false);
                return;
            }

            // 2. Insert Data
            const { error: insertError } = await supabase
              .from('registrants')
              .insert([
                {
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
                  station_id: formData.stationId
                }
              ]);
            
            if (insertError) throw insertError;

            setIsModalOpen(true);

        } catch (err: any) {
            setError(`Gagal menyimpan data: ${err.message || 'Terjadi kesalahan'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsAppRedirect = (targetPhoneNumber: string) => {
        const message = `
Halo Pak Korlap,
Saya ingin mendaftar sebagai Daily Worker baru.

Berikut data saya:
- *Nama Lengkap*: ${formData.fullName}
- *National ID (NIK)*: ${formData.nationalId}
- *Agama*: ${formData.religion}
- *No. Telepon*: ${formData.phoneNumber}
- *Nama Bank*: ${formData.bankName}
- *Nama Rekening*: ${formData.bankAccountName}
- *Nomor Rekening*: ${formData.bankAccountNumber}
- *Tipe Kontrak*: ${formData.contractType}
- *Agensi*: ${formData.agency}
- *Departemen*: ${formData.department}
- *ID Stasiun*: ${formData.stationId}

Terima kasih.
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
                <option value="Islam">Islam</option>
                <option value="Kristen Protestan">Kristen Protestan</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="contractType" required>Contract Type</Label>
            <Select id="contractType" name="contractType" value={formData.contractType} onChange={handleChange} required disabled>
                <option>{formData.contractType}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="phoneNumber" required>Nomor WhatsApp</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="bankName" required>Nama Bank</Label>
            <Select id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required>
                <option value="" disabled>Pilih Bank</option>
                <option value="BCA">BCA</option>
                <option value="BCA Digital">BCA Digital</option>
                <option value="BCA Syariah">BCA Syariah</option>
                <option value="BJB">BJB</option>
                <option value="BJB Syariah">BJB Syariah</option>
                <option value="BNI">BNI</option>
                <option value="BRI">BRI</option>
                <option value="BTN">BTN</option>
                <option value="BTN UUS">BTN UUS</option>
                <option value="Bank DKI">Bank DKI</option>
                <option value="Bank DKI UUS">Bank DKI UUS</option>
                <option value="Bank Danamon IND. UU Syariah">Bank Danamon IND. UU Syariah</option>
                <option value="Bank Jago">Bank Jago</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="Bank Mandiri Taspen">Bank Mandiri Taspen</option>
                <option value="Bank Panin">Bank Panin</option>
                <option value="Bank Panin Syariah">Bank Panin Syariah</option>
                <option value="Bank Permata">Bank Permata</option>
                <option value="Bank Permata Syariah">Bank Permata Syariah</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="HSBC">HSBC</option>
                <option value="Maybank">Maybank</option>
                <option value="SeaBank">SeaBank</option>
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
            <Label htmlFor="agency" required>Agency</Label>
            <Select id="agency" name="agency" value={formData.agency} onChange={handleChange} required disabled>
                <option>{formData.agency}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="department" required>Department</Label>
            <Select id="department" name="department" value={formData.department} onChange={handleChange} required disabled>
                <option>{formData.department}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="stationId" required>Attendance Station ID</Label>
            <Select id="stationId" name="stationId" value={formData.stationId} onChange={handleChange} required disabled>
                <option>{formData.stationId}</option>
            </Select>
        </FormRow>

        {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}

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
            Data Anda telah berhasil disimpan di database. Silakan pilih salah satu Korlap untuk konfirmasi melalui WhatsApp.
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
    </>
  );
};

export default NewRegistrationForm;

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
    stationId: '14461 (Sunter DC)',
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

        const { error: supabaseError } = await supabase
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
        
        setIsSubmitting(false);

        if (supabaseError) {
          setError(`Gagal menyimpan data: ${supabaseError.message}`);
          return;
        }

        setIsModalOpen(true);
    };

    const handleWhatsAppRedirect = () => {
        const phoneNumber = '6287787460647';
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
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
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
        {error && <div className="text-right md:col-start-2 md:col-span-2"><p className="text-red-500 text-sm">{error}</p></div>}
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
            <Input id="bankName" name="bankName" type="text" value={formData.bankName} onChange={handleChange} required />
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
                {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
        </div>
      </form>
    </div>
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Pendaftaran Siap Dikonfirmasi">
        <p className="text-gray-600 mb-6 text-center">
            Data Anda telah berhasil disimpan di database. Silakan lanjutkan konfirmasi melalui WhatsApp.
        </p>
        <div className="flex flex-col gap-4">
            <button
                onClick={handleWhatsAppRedirect}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-3"
            >
                <WhatsappIcon className="w-6 h-6" />
                <span>Konfirmasi via WhatsApp</span>
            </button>
            <button
                onClick={handleCloseModal}
                className="w-full px-6 py-2 text-slate-700 font-semibold hover:bg-slate-100 transition-colors rounded-lg"
            >
                Tutup dan Kembali
            </button>
        </div>
    </Modal>
    </>
  );
};

export default NewRegistrationForm;
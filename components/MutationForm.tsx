import React, { useState } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Modal from './Modal';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { supabase } from '../lib/supabaseClient';

interface MutationFormProps {
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
    <input {...props} className="md:col-span-2 w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="md:col-span-2 w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500">
        {props.children}
    </select>
);

const initialFormData = {
    opsId: '',
    role: 'Daily Worker',
    fullName: '',
    contractType: 'Daily Worker Vendor - NEXUS',
    agency: 'NEXUS',
    department: 'SOC Operator',
    stationId: '14461 (Sunter DC)',
};

const MutationForm: React.FC<MutationFormProps> = ({ onBack }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        const { error: supabaseError } = await supabase
          .from('mutations')
          .insert([
            {
              ops_id: formData.opsId,
              full_name: formData.fullName,
              role: formData.role
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
Saya ingin mengajukan mutasi.

Berikut data saya:
- *OpsID*: ${formData.opsId}
- *Role Ops yang diajukan*: ${formData.role}
- *Nama Lengkap*: ${formData.fullName}
- *Contract Type (BPO)*: ${formData.contractType}
- *Agency (BPO)*: ${formData.agency}
- *Department (BPO)*: ${formData.department}
- *Attendance Station ID*: ${formData.stationId}

Mohon diproses lebih lanjut. Terima kasih.
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
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Formulir Mutasi</h2>
      <p className="text-gray-600 mb-8 text-center">Lengkapi data di bawah ini untuk mengajukan perpindahan (mutasi).</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow>
            <Label htmlFor="opsId" required>OpsID</Label>
            <Input id="opsId" name="opsId" type="text" value={formData.opsId} onChange={handleChange} required />
        </FormRow>
        <FormRow>
            <Label htmlFor="role" required>Role Ops yang diajukan</Label>
            <Select id="role" name="role" value={formData.role} disabled>
                <option>{formData.role}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="fullName" required>Nama Lengkap</Label>
            <Input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required />
        </FormRow>
         <FormRow>
            <Label htmlFor="contractType" required>Contract Type (BPO)</Label>
            <Select id="contractType" name="contractType" value={formData.contractType} disabled>
                <option>{formData.contractType}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="agency" required>Agency (BPO)</Label>
            <Select id="agency" name="agency" value={formData.agency} disabled>
                <option>{formData.agency}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="department" required>Department (BPO)</Label>
            <Select id="department" name="department" value={formData.department} disabled>
                <option>{formData.department}</option>
            </Select>
        </FormRow>
        <FormRow>
            <Label htmlFor="stationId" required>Attendance Station ID</Label>
            <Select id="stationId" name="stationId" value={formData.stationId} disabled>
                <option>{formData.stationId}</option>
            </Select>
        </FormRow>
        {error && <div className="text-right md:col-start-2 md:col-span-2"><p className="text-red-500 text-sm">{error}</p></div>}
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
                {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Mutasi'}
            </button>
        </div>
      </form>
    </div>
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Pengajuan Mutasi Siap Dikonfirmasi">
        <p className="text-gray-600 mb-6 text-center">
            Data Anda telah berhasil disimpan di database. Silakan lanjutkan konfirmasi pengajuan mutasi melalui WhatsApp.
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

export default MutationForm;
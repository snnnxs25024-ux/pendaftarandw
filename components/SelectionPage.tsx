
import React from 'react';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface SelectionPageProps {
    onBack: () => void;
    onGoToNewRegistration: () => void;
    onGoToMutation: () => void;
}

const SelectionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void }> = ({ title, description, icon, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group bg-white rounded-lg shadow-lg p-8 text-center cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 transform"
        >
            <div className="mx-auto bg-orange-100 rounded-full h-20 w-20 flex items-center justify-center mb-6 transition-colors group-hover:bg-orange-500">
                <div className="text-orange-600 transition-colors group-hover:text-white">
                    {icon}
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
};

const SelectionPage: React.FC<SelectionPageProps> = ({ onBack, onGoToNewRegistration, onGoToMutation }) => {
    
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Pilih Jenis Formulir</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
                Silakan pilih salah satu opsi di bawah ini untuk melanjutkan. Apakah Anda ingin mendaftar sebagai pekerja baru atau mengajukan mutasi?
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <SelectionCard 
                title="Pendaftaran DW Baru"
                description="Isi formulir ini jika Anda adalah calon pekerja baru yang ingin bergabung."
                icon={<UserPlusIcon className="w-10 h-10" />}
                onClick={onGoToNewRegistration}
            />
            <SelectionCard 
                title="Formulir Mutasi"
                description="Isi formulir ini jika Anda sudah terdaftar dan ingin mengajukan perpindahan (mutasi)."
                icon={<ArrowPathIcon className="w-10 h-10" />}
                onClick={onGoToMutation}
            />
        </div>
        <button 
            onClick={onBack}
            className="mt-12 px-6 py-2 text-orange-600 font-semibold border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
        >
            Kembali ke Informasi
        </button>
    </div>
  );
};

export default SelectionPage;

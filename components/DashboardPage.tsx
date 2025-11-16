import React, { useState } from 'react';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import Modal from './Modal';

// --- TYPE DEFINITIONS ---
interface Registrant {
    id: number;
    name: string;
    nik: string;
    religion: string;
    contractType: string;
    phone: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    agency: string;
    department: string;
    stationId: string;
    date: string;
}

interface Mutation {
    id: number;
    opsId: string;
    fullName: string;
    role: string;
    date: string;
}

// --- INITIAL DATA (DATABASE SIMULATION) ---
const initialRegistrantsData: Registrant[] = [
    { id: 1, name: 'Budi Santoso', nik: '3201234567890001', phone: '081234567890', religion: 'Islam', bankName: 'BCA', bankAccountName: 'Budi Santoso', bankAccountNumber: '1234567890', contractType: 'Daily Worker Vendor - NEXUS', agency: 'NEXUS', department: 'SOC Operator', stationId: '14461 (Sunter DC)', date: '2023-10-27' },
    { id: 2, name: 'Ani Yudhoyono', nik: '3201234567890002', phone: '082345678901', religion: 'Kristen Protestan', bankName: 'Mandiri', bankAccountName: 'Ani Yudhoyono', bankAccountNumber: '0987654321', contractType: 'Daily Worker Vendor - NEXUS', agency: 'NEXUS', department: 'SOC Operator', stationId: '14461 (Sunter DC)', date: '2023-10-27' },
    { id: 3, name: 'Citra Kirana', nik: '3201234567890003', phone: '083456789012', religion: 'Katolik', bankName: 'BRI', bankAccountName: 'Citra Kirana', bankAccountNumber: '1122334455', contractType: 'Daily Worker Vendor - NEXUS', agency: 'NEXUS', department: 'SOC Operator', stationId: '14461 (Sunter DC)', date: '2023-10-26' },
];

const initialMutationData: Mutation[] = [
    { id: 1, opsId: 'NXS-001', fullName: 'Eko Prabowo', role: 'Daily Worker', date: '2023-10-27' },
    { id: 2, opsId: 'NXS-002', fullName: 'Fajar Nugraha', role: 'Daily Worker', date: '2023-10-26' },
];


// --- Dashboard Component ---
const DashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'registrants' | 'mutations'>('dashboard');
    const [registrants, setRegistrants] = useState<Registrant[]>(initialRegistrantsData);
    const [mutations, setMutations] = useState<Mutation[]>(initialMutationData);

    const [modalState, setModalState] = useState<{ type: 'view' | 'edit' | 'delete' | null; data: any; dataType: 'registrant' | 'mutation' | null }>({ type: null, data: null, dataType: null });
    const [editFormData, setEditFormData] = useState<any>(null);

    // --- CRUD Handlers ---
    const handleCopy = (data: Registrant | Mutation, type: 'registrant' | 'mutation') => {
        let textToCopy = '';
        if (type === 'registrant') {
            const reg = data as Registrant;
            textToCopy = [
                reg.name,
                reg.nik,
                reg.religion,
                reg.contractType,
                reg.phone,
                reg.bankName,
                reg.bankAccountName,
                reg.bankAccountNumber,
                reg.agency,
                reg.department,
                reg.stationId,
            ].join('\t');
        } else {
            const mut = data as Mutation;
            textToCopy = [
                mut.opsId,
                mut.role,
                mut.fullName,
            ].join('\t');
        }
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('Data disalin! Siap untuk di-paste ke spreadsheet.');
            })
            .catch(err => {
                console.error('Gagal menyalin data:', err);
                alert('Gagal menyalin data ke clipboard.');
            });
    };


    const openModal = (type: 'view' | 'edit' | 'delete', data: any, dataType: 'registrant' | 'mutation') => {
        setModalState({ type, data, dataType });
        if(type === 'edit') {
            setEditFormData(data);
        }
    };
    
    const closeModal = () => {
        setModalState({ type: null, data: null, dataType: null });
        setEditFormData(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = () => {
        if (modalState.dataType === 'registrant') {
            setRegistrants(registrants.map(r => r.id === editFormData.id ? editFormData : r));
        } else {
            setMutations(mutations.map(m => m.id === editFormData.id ? editFormData : m));
        }
        closeModal();
    };

    const handleDelete = () => {
        if (modalState.dataType === 'registrant') {
            setRegistrants(registrants.filter(r => r.id !== modalState.data.id));
        } else {
            setMutations(mutations.filter(m => m.id !== modalState.data.id));
        }
        closeModal();
    };

    // --- Render Helper Components ---
    const SideBarCard: React.FC<{
      icon: React.ReactNode;
      label: string;
      description: string;
      view: 'dashboard' | 'registrants' | 'mutations';
    }> = ({ icon, label, description, view }) => (
      <button
        onClick={() => setActiveView(view)}
        className={`w-full text-left p-4 rounded-lg transition-all transform hover:shadow-lg hover:-translate-y-1 ${
          activeView === view ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-bold text-lg">{label}</span>
        </div>
        <p className={`mt-2 text-sm ${activeView === view ? 'text-orange-100' : 'text-slate-600'}`}>{description}</p>
      </button>
    );

    const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Ringkasan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Pengakses Aplikasi" value="1,204" />
                            <StatCard title="Total Pendaftar Baru" value={registrants.length} />
                            <StatCard title="Total Pengajuan Mutasi" value={mutations.length} />
                        </div>
                    </div>
                );
            case 'registrants':
                return <DataTable title="Data Pendaftar Baru" data={registrants} type="registrant" />;
            case 'mutations':
                return <DataTable title="Data Pengajuan Mutasi" data={mutations} type="mutation" />;
            default: return null;
        }
    };
    
    const DataTable: React.FC<{ title: string, data: any[], type: 'registrant' | 'mutation'}> = ({ title, data, type }) => {
        const headers = type === 'registrant' ? ['Nama Lengkap', 'NIK', 'No. WhatsApp'] : ['OpsID', 'Nama Lengkap', 'Role Diajukan'];
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                {headers.map(h => <th key={h} className="px-5 py-3 border-b-2 border-orange-300 bg-orange-500 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">{h}</th>)}
                                <th className="px-5 py-3 border-b-2 border-orange-300 bg-orange-500 text-right text-xs font-semibold text-gray-800 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.id}>
                                    {type === 'registrant' ? (<>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.name}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.nik}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.phone}</td>
                                    </>) : (<>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.opsId}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.fullName}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.role}</td>
                                    </>)}
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right space-x-2">
                                        <button onClick={() => handleCopy(item, type)} title="Salin" className="text-gray-500 hover:text-blue-600"><ClipboardIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('view', item, type)} title="Lihat Detail" className="text-gray-500 hover:text-green-600"><EyeIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('edit', item, type)} title="Edit" className="text-gray-500 hover:text-yellow-600"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('delete', item, type)} title="Hapus" className="text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };
    
    const renderModalContent = () => {
        if (!modalState.type) return null;
        const { type, data, dataType } = modalState;
        
        const DetailView = ({ item, type }: { item: any; type: 'registrant' | 'mutation' }) => (
            <div className="space-y-2 text-sm">
                {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3">
                        <span className="font-semibold capitalize text-gray-600 col-span-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-800 col-span-2">{String(value)}</span>
                    </div>
                ))}
            </div>
        );

        const EditForm = () => {
            if (!editFormData) return null;
            return (
                <form className="space-y-3">
                    {Object.entries(editFormData).map(([key, value]) => key !== 'id' && (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input
                                type="text"
                                name={key}
                                value={editFormData[key]}
                                onChange={handleEditFormChange}
                                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    ))}
                </form>
            );
        };
        
        switch (type) {
            case 'view':
                return (
                    <Modal isOpen={!!type} onClose={closeModal} title={`Detail ${dataType === 'registrant' ? 'Pendaftar' : 'Mutasi'}`}>
                        <DetailView item={data} type={dataType!} />
                        <button onClick={closeModal} className="mt-6 w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Tutup</button>
                    </Modal>
                );
            case 'edit':
                 return (
                    <Modal isOpen={!!type} onClose={closeModal} title={`Edit ${dataType === 'registrant' ? 'Pendaftar' : 'Mutasi'}`}>
                        <EditForm />
                        <div className="mt-6 flex gap-4">
                            <button onClick={closeModal} className="w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Batal</button>
                            <button onClick={handleSaveChanges} className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Simpan Perubahan</button>
                        </div>
                    </Modal>
                );
            case 'delete':
                return (
                    <Modal isOpen={!!type} onClose={closeModal} title="Konfirmasi Hapus">
                        <p>Anda yakin ingin menghapus data untuk <strong>{dataType === 'registrant' ? data.name : data.fullName}</strong>? Tindakan ini tidak dapat diurungkan.</p>
                        <div className="mt-6 flex gap-4">
                            <button onClick={closeModal} className="w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Batal</button>
                            <button onClick={handleDelete} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Ya, Hapus</button>
                        </div>
                    </Modal>
                );
            default: return null;
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-150px)] animate-fade-in bg-slate-100 rounded-lg">
            {/* Sidebar */}
            <aside className="w-72 bg-white p-4 flex flex-col shadow-lg">
                <nav className="flex-grow space-y-4">
                    <SideBarCard
                        icon={<ChartBarIcon className="w-7 h-7" />}
                        label="Dashboard"
                        description="Lihat ringkasan data dan statistik."
                        view="dashboard"
                    />
                    <SideBarCard
                        icon={<UsersIcon className="w-7 h-7" />}
                        label="Pendaftar Baru"
                        description="Kelola data calon pekerja baru."
                        view="registrants"
                    />
                    <SideBarCard
                        icon={<ArrowsRightLeftIcon className="w-7 h-7" />}
                        label="Pengajuan Mutasi"
                        description="Proses pengajuan mutasi pekerja."
                        view="mutations"
                    />
                </nav>
                <div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-200"
                    >
                        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {renderContent()}
            </main>
            
            {/* Modals */}
            {renderModalContent()}
        </div>
    );
};

export default DashboardPage;
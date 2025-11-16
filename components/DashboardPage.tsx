import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import Modal from './Modal';
import { supabase } from '../lib/supabaseClient';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

// --- TYPE DEFINITIONS (camelCase for UI) ---
interface Registrant {
    id: number;
    fullName: string;
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
    createdAt: string;
}

interface Mutation {
    id: number;
    opsId: string;
    fullName: string;
    role: string;
    createdAt: string;
}

// --- Data Table Component (Moved outside to prevent re-creation) ---
const DataTable: React.FC<{ 
    title: string; 
    data: any[]; 
    type: 'registrant' | 'mutation';
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleCopy: (data: any, type: 'registrant' | 'mutation') => void;
    openModal: (type: 'view' | 'edit' | 'delete', data: any, dataType: 'registrant' | 'mutation') => void;
}> = ({ title, data, type, searchTerm, setSearchTerm, handleCopy, openModal }) => {
    const headers = type === 'registrant' ? ['Nama Lengkap', 'NIK', 'No. WhatsApp'] : ['OpsID', 'Nama Lengkap', 'Role Diajukan'];
    
    // State to give feedback on copy action
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const onCopy = (item: any) => {
        handleCopy(item, type);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000); // Reset icon after 2 seconds
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                <input
                    type="search"
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 bg-slate-800 border border-slate-600 placeholder-slate-400 text-white rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            {headers.map(h => <th key={h} className="px-5 py-3 border-b-2 border-orange-200 bg-orange-100 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">{h}</th>)}
                            <th className="px-5 py-3 border-b-2 border-orange-200 bg-orange-100 text-right text-xs font-semibold text-orange-800 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map(item => (
                                <tr key={item.id}>
                                    {type === 'registrant' ? (<>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.fullName}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.nik}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.phone}</td>
                                    </>) : (<>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.opsId}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.fullName}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900">{item.role}</td>
                                    </>)}
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right space-x-2">
                                        <button onClick={() => onCopy(item)} title="Salin" className="text-gray-500 hover:text-blue-600 disabled:opacity-50" disabled={copiedId === item.id}>
                                            {copiedId === item.id ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5"/>}
                                        </button>
                                        <button onClick={() => openModal('view', item, type)} title="Lihat Detail" className="text-gray-500 hover:text-green-600"><EyeIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('edit', item, type)} title="Edit" className="text-gray-500 hover:text-yellow-600"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('delete', item, type)} title="Hapus" className="text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={headers.length + 1} className="text-center py-10 text-gray-500">
                                    {searchTerm ? 'Tidak ada hasil yang cocok dengan pencarian Anda.' : 'Tidak ada data untuk ditampilkan.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
};


// --- Dashboard Page Component ---
const DashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'registrants' | 'mutations'>('dashboard');
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [mutations, setMutations] = useState<Mutation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchRegistrants, setSearchRegistrants] = useState('');
    const [searchMutations, setSearchMutations] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [modalState, setModalState] = useState<{ type: 'view' | 'edit' | 'delete' | null; data: any; dataType: 'registrant' | 'mutation' | null }>({ type: null, data: null, dataType: null });
    const [editFormData, setEditFormData] = useState<any>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchRegistrants = useCallback(async () => {
        const { data, error } = await supabase.from('registrants').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching registrants:', error);
            showNotification('Gagal memuat data pendaftar.', 'error');
        } else if (data) {
            const formattedData: Registrant[] = data.map(item => ({
                id: item.id,
                fullName: item.full_name,
                nik: item.nik,
                religion: item.religion,
                contractType: item.contract_type,
                phone: item.phone,
                bankName: item.bank_name,
                bankAccountName: item.bank_account_name,
                bankAccountNumber: item.bank_account_number,
                agency: item.agency,
                department: item.department,
                stationId: item.station_id,
                createdAt: new Date(item.created_at).toLocaleDateString('id-ID'),
            }));
            setRegistrants(formattedData);
        }
    }, []);

    const fetchMutations = useCallback(async () => {
        const { data, error } = await supabase.from('mutations').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching mutations:', error);
            showNotification('Gagal memuat data mutasi.', 'error');
        } else if (data) {
             const formattedData: Mutation[] = data.map(item => ({
                id: item.id,
                opsId: item.ops_id,
                fullName: item.full_name,
                role: item.role,
                createdAt: new Date(item.created_at).toLocaleDateString('id-ID'),
            }));
            setMutations(formattedData);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchRegistrants(), fetchMutations()]).finally(() => setLoading(false));
    }, [fetchRegistrants, fetchMutations]);
    
    const filteredRegistrants = useMemo(() => 
        registrants.filter(r => 
            r.fullName.toLowerCase().includes(searchRegistrants.toLowerCase()) ||
            r.nik.toLowerCase().includes(searchRegistrants.toLowerCase()) ||
            r.phone.toLowerCase().includes(searchRegistrants.toLowerCase())
    ), [registrants, searchRegistrants]);

    const filteredMutations = useMemo(() => 
        mutations.filter(m => 
            m.opsId.toLowerCase().includes(searchMutations.toLowerCase()) ||
            m.fullName.toLowerCase().includes(searchMutations.toLowerCase()) ||
            m.role.toLowerCase().includes(searchMutations.toLowerCase())
    ), [mutations, searchMutations]);


    // --- CRUD Handlers ---
    const handleCopy = (data: Registrant | Mutation, type: 'registrant' | 'mutation') => {
        let textToCopy = '';
        if (type === 'registrant') {
            const reg = data as Registrant;
            textToCopy = [
                reg.fullName, reg.nik, reg.religion, reg.contractType, reg.contractType, reg.phone,
                reg.bankName, reg.bankAccountName, reg.bankAccountNumber,
                reg.agency, reg.department, reg.stationId
            ].join('\t');
        } else {
            const mut = data as Mutation;
            textToCopy = [mut.opsId, mut.role, mut.role, mut.fullName].join('\t');
        }
        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Data disalin ke clipboard!', 'success'))
            .catch(err => {
                console.error('Gagal menyalin data:', err);
                showNotification('Gagal menyalin data.', 'error');
            });
    };

    const openModal = (type: 'view' | 'edit' | 'delete', data: any, dataType: 'registrant' | 'mutation') => {
        setModalState({ type, data, dataType });
        if(type === 'edit') setEditFormData(data);
    };
    
    const closeModal = () => {
        setModalState({ type: null, data: null, dataType: null });
        setEditFormData(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        if (!editFormData) return;
        const { id, ...rest } = editFormData;
        
        if (modalState.dataType === 'registrant') {
            const { fullName, nik, religion, contractType, phone, bankName, bankAccountName, bankAccountNumber, agency, department, stationId } = rest;
            const { error } = await supabase.from('registrants').update({
                full_name: fullName, nik, religion, contract_type: contractType, phone,
                bank_name: bankName, bank_account_name: bankAccountName, bank_account_number: bankAccountNumber,
                agency, department, station_id: stationId
            }).eq('id', id);
            
            if (error) showNotification('Gagal menyimpan perubahan: ' + error.message, 'error');
            else await fetchRegistrants();

        } else if (modalState.dataType === 'mutation') {
            const { opsId, fullName, role } = rest;
            const { error } = await supabase.from('mutations').update({
                ops_id: opsId, full_name: fullName, role
            }).eq('id', id);
            
            if (error) showNotification('Gagal menyimpan perubahan: ' + error.message, 'error');
            else await fetchMutations();
        }
        closeModal();
    };

    const handleDelete = async () => {
        const { data, dataType } = modalState;
        if (!data || !dataType) return;

        const fromTable = dataType === 'registrant' ? 'registrants' : 'mutations';
        const { error } = await supabase.from(fromTable).delete().eq('id', data.id);

        if (error) {
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        } else {
            if (dataType === 'registrant') await fetchRegistrants();
            else await fetchMutations();
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
        if (loading) {
            return <div className="text-center p-10">Memuat data...</div>;
        }

        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Ringkasan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Pendaftar Baru" value={registrants.length} />
                            <StatCard title="Total Pengajuan Mutasi" value={mutations.length} />
                        </div>
                    </div>
                );
            case 'registrants':
                return <DataTable title="Data Pendaftar Baru" data={filteredRegistrants} type="registrant" searchTerm={searchRegistrants} setSearchTerm={setSearchRegistrants} handleCopy={handleCopy} openModal={openModal} />;
            case 'mutations':
                return <DataTable title="Data Pengajuan Mutasi" data={filteredMutations} type="mutation" searchTerm={searchMutations} setSearchTerm={setSearchMutations} handleCopy={handleCopy} openModal={openModal}/>;
            default: return null;
        }
    };
    
    const renderModalContent = () => {
        if (!modalState.type) return null;
        const { type, data, dataType } = modalState;
        
        const DetailView = ({ item }: { item: any }) => (
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
                    {Object.entries(editFormData).filter(([key]) => !['id', 'createdAt'].includes(key)).map(([key, value]) => (
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
                        <DetailView item={data} />
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
                        <p>Anda yakin ingin menghapus data untuk <strong>{data.fullName}</strong>? Tindakan ini tidak dapat diurungkan.</p>
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
        <div className="flex min-h-[calc(100vh-150px)] animate-fade-in bg-slate-100 rounded-lg relative">
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
            
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
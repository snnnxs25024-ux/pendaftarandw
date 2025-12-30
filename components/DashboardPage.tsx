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
import { createClient } from '@supabase/supabase-js'; // Import createClient for second DB
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { CameraIcon } from './icons/CameraIcon';
import { useNotification } from '../contexts/NotificationContext';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

// --- KONEKSI KE APLIKASI ABSENSI (DATABASE KEDUA) ---
// URL didapat dari gambar yang Anda berikan
const attendanceUrl = 'https://bcpcktordkkmatpibmfz.supabase.co';

// =====================================================================================
// !! PENTING: KESALAHAN "MANUAL SYNC FAILED" KEMUNGKINAN BESAR ADA DI SINI !!
// Kunci (Key) di bawah ini HARUS diganti dengan "anon" key dari PROYEK SUPABASE ABSENSI Anda.
// 
// CARA MEMPERBAIKI:
// 1. Buka dashboard Supabase untuk aplikasi ABSENSI Anda.
// 2. Pergi ke Settings -> API.
// 3. Di bagian "Project API keys", salin nilai dari kunci "anon" (public).
// 4. Tempel (paste) nilai tersebut di bawah ini untuk menggantikan kunci yang sekarang.
//    Kunci yang benar jauh lebih panjang dari yang ada sekarang.
// =====================================================================================
const attendanceAnonKey = 'sb_publishable_s6I8IKINuDFbOpQcDi0j3Q_16NKA91z'; // <--- GANTI NILAI INI

// Inisialisasi Client khusus untuk Absensi
const attendanceClient = createClient(attendanceUrl, attendanceAnonKey);


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
    status: string;
    generatedOpsId?: string; // New field for OpsID
    infoSource?: string; // New field for Info Source
    ktpImageUrl?: string; // New field for KTP image
    selfieImageUrl?: string; // New field for Selfie image
    createdAt: string;
}

interface Mutation {
    id: number;
    opsId: string;
    fullName: string;
    role: string;
    status: string;
    createdAt: string;
}

// --- HELPER: CSV EXPORT ---
const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Daftar kolom yang berisi angka panjang dan harus dipaksa jadi Teks di Excel
    // Agar tidak berubah jadi Scientific Notation (misal: 6.28E+10)
    const forceTextColumns = ['nik', 'phone', 'bankAccountNumber', 'opsId', 'generatedOpsId'];

    // Convert data to CSV format
    const csvContent = [
        headers.join(';'), // Menggunakan Titik Koma (;) untuk kompatibilitas Excel Indonesia
        ...data.map(row => 
            headers.map(fieldName => {
                let value = row[fieldName] || '';
                
                // Cek apakah kolom ini harus dipaksa jadi teks
                const isForceText = forceTextColumns.includes(fieldName);

                // Escape quotes and wrap in quotes if contains delimiter
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    
                    if (isForceText) {
                        // TRICK: Tambahkan ="..." agar Excel membacanya sebagai String murni
                        // Ini membuat kolom NIK/HP langsung lebar dan tidak terpotong
                        value = `="${value}"`;
                    } else if (value.includes(';') || value.includes('"') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }
                return value;
            }).join(';') // Menggunakan Titik Koma (;)
        )
    ].join('\n');

    // Create a Blob with BOM (\uFEFF) to ensure UTF-8 encoding works properly in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


// --- CHART COMPONENTS ---

// 1. Simple Donut Chart Component
const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let cumulativeAngle = 0;

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Belum ada data
            </div>
        );
    }

    // Helper to calculate SVG path for arc
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map((slice, index) => {
        const startAngle = cumulativeAngle;
        const sliceAngle = slice.value / total;
        cumulativeAngle += sliceAngle;
        const endAngle = cumulativeAngle;

        // Calculate path
        const [startX, startY] = getCoordinatesForPercent(startAngle);
        const [endX, endY] = getCoordinatesForPercent(endAngle);

        // If slice is 100%, draw full circle
        if (sliceAngle === 1) {
            return (
                <circle key={index} cx="0" cy="0" r="1" fill={slice.color} />
            );
        }

        const largeArcFlag = sliceAngle > 0.5 ? 1 : 0;

        const pathData = [
            `M ${startX} ${startY}`, // Move
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
            `L 0 0`, // Line to center
        ].join(' ');

        return <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.05" />;
    });

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
                 <svg viewBox="-1.2 -1.2 2.4 2.4" className="transform -rotate-90 w-full h-full">
                    {slices}
                    <circle cx="0" cy="0" r="0.6" fill="white" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800">{total}</span>
                    <span className="text-[10px] text-slate-500 uppercase">Total</span>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 w-full px-2">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center text-xs">
                        <span className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-600 truncate flex-1">{item.label}</span>
                        <span className="font-bold text-gray-800 ml-1">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2. Horizontal Bar Chart for Info Source
const HorizontalBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    const max = Math.max(...data.map(d => d.value));

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Belum ada data informasi
            </div>
        );
    }

    return (
        <div className="space-y-3 w-full">
            {data.map((item, i) => (
                <div key={i} className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-semibold truncate pr-2">{item.label}</span>
                        <span className="text-gray-900 font-bold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                            className="h-2 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    )
};


// 3. Smooth Area Chart Component
const AreaChart: React.FC<{ 
    data: { label: string; count: number; fullDate?: string }[]; 
    color: string; 
    gradientId: string;
}> = ({ data, color, gradientId }) => {
    
    // State to track hover
    const [activePoint, setActivePoint] = useState<any>(null);

    if (data.length === 0) return null;

    const height = 200;
    const width = 500;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => d.count), 5); // Minimum y-scale 5
    
    // Calculate points using useMemo to avoid recalc on hover
    const points = useMemo(() => data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - (d.count / maxVal) * (height - padding * 2) - padding;
        return { x, y, ...d };
    }), [data, maxVal]);

    // Simple smoothing function
    const lineCommand = (point: any, i: number, a: any[]) => {
        if (i === 0) return `M ${point.x},${point.y}`;
        const prev = a[i - 1];
        const cpsX = prev.x + (point.x - prev.x) / 3;
        const cpsY = prev.y;
        const cpeX = point.x - (point.x - prev.x) / 3;
        const cpeY = point.y;
        return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`;
    };

    const pathD = points.map((p, i, a) => lineCommand(p, i, a)).join(' ');
    
    const areaPathD = `
        ${pathD} 
        L ${points[points.length - 1].x},${height} 
        L ${points[0].x},${height} 
        Z
    `;

    // Render Tooltip Logic
    const renderTooltip = () => {
        if (!activePoint) return null;

        const { x, y, count } = activePoint;
        const tooltipW = 100;
        const tooltipH = 30;
        const arrowH = 6;
        
        let isOnTop = true;
        let boxY = y - tooltipH - arrowH - 4;
        let arrowY = y - 4; // Tip of arrow
        
        if (boxY < 0) {
            isOnTop = false;
            boxY = y + arrowH + 6;
            arrowY = y + 4; 
        }

        let boxX = x - tooltipW / 2;
        if (boxX < 0) boxX = 0;
        else if (boxX + tooltipW > width) boxX = width - tooltipW;

        const arrowPath = isOnTop
            ? `M ${x} ${arrowY} L ${x - 5} ${arrowY - arrowH} L ${x + 5} ${arrowY - arrowH} Z`
            : `M ${x} ${arrowY} L ${x - 5} ${arrowY + arrowH} L ${x + 5} ${arrowY + arrowH} Z`;

        return (
            <g className="pointer-events-none" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}>
                <rect 
                    x={boxX} y={boxY} 
                    width={tooltipW} height={tooltipH} 
                    rx="6" fill="#1e293b" 
                />
                <path d={arrowPath} fill="#1e293b" />
                <text 
                    x={boxX + tooltipW / 2} 
                    y={boxY + tooltipH / 2} 
                    dy="0.35em" 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="12" 
                    fontWeight="bold"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                    {count} Pendaftar
                </text>
            </g>
        );
    };

    return (
        <div className="w-full h-full relative" onMouseLeave={() => setActivePoint(null)}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                     const y = height - tick * (height - padding * 2) - padding;
                     return (
                         <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeDasharray="4" />
                     )
                })}

                <path d={areaPathD} fill={`url(#${gradientId})`} />
                <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((p, i) => (
                    <circle 
                        key={`hit-${i}`}
                        cx={p.x} cy={p.y} 
                        r="20"
                        fill="transparent" 
                        onMouseEnter={() => setActivePoint(p)}
                        className="cursor-pointer"
                    />
                ))}

                {points.map((p, i) => (
                    <circle 
                        key={`vis-${i}`}
                        cx={p.x} cy={p.y} 
                        r={activePoint === p ? 6 : 4} 
                        fill="white" stroke={color} strokeWidth="2" 
                        className="transition-all duration-200 pointer-events-none" 
                    />
                ))}
                
                {renderTooltip()}

                 {points.map((p, i) => (
                     <text key={i} x={p.x} y={height} dy="10" textAnchor="middle" fill="#94a3b8" fontSize="10" className="pointer-events-none">
                         {p.label}
                     </text>
                 ))}
            </svg>
        </div>
    );
};


// --- Data Table Component ---
const DataTable: React.FC<{ 
    title: string; 
    data: any[]; 
    type: 'registrant' | 'mutation';
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleCopy: (data: any, type: 'registrant' | 'mutation') => void;
    openModal: (type: 'view' | 'edit' | 'delete' | 'add', data: any, dataType: 'registrant' | 'mutation') => void;
    onStatusUpdate: (id: number, newStatus: string, type: 'registrant' | 'mutation') => void;
    onSync?: (data: any) => void;
    onBulkStatusUpdate: (ids: number[], newStatus: string, type: 'registrant' | 'mutation') => void;
    onBulkDelete: (ids: number[], type: 'registrant' | 'mutation') => void;
    copiedId: number | null;
}> = ({ title, data, type, searchTerm, setSearchTerm, handleCopy, openModal, onStatusUpdate, onSync, onBulkStatusUpdate, onBulkDelete, copiedId }) => {
    
    // Tab State
    const [activeTab, setActiveTab] = useState<string>('Semua');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // WA Editor State
    const [waModalOpen, setWaModalOpen] = useState(false);
    const [waMessage, setWaMessage] = useState('');
    const [waTargetPhone, setWaTargetPhone] = useState('');

    // Reset to page 1 and clear selection when search/tab changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [searchTerm, data.length, type, activeTab]);

    // --- Tab Filtering Logic ---
    const tabOptions = ['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Ditolak'];

    // Filter data based on active tab
    const filteredData = useMemo(() => {
        if (activeTab === 'Semua') return data;
        return data.filter(item => {
            const status = (item.status || 'Menunggu').toLowerCase();
            return status === activeTab.toLowerCase();
        });
    }, [data, activeTab]);

    // Calculate counts for each tab
    const getTabCount = (tab: string) => {
        if (tab === 'Semua') return data.length;
        return data.filter(item => {
            const status = (item.status || 'Menunggu').toLowerCase();
            return status === tab.toLowerCase();
        }).length;
    };

    // Calculate Pagination logic based on FILTERED data
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    // --- Selection Handlers ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all items ON THE CURRENT PAGE
            const idsOnPage = currentItems.map(item => item.id);
            // Merge with existing selection, avoid duplicates
            const newSelection = Array.from(new Set([...selectedIds, ...idsOnPage]));
            setSelectedIds(newSelection);
        } else {
            // Deselect all items ON THE CURRENT PAGE
            const idsOnPage = currentItems.map(item => item.id);
            const newSelection = selectedIds.filter(id => !idsOnPage.includes(id));
            setSelectedIds(newSelection);
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllSelected = currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id));
    const isIndeterminate = currentItems.some(item => selectedIds.includes(item.id)) && !isAllSelected;


    // --- Bulk Action Handlers ---
    const handleBulkStatus = (status: string) => {
        if (confirm(`Apakah Anda yakin ingin mengubah status ${selectedIds.length} data menjadi "${status}"?`)) {
            onBulkStatusUpdate(selectedIds, status, type);
            setSelectedIds([]); // Clear selection after action
        }
    };

    const handleBulkDel = () => {
        if (confirm(`PERINGATAN: Anda akan menghapus ${selectedIds.length} data secara permanen. Lanjutkan?`)) {
            onBulkDelete(selectedIds, type);
            setSelectedIds([]);
        }
    };

    const handleExportCSV = (selectedOnly: boolean) => {
        const rawData = selectedOnly 
            ? data.filter(item => selectedIds.includes(item.id))
            : filteredData;
        
        // Reorder columns strictly
        const dataToExport = rawData.map(item => {
            if (type === 'registrant') {
                return {
                    id: item.id,
                    generatedOpsId: item.generatedOpsId,
                    fullName: item.fullName,
                    nik: item.nik,
                    phone: item.phone,
                    religion: item.religion,
                    contractType: item.contractType,
                    bankName: item.bankName,
                    bankAccountName: item.bankAccountName,
                    bankAccountNumber: item.bankAccountNumber,
                    agency: item.agency,
                    department: item.department,
                    stationId: item.stationId,
                    infoSource: item.infoSource, // Export Info Source
                    status: item.status,
                    createdAt: item.createdAt
                };
            } else {
                return {
                    id: item.id,
                    opsId: item.opsId,
                    fullName: item.fullName,
                    role: item.role,
                    status: item.status,
                    createdAt: item.createdAt
                };
            }
        });
        
        const timestamp = new Date().toISOString().slice(0,10);
        const filename = `${type}_export_${timestamp}.csv`;
        downloadCSV(dataToExport, filename);
    };


    // Add Headers (Added 'Generated OpsID' for registrants)
    const headers = type === 'registrant' 
        ? ['Status', 'Nama Lengkap', 'NIK', 'Generated OpsID', 'No. WhatsApp', 'Info Dari'] 
        : ['Status', 'OpsID', 'Nama Lengkap', 'Role Diajukan'];
    
    // const [copiedId, setCopiedId] = useState<number | null>(null);

    const onCopy = (item: any) => {
        handleCopy(item, type);
        // setCopiedId handled inside handleCopy for async reasons or here? 
        // We moved it inside handleCopy to sync with clipboard success
    };

    const handleDirectWA = (item: any) => {
        const phone = item.phone || '';
        // 1. Remove non-numeric chars
        let cleanPhone = phone.replace(/\D/g, '');
        
        // 2. Replace leading '0' with '62'
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.slice(1);
        }
        
        setWaTargetPhone(cleanPhone);

        // 3. Prepare Data
        const rawStatus = item.status || '';
        const statusLower = rawStatus.toLowerCase().trim();
        const opsId = item.generatedOpsId ? String(item.generatedOpsId).trim() : '';
        const name = item.fullName;

        let message = '';

        // 4. Smart Template Logic
        if (type === 'registrant') {
            if (statusLower === 'diproses') {
                // Template PROSES
                message = `Halo, ${name} datamu lagi kami proses untuk pembuatan OpsID.\nTunggu sebentar ya, nanti kalau sudah jadi akan langsung kami infokan.`;
            } else if (statusLower === 'selesai' || opsId.length > 0) {
                // Template SELESAI
                message = `Halo, ${name} OpsID kamu sudah selesai diproses.\nSilakan datang ke Tenda Vendor NEXUS di gudang dan bertemu Pak Dimas pada pukul 12.00–15.00 untuk pengambilan OpsID serta informasi shift kerja.\n\nMohon membawa seragam sesuai ketentuan:\n\nBaju tidak berkerah\n\nCelana pendek tanpa kantung\n\nSepatu bertali tanpa kaos kaki\n\nLokasi Maps:\nhttps://maps.app.goo.gl/CQVH6wUpqUPTGmz48\n\n(Pergudangan DUNEX – Gudang I, Tenda Vendor NEXUS)`;
            } else {
                // Template Default/Kosong
                message = `Halo Sdr/i ${name}, `;
            }
        } else {
            // Template Default Mutasi
            message = `Halo Sdr/i ${name}, terkait pengajuan mutasi OpsID ${item.opsId}...`;
        }

        setWaMessage(message);
        setWaModalOpen(true);
    };

    const sendWhatsAppMessage = () => {
        if (!waTargetPhone) {
            alert("Nomor telepon tidak valid.");
            return;
        }
        const encodedMessage = encodeURIComponent(waMessage);
        window.open(`https://wa.me/${waTargetPhone}?text=${encodedMessage}`, 'wa_admin_tab');
        setWaModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        const s = status || 'Menunggu';
        switch (s.toLowerCase()) {
            case 'diproses': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'selesai': return 'bg-green-100 text-green-800 border-green-200';
            case 'ditolak': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; 
        }
    };

    // Helper functions for responsive rendering
    const renderStatusDropdown = (item: any) => (
        <div className="relative w-full md:w-auto">
            <select
                value={item.status || 'Menunggu'}
                onChange={(e) => onStatusUpdate(item.id, e.target.value, type)}
                className={`appearance-none block w-full px-3 py-1 pr-8 text-xs font-bold rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500 ${getStatusColor(item.status)}`}
            >
                <option value="Menunggu">Menunggu</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditolak">Ditolak</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    );

    const renderActions = (item: any) => (
        <div className="flex justify-end items-center space-x-2">
            {type === 'registrant' && onSync && (
                <button 
                    onClick={() => onSync(item)} 
                    title="Sync ke Absensi (Kirim Manual)"
                    disabled={!item.generatedOpsId}
                    className={`p-1 rounded-full transition-colors ${!item.generatedOpsId ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}`}
                >
                    <CloudArrowUpIcon className="w-5 h-5"/>
                </button>
            )}
            {type === 'registrant' && (
                <button 
                    onClick={() => handleDirectWA(item)} 
                    title="Kirim Pesan WA (Preview & Edit)"
                    className={`p-1 rounded-full transition-colors ${item.generatedOpsId ? 'text-white bg-green-500 hover:bg-green-600 shadow-md p-1.5' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
                >
                    <WhatsappIcon className="w-5 h-5"/>
                </button>
            )}
            <button onClick={() => onCopy(item)} title="Salin Data (Excel Compatible)" className="text-gray-500 hover:text-blue-600 disabled:opacity-50" disabled={copiedId === item.id}>
                {copiedId === item.id ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5"/>}
            </button>
            <button onClick={() => openModal('view', item, type)} title="Lihat Detail" className="text-gray-500 hover:text-green-600"><EyeIcon className="w-5 h-5"/></button>
            <button onClick={() => openModal('edit', item, type)} title="Edit Data" className="text-gray-500 hover:text-yellow-600"><PencilIcon className="w-5 h-5"/></button>
            <button onClick={() => openModal('delete', item, type)} title="Hapus" className="text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
        </div>
    );

    return (
        <div>
            {/* SEARCH & ADD TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="search"
                        placeholder="Cari..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 placeholder-slate-400 text-white rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    />
                    {type === 'registrant' && (
                        <button 
                            onClick={() => openModal('add', null, 'registrant')}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-semibold whitespace-nowrap"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Tambah</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TABBED FILTER NAVIGATION */}
            <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200 justify-between items-end">
                <div className="flex space-x-1">
                    {tabOptions.map((tab) => {
                        const count = getTabCount(tab);
                        const isActive = activeTab === tab;
                        
                        let badgeColor = "bg-gray-100 text-gray-500";
                        if (isActive) {
                             if (tab === 'Menunggu') badgeColor = "bg-yellow-200 text-yellow-800";
                             else if (tab === 'Diproses') badgeColor = "bg-blue-200 text-blue-800";
                             else if (tab === 'Selesai') badgeColor = "bg-green-200 text-green-800";
                             else if (tab === 'Ditolak') badgeColor = "bg-red-200 text-red-800";
                             else badgeColor = "bg-orange-200 text-orange-800";
                        }

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    whitespace-nowrap px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-2
                                    ${isActive 
                                        ? 'border-orange-500 text-orange-600 bg-orange-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {/* Global Export Button */}
                <button
                    onClick={() => handleExportCSV(false)}
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-semibold mb-2"
                    title="Download semua data dalam tabel ini ke CSV/Excel"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download CSV
                </button>
            </div>
            
            {/* BULK ACTION BAR */}
            {selectedIds.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-semibold text-orange-900">Data Terpilih</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <select 
                            onChange={(e) => handleBulkStatus(e.target.value)}
                            value=""
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-1.5"
                        >
                            <option value="" disabled>Ubah Status Massal...</option>
                            <option value="Menunggu">ke Menunggu</option>
                            <option value="Diproses">ke Diproses</option>
                            <option value="Selesai">ke Selesai</option>
                            <option value="Ditolak">ke Ditolak</option>
                        </select>
                        <div className="h-6 w-px bg-orange-300 hidden sm:block"></div>
                        <button 
                            onClick={() => handleExportCSV(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4 text-green-600" />
                            Export Terpilih
                        </button>
                        <button 
                            onClick={handleBulkDel}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 rounded text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Hapus
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4 mb-4">
                {/* Select All Checkbox for Mobile */}
                <div className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={input => { if (input) input.indeterminate = isIndeterminate }}
                        onChange={handleSelectAll}
                        className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Pilih Semua di Halaman Ini</span>
                </div>

                {currentItems.length > 0 ? (
                    currentItems.map(item => (
                        <div key={item.id} className={`bg-white p-5 rounded-xl shadow-md border ${selectedIds.includes(item.id) ? 'border-orange-400 ring-1 ring-orange-400' : 'border-slate-100'} flex flex-col gap-4 relative transition-all`}>
                            {/* Mobile Row Checkbox */}
                            <div className="absolute top-5 right-5">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => handleSelectOne(item.id)}
                                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                            </div>

                            <div className="flex justify-between items-start pr-10">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.fullName}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1">
                                        {type === 'registrant' ? item.nik : item.opsId}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="w-full">
                                {renderStatusDropdown(item)}
                            </div>

                            <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-3 rounded-lg">
                                {type === 'registrant' ? (
                                    <>
                                        {item.generatedOpsId && (
                                            <div className="flex justify-between border-b border-slate-200 pb-1">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">OpsID</span>
                                                <span className="font-mono font-bold text-blue-600">{item.generatedOpsId}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">WhatsApp</span>
                                            <span className="font-medium">{item.phone}</span>
                                        </div>
                                        {item.infoSource && (
                                            <div className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">Info Dari</span>
                                                <span className="font-medium">{item.infoSource}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Role</span>
                                        <span className="font-medium">{item.role}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex justify-end">
                                {renderActions(item)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow text-gray-500">
                        {searchTerm ? 'Tidak ada hasil.' : 'Tidak ada data untuk status ini.'}
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow flex-col mb-4"> 
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-orange-200 bg-orange-100 w-10">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={input => { if (input) input.indeterminate = isIndeterminate }}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                    />
                                </th>
                                {headers.map(h => <th key={h} className="px-5 py-3 border-b-2 border-orange-200 bg-orange-100 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">{h}</th>)}
                                <th className="px-5 py-3 border-b-2 border-orange-200 bg-orange-100 text-right text-xs font-semibold text-orange-800 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map(item => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-orange-50' : ''}`}>
                                        <td className="px-5 py-4 border-b border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => handleSelectOne(item.id)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm w-40">
                                            {renderStatusDropdown(item)}
                                        </td>
                                        {type === 'registrant' ? (<>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900 font-medium">{item.fullName}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600 font-mono">{item.nik}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm font-mono text-blue-600 font-bold">
                                                {item.generatedOpsId || '-'}
                                            </td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">{item.phone}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">{item.infoSource || '-'}</td>
                                        </>) : (<>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900 font-mono">{item.opsId}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900 font-medium">{item.fullName}</td>
                                            <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">{item.role}</td>
                                        </>)}
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                            {renderActions(item)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length + 2} className="text-center py-10 text-gray-500">
                                        {searchTerm ? 'Tidak ada hasil yang cocok.' : `Tidak ada data dengan status "${activeTab}".`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Footer */}
            {filteredData.length > 0 && (
                <div className="px-5 py-4 bg-white rounded-lg shadow border-t flex flex-col xs:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-gray-700 text-center xs:text-left">
                        Menampilkan <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredData.length)}</span> dari <span className="font-semibold text-gray-900">{filteredData.length}</span>
                    </span>
                    <div className="inline-flex gap-2">
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center justify-center px-4 h-10 rounded-full bg-orange-50 border border-orange-200 text-sm font-medium text-orange-700 shadow-sm whitespace-nowrap">
                            Hal {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* WA Editor Modal */}
            <Modal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} title="Kirim Pesan WhatsApp">
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                        Silakan tinjau dan edit pesan di bawah ini sebelum dikirim ke kandidat.
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Isi Pesan:</label>
                        <textarea
                            rows={10}
                            value={waMessage}
                            onChange={(e) => setWaMessage(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm font-sans"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={() => setWaModalOpen(false)} 
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={sendWhatsAppMessage} 
                            className="px-6 py-2 bg-green-500 text-white font-bold rounded shadow hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                            <WhatsappIcon className="w-5 h-5" />
                            Kirim ke WA
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
};

// --- Settings View Component ---
const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState({
        is_geolocation_enabled: false,
        target_latitude: -6.1338,
        target_longitude: 106.8767,
        max_distance_meters: 500,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) {
                setSettings(data);
            } else if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
                showNotification('Gagal memuat pengaturan: ' + error.message, 'error');
            }
            // If no data (PGRST116), it will just use the default state which is correct.
            setIsLoading(false);
        };
        fetchSettings();
    }, [showNotification]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Use upsert with a fixed id to create/update the single settings row
        const { error } = await supabase.from('settings').upsert({ id: 1, ...settings });
        
        if (error) {
            showNotification('Gagal menyimpan pengaturan: ' + error.message, 'error');
        } else {
            showNotification('Pengaturan berhasil disimpan!', 'success');
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="text-center p-10 text-gray-500">Memuat pengaturan...</div>;
    }

    return (
        <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
            <div className="pb-6 border-b border-gray-200">
                 <h2 className="text-3xl font-extrabold text-slate-800">Pengaturan Aplikasi</h2>
                <p className="text-gray-500 mt-1">Kelola fitur dan fungsionalitas aplikasi dari sini.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Kunci Lokasi (Geolocation Lock)</h3>
                <p className="text-gray-500 mb-6">Aktifkan fitur ini untuk membatasi akses pendaftaran hanya pada lokasi dan radius yang ditentukan.</p>
                
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                    <label htmlFor="is_geolocation_enabled" className="font-bold text-slate-700">Aktifkan Kunci Lokasi</label>
                    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="is_geolocation_enabled"
                            id="is_geolocation_enabled"
                            checked={settings.is_geolocation_enabled}
                            onChange={handleChange}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label htmlFor="is_geolocation_enabled" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                </div>

                {settings.is_geolocation_enabled && (
                    <div className="mt-6 space-y-4 animate-fade-in border-t pt-6">
                        <div>
                            <label htmlFor="target_latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="target_latitude"
                                id="target_latitude"
                                value={settings.target_latitude}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="target_longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="target_longitude"
                                id="target_longitude"
                                value={settings.target_longitude}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="max_distance_meters" className="block text-sm font-medium text-gray-700">Radius Jangkauan (dalam meter)</label>
                            <input
                                type="number"
                                name="max_distance_meters"
                                id="max_distance_meters"
                                value={settings.max_distance_meters}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div className="text-xs text-gray-500 p-3 bg-slate-50 rounded-md">
                            <strong>Cara mendapatkan koordinat:</strong> Buka Google Maps, klik kanan pada lokasi yang diinginkan, dan klik pada angka koordinat yang muncul untuk menyalin.
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-6">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors disabled:bg-gray-400"
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
            
            <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #f97316; }
                .toggle-checkbox:checked + .toggle-label { background-color: #f97316; }
            `}</style>
        </div>
    );
};

// --- Dashboard Page Component ---
const DashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    // CHANGE DEFAULT VIEW TO 'registrants'
    const [activeView, setActiveView] = useState<'dashboard' | 'registrants' | 'mutations' | 'settings'>('registrants');
    
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [mutations, setMutations] = useState<Mutation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchRegistrants, setSearchRegistrants] = useState('');
    const [searchMutations, setSearchMutations] = useState('');
    const { showNotification } = useNotification();

    // Analytics Chart State
    const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const [modalState, setModalState] = useState<{ type: 'view' | 'edit' | 'delete' | 'add' | null; data: any; dataType: 'registrant' | 'mutation' | null }>({ type: null, data: null, dataType: null });
    const [editFormData, setEditFormData] = useState<any>(null);
    
    // Add state for copiedId in DashboardPage so handleCopy can access it
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // --- State for OpsID Input Modal ---
    const [opsIdModalOpen, setOpsIdModalOpen] = useState(false);
    const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
    const [opsIdInput, setOpsIdInput] = useState('');
    
    // --- Error Handling Helper ---
    const getErrorMessage = (error: any, prefix: string): string => {
        let message = 'Terjadi kesalahan tidak dikenal.';
        if (typeof error?.message === 'string') {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        // Custom friendly messages
        if (message.toLowerCase().includes('jwt')) {
            return 'Gagal Sync: Kunci API (attendanceAnonKey) untuk database Absensi tidak valid. Mohon periksa kembali.';
        }
        if (message.toLowerCase().includes('rls')) {
            return 'Gagal Sync: Izin ditolak oleh database Absensi (RLS). Pastikan policy INSERT di tabel `workers` sudah aktif.';
        }
        if (message.toLowerCase().includes('on conflict') || message.toLowerCase().includes('unique constraint')) {
            return `Gagal Sync: Database Absensi menolak data karena ada duplikasi. Hubungi developer jika masalah berlanjut.`;
        }
        
        return `${prefix}: ${message}`;
    };


    const fetchRegistrants = useCallback(async () => {
        const { data, error } = await supabase.from('registrants').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching registrants:', JSON.stringify(error, null, 2));
            showNotification('Gagal memuat data pendaftar: ' + error.message, 'error');
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
                status: item.status, 
                generatedOpsId: item.generated_ops_id, // Fetch generated_ops_id
                infoSource: item.info_source, // Fetch info_source
                ktpImageUrl: item.ktp_image_url,
                selfieImageUrl: item.selfie_image_url,
                createdAt: new Date(item.created_at).toLocaleDateString('id-ID'),
            }));
            setRegistrants(formattedData);
        }
    }, [showNotification]);

    const fetchMutations = useCallback(async () => {
        const { data, error } = await supabase.from('mutations').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching mutations:', JSON.stringify(error, null, 2));
            showNotification('Gagal memuat data mutasi: ' + error.message, 'error');
        } else if (data) {
             const formattedData: Mutation[] = data.map(item => ({
                id: item.id,
                opsId: item.ops_id,
                fullName: item.full_name,
                role: item.role,
                status: item.status, 
                createdAt: new Date(item.created_at).toLocaleDateString('id-ID'),
            }));
            setMutations(formattedData);
        }
    }, [showNotification]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchRegistrants(), fetchMutations()]).finally(() => setLoading(false));
    }, [fetchRegistrants, fetchMutations]);
    
    // --- REALTIME SUBSCRIPTION EFFECT ---
    useEffect(() => {
        // Create a channel specifically for dashboard updates
        const channel = supabase
            .channel('dashboard-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'registrants' },
                (payload) => {
                    console.log('Realtime change received (registrants):', payload);
                    // Refresh data to ensure UI matches DB exactly (handled server side defaults, triggers etc)
                    fetchRegistrants();
                    showNotification('Data pendaftar diperbarui.', 'info');
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'mutations' },
                (payload) => {
                    console.log('Realtime change received (mutations):', payload);
                    fetchMutations();
                    showNotification('Data mutasi diperbarui.', 'info');
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchRegistrants, fetchMutations, showNotification]);


    // --- Chart Data Calculation Hook ---
    const chartData = useMemo(() => {
        if (registrants.length === 0) return [];

        const today = new Date();
        const data = [];

        // Helper to parse 'DD/MM/YYYY'
        const parseDate = (str: string) => {
            const [d, m, y] = str.split('/');
            return new Date(Number(y), Number(m) - 1, Number(d));
        };

        if (chartTimeframe === 'daily') {
            // Last 7 Days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateString = d.toLocaleDateString('id-ID'); // 'DD/MM/YYYY'
                
                // For label, show '14/10'
                const [day, month] = dateString.split('/');
                
                const count = registrants.filter(r => r.createdAt === dateString).length;
                data.push({ label: `${day}/${month}`, count, fullDate: dateString });
            }
        } else if (chartTimeframe === 'weekly') {
            // Last 8 Weeks
            for (let i = 7; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - (i * 7));
                
                // Find start of that week
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                const sunday = new Date(d.setDate(monday.getDate() + 6));
                
                // Label: "12 Okt - 18 Okt"
                const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                const label = `${monday.toLocaleDateString('id-ID', options)} - ${sunday.toLocaleDateString('id-ID', options)}`;
                
                // Count registrants in this range
                const count = registrants.filter(r => {
                    const regDate = parseDate(r.createdAt);
                    // Reset hours for accurate comparison
                    regDate.setHours(0,0,0,0);
                    monday.setHours(0,0,0,0);
                    sunday.setHours(23,59,59,999);
                    return regDate >= monday && regDate <= sunday;
                }).length;

                data.push({ label, count });
            }
        } else if (chartTimeframe === 'monthly') {
            // Last 6 Months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthName = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }); // "Okt 24"
                
                const targetMonth = d.getMonth();
                const targetYear = d.getFullYear();

                const count = registrants.filter(r => {
                    const regDate = parseDate(r.createdAt);
                    return regDate.getMonth() === targetMonth && regDate.getFullYear() === targetYear;
                }).length;

                data.push({ label: monthName, count });
            }
        }

        return data;
    }, [registrants, chartTimeframe]);

    // --- Status Distribution Data for Donut Chart ---
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {
            'Menunggu': 0,
            'Diproses': 0,
            'Selesai': 0,
            'Ditolak': 0
        };

        registrants.forEach(r => {
            const s = r.status || 'Menunggu';
            // Normalize
            const key = Object.keys(counts).find(k => k.toLowerCase() === s.toLowerCase()) || 'Menunggu';
            counts[key] = (counts[key] || 0) + 1;
        });

        return [
            { label: 'Selesai', value: counts['Selesai'], color: '#22c55e' }, // Green
            { label: 'Diproses', value: counts['Diproses'], color: '#3b82f6' }, // Blue
            { label: 'Menunggu', value: counts['Menunggu'], color: '#eab308' }, // Yellow
            { label: 'Ditolak', value: counts['Ditolak'], color: '#ef4444' }  // Red
        ].filter(d => d.value > 0);
    }, [registrants]);

    // --- Info Source Distribution Data for Bar Chart ---
    const infoSourceData = useMemo(() => {
        const counts: Record<string, number> = {};
        registrants.forEach(r => {
            const source = r.infoSource || 'Tidak Ada Info';
            counts[source] = (counts[source] || 0) + 1;
        });

        // Convert to array and sort
        return Object.entries(counts)
            .map(([label, value], index) => ({
                label,
                value,
                color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6] // Cycle colors
            }))
            .sort((a, b) => b.value - a.value); // Sort by highest
    }, [registrants]);


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
    const handleCopy = async (data: Registrant | Mutation, type: 'registrant' | 'mutation') => {
        try {
            // Prepare Data Fields
            let fields: { val: any; forceText?: boolean }[] = [];

            if (type === 'registrant') {
                const reg = data as Registrant;
                fields = [
                    { val: reg.fullName },
                    { val: reg.nik, forceText: true },
                    { val: reg.religion },
                    { val: '' },
                    { val: reg.contractType },
                    { val: reg.phone, forceText: true },
                    { val: reg.bankName },
                    { val: reg.bankAccountName },
                    { val: reg.bankAccountNumber, forceText: true },
                    { val: reg.agency },
                    { val: reg.department },
                    { val: reg.stationId },
                    { val: reg.infoSource } // Include Info Source in Copy
                ];
            } else {
                const mut = data as Mutation;
                fields = [
                    { val: mut.opsId, forceText: true },
                    { val: mut.role },
                    { val: mut.fullName }
                ];
            }

            // Helper to clean data for Text format (remove tabs/newlines inside data that break columns)
            const cleanForText = (val: any) => String(val || '').replace(/[\t\n\r]+/g, ' ').trim();

            // 1. TEXT Format (TSV) - Sanitized
            const textString = fields.map(f => cleanForText(f.val)).join('\t');
            const textBlob = new Blob([textString], { type: 'text/plain' });

            // 2. HTML Format (Table with Text Styles)
            // mso-number-format:'@' forces Excel to treat cell as Text
            const htmlRows = fields.map(f => {
                const style = f.forceText ? 'style="mso-number-format:\'@\'"' : '';
                return `<td ${style}>${f.val || ''}</td>`;
            }).join('');
            
            const htmlString = `
                <html>
                <body>
                    <table>
                        <tr>${htmlRows}</tr>
                    </table>
                </body>
                </html>
            `;
            const htmlBlob = new Blob([htmlString], { type: 'text/html' });

            // Execute Copy
            // Note: ClipboardItem is available in modern browsers
            if (typeof ClipboardItem !== 'undefined') {
                 await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': textBlob,
                        'text/html': htmlBlob
                    })
                ]);
            } else {
                // Fallback for older browsers
                await navigator.clipboard.writeText(textString);
            }

            showNotification('Data disalin! (Format Excel)', 'success');
            setCopiedId(data.id);
            setTimeout(() => setCopiedId(null), 2000);

        } catch (err) {
            console.error('Advanced copy failed, falling back to text:', err);
            // Emergency Fallback
            try {
                let fallbackText = '';
                // Use sanitization even in fallback
                const cleanForText = (val: any) => String(val || '').replace(/[\t\n\r]+/g, ' ').trim();

                if (type === 'registrant') {
                   const reg = data as Registrant;
                   fallbackText = [
                       cleanForText(reg.fullName), 
                       cleanForText(reg.nik), 
                       cleanForText(reg.religion), 
                       cleanForText(reg.contractType), 
                       cleanForText(reg.phone), 
                       cleanForText(reg.bankName), 
                       cleanForText(reg.bankAccountName), 
                       cleanForText(reg.bankAccountNumber), 
                       cleanForText(reg.agency), 
                       cleanForText(reg.department), 
                       cleanForText(reg.stationId),
                       cleanForText(reg.infoSource)
                    ].join('\t');
                } else {
                   const mut = data as Mutation;
                   fallbackText = [
                       cleanForText(mut.opsId), 
                       cleanForText(mut.role), 
                       cleanForText(mut.fullName)
                    ].join('\t');
                }
                await navigator.clipboard.writeText(fallbackText);
                showNotification('Data disalin (Mode Teks Biasa)', 'success');
                setCopiedId(data.id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (e) {
                showNotification('Gagal menyalin data', 'error');
            }
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string, type: 'registrant' | 'mutation') => {
        // SPECIAL CASE: If Registrant and Status is 'Selesai', prompt for OpsID
        if (type === 'registrant' && newStatus === 'Selesai') {
            setPendingStatusId(id);
            setOpsIdInput(''); // Reset input
            setOpsIdModalOpen(true);
            return; // Stop here, wait for modal
        }
        updateStatusInDB([id], newStatus, type);
    };

    const handleBulkStatusUpdate = async (ids: number[], newStatus: string, type: 'registrant' | 'mutation') => {
        // For bulk updates to "Selesai", we skip the OpsID prompt to avoid complexity for now, 
        // OR we could just set status without OpsID (user has to edit manually later). 
        // Let's set status and notify.
        updateStatusInDB(ids, newStatus, type);
    };

    const updateStatusInDB = async (ids: number[], newStatus: string, type: 'registrant' | 'mutation') => {
        const table = type === 'registrant' ? 'registrants' : 'mutations';
        
        // Optimistic UI update
        if (type === 'registrant') {
            setRegistrants(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: newStatus } : r));
        } else {
            setMutations(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: newStatus } : m));
        }

        const { error } = await supabase.from(table).update({ status: newStatus }).in('id', ids);

        if (error) {
            console.error('Error updating status:', JSON.stringify(error, null, 2));
            showNotification(`Gagal memperbarui status: ${error.message || 'Lihat console'}`, 'error');
            if (type === 'registrant') fetchRegistrants(); 
            else fetchMutations();
        } else {
            const count = ids.length;
            showNotification(count > 1 ? `${count} data diperbarui ke status: ${newStatus}` : `Status diubah menjadi: ${newStatus}`, 'success');
        }
    };
    
    const handleBulkDelete = async (ids: number[], type: 'registrant' | 'mutation') => {
        const table = type === 'registrant' ? 'registrants' : 'mutations';
        
        const { error } = await supabase.from(table).delete().in('id', ids);

        if (error) {
            console.error('Error deleting data:', JSON.stringify(error, null, 2));
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        } else {
            if (type === 'registrant') await fetchRegistrants();
            else await fetchMutations();
            showNotification(`${ids.length} data berhasil dihapus permanen`, 'success');
        }
    };

    // --- Refactored Sync Logic ---
    const performSync = async (opsId: string, nik: string, payload: any) => {
        // 1. Check if worker exists by either ops_id or nik
        const { data: existingWorker, error: selectError } = await attendanceClient
            .from('workers')
            .select('id')
            .or(`ops_id.eq.${opsId},nik.eq.${nik}`)
            .limit(1)
            .single();
    
        if (selectError && selectError.code !== 'PGRST116') { // Ignore "Not Found"
            throw selectError;
        }
    
        let finalError = null;
    
        if (existingWorker) {
            // 2a. Update existing worker using its primary key for safety
            const { error: updateError } = await attendanceClient
                .from('workers')
                .update(payload)
                .eq('id', existingWorker.id);
            finalError = updateError;
        } else {
            // 2b. Insert new worker (payload already includes ops_id)
            const { error: insertError } = await attendanceClient
                .from('workers')
                .insert(payload);
            finalError = insertError;
        }
        
        if (finalError) {
            throw finalError;
        }
    };

    const handleManualSync = async (item: Registrant) => {
        if (!item.generatedOpsId || !item.nik) {
            showNotification('Gagal sinkronisasi: OpsID atau NIK tidak boleh kosong.', 'error');
            return;
        }

        const payload = {
            ops_id: item.generatedOpsId,
            full_name: item.fullName,
            nik: item.nik,
            phone: item.phone,
            department: 'SOC Operator',
            status: 'Active',
            contract_type: item.contractType,
        };

        try {
            await performSync(item.generatedOpsId, item.nik, payload);
            showNotification(`Berhasil sinkronisasi data ${item.fullName} ke Aplikasi Absensi!`, 'success');
        } catch(error) {
            console.error('Manual Sync Failed:', error);
            const errorMessage = getErrorMessage(error, 'Gagal Sync ke Absensi');
            showNotification(errorMessage, 'error');
        }
    };

    // --- Submit OpsID Modal & Sync to Attendance App ---
    const submitOpsId = async () => {
        if (!pendingStatusId || !opsIdInput) {
            showNotification('OpsID tidak boleh kosong!', 'error');
            return;
        }

        const registrantData = registrants.find(r => r.id === pendingStatusId);

        if (!registrantData || !registrantData.nik) {
            showNotification('Data Pendaftar (terutama NIK) tidak ditemukan untuk sinkronisasi.', 'error');
            return;
        }

        const { error: localUpdateError } = await supabase.from('registrants')
            .update({ 
                status: 'Selesai',
                generated_ops_id: opsIdInput 
            })
            .eq('id', pendingStatusId);

        if (localUpdateError) {
             console.error('Error updating OpsID:', JSON.stringify(localUpdateError, null, 2));
             showNotification(`Gagal menyimpan OpsID: ${localUpdateError.message}`, 'error');
             return;
        }
        
        showNotification(`Status Selesai! OpsID ${opsIdInput} berhasil disimpan.`, 'success');
        
        const payload = {
            ops_id: opsIdInput,
            full_name: registrantData.fullName,
            nik: registrantData.nik,
            phone: registrantData.phone,
            department: 'SOC Operator',
            status: 'Active',
            contract_type: registrantData.contractType,
        };

        try {
            await performSync(opsIdInput, registrantData.nik, payload);
            showNotification('Data juga berhasil dikirim ke sistem Absensi.', 'success');
        } catch (syncError) {
            console.error('Sync Absensi Gagal:', syncError);
            const errorMessage = getErrorMessage(syncError, 'Gagal sinkronisasi ke Absensi');
            showNotification(errorMessage, 'error');
        }

        await fetchRegistrants(); 
        setOpsIdModalOpen(false);
        setPendingStatusId(null);
        setOpsIdInput('');
    };

    const cancelOpsId = () => {
        setOpsIdModalOpen(false);
        setPendingStatusId(null);
        setOpsIdInput('');
    };

    const openModal = (type: 'view' | 'edit' | 'delete' | 'add', data: any, dataType: 'registrant' | 'mutation') => {
        setModalState({ type, data, dataType });
        if(type === 'edit') setEditFormData({ ...data, status: data.status || 'Menunggu' });
        if(type === 'add' && dataType === 'registrant') {
            setEditFormData({
                fullName: '', nik: '', religion: '', phone: '',
                bankName: '', bankAccountName: '', bankAccountNumber: '',
                contractType: 'Daily Worker Vendor - NEXUS',
                agency: 'NEXUS', department: 'SOC Operator', stationId: 'Sunter DC',
                status: 'Menunggu',
                infoSource: ''
            });
        }
    };
    
    const closeModal = () => {
        setModalState({ type: null, data: null, dataType: null });
        setEditFormData(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        if (!editFormData) return;
        const { id, ...rest } = editFormData;
        
        let error = null;

        if (modalState.type === 'add') {
             // INSERT NEW DATA
             if (modalState.dataType === 'registrant') {
                 const { fullName, nik, religion, contractType, phone, bankName, bankAccountName, bankAccountNumber, agency, department, stationId, infoSource } = rest;
                 const result = await supabase.from('registrants').insert([{
                     full_name: fullName, nik, religion, contract_type: contractType, phone,
                     bank_name: bankName, bank_account_name: bankAccountName, bank_account_number: bankAccountNumber,
                     agency, department, station_id: stationId, status: 'Menunggu',
                     info_source: infoSource
                 }]);
                 error = result.error;
             }
        } else {
            // UPDATE EXISTING DATA
            if (modalState.dataType === 'registrant') {
                const { fullName, nik, religion, contractType, phone, bankName, bankAccountName, bankAccountNumber, agency, department, stationId, status, generatedOpsId, infoSource } = rest;
                const result = await supabase.from('registrants').update({
                    full_name: fullName, nik, religion, contract_type: contractType, phone,
                    bank_name: bankName, bank_account_name: bankAccountName, bank_account_number: bankAccountNumber,
                    agency, department, station_id: stationId, status,
                    generated_ops_id: generatedOpsId, // Allow editing this too
                    info_source: infoSource
                }).eq('id', id);
                error = result.error;

            } else if (modalState.dataType === 'mutation') {
                const { opsId, fullName, role, status } = rest;
                const result = await supabase.from('mutations').update({
                    ops_id: opsId, full_name: fullName, role, status
                }).eq('id', id);
                error = result.error;
            }
        }
        
        if (error) {
             console.error('Error saving changes:', JSON.stringify(error, null, 2));
             showNotification('Gagal menyimpan: ' + error.message, 'error');
        } else {
            if (modalState.dataType === 'registrant') await fetchRegistrants();
            else await fetchMutations();
            showNotification(modalState.type === 'add' ? 'Data berhasil ditambahkan' : 'Data berhasil diperbarui', 'success');
            closeModal();
        }
    };

    const handleDelete = async () => {
        const { data, dataType } = modalState;
        if (!data || !dataType) return;

        const fromTable = dataType === 'registrant' ? 'registrants' : 'mutations';
        const { error } = await supabase.from(fromTable).delete().eq('id', data.id);

        if (error) {
            console.error('Error deleting data:', JSON.stringify(error, null, 2));
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        } else {
            if (dataType === 'registrant') await fetchRegistrants();
            else await fetchMutations();
            showNotification('Data berhasil dihapus', 'success');
            closeModal();
        }
    };

    // --- Render Helper Components ---
    const SideBarCard: React.FC<{
      icon: React.ReactNode;
      label: string;
      description: string;
      view: 'dashboard' | 'registrants' | 'mutations' | 'settings';
    }> = ({ icon, label, description, view }) => (
      <button
        onClick={() => setActiveView(view)}
        className={`w-full text-left p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
          activeView === view 
          ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-200' 
          : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-100'
        }`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-bold text-lg">{label}</span>
        </div>
        <p className={`mt-2 text-sm ${activeView === view ? 'text-orange-100' : 'text-slate-400'}`}>{description}</p>
      </button>
    );

    const StatCard: React.FC<{ title: string; value: string | number; color: 'blue' | 'orange' | 'purple' }> = ({ title, value, color }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            orange: 'bg-orange-50 text-orange-600 border-orange-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100'
        };

        return (
            <div className={`p-6 rounded-2xl shadow-sm border ${colorClasses[color]} border-opacity-60 flex flex-col justify-center h-full relative overflow-hidden group hover:shadow-md transition-shadow`}>
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {color === 'blue' && <UsersIcon className="w-24 h-24" />}
                    {color === 'orange' && <ChartBarIcon className="w-24 h-24" />}
                    {color === 'purple' && <ArrowsRightLeftIcon className="w-24 h-24" />}
                </div>
                <h3 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider relative z-10">{title}</h3>
                <p className="text-4xl font-extrabold text-slate-800 relative z-10">{value}</p>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-20 text-gray-500 animate-pulse">Sedang memuat data dashboard...</div>;
        }

        switch (activeView) {
            case 'dashboard':
                // Analytics Data Handling
                const todayStr = new Date().toLocaleDateString('id-ID');
                const dailyRegistrants = registrants.filter(r => r.createdAt === todayStr).length;

                // Dynamic Chart Styles based on Timeframe
                let chartTitle = 'Tren Pendaftaran (7 Hari)';
                let chartColor = '#f97316'; // orange-500
                let gradientId = 'orangeGradient';

                if (chartTimeframe === 'weekly') {
                    chartTitle = 'Tren Mingguan (8 Minggu)';
                    chartColor = '#8b5cf6'; // violet-500
                    gradientId = 'violetGradient';
                } else if (chartTimeframe === 'monthly') {
                    chartTitle = 'Tren Bulanan (6 Bulan)';
                    chartColor = '#14b8a6'; // teal-500
                    gradientId = 'tealGradient';
                }

                return (
                    <div className="animate-fade-in pb-10 space-y-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800">Overview Dashboard</h2>
                                <p className="text-gray-500 mt-1">Selamat datang kembali, Admin.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-400">Hari ini</p>
                                <p className="text-lg font-bold text-orange-600">
                                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Pendaftar" value={registrants.length} color="blue" />
                            <StatCard title="Pendaftar Hari Ini" value={dailyRegistrants} color="orange" />
                            <StatCard title="Total Mutasi" value={mutations.length} color="purple" />
                        </div>

                        {/* Charts Section Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Area Chart (Span 2) */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-gray-100`}>
                                            <ChartBarIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                        {chartTitle}
                                    </h3>
                                    
                                    {/* Timeframe Switcher */}
                                    <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                                        {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setChartTimeframe(tf)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                                    chartTimeframe === tf 
                                                    ? 'bg-white text-slate-800 shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {tf === 'daily' ? 'Harian' : tf === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-grow w-full h-64">
                                     <AreaChart data={chartData} color={chartColor} gradientId={gradientId} />
                                </div>
                            </div>

                            {/* Side Stacked Charts (Span 1) */}
                            <div className="flex flex-col gap-6">
                                {/* Donut Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-gray-100`}>
                                                <CheckCircleIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                        Status
                                    </h3>
                                    <div className="flex-grow">
                                        <DonutChart data={statusData} />
                                    </div>
                                </div>

                                {/* Info Source Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-gray-100`}>
                                                <UsersIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                        Sumber Info
                                    </h3>
                                    <div className="flex-grow">
                                        <HorizontalBarChart data={infoSourceData} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'registrants':
                return <DataTable 
                    title="Data Pendaftar Baru" 
                    data={filteredRegistrants} 
                    type="registrant" 
                    searchTerm={searchRegistrants} 
                    setSearchTerm={setSearchRegistrants} 
                    handleCopy={handleCopy} 
                    openModal={openModal} 
                    onStatusUpdate={handleStatusUpdate} 
                    onSync={handleManualSync}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkDelete={handleBulkDelete}
                    copiedId={copiedId}
                />;
            case 'mutations':
                return <DataTable 
                    title="Data Pengajuan Mutasi" 
                    data={filteredMutations} 
                    type="mutation" 
                    searchTerm={searchMutations} 
                    setSearchTerm={setSearchMutations} 
                    handleCopy={handleCopy} 
                    openModal={openModal} 
                    onStatusUpdate={handleStatusUpdate}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkDelete={handleBulkDelete}
                    copiedId={copiedId}
                />;
            case 'settings':
                return <SettingsView />;
            default: return null;
        }
    };
    
    const renderModalContent = () => {
        if (!modalState.type) return null;
        const { type, data, dataType } = modalState;
        
        const DetailView = ({ item }: { item: Registrant | Mutation }) => {
            // New Landscape Layout for Registrant
            if (dataType === 'registrant') {
                const registrant = item as Registrant;
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Profile */}
                            <div className="lg:col-span-1 space-y-4">
                                {registrant.selfieImageUrl ? (
                                    <a href={registrant.selfieImageUrl} target="_blank" rel="noopener noreferrer" title="Klik untuk melihat gambar penuh">
                                        <img 
                                            src={registrant.selfieImageUrl} 
                                            alt="Foto Selfie" 
                                            className="w-full h-auto rounded-lg border-2 border-slate-200 object-cover aspect-square cursor-pointer hover:border-orange-400 transition"
                                        />
                                    </a>
                                ) : (
                                    <div className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-slate-400 text-sm text-center">
                                        <CameraIcon className="w-12 h-12 mb-2" />
                                        <span>Foto Selfie tidak tersedia.</span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 break-words">{registrant.fullName}</h3>
                                    <p className="text-sm text-slate-500 font-mono">{registrant.nik}</p>
                                </div>
                            </div>

                            {/* Right Column: Details */}
                            <div className="lg:col-span-2 max-h-[400px] overflow-y-auto pr-3 space-y-1 text-sm">
                                {Object.entries(registrant)
                                    .filter(([key]) => !['id', 'fullName', 'nik', 'ktpImageUrl', 'selfieImageUrl', 'createdAt'].includes(key))
                                    .map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-2 gap-4 py-2.5 border-b last:border-0">
                                            <span className="font-semibold capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="text-gray-800 break-words">{value ?? '-'}</span>
                                        </div>
                                ))}
                                <div className="grid grid-cols-2 gap-4 py-2.5 border-b last:border-0">
                                    <span className="font-semibold capitalize text-gray-600">Created At</span>
                                    <span className="text-gray-800 break-words">{registrant.createdAt ?? '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: KTP */}
                        <div className="pt-6 border-t">
                            <h4 className="font-bold text-slate-800 mb-2 text-base">Dokumen KTP</h4>
                            {registrant.ktpImageUrl ? (
                                <a href={registrant.ktpImageUrl} target="_blank" rel="noopener noreferrer" title="Klik untuk melihat gambar penuh">
                                    <img 
                                        src={registrant.ktpImageUrl} 
                                        alt="Foto KTP" 
                                        className="w-full h-auto rounded-lg border-2 border-slate-200 object-contain max-h-80 cursor-pointer hover:border-orange-400 transition"
                                    />
                                </a>
                            ) : (
                                <div className="w-full h-40 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-slate-400 text-sm text-center">
                                    <IdentificationIcon className="w-10 h-10 mb-2" />
                                    <span>Foto KTP tidak tersedia.</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            
            // Fallback for Mutation (old portrait style)
            return (
                <div className="space-y-2 text-sm max-h-[70vh] overflow-y-auto pr-2">
                    {Object.entries(item)
                        .map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b last:border-0">
                                <span className="font-semibold capitalize text-gray-600 col-span-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-gray-800 col-span-2 break-words">{String(value)}</span>
                            </div>
                    ))}
                </div>
            );
        };

        const EditForm = () => {
            if (!editFormData) return null;
            return (
                <form className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                    {/* ONLY SHOW STATUS for Edit Mode, NOT Add Mode */}
                    {modalState.type === 'edit' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status Proses</label>
                            <select
                                name="status"
                                value={editFormData.status}
                                onChange={handleEditFormChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="Menunggu">Menunggu</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>
                    )}

                    {/* Explicity Show Generated OpsID for Registrants (Edit Mode Only) */}
                    {modalState.type === 'edit' && modalState.dataType === 'registrant' && (
                        <div className="bg-orange-50 p-3 rounded-md border border-orange-200 my-2">
                            <label className="block text-sm font-bold text-orange-800">Generated OpsID</label>
                            <input
                                type="text"
                                name="generatedOpsId"
                                value={editFormData.generatedOpsId || ''}
                                onChange={handleEditFormChange}
                                placeholder="Kosongkan jika ingin menghapus"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-orange-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-orange-900 font-mono"
                            />
                            <p className="text-xs text-orange-700 mt-1 italic">*Edit nomor ini jika salah input, atau hapus isinya untuk membatalkan.</p>
                        </div>
                    )}

                    {Object.entries(editFormData)
                        .filter(([key]) => !['id', 'createdAt', 'status', 'generatedOpsId', 'ktpImageUrl', 'selfieImageUrl'].includes(key)) // Filter out manually handled fields
                        .map(([key, value]) => (
                        <div key={key}>
                            {key === 'infoSource' ? (
                                <>
                                    <label className="block text-sm font-medium text-gray-700 capitalize">Info Dari</label>
                                    <select
                                        name="infoSource"
                                        value={editFormData.infoSource || ''}
                                        onChange={handleEditFormChange}
                                        className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="" disabled>Pilih Sumber Informasi</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="WhatsApp Status/Group">WhatsApp Status/Group</option>
                                        <option value="Teman/Kerabat">Teman/Kerabat</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type="text"
                                        name={key}
                                        value={editFormData[key] || ''}
                                        onChange={handleEditFormChange}
                                        className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </form>
            );
        };
        
        switch (type) {
            case 'view':
                const modalSize = dataType === 'registrant' ? '4xl' : 'md';
                return (
                    <Modal isOpen={!!type} onClose={closeModal} title={`Detail ${dataType === 'registrant' ? 'Pendaftar' : 'Mutasi'}`} size={modalSize}>
                        <DetailView item={data} />
                        <button onClick={closeModal} className="mt-6 w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Tutup</button>
                    </Modal>
                );
            case 'edit':
            case 'add':
                 return (
                    <Modal isOpen={!!type} onClose={closeModal} title={`${type === 'add' ? 'Tambah' : 'Edit'} ${dataType === 'registrant' ? 'Pendaftar' : 'Mutasi'}`}>
                        <EditForm />
                        <div className="mt-6 flex gap-4">
                            <button onClick={closeModal} className="w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Batal</button>
                            <button onClick={handleSaveChanges} className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Simpan</button>
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
        <div className="flex min-h-[calc(100vh-150px)] animate-fade-in bg-slate-100/90 rounded-lg relative backdrop-blur-sm">
            {/* Sidebar */}
            <aside className="w-72 bg-white/95 backdrop-blur-md p-6 flex flex-col shadow-lg hidden md:flex rounded-l-lg border-r border-slate-100">
                <div className="mb-8 px-2">
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Admin<span className="text-orange-600">Panel</span></h1>
                </div>
                <nav className="flex-grow space-y-4">
                    <SideBarCard
                        icon={<ChartBarIcon className="w-6 h-6" />}
                        label="Dashboard"
                        description="Statistik & Ringkasan"
                        view="dashboard"
                    />
                    <SideBarCard
                        icon={<UsersIcon className="w-6 h-6" />}
                        label="Pendaftar Baru"
                        description="Data Calon Pekerja"
                        view="registrants"
                    />
                    <SideBarCard
                        icon={<ArrowsRightLeftIcon className="w-6 h-6" />}
                        label="Mutasi"
                        description="Pengajuan Pindah"
                        view="mutations"
                    />
                    <SideBarCard
                        icon={<Cog6ToothIcon className="w-6 h-6" />}
                        label="Pengaturan"
                        description="Kelola fitur aplikasi"
                        view="settings"
                    />
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-100">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-slate-500 hover:bg-red-50 hover:text-red-600 group"
                    >
                        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </aside>
            
            {/* Mobile Sidebar Replacement (Horizontal Nav) */}
             <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50">
                 <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-2 ${activeView === 'dashboard' ? 'text-orange-600' : 'text-gray-500'}`}>
                    <ChartBarIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">Dash</span>
                 </button>
                 <button onClick={() => setActiveView('registrants')} className={`flex flex-col items-center p-2 ${activeView === 'registrants' ? 'text-orange-600' : 'text-gray-500'}`}>
                    <UsersIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">Pendaftar</span>
                 </button>
                 <button onClick={() => setActiveView('mutations')} className={`flex flex-col items-center p-2 ${activeView === 'mutations' ? 'text-orange-600' : 'text-gray-500'}`}>
                    <ArrowsRightLeftIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">Mutasi</span>
                 </button>
                 <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center p-2 ${activeView === 'settings' ? 'text-orange-600' : 'text-gray-500'}`}>
                    <Cog6ToothIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">Atur</span>
                </button>
                 <button onClick={onLogout} className="flex flex-col items-center p-2 text-gray-500">
                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">Logout</span>
                 </button>
             </div>


            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 overflow-auto mb-16 md:mb-0">
                {renderContent()}
            </main>
            
            {/* CRUD Modals */}
            {renderModalContent()}

            {/* OpsID Input Modal */}
            <Modal isOpen={opsIdModalOpen} onClose={cancelOpsId} title="Input OpsID Kandidat">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Anda menandai status pendaftar ini sebagai <strong>Selesai</strong>. 
                        Silakan masukkan <strong>OpsID</strong> yang diberikan kepada kandidat ini untuk disimpan ke dalam sistem.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Generated OpsID</label>
                        <input 
                            type="text" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 font-bold tracking-wide"
                            placeholder="Contoh: 2400123"
                            value={opsIdInput}
                            onChange={(e) => setOpsIdInput(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={cancelOpsId} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Batal</button>
                        <button onClick={submitOpsId} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold">Simpan & Selesaikan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardPage;
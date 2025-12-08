import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ApplicantDB, JobPlacement, JobPosition, JobClient } from '../types';
import { 
  LogOut, 
  Search, 
  FileText, 
  Download, 
  X, 
  User, 
  LayoutDashboard,
  CheckCircle,
  MessageCircle,
  Trash2,
  Edit,
  Save,
  Plus,
  Copy,
  CheckSquare,
  Square,
  ArrowUpDown,
  Settings,
  StickyNote,
  Building2,
  Briefcase,
  MapPin,
  Eye,
  EyeOff,
  GraduationCap,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  Calendar,
  Clock,
  Video,
  History,
  MoreVertical,
  Check,
  Phone
} from 'lucide-react';

const PIC_OPTIONS = ['SUNAN', 'ADMIN', 'REKRUTER'];
const ITEMS_PER_PAGE = 20;

// ... (Chart Components & WA Templates remain same)
const SimpleLineChart = ({ data, color = '#3b82f6' }: { data: number[], color?: string }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-gray-400 text-xs">Data tidak cukup</div>;
    const max = Math.max(...data, 1);
    const points = data.map((val, i) => { const x = (i / (data.length - 1)) * 100; const y = 100 - (val / max) * 100; return `${x},${y}`; }).join(' ');
    return ( <div className="h-40 w-full relative"> <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible"> <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" /> <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" /> <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="0.5" /> <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> <polygon fill={color} fillOpacity="0.1" points={`0,100 ${points} 100,100`} /> {data.map((val, i) => { const x = (i / (data.length - 1)) * 100; const y = 100 - (val / max) * 100; return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" /> })} </svg> </div> );
};
const SimpleDonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0; if (total === 0) return <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Belum ada data</div>;
    const gradientParts = data.map(item => { const start = cumulativePercent; const percent = (item.value / total) * 100; cumulativePercent += percent; return `${item.color} ${start}% ${cumulativePercent}%`; }).join(', ');
    return ( <div className="flex items-center gap-6"> <div className="w-32 h-32 rounded-full relative shrink-0" style={{ background: `conic-gradient(${gradientParts})` }}> <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col"> <span className="text-xs text-gray-400">Total</span> <span className="text-xl font-bold text-gray-800">{total}</span> </div> </div> <div className="flex-1 space-y-2"> {data.map((item, idx) => ( <div key={idx} className="flex items-center justify-between text-xs"> <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background: item.color}}></span><span className="text-gray-600">{item.label}</span></div> <span className="font-bold text-gray-800">{item.value} ({Math.round((item.value/total)*100)}%)</span> </div> ))} </div> </div> );
};
const SimpleBarChart = ({ data }: { data: { label: string, value: number }[] }) => {
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Belum ada data</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    return ( <div className="space-y-3"> {data.map((item, idx) => ( <div key={idx} className="space-y-1"> <div className="flex justify-between text-xs"><span className="text-gray-600 font-medium truncate max-w-[150px]">{item.label}</span><span className="text-gray-800 font-bold">{item.value}</span></div> <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${(item.value / max) * 100}%` }} /></div> </div> ))} </div> );
};

const WA_TEMPLATES = [
  { id: 'interview', label: '📅 Undangan Interview', color: 'bg-blue-50 text-blue-700 border-blue-200', getMessage: (name: string, pos: string) => `Halo Sdr/i *${name}*, kami dari Tim Rekrutmen PT Swapro International.\n\nBerdasarkan lamaran Anda untuk posisi *${pos}*, kami ingin mengundang Anda untuk mengikuti sesi Interview pada:\n\nHari/Tgl: \nJam: \nLokasi: \n\nMohon konfirmasi kehadirannya. Terima kasih.` },
  { id: 'lolos', label: '✅ Lolos Berkas', color: 'bg-green-50 text-green-700 border-green-200', getMessage: (name: string, pos: string) => `Selamat Pagi/Siang *${name}*,\n\nSelamat! Berkas lamaran Anda untuk posisi *${pos}* telah lolos seleksi administrasi di PT Swapro International.\n\nMohon kesediaannya untuk menunggu jadwal interview selanjutnya yang akan kami informasikan segera.` },
  { id: 'revisi', label: '⚠️ Minta Revisi Data', color: 'bg-amber-50 text-amber-700 border-amber-200', getMessage: (name: string, _pos: string) => `Halo *${name}*,\n\nMohon maaf kami belum dapat memproses lamaran Anda lebih lanjut dikarenakan foto dokumen (KTP/CV) yang terlampir kurang jelas/buram.\n\nMohon kirimkan ulang foto dokumen yang jelas ke nomor ini agar bisa kami proses. Terima kasih.` },
  { id: 'tolak', label: '❌ Penolakan Halus', color: 'bg-red-50 text-red-700 border-red-200', getMessage: (name: string, pos: string) => `Halo *${name}*,\n\nTerima kasih telah melamar di PT Swapro International. Untuk saat ini kualifikasi Anda belum sesuai dengan kebutuhan kami untuk posisi *${pos}*.\n\nData Anda akan kami simpan untuk kebutuhan lowongan di masa mendatang. Sukses selalu!` },
  { id: 'custom', label: '💬 Chat Manual', color: 'bg-gray-50 text-gray-700 border-gray-200', getMessage: (name: string, _pos: string) => `Halo ${name}, ` }
];

// ... (Interfaces remain same)
interface DashboardProps { onLogout: () => void; }
type TabType = 'dashboard' | 'talent_pool' | 'process' | 'interview_schedule' | 'rejected' | 'hired' | 'master_data';
type DetailTab = 'profile' | 'qualification' | 'documents';
interface InterviewEvent { id: number; applicant_id: number; applicant_name: string; position: string; client_name: string; branch_name: string; date: string; time: string; type: 'Online' | 'Offline'; location: string; interviewer?: string; status?: 'Scheduled' | 'Passed' | 'Failed' | 'Rescheduled' | 'No Show'; result_note?: string; }
interface LogEntry { date: string; admin: string; text: string; type?: 'note' | 'interview' | 'status'; }

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  // ... (States remain same)
  const [applicants, setApplicants] = useState<ApplicantDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState({ trend: [] as number[], education: [] as any[], positions: [] as any[], gender: { male: 0, female: 0 } });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterEducation, setFilterEducation] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantDB | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('profile'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ApplicantDB>>({});
  const [noteLogs, setNoteLogs] = useState<LogEntry[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyFormData, setCopyFormData] = useState({ pic: 'SUNAN', sentra: '', cabang: '', posisi: '' });
  const [waTarget, setWaTarget] = useState<ApplicantDB | null>(null);
  const [waStep, setWaStep] = useState<'selection' | 'editing'>('selection');
  const [waDraft, setWaDraft] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewEvent | null>(null);
  const [scheduleData, setScheduleData] = useState<Partial<InterviewEvent>>({ date: new Date().toISOString().split('T')[0], time: '10:00', type: 'Online', location: 'Google Meet', interviewer: 'HRD Team' });
  const [interviewResult, setInterviewResult] = useState({ status: 'Passed', note: '', nextAction: 'next_interview' });
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [clients, setClients] = useState<JobClient[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [placements, setPlacements] = useState<JobPlacement[]>([]);
  const [masterTab, setMasterTab] = useState<'clients' | 'positions' | 'placements'>('clients');
  const [newClient, setNewClient] = useState('');
  const [newPosition, setNewPosition] = useState({ name: '', client_id: '' });
  const [placementClientFilter, setPlacementClientFilter] = useState(''); 
  const [placementPositionFilter, setPlacementPositionFilter] = useState(''); 
  const [newPlacement, setNewPlacement] = useState({ label: '', recruiter_phone: '' }); 
  const [stats, setStats] = useState({ total: 0, new: 0, process: 0, hired: 0, rejected: 0, interview: 0 });

  // ... (Fetch logic blocks - unchanged)
  const fetchDashboardData = useCallback(async () => { const { data: rawData } = await supabase.from('applicants').select('created_at, tingkat_pendidikan, posisi_dilamar, jenis_kelamin'); if (!rawData) return; const last7Days = Array.from({length: 7}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]; }); const trendCounts = last7Days.map(date => rawData.filter((r: any) => r.created_at.startsWith(date)).length); const eduCounts = rawData.reduce((acc: any, curr: any) => { acc[curr.tingkat_pendidikan] = (acc[curr.tingkat_pendidikan] || 0) + 1; return acc; }, {}); const eduData = [ { label: 'SMA/SMK', value: eduCounts['SMA/SMK'] || 0, color: '#3b82f6' }, { label: 'D3', value: eduCounts['D3'] || 0, color: '#8b5cf6' }, { label: 'S1', value: eduCounts['S1'] || 0, color: '#f59e0b' }, { label: 'Lainnya', value: (eduCounts['SD']||0)+(eduCounts['SMP']||0)+(eduCounts['S2']||0), color: '#94a3b8' } ].filter(x => x.value > 0); const posCounts = rawData.reduce((acc: any, curr: any) => { const pos = curr.posisi_dilamar || 'Unspecified'; acc[pos] = (acc[pos] || 0) + 1; return acc; }, {}); const topPos = Object.entries(posCounts).map(([label, value]) => ({ label, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 5); const male = rawData.filter((r: any) => r.jenis_kelamin === 'Laki-laki').length; const female = rawData.filter((r: any) => r.jenis_kelamin === 'Perempuan').length; setDashboardMetrics({ trend: trendCounts, education: eduData, positions: topPos, gender: { male, female } }); }, []);
  const fetchApplicants = useCallback(async () => { if (activeTab === 'dashboard' || activeTab === 'interview_schedule') return; setLoading(true); try { let query = supabase.from('applicants').select('*', { count: 'exact' }); if (activeTab === 'talent_pool') query = query.or('status.eq.new,status.is.null'); else if (activeTab === 'process') query = query.in('status', ['process', 'interview']); else if (activeTab === 'rejected') query = query.eq('status', 'rejected'); else if (activeTab === 'hired') query = query.eq('status', 'hired'); if (searchTerm) query = query.or(`nama_lengkap.ilike.%${searchTerm}%,penempatan.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%`); if (filterClient) query = query.ilike('penempatan', `%${filterClient}%`); if (filterEducation) query = query.eq('tingkat_pendidikan', filterEducation); query = query.order('created_at', { ascending: sortOrder === 'oldest' }); const from = (currentPage - 1) * ITEMS_PER_PAGE; const to = from + ITEMS_PER_PAGE - 1; query = query.range(from, to); const { data, count, error } = await query; if (error) throw error; setApplicants(data || []); if (count !== null) setTotalCount(count); } catch (err: any) { console.error('Error fetching applicants:', err.message); } finally { setLoading(false); } }, [activeTab, currentPage, searchTerm, filterClient, filterEducation, sortOrder]);
  const fetchStats = async () => { const getCount = async (statusFilter: string) => { let q = supabase.from('applicants').select('id', { count: 'exact', head: true }); if (statusFilter === 'new') q = q.or('status.eq.new,status.is.null'); else if (statusFilter === 'process') q = q.in('status', ['process', 'interview']); else if (statusFilter === 'all') { } else q = q.eq('status', statusFilter); const { count } = await q; return count || 0; }; const [total, newCount, process, hired, rejected, interview] = await Promise.all([ getCount('all'), getCount('new'), getCount('process'), getCount('hired'), getCount('rejected'), getCount('interview') ]); setStats({ total, new: newCount, process, hired, rejected, interview }); };
  const fetchMasterData = async () => { const { data: cl } = await supabase.from('job_clients').select('*').order('name'); if (cl) setClients(cl); const { data: pos } = await supabase.from('job_positions').select('*').order('name'); if (pos) setPositions(pos); const { data: place } = await supabase.from('job_placements').select('*').order('label'); if (place) setPlacements(place); };
  useEffect(() => { if (activeTab === 'dashboard') { fetchStats(); fetchDashboardData(); } else if (activeTab === 'master_data') { fetchMasterData(); } else if (activeTab === 'interview_schedule') { } else { fetchApplicants(); fetchStats(); } }, [activeTab, fetchApplicants, fetchDashboardData]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, filterClient, filterEducation]);
  useEffect(() => { setSelectedIds([]); }, [activeTab, currentPage]);
  useEffect(() => { if (selectedApplicant) { try { if (selectedApplicant.internal_notes && selectedApplicant.internal_notes.startsWith('[')) { setNoteLogs(JSON.parse(selectedApplicant.internal_notes)); } else if (selectedApplicant.internal_notes) { setNoteLogs([{ date: new Date().toISOString(), admin: 'System', text: selectedApplicant.internal_notes }]); } else { setNoteLogs([]); } } catch (e) { setNoteLogs([]); } setNoteInput(''); setActiveDetailTab('profile'); setIsEditing(false); } }, [selectedApplicant]);
  useEffect(() => { const channel = supabase.channel('realtime-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'applicants' }, () => { if (activeTab === 'dashboard') { fetchStats(); fetchDashboardData(); } else { fetchApplicants(); fetchStats(); } }).on('postgres_changes', { event: '*', schema: 'public', table: 'job_clients' }, fetchMasterData).on('postgres_changes', { event: '*', schema: 'public', table: 'job_positions' }, fetchMasterData).on('postgres_changes', { event: '*', schema: 'public', table: 'job_placements' }, fetchMasterData).subscribe(); return () => { supabase.removeChannel(channel); }; }, [fetchApplicants, fetchDashboardData, activeTab]);

  // ... (Actions blocks - unchanged)
  const updateStatus = async (id: number, newStatus: string) => { await supabase.from('applicants').update({ status: newStatus }).eq('id', id); };
  const addLogToApplicant = async (applicantId: number, text: string, type: 'note' | 'interview' | 'status' = 'note') => { const { data } = await supabase.from('applicants').select('internal_notes').eq('id', applicantId).single(); let currentLogs: LogEntry[] = []; try { currentLogs = data?.internal_notes ? JSON.parse(data.internal_notes) : []; } catch (e) {} const newLog: LogEntry = { date: new Date().toISOString(), admin: 'Admin', text, type }; const updatedLogs = [newLog, ...currentLogs]; await supabase.from('applicants').update({ internal_notes: JSON.stringify(updatedLogs) }).eq('id', applicantId); if(selectedApplicant && selectedApplicant.id === applicantId) setNoteLogs(updatedLogs); };
  const handleAddNote = async () => { if (!selectedApplicant || !noteInput.trim()) return; setSavingNote(true); await addLogToApplicant(selectedApplicant.id, noteInput); setNoteInput(''); setSavingNote(false); };
  const handleDeleteLog = async (index: number) => { if(!window.confirm("Hapus catatan ini?")) return; if (!selectedApplicant) return; const updatedLogs = noteLogs.filter((_, i) => i !== index); setNoteLogs(updatedLogs); await supabase.from('applicants').update({ internal_notes: JSON.stringify(updatedLogs) }).eq('id', selectedApplicant.id); };
  const toggleSelectAll = () => { if (selectedIds.length === applicants.length && applicants.length > 0) setSelectedIds([]); else setSelectedIds(applicants.map(a => a.id)); };
  const toggleSelection = (id: number) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const handleBulkStatusUpdate = async (newStatus: string) => { if (!window.confirm(`Update ${selectedIds.length} data?`)) return; await supabase.from('applicants').update({ status: newStatus }).in('id', selectedIds); setSelectedIds([]); };
  const handleBulkDelete = async () => { if (!window.confirm(`HAPUS ${selectedIds.length} DATA?`)) return; await supabase.from('applicants').delete().in('id', selectedIds); setSelectedIds([]); };
  const handleDelete = async (id: number) => { if (!window.confirm("Hapus permanen?")) return; await supabase.from('applicants').delete().eq('id', id); };
  const startEditing = () => { if (selectedApplicant) { setEditFormData({ ...selectedApplicant }); setIsEditing(true); } };
  const saveChanges = async () => { if (!selectedApplicant) return; try { const { error } = await supabase.from('applicants').update(editFormData).eq('id', selectedApplicant.id); if (error) throw error; setIsEditing(false); alert("Data berhasil diperbarui!"); } catch (err: any) { alert("Gagal update: " + err.message); } };
  const handleOpenSchedule = (applicant: ApplicantDB, preFill?: Partial<InterviewEvent>) => { setSelectedApplicant(applicant); setScheduleData({ date: new Date().toISOString().split('T')[0], time: '10:00', type: 'Online', location: 'Google Meet', interviewer: 'HRD Team', client_name: applicant.penempatan.split(' ')[0] || 'Client', position: applicant.posisi_dilamar, ...preFill }); setScheduleModalOpen(true); };
  const handleSaveSchedule = async () => { if(!selectedApplicant) return; const newEvent: InterviewEvent = { id: Date.now(), applicant_id: selectedApplicant.id, applicant_name: selectedApplicant.nama_lengkap, position: scheduleData.position || '', client_name: scheduleData.client_name || '', branch_name: selectedApplicant.penempatan, date: scheduleData.date || '', time: scheduleData.time || '', type: scheduleData.type as any, location: scheduleData.location || '', interviewer: scheduleData.interviewer, status: 'Scheduled' }; setInterviewEvents(prev => [...prev, newEvent]); setScheduleModalOpen(false); const logText = `[INTERVIEW TERJADWAL]\nPosisi: ${newEvent.position} (${newEvent.client_name})\nTgl: ${newEvent.date} Jam ${newEvent.time}\nTipe: ${newEvent.type} @ ${newEvent.location}\nPewawancara: ${newEvent.interviewer}`; await addLogToApplicant(selectedApplicant.id, logText, 'interview'); alert(`✅ Berhasil Dijadwalkan!\n\nUndangan interview untuk posisi ${newEvent.position} telah dibuat.`); if(selectedApplicant.status !== 'interview') updateStatus(selectedApplicant.id, 'interview'); };
  const handleOpenResult = (event: InterviewEvent) => { setSelectedInterview(event); setResultModalOpen(true); };
  const handleSaveResult = async () => { if(!selectedInterview) return; setInterviewEvents(prev => prev.map(ev => ev.id === selectedInterview.id ? { ...ev, status: interviewResult.status as any, result_note: interviewResult.note } : ev)); const resultText = `[HASIL INTERVIEW]\nStatus: ${interviewResult.status}\nCatatan: ${interviewResult.note}`; await addLogToApplicant(selectedInterview.applicant_id, resultText, 'interview'); setResultModalOpen(false); if (interviewResult.nextAction === 'next_interview') { const { data } = await supabase.from('applicants').select('*').eq('id', selectedInterview.applicant_id).single(); if (data) { handleOpenSchedule(data as ApplicantDB, { position: selectedInterview.position, client_name: selectedInterview.client_name, interviewer: 'User / Manager' }); } } else if (interviewResult.nextAction === 'hired') { updateStatus(selectedInterview.applicant_id, 'hired'); alert("Kandidat ditandai sebagai DITERIMA."); } else if (interviewResult.nextAction === 'rejected') { updateStatus(selectedInterview.applicant_id, 'rejected'); } else { alert("Hasil interview disimpan."); } };
  const openCopyModal = () => { if (!selectedApplicant) return; let shortPos = 'SO'; const appliedPos = selectedApplicant.posisi_dilamar.toUpperCase(); if (appliedPos.includes('KOLEKTOR') || appliedPos.includes('REMEDIAL')) shortPos = 'COLLECTION'; else if (appliedPos.includes('RELATION')) shortPos = 'RO'; setCopyFormData({ pic: 'SUNAN', sentra: '', cabang: '', posisi: shortPos }); setIsCopyModalOpen(true); };
  const executeCopy = () => { if (!selectedApplicant) return; const rowData = [ new Date().toLocaleDateString('id-ID'), copyFormData.pic, copyFormData.sentra, "'" + selectedApplicant.nik, copyFormData.cabang, selectedApplicant.nama_lengkap, copyFormData.posisi, "'" + selectedApplicant.no_hp ].join('\t'); navigator.clipboard.writeText(rowData).then(() => { alert("Disalin!"); setIsCopyModalOpen(false); }); };
  const handleOpenWa = (applicant: ApplicantDB) => { setWaTarget(applicant); setWaStep('selection'); };
  const handleSelectTemplate = (template: typeof WA_TEMPLATES[0]) => { if (!waTarget) return; const msg = template.getMessage(waTarget.nama_lengkap, waTarget.posisi_dilamar); setWaDraft(msg); setWaStep('editing'); };
  const handleSendWaFinal = () => { if (!waTarget) return; const phone = waTarget.no_hp.replace(/\D/g, '').replace(/^0/, '62'); const link = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waDraft)}`; window.open(link, '_blank'); setWaTarget(null); };
  const handleAddClient = async () => { if(!newClient.trim()) return; const { error } = await supabase.from('job_clients').insert({ name: newClient, is_active: true }); if (!error) { setNewClient(''); } };
  const toggleClient = async (id: number, currentStatus: boolean) => { await supabase.from('job_clients').update({ is_active: !currentStatus }).eq('id', id); };
  const handleDeleteClient = async (id: number) => { const confirmMsg = "⚠️ PERINGATAN KERAS!\n\nMenghapus Klien ini akan MENGHAPUS OTOMATIS semua Posisi dan Penempatan yang terhubung.\n\nApakah Anda yakin ingin melanjutkan?"; if(!window.confirm(confirmMsg)) return; try { const { data: posToDelete } = await supabase.from('job_positions').select('id').eq('client_id', id); if (posToDelete && posToDelete.length > 0) { const posIds = posToDelete.map(p => p.id); await supabase.from('job_placements').delete().in('position_id', posIds); await supabase.from('job_positions').delete().in('id', posIds); } await supabase.from('job_clients').delete().eq('id', id); alert("Klien dan data terkait berhasil dihapus."); } catch (err: any) { alert("GAGAL MENGHAPUS: " + err.message); } };
  const handleAddPosition = async () => { if(!newPosition.name.trim() || !newPosition.client_id) return alert("Isi nama dan pilih klien"); await supabase.from('job_positions').insert({ name: newPosition.name, value: newPosition.name.toUpperCase(), client_id: parseInt(newPosition.client_id), is_active: true }); setNewPosition({name: '', client_id: ''}); };
  const togglePosition = async (id: number, currentStatus: boolean) => { await supabase.from('job_positions').update({ is_active: !currentStatus }).eq('id', id); };
  const handleDeletePosition = async (id: number) => { if(!window.confirm("Yakin ingin menghapus Posisi ini? Semua Penempatan di dalamnya akan terhapus.")) return; await supabase.from('job_placements').delete().eq('position_id', id); const { error } = await supabase.from('job_positions').delete().eq('id', id); if(error) alert("Gagal hapus: " + error.message); };
  const handleAddPlacement = async () => { if(!newPlacement.label.trim() || !newPlacement.recruiter_phone.trim() || !placementPositionFilter) return alert("Pilih Klien, Posisi, dan lengkapi data"); await supabase.from('job_placements').insert({ label: newPlacement.label, value: newPlacement.label.replace(' - ', ' ').toUpperCase(), recruiter_phone: newPlacement.recruiter_phone, position_id: parseInt(placementPositionFilter), is_active: true }); setNewPlacement({label: '', recruiter_phone: ''}); };
  const togglePlacement = async (id: number, currentStatus: boolean) => { await supabase.from('job_placements').update({ is_active: !currentStatus }).eq('id', id); };
  const handleDeletePlacement = async (id: number) => { if(!window.confirm("Yakin ingin menghapus Penempatan ini?")) return; const { error } = await supabase.from('job_placements').delete().eq('id', id); if(error) alert("Gagal hapus: " + error.message); };
  const getFileUrl = (path: string) => path ? supabase.storage.from('documents').getPublicUrl(path).data.publicUrl : '#';
  const getPlacementDetails = (p: JobPlacement) => { const pos = positions.find(pos => pos.id === p.position_id); const cli = pos ? clients.find(c => c.id === pos.client_id) : null; return { positionName: pos ? pos.name : 'Unknown Pos', clientName: cli ? cli.name : 'Unknown Client' }; };
  const renderEditField = (label: string, field: keyof ApplicantDB, type = 'text', options?: string[]) => {
      // @ts-ignore
      const rawVal = isEditing ? (editFormData[field] ?? '') : (selectedApplicant ? selectedApplicant[field] : '-'); const val = typeof rawVal === 'boolean' ? String(rawVal) : rawVal;
      return ( <div className="mb-4"> <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label> {isEditing ? ( options ? ( <select className="w-full border border-gray-300 rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-brand-500" value={val} onChange={e => setEditFormData({...editFormData, [field]: e.target.value})} > <option value="">- Pilih -</option> {options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select> ) : ( <input type={type} className="w-full border border-gray-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-brand-500" value={val as string | number | readonly string[] | undefined} onChange={e => setEditFormData({...editFormData, [field]: e.target.value})} /> ) ) : ( <div className="font-medium text-gray-800 text-sm break-words">{val}</div> )} </div> );
  };
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE); const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1; const endItem = Math.min(startItem + ITEMS_PER_PAGE - 1, totalCount);

  // --- RENDER HELPERS ---
  const getInitials = (name: string) => name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  const getRandomColor = (id: number) => { const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']; return colors[id % colors.length]; };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <img src="https://i.imgur.com/Lf2IC1Z.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-white">SWA ADMIN</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-brand-600 to-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase">Pipeline</div>
          {['talent_pool', 'process', 'interview_schedule', 'hired', 'rejected'].map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${activeTab === tab ? 'bg-slate-800 text-white shadow-md border-l-4 border-brand-500' : 'hover:bg-slate-800'}`}>
                <div className="flex items-center gap-3 capitalize">
                    {tab === 'interview_schedule' ? <><Calendar size={18}/> Jadwal Interview</> : tab.replace('_', ' ')}
                </div>
                {tab !== 'interview_schedule' && (
                    <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">{stats[tab === 'talent_pool' ? 'new' : tab] || 0}</span>
                )}
             </button>
          ))}
           <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase">System</div>
            <button onClick={() => setActiveTab('master_data')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeTab === 'master_data' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
            <Settings size={18} /> Master Data
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-400 py-2 hover:bg-slate-800 rounded-lg"><LogOut size={16} /> Keluar</button></div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {/* ... (Main Content: Headers, Charts, Tables are same as before) ... */}
        {/* For brevity, omitting re-pasting the charts and table code here as they are unchanged from previous step. 
            I will focus on rendering the NEW DETAIL MODAL below. */}
        <div className="flex justify-between items-end mb-8">
            <h1 className="text-2xl font-bold text-slate-900 capitalize tracking-tight flex items-center gap-2">
                {activeTab === 'dashboard' ? <LayoutDashboard className="text-brand-600"/> : activeTab === 'interview_schedule' ? 'Jadwal Interview' : activeTab.replace('_', ' ')}
                {activeTab === 'dashboard' && <span className="text-sm font-normal text-slate-500 ml-2 bg-slate-100 px-3 py-1 rounded-full">Statistik & Analisa</span>}
            </h1>
            {activeTab !== 'dashboard' && activeTab !== 'master_data' && activeTab !== 'interview_schedule' && ( <div className="text-sm text-gray-500"> Total: <span className="font-bold text-slate-900">{totalCount}</span> Kandidat </div> )}
        </div>
        {activeTab === 'dashboard' ? (
             /* DASHBOARD CONTENT (Same as before) */
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><User size={100}/></div><div className="text-blue-100 text-sm font-medium mb-1">Total Pelamar</div><div className="text-4xl font-bold">{stats.total}</div><div className="mt-4 text-xs bg-white/20 w-fit px-2 py-1 rounded">Semua Waktu</div></div>
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><FileText size={100}/></div><div className="text-indigo-100 text-sm font-medium mb-1">Baru Masuk</div><div className="text-4xl font-bold">{stats.new}</div><div className="mt-4 text-xs bg-white/20 w-fit px-2 py-1 rounded">Perlu Diproses</div></div>
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><Loader2 size={100}/></div><div className="text-amber-50 text-sm font-medium mb-1">Sedang Proses</div><div className="text-4xl font-bold">{stats.process}</div><div className="mt-4 text-xs bg-white/20 w-fit px-2 py-1 rounded">Interview & Psikotes</div></div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><CheckCircle size={100}/></div><div className="text-emerald-100 text-sm font-medium mb-1">Diterima</div><div className="text-4xl font-bold">{stats.hired}</div><div className="mt-4 text-xs bg-white/20 w-fit px-2 py-1 rounded">Karyawan Baru</div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="text-brand-600" size={20}/> Tren Pendaftaran (7 Hari Terakhir)</h3><SimpleLineChart data={dashboardMetrics.trend} /><div className="flex justify-between mt-4 text-xs text-gray-400 px-2"><span>7 Hari Lalu</span><span>Hari Ini</span></div></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="text-purple-600" size={20}/> Kualifikasi Pendidikan</h3><SimpleDonutChart data={dashboardMetrics.education} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="text-indigo-600" size={20}/> 5 Posisi Terpopuler</h3><SimpleBarChart data={dashboardMetrics.positions} /></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="text-pink-600" size={20}/> Demografi Gender</h3><div className="flex items-center justify-center gap-8 h-40"><div className="text-center"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-2"><User size={32}/></div><div className="text-2xl font-bold text-slate-800">{dashboardMetrics.gender.male}</div><div className="text-xs text-gray-500">Laki-laki</div></div><div className="h-12 w-px bg-gray-200"></div><div className="text-center"><div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 mx-auto mb-2"><User size={32}/></div><div className="text-2xl font-bold text-slate-800">{dashboardMetrics.gender.female}</div><div className="text-xs text-gray-500">Perempuan</div></div></div></div>
                </div>
            </div>
        ) : activeTab === 'interview_schedule' ? (
             /* INTERVIEW SCHEDULE (Same as before) */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Calendar className="text-brand-600" size={24}/> Kalender Interview (Simulasi Integrasi)</h3>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">Connected to: <strong>hrd@swapro.co.id</strong> (Google Calendar)</div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interviewEvents.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">Belum ada jadwal interview yang dibuat.<br/><span className="text-xs">Ubah status kandidat menjadi "Interview" untuk menjadwalkan.</span></div>
                    ) : (
                        interviewEvents.map(event => (
                            <div key={event.id} className={`bg-white border border-l-4 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow relative ${event.status === 'Passed' ? 'border-l-green-500' : event.status === 'Failed' ? 'border-l-red-500' : 'border-l-brand-500'}`}>
                                <div className="flex justify-between items-start mb-2"><div className="font-bold text-slate-800">{event.applicant_name}</div><span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${event.status === 'Passed' ? 'bg-green-100 text-green-700' : event.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{event.status || 'Scheduled'}</span></div>
                                <div className="text-xs text-slate-500 mb-1 font-semibold">{event.position}</div>
                                <div className="text-[10px] text-gray-400 mb-3">{event.client_name} - {event.branch_name}</div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 mb-1"><Calendar size={14} className="text-gray-400"/> {new Date(event.date).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 mb-1"><Clock size={14} className="text-gray-400"/> {event.time} WIB</div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 mt-2 pt-2 border-t border-gray-100">{event.type === 'Online' ? <Video size={14} className="text-brand-500"/> : <MapPin size={14} className="text-brand-500"/>}<span className="truncate">{event.location}</span></div>
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><User size={12}/> {event.interviewer || 'HR Team'}</div>
                                <div className="mt-4 flex gap-2"><button onClick={() => handleOpenResult(event)} className="flex-1 bg-brand-600 text-white text-xs py-1.5 rounded hover:bg-brand-700">Input Hasil</button><button onClick={async () => { const { data } = await supabase.from('applicants').select('*').eq('id', event.applicant_id).single(); if(data) setSelectedApplicant(data as ApplicantDB); }} className="px-2 border rounded hover:bg-gray-50" title="Lihat Detail"><FileText size={14} className="text-gray-600"/></button></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ) : activeTab === 'master_data' ? (
           /* --- MASTER DATA (Same as before) --- */
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
              <div className="border-b border-gray-200 flex bg-gray-50">
                 {['clients', 'positions', 'placements'].map(tab => ( <button key={tab} onClick={() => setMasterTab(tab as any)} className={`px-6 py-3 text-sm font-bold uppercase ${masterTab === tab ? 'bg-white border-t-2 border-brand-600 text-brand-600' : 'text-gray-500'}`}>{tab}</button> ))}
              </div>
              <div className="p-6">
                 {masterTab === 'clients' && ( <div className="max-w-xl"><h3 className="font-bold mb-4 flex items-center gap-2"><Building2 size={18}/> Daftar Klien Mitra</h3><div className="flex gap-4 mb-6"><input className="flex-1 border p-2 rounded" placeholder="Nama Klien (ex: ADIRA)" value={newClient} onChange={e => setNewClient(e.target.value)} /><button onClick={handleAddClient} className="bg-brand-600 text-white px-4 py-2 rounded">Tambah</button></div><table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Nama Klien</th><th className="p-3 text-center">Visibility</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{clients.map(c => (<tr key={c.id} className={`border-t ${!c.is_active ? 'bg-gray-50 opacity-60' : ''}`}><td className="p-3 font-bold">{c.name}</td><td className="p-3 text-center"><button onClick={() => toggleClient(c.id, c.is_active)} className={`p-1.5 rounded-full transition-colors ${c.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>{c.is_active ? <Eye size={20} /> : <EyeOff size={20} />}</button></td><td className="p-3 text-right"><button onClick={() => handleDeleteClient(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div> )}
                 {masterTab === 'positions' && ( <div className="max-w-2xl"><h3 className="font-bold mb-4 flex items-center gap-2"><Briefcase size={18}/> Daftar Posisi</h3><div className="flex gap-4 mb-6"><select className="border p-2 rounded" value={newPosition.client_id} onChange={e => setNewPosition({...newPosition, client_id: e.target.value})}><option value="">-- Pilih Klien --</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="flex-1 border p-2 rounded" placeholder="Nama Posisi (ex: SALES)" value={newPosition.name} onChange={e => setNewPosition({...newPosition, name: e.target.value})} /><button onClick={handleAddPosition} className="bg-brand-600 text-white px-4 py-2 rounded">Tambah</button></div><table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Klien</th><th className="p-3 text-left">Posisi</th><th className="p-3 text-center">Status</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{positions.map(p => { const clientName = clients.find(c => c.id === p.client_id)?.name || '-'; return (<tr key={p.id} className={`border-t ${!p.is_active ? 'bg-gray-50 opacity-60' : ''}`}><td className="p-3 text-gray-500">{clientName}</td><td className="p-3 font-bold">{p.name}</td><td className="p-3 text-center"><button onClick={() => togglePosition(p.id, p.is_active)} className={`p-1.5 rounded-full ${p.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{p.is_active ? <Eye size={18} /> : <EyeOff size={18} />}</button></td><td className="p-3 text-right"><button onClick={() => handleDeletePosition(p.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={18}/></button></td></tr>); })}</tbody></table></div> )}
                 {masterTab === 'placements' && ( <div className="max-w-5xl"><h3 className="font-bold mb-4 flex items-center gap-2"><MapPin size={18}/> Daftar Penempatan</h3><div className="bg-blue-50 p-4 rounded mb-6 text-sm border border-blue-100"><p className="font-bold text-blue-800 mb-2">Tambah Penempatan Baru (3 Level)</p><div className="flex gap-4 items-end flex-wrap"><div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-500">1. Pilih Klien</label><select className="border p-2 rounded w-48" value={placementClientFilter} onChange={e => {setPlacementClientFilter(e.target.value); setPlacementPositionFilter('');}}><option value="">-- Pilih Klien --</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-500">2. Pilih Posisi</label><select className="border p-2 rounded w-48" value={placementPositionFilter} onChange={e => setPlacementPositionFilter(e.target.value)} disabled={!placementClientFilter}><option value="">-- Pilih Posisi --</option>{positions.filter(p => p.client_id === parseInt(placementClientFilter)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="flex flex-col gap-1 flex-1 min-w-[200px]"><label className="text-xs font-bold text-gray-500">3. Label Wilayah</label><input className="border p-2 rounded w-full" placeholder="ex: JAKARTA SELATAN" value={newPlacement.label} onChange={e => setNewPlacement({...newPlacement, label: e.target.value})} disabled={!placementPositionFilter}/></div><div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-500">4. No WA Rekruter</label><input className="border p-2 rounded w-40" placeholder="628..." value={newPlacement.recruiter_phone} onChange={e => setNewPlacement({...newPlacement, recruiter_phone: e.target.value})} disabled={!placementPositionFilter}/></div><button onClick={handleAddPlacement} disabled={!placementPositionFilter} className="bg-brand-600 text-white px-6 py-2 rounded h-[42px] font-bold disabled:bg-gray-300">Simpan</button></div></div><table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Klien</th><th className="p-3 text-left">Posisi</th><th className="p-3 text-left">Wilayah</th><th className="p-3 text-left">No. Rekruter</th><th className="p-3 text-center">Status</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{placements.map(p => { const details = getPlacementDetails(p); return (<tr key={p.id} className={`border-t ${!p.is_active ? 'bg-gray-50 opacity-60' : ''}`}><td className="p-3 text-gray-500">{details.clientName}</td><td className="p-3 text-brand-600 font-medium">{details.positionName}</td><td className="p-3 font-bold">{p.label}</td><td className="p-3 font-mono text-xs">{p.recruiter_phone}</td><td className="p-3 text-center"><button onClick={() => togglePlacement(p.id, p.is_active)} className={`p-1.5 rounded-full ${p.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{p.is_active ? <Eye size={18} /> : <EyeOff size={18} />}</button></td><td className="p-3 text-right"><button onClick={() => handleDeletePlacement(p.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={18}/></button></td></tr>); })}</tbody></table></div> )}
              </div>
           </div>
        ) : (
          /* --- OPERATIONAL TABLE VIEW (Same as before) --- */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2 w-full md:w-auto"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Cari nama, posisi..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full md:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div><select className="border p-2 rounded-lg text-sm" value={filterClient} onChange={e => setFilterClient(e.target.value)}><option value="">Semua Klien</option>{clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select><select className="border p-2 rounded-lg text-sm" value={filterEducation} onChange={e => setFilterEducation(e.target.value)}><option value="">Semua Pendidikan</option><option value="S1">S1</option><option value="D3">D3</option><option value="SMA/SMK">SMA/SMK</option></select><button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="p-2 border rounded bg-white" title="Sort Date"><ArrowUpDown size={18}/></button></div>
                {selectedIds.length > 0 && (<div className="flex items-center gap-2 animate-fadeIn bg-brand-50 px-3 py-1 rounded-lg border border-brand-100"><span className="text-xs font-bold text-brand-700">{selectedIds.length} Dipilih</span><select onChange={(e) => { if(e.target.value) handleBulkStatusUpdate(e.target.value); }} className="text-xs border p-1 rounded"><option value="">Ubah Status...</option><option value="process">Proses</option><option value="interview">Interview</option><option value="hired">Terima</option><option value="rejected">Tolak</option></select><button onClick={handleBulkDelete} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button></div>)}
                <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700" onClick={() => alert("Fitur Tambah Kandidat Manual akan segera hadir.")}><Plus size={16}/> Tambah Kandidat</button>
              </div>
              <div className="overflow-x-auto min-h-[400px]">
                {loading ? ( <div className="flex items-center justify-center h-64 text-slate-400 gap-2"><Loader2 className="animate-spin" size={24}/> Memuat data...</div> ) : (
                    <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-200 text-xs uppercase font-semibold tracking-wider"><tr><th className="p-4 w-10"><button onClick={toggleSelectAll}><CheckSquare size={16} className={selectedIds.length > 0 ? "text-brand-400" : "text-slate-500"} /></button></th><th className="p-4">Tanggal</th><th className="p-4">Kandidat</th><th className="p-4">Posisi & Klien</th><th className="p-4">Kontak</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {applicants.map((app) => {
                            let rowClass = "bg-white hover:bg-slate-50"; 
                            let statusBadgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                            let nameColor = "text-slate-900";
                            if (selectedIds.includes(app.id)) { rowClass = "bg-blue-50 border-l-4 border-l-blue-500"; } 
                            else if (app.status === 'hired') { rowClass = "bg-emerald-50/50 hover:bg-emerald-50"; statusBadgeColor = "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200"; nameColor = "text-emerald-800"; } 
                            else if (app.status === 'rejected') { rowClass = "bg-rose-50/50 hover:bg-rose-50"; statusBadgeColor = "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-200"; nameColor = "text-rose-800"; } 
                            else if (['process', 'interview'].includes(app.status)) { rowClass = "bg-amber-50/50 hover:bg-amber-50"; statusBadgeColor = "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200"; nameColor = "text-amber-800"; }
                            return (
                                <tr key={app.id} className={`transition-all ${rowClass}`}>
                                    <td className="p-4"><button onClick={() => toggleSelection(app.id)}>{selectedIds.includes(app.id) ? <CheckSquare size={18} className="text-brand-600"/> : <Square size={18} className="text-gray-300"/>}</button></td>
                                    <td className="p-4 text-sm text-slate-500 font-medium">{new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}<div className="text-xs text-slate-400 font-normal">{new Date(app.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div></td>
                                    <td className="p-4"><div className={`font-bold ${nameColor}`}>{app.nama_lengkap}</div><div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><User size={10}/> {app.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'} • {app.umur} Th • {app.tingkat_pendidikan}</div></td>
                                    <td className="p-4"><div className="text-sm font-bold text-slate-700">{app.posisi_dilamar}</div><div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">{app.penempatan}</div></td>
                                    <td className="p-4"><div className="text-sm text-slate-700 font-mono">{app.no_hp}</div><div className="text-xs text-slate-400 mt-0.5">{app.kota}</div></td>
                                    <td className="p-4 text-center">
                                    <select value={app.status || 'new'} onChange={(e) => updateStatus(app.id, e.target.value)} className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none appearance-none text-center min-w-[90px] transition-all ${statusBadgeColor}`} > <option value="new" className="bg-white text-slate-800">BARU</option> <option value="process" className="bg-white text-slate-800">PROSES</option> <option value="interview" className="bg-white text-slate-800">INTERVIEW</option> <option value="hired" className="bg-white text-slate-800">DITERIMA</option> <option value="rejected" className="bg-white text-slate-800">DITOLAK</option> </select>
                                    {app.internal_notes && ( <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded-md w-fit mx-auto"><StickyNote size={10}/> Note</div> )}
                                    {app.status === 'interview' && ( <button onClick={() => handleOpenSchedule(app)} className="mt-1 flex items-center justify-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-1 rounded w-fit mx-auto hover:bg-indigo-100"> <Calendar size={10}/> Atur Jadwal </button> )}
                                    </td>
                                    <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2"><button onClick={() => handleOpenWa(app)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg bg-white shadow-sm border border-green-100 hover:border-green-300 transition-all" title="WhatsApp"><MessageCircle size={18} /></button><button onClick={() => setSelectedApplicant(app)} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg bg-white shadow-sm border border-brand-100 hover:border-brand-300 transition-all" title="Detail"><FileText size={18} /></button><button onClick={() => handleDelete(app.id)} className="p-2 text-red-400 hover:bg-red-100 rounded-lg bg-white shadow-sm border border-red-100 hover:border-red-300 transition-all" title="Hapus"><Trash2 size={18} /></button></div>
                                    </td>
                                </tr>
                            );
                        })}
                        {applicants.length === 0 && !loading && ( <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Belum ada data pelamar untuk kategori ini.</td></tr> )}
                    </tbody>
                    </table>
                )}
              </div>
              {/* PAGINATION CONTROLS */}
              <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-between">
                 <div className="text-sm text-slate-500">Menampilkan <span className="font-bold text-slate-800">{totalCount > 0 ? startItem : 0}-{endItem}</span> dari <span className="font-bold text-slate-800">{totalCount}</span> data</div>
                 <div className="flex items-center gap-2"><button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"><ChevronLeft size={18}/></button><span className="text-sm font-semibold px-3 py-1 bg-slate-100 rounded text-slate-600"> Halaman {currentPage} / {Math.max(totalPages, 1)} </span><button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages || loading} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"><ChevronRight size={18}/></button></div>
              </div>
            </div>
        )}
      </main>

      {/* ... (WA, Schedule, Result Modals remain same) ... */}
      {/* WA TEMPLATE MODAL */}
      {waTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageCircle className="text-green-600" size={20}/> {waStep === 'selection' ? `Hubungi ${waTarget.nama_lengkap}` : 'Edit Pesan WhatsApp'}</h3>
              <button onClick={() => setWaTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {waStep === 'selection' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-2">Pilih template pesan:</p>
                    {WA_TEMPLATES.map(t => ( <button key={t.id} onClick={() => handleSelectTemplate(t)} className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all hover:shadow-md ${t.color}`} > <div className="font-bold text-sm">{t.label}</div> </button> ))}
                  </div>
              ) : (
                  <div className="space-y-4">
                      <textarea className="w-full h-48 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500" value={waDraft} onChange={(e) => setWaDraft(e.target.value)} />
                      <div className="flex gap-3"><button onClick={() => setWaStep('selection')} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold flex items-center justify-center gap-2"><ArrowLeft size={16} /> Kembali</button><button onClick={handleSendWaFinal} className="flex-[2] py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center justify-center gap-2"><Send size={16} /> Kirim WhatsApp</button></div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleModalOpen && selectedApplicant && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b bg-indigo-50 flex justify-between items-center">
                      <div><h3 className="font-bold text-indigo-900 flex items-center gap-2"><Calendar className="text-indigo-600"/> Atur Jadwal Interview</h3><div className="text-[10px] text-indigo-600 mt-1 space-y-0.5"><p>Kandidat: <strong>{selectedApplicant.nama_lengkap}</strong></p></div></div>
                      <button onClick={() => setScheduleModalOpen(false)}><X size={20} className="text-indigo-400"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label><input type="date" className="w-full border p-2 rounded text-sm" value={scheduleData.date} onChange={e=>setScheduleData({...scheduleData, date: e.target.value})}/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Jam (WIB)</label><input type="time" className="w-full border p-2 rounded text-sm" value={scheduleData.time} onChange={e=>setScheduleData({...scheduleData, time: e.target.value})}/></div></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Bertemu Dengan (Interviewer)</label><input className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={scheduleData.interviewer} onChange={e=>setScheduleData({...scheduleData, interviewer: e.target.value})} placeholder="Contoh: Ibu Sari (HRD)"/></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Posisi (Edit)</label><input className="w-full border p-2 rounded text-sm" value={scheduleData.position} onChange={e=>setScheduleData({...scheduleData, position: e.target.value})}/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Klien (Edit)</label><input className="w-full border p-2 rounded text-sm" value={scheduleData.client_name} onChange={e=>setScheduleData({...scheduleData, client_name: e.target.value})}/></div></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Tipe Interview</label><select className="w-full border p-2 rounded text-sm" value={scheduleData.type} onChange={e=>setScheduleData({...scheduleData, type: e.target.value as any})}><option value="Online">Online (Google Meet)</option><option value="Offline">Offline (Kantor)</option></select></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Link / Alamat Lengkap</label><input className="w-full border p-2 rounded text-sm" value={scheduleData.location} onChange={e=>setScheduleData({...scheduleData, location: e.target.value})} placeholder={scheduleData.type === 'Online' ? 'Link Google Meet' : 'Alamat Kantor'}/></div>
                      <button onClick={handleSaveSchedule} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 mt-4 shadow-lg shadow-indigo-200 text-sm">Simpan & Kirim Undangan</button>
                  </div>
              </div>
          </div>
      )}

      {/* RESULT MODAL */}
      {resultModalOpen && selectedInterview && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                   <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">Input Hasil Interview</h3></div>
                   <div className="p-6 space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Hasil</label><select className="w-full border p-2 rounded" value={interviewResult.status} onChange={e=>setInterviewResult({...interviewResult, status: e.target.value})}><option value="Passed">Lolos</option><option value="Failed">Gagal</option><option value="Rescheduled">Reschedule</option><option value="No Show">Tidak Hadir</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Catatan</label><textarea className="w-full border p-2 rounded h-24 text-sm" placeholder="Contoh: Skill bagus, attitude baik..." value={interviewResult.note} onChange={e=>setInterviewResult({...interviewResult, note: e.target.value})}/></div>
                        {interviewResult.status === 'Passed' && (<div className="bg-green-50 p-3 rounded border border-green-200 animate-fadeIn"><label className="block text-xs font-bold text-green-800 mb-1">Langkah Selanjutnya:</label><div className="space-y-2"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="next" checked={interviewResult.nextAction === 'next_interview'} onChange={()=>setInterviewResult({...interviewResult, nextAction: 'next_interview'})}/> Jadwalkan Interview Lanjutan</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="next" checked={interviewResult.nextAction === 'hired'} onChange={()=>setInterviewResult({...interviewResult, nextAction: 'hired'})}/> Proses Join / Offering</label></div></div>)}
                        <div className="flex gap-2 pt-2"><button onClick={() => setResultModalOpen(false)} className="flex-1 bg-gray-100 py-2 rounded text-sm font-bold text-gray-600">Batal</button><button onClick={handleSaveResult} className="flex-1 bg-brand-600 py-2 rounded text-sm font-bold text-white hover:bg-brand-700">Simpan</button></div>
                   </div>
              </div>
          </div>
      )}

      {/* NEW DETAIL MODAL WITH UPGRADED UI */}
      {selectedApplicant && !scheduleModalOpen && !resultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-scaleIn">
            
            {/* 1. INSTAGRAM-STYLE HEADER */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden shrink-0">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Avatar */}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-white/10 ${getRandomColor(selectedApplicant.id)}`}>
                      {getInitials(selectedApplicant.nama_lengkap)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-3xl font-bold tracking-tight">{isEditing ? <input className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white" value={editFormData.nama_lengkap} onChange={e=>setEditFormData({...editFormData, nama_lengkap: e.target.value})} /> : selectedApplicant.nama_lengkap}</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedApplicant.status === 'hired' ? 'bg-green-500 text-white' : 'bg-white/20 text-white border border-white/30'}`}>
                             {selectedApplicant.status || 'NEW'}
                          </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-slate-300 text-sm font-medium">
                          <div className="flex items-center gap-1.5"><Briefcase size={14}/> {selectedApplicant.posisi_dilamar}</div>
                          <div className="flex items-center gap-1.5"><MapPin size={14}/> {selectedApplicant.penempatan}</div>
                          <div className="flex items-center gap-1.5"><Phone size={14}/> {selectedApplicant.no_hp}</div>
                          <div className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(selectedApplicant.created_at).toLocaleDateString()}</div>
                      </div>
                  </div>

                  {/* Top Actions */}
                  <div className="flex gap-2 self-start md:self-center">
                     <button onClick={() => setSelectedApplicant(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"><X size={20} /></button>
                  </div>
               </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-gray-100 bg-white px-8 shrink-0">
                <button onClick={() => setActiveDetailTab('profile')} className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><User size={16} /> Profil & Alamat</button>
                <button onClick={() => setActiveDetailTab('qualification')} className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'qualification' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Briefcase size={16} /> Kualifikasi</button>
                <button onClick={() => setActiveDetailTab('documents')} className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'documents' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><FileText size={16} /> Dokumen & History</button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    {/* Reuse Render Logic from previous steps, wrapped in cleaner containers */}
                    {activeDetailTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                             <div className="space-y-6">
                                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-2">Identitas Diri</h3>
                                {renderEditField("NIK (KTP)", "nik")}
                                {renderEditField("Tempat Lahir", "tempat_lahir")}
                                {renderEditField("Tanggal Lahir", "tanggal_lahir", "date")}
                                {renderEditField("Jenis Kelamin", "jenis_kelamin", "text", ['Laki-laki', 'Perempuan'])}
                                {renderEditField("Status Perkawinan", "status_perkawinan", "text", ['Belum Menikah', 'Menikah', 'Cerai'])}
                                {renderEditField("Agama", "agama", "text", ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Lainnya'])}
                             </div>
                             <div className="space-y-6">
                                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-2">Kontak & Alamat</h3>
                                {renderEditField("Nama Ibu Kandung", "nama_ibu")}
                                {renderEditField("Alamat KTP", "alamat_ktp")}
                                {renderEditField("Alamat Domisili", "alamat_domisili")}
                                <div className="grid grid-cols-2 gap-4">{renderEditField("Kota/Kab", "kota")}{renderEditField("Kode Pos", "kode_pos")}</div>
                             </div>
                        </div>
                    )}

                    {activeDetailTab === 'qualification' && (
                        <div className="space-y-6">
                             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-2 mb-6">Pendidikan Terakhir</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {renderEditField("Tingkat", "tingkat_pendidikan", "text", ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2'])}
                                    {renderEditField("Nama Sekolah", "nama_sekolah")}
                                    {renderEditField("Jurusan", "jurusan")}
                                    {renderEditField("Tahun Lulus", "tahun_lulus")}
                                    {renderEditField("IPK", "ipk")}
                                </div>
                             </div>
                             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-2 mb-6">Pengalaman Kerja</h3>
                                {selectedApplicant.has_pengalaman_kerja || isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderEditField("Perusahaan", "nama_perusahaan")}
                                            {renderEditField("Posisi", "posisi_jabatan")}
                                            {renderEditField("Periode", "periode_kerja")}
                                        </div>
                                        {renderEditField("Deskripsi Tugas", "deskripsi_tugas")}
                                    </div>
                                ) : <p className="text-slate-400 italic">Fresh Graduate</p>}
                             </div>
                        </div>
                    )}

                    {activeDetailTab === 'documents' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">File Dokumen</h3>
                                    <div className="space-y-3">
                                        <a href={getFileUrl(selectedApplicant.cv_path)} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-brand-300 transition-all group">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center"><FileText size={20}/></div>
                                            <div className="flex-1"><p className="text-sm font-bold text-slate-700">Curriculum Vitae</p><p className="text-xs text-slate-400">Klik untuk unduh</p></div>
                                            <Download size={18} className="text-slate-300 group-hover:text-brand-600"/>
                                        </a>
                                        <a href={getFileUrl(selectedApplicant.ktp_path)} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-brand-300 transition-all group">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><User size={20}/></div>
                                            <div className="flex-1"><p className="text-sm font-bold text-slate-700">KTP / Identitas</p><p className="text-xs text-slate-400">Klik untuk unduh</p></div>
                                            <Download size={18} className="text-slate-300 group-hover:text-brand-600"/>
                                        </a>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Motivasi</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"{selectedApplicant.alasan_melamar}"</p>
                                </div>
                            </div>

                            {/* 2. TIMELINE VISUAL */}
                            <div className="bg-white border border-slate-200 rounded-xl p-0 flex flex-col h-[500px] shadow-sm relative overflow-hidden">
                                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                    <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2"><History size={16} className="text-brand-600"/> Riwayat Aktivitas</h4>
                                    {isEditing && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">MODE EDIT</span>}
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {noteLogs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <History size={32}/>
                                            <p className="text-xs">Belum ada riwayat aktivitas.</p>
                                        </div>
                                    ) : (
                                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-6 py-2">
                                            {noteLogs.map((log, index) => (
                                                <div key={index} className="relative group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${log.type === 'interview' ? 'bg-indigo-500' : 'bg-brand-500'}`}></div>
                                                    
                                                    {/* Content Card */}
                                                    <div className={`p-3 rounded-lg border text-sm relative transition-all hover:shadow-md ${log.type === 'interview' ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{log.admin}</span>
                                                            <span className="text-[10px] text-slate-400">{new Date(log.date).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{log.text}</p>
                                                        
                                                        {/* Delete Button (Only in Edit Mode) */}
                                                        {isEditing && (
                                                            <button 
                                                                onClick={() => handleDeleteLog(index)}
                                                                className="absolute top-2 right-2 p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded"
                                                                title="Hapus Catatan"
                                                            >
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* INPUT AREA (HIDDEN in Read Mode) */}
                                {isEditing ? (
                                    <div className="p-3 border-t bg-slate-50">
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 text-sm px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow" 
                                                placeholder="Tulis catatan / update status..."
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                                autoFocus
                                            />
                                            <button 
                                                onClick={handleAddNote} 
                                                disabled={savingNote || !noteInput.trim()} 
                                                className="bg-brand-600 text-white p-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:translate-y-0.5"
                                            >
                                                {savingNote ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 border-t bg-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400">Masuk mode edit (ikon pensil) untuk menambah catatan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. STICKY FLOATING ACTION BAR */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <div className="flex gap-2">
                    <button onClick={openCopyModal} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 font-semibold text-sm transition-all shadow-sm">
                        <Copy size={16}/> Salin Excel
                    </button>
                    {!isEditing && (
                        <button onClick={startEditing} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 font-semibold text-sm transition-all shadow-sm">
                            <Edit size={16}/> Edit Data
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold text-sm">Batal</button>
                            <button onClick={saveChanges} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <Save size={18}/> Simpan Perubahan
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleOpenSchedule(selectedApplicant)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md hover:shadow-indigo-200 transition-all">
                                <Calendar size={18}/> Jadwal Interview
                            </button>
                            <button onClick={() => handleOpenWa(selectedApplicant)} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-md hover:shadow-green-200 transition-all">
                                <MessageCircle size={18}/> Hubungi WA
                            </button>
                        </>
                    )}
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

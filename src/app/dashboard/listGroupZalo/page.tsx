'use client';

import { useState, useEffect, useMemo } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// ✨ THÊM MỚI: Import thêm FiClock
import { FiUsers, FiLoader, FiAlertTriangle, FiSearch, FiSliders, FiShield, FiX, FiGrid, FiUserCheck, FiMessageSquare, FiSend, FiHelpCircle, FiChevronDown, FiEye, FiCheckCircle, FiUserPlus, FiLink, FiCreditCard, FiPaperclip, FiTrash2, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import MessageComposer from '@/components/MessageComposer';

// --- HELPER FUNCTIONS (MỚI) ---

// Lấy thời gian hiện tại cho input datetime-local (YYYY-MM-DDTHH:mm)
const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localISOTime = (new Date(now.getTime() - offsetMs)).toISOString().slice(0, 16);
    return localISOTime;
};

// Format thời gian từ input sang định dạng API yêu cầu (H:i d/m/Y)
const formatTimeForApi = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${h}:${m} ${d}/${month}/${y}`;
};

// --- TYPE DEFINITIONS ---
interface ZaloGroup {
    id: string;
    name: string;
    avatar: string;
    totalMembers: number;
    admins: string[];
    isCommunity: boolean;
}

// --- COMPONENTS ---

// Component ViewGroupByLinkModal (Giữ nguyên code gốc của bạn)
const ViewGroupByLinkModal = ({ onClose, onNavigate }: { onClose: () => void; onNavigate: (link: string) => void; }) => {
    const [link, setLink] = useState('');
    const [error, setError] = useState('');

    const handleView = () => {
        if (!link.trim()) {
            setError("Vui lòng nhập link chia sẻ của nhóm.");
            return;
        }
        const match = link.match(/zalo\.me\/g\/(\w+)/);
        if (match && match[0]) {
            onNavigate(link);
        } else {
            setError("Link không hợp lệ. Vui lòng kiểm tra lại.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Xem thông tin nhóm bằng link</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-sm">Dán link chia sẻ của nhóm Zalo vào ô bên dưới.</p>
                    <div className="relative">
                        <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                            type="text" 
                            value={link} 
                            onChange={e => setLink(e.target.value)} 
                            placeholder="https://zalo.me/g/..."
                            className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <div className="p-4 bg-gray-900 flex justify-end"><button onClick={handleView} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Xem thông tin</button></div>
            </div>
        </div>
    );
};

// Component StatsCard (Giữ nguyên code gốc của bạn)
const StatsCard = ({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string; }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border-l-4" style={{ borderColor: color }}>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>{icon}</div>
        <div><p className="text-gray-400 text-sm">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
    </div>
);

// CẬP NHẬT HOÀN CHỈNH: Popup gửi tin nhắn hàng loạt (CÓ FILE & CÓ THỜI GIAN)
const BulkSendMessageModal = ({ allGroups, selectedAccount, onSubmit, onClose, pointCost, currentUserPoints }: any) => {
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());
    const [searchTerm, setSearchTerm] = useState('');

    const filteredList = allGroups.filter((g: any) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const isAllSelected = filteredList.length > 0 && filteredList.every((g: any) => selectedIds.has(g.id));

    const handleSelectAll = () => {
        const next = new Set(selectedIds);
        if (isAllSelected) {
            // Nếu đang chọn hết -> Bỏ chọn các nhóm trong danh sách lọc hiện tại
            filteredList.forEach((g: any) => next.delete(g.id));
        } else {
            // Nếu chưa chọn hết -> Chọn tất cả các nhóm trong danh sách lọc hiện tại
            filteredList.forEach((g: any) => next.add(g.id));
        }
        setSelectedIds(next);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header giữ nguyên */}
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-white text-lg">Gửi tin nhắn nhóm hàng loạt</h3>
                    <button onClick={onClose}><FiX size={20} className="text-white"/></button>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái chọn nhóm */}
                    <div className="w-full md:w-2/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden">
                        <input type="text" placeholder="Tìm kiếm nhóm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded mb-4 outline-none border border-gray-600"/>
                        
                        {/* ✨ MỚI: Checkbox Chọn tất cả */}
                        <div className="flex items-center gap-3 p-2 mb-2 border-b border-gray-600 pb-2">
                            <input 
                                type="checkbox" 
                                checked={isAllSelected} 
                                onChange={handleSelectAll}
                                disabled={filteredList.length === 0}
                                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700 focus:ring-offset-gray-800 cursor-pointer"
                            />
                            <span className="text-white font-bold text-sm">
                                Chọn tất cả ({filteredList.length} nhóm)
                            </span>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {filteredList.map((group: any) => (
                                <label key={group.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedIds.has(group.id)} onChange={() => {
                                        const next = new Set(selectedIds);
                                        next.has(group.id) ? next.delete(group.id) : next.add(group.id);
                                        setSelectedIds(next);
                                    }} className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700 focus:ring-offset-gray-800"/>
                                    <span className="text-white truncate text-sm">{group.name}</span>
                                </label>
                            ))}
                            {filteredList.length === 0 && (
                                <p className="text-gray-500 text-center text-sm py-4">Không tìm thấy nhóm nào.</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Cột phải soạn tin (Giữ nguyên) */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar">
                        <MessageComposer 
                            message={message} onChangeMessage={setMessage}
                            selectedFiles={selectedFiles} onFilesChange={setSelectedFiles}
                            timeSend={sendTime} onTimeSendChange={setSendTime}
                        />
                    </div>
                </div>
                
                {/* Footer giữ nguyên */}
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center shrink-0">
                    <div className="text-sm">
                        <span className="text-gray-400">Đã chọn: <b className="text-white">{selectedIds.size}</b> nhóm. Chi phí: </span>
                        <span className={`font-bold ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded">Hủy</button>
                        <button onClick={() => onSubmit(message, Array.from(selectedIds), selectedFiles, formatTimeForApi(sendTime))} disabled={selectedIds.size === 0 || !hasEnoughPoints} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50">Gửi ngay</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component SuccessModal (Giữ nguyên code gốc của bạn)
const SuccessModal = ({ count, onClose, onViewProgress }: { count: number; onClose: () => void; onViewProgress: () => void; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-green-400" size={40} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Yêu cầu đã được tạo</h3>
                <p className="text-gray-300 mb-6">Đã tạo yêu cầu gửi tin nhắn đến <span className="font-bold">{count}</span> thành viên thành công!</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Đóng</button>
                    <button onClick={onViewProgress} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2">
                        <FiEye /> Xem tiến trình
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function ListGroupZaloPage() {
    const { selectedAccount, removeAccount } = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState<ZaloGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [minMembers, setMinMembers] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'community' | 'normal'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);
    const [successInfo, setSuccessInfo] = useState<{ count: number } | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, isSyncing: false });

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    // Toàn bộ các hàm và useEffect cũ của bạn được giữ nguyên
    useEffect(() => { setIsClient(true); }, []);
    
    useEffect(() => { 
        if (!isClient || !selectedAccount) { 
            if (isClient && !selectedAccount) { setGroups([]); setLoading(false); } 
            return; 
        } 

        const fetchGroups = async (forceRefresh = false) => { 
            if (!forceRefresh) setLoading(true); 
            setError(null); 
            
            const myId = selectedAccount.profile.userId;
            const cacheKey = `ztool_groups_${myId}`;
            let cachedGroups: any[] = [];

            try { 
                // 1. ĐỌC CACHE TỪ LOCALSTORAGE
                if (!forceRefresh) {
                    const cachedData = localStorage.getItem(cacheKey);
                    if (cachedData) {
                        cachedGroups = JSON.parse(cachedData);
                        setGroups(cachedGroups);
                        setLoading(false); // Có cache thì nhả UI ra ngay
                    }
                }

                const { cookie, imei, userAgent } = selectedAccount; 
                const payload = { cookie, imei, userAgent, proxy: savedProxy };

                // 2. LẤY MẢNG ID TỪ SERVER
                const resIds = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups`, payload); 
                const dataIds = resIds.data; 

                if (dataIds.code === 179) { 
                    removeAccount(selectedAccount.profile.userId); 
                    throw new Error(`Tài khoản "${selectedAccount.profile.displayName}" đã hết hạn và đã được tự động xóa.`); 
                } 
                
                if (dataIds.success) { 
                    const groupIds = dataIds.groups || [];

                    // --- 3. SMART CACHE DIFFING & BẢO VỆ SILENT LIMIT ---
                    if (groupIds.length === 0 && cachedGroups.length > 5 && !forceRefresh) {
                        console.warn("🛡️ Phát hiện API Zalo trả về 0 nhóm bất thường. Đã chặn lệnh xóa Cache!");
                        setLoading(false);
                        return;
                    }

                    setSyncProgress({ current: 0, total: groupIds.length, isSyncing: true });

                    let accumulatedGroups = [...cachedGroups];

                    if (groupIds.length > 0 && cachedGroups.length > 0) {
                        // Lọc bỏ nhóm đã thoát
                        accumulatedGroups = cachedGroups.filter(g => groupIds.includes(g.id));
                        setGroups(accumulatedGroups);
                        localStorage.setItem(cacheKey, JSON.stringify(accumulatedGroups));
                    } else if (forceRefresh || cachedGroups.length === 0) {
                        accumulatedGroups = [];
                        setGroups([]);
                    }

                    // ✨ [THÊM DÒNG NÀY]: Tắt vòng xoay loading khổng lồ ngay lập tức 
                    // để nhường chỗ cho UI hiển thị dữ liệu được nạp vào dần dần
                    setLoading(false);

                    // --- 4. VÒNG LẶP TẢI CHI TIẾT NGẦM (BATCH ORCHESTRATION) ---
                    const BATCH_SIZE = 5;
                    for (let i = 0; i < groupIds.length; i += BATCH_SIZE) {
                        const batchIds = groupIds.slice(i, i + BATCH_SIZE);
                        try {
                            const batchRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sync-groups-batch`, {
                                ...payload, batchIds
                            });

                            if (batchRes.data.success) {
                                const newFetchedGroups = batchRes.data.groups;
                                // Upsert đè dữ liệu mới lên
                                newFetchedGroups.forEach((newG: any) => {
                                    const idx = accumulatedGroups.findIndex(g => g.id === newG.id);
                                    if (idx >= 0) accumulatedGroups[idx] = newG;
                                    else accumulatedGroups.push(newG);
                                });

                                setGroups([...accumulatedGroups]); // Render mượt mà
                                setSyncProgress(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, groupIds.length) }));
                            }
                        } catch (err) { console.error("Batch Error:", err); }

                        // Ngủ 1.5s giữa các request để tránh bão mạng
                        if (i + BATCH_SIZE < groupIds.length) {
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }

                    // 5. HOÀN TẤT ĐỒNG BỘ
                    setSyncProgress(prev => ({ ...prev, isSyncing: false, current: prev.total }));
                    localStorage.setItem(cacheKey, JSON.stringify(accumulatedGroups));

                } else { 
                    throw new Error(dataIds.message || 'Lấy danh sách nhóm thất bại.'); 
                } 
            } catch (err: any) { 
                setError(err.response?.data?.message || err.message); 
            } finally { 
                setLoading(false); 
            } 
        }; 
        
        // Gọi hàm fetch (Dùng cờ tĩnh để chống gọi 2 lần trong Strict Mode của React)
        fetchGroups(); 
    }, [selectedAccount, removeAccount, isClient]);

    const groupStats = useMemo(() => { if (!isClient || !selectedAccount) return { total: 0, admin: 0, member: 0 }; const adminCount = groups.filter(g => Array.isArray(g.admins) && g.admins.includes(selectedAccount.profile.userId)).length; return { total: groups.length, admin: adminCount, member: groups.length - adminCount }; }, [groups, selectedAccount, isClient]);
    const filteredGroups = useMemo(() => { if (!isClient || !selectedAccount) return []; return groups.filter(group => { if (searchTerm && group.name && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) return false; const min = parseInt(minMembers, 10); const max = parseInt(maxMembers, 10); if (!isNaN(min) && group.totalMembers < min) return false; if (!isNaN(max) && group.totalMembers > max) return false; const isAdmin = Array.isArray(group.admins) && group.admins.includes(selectedAccount.profile.userId); if (roleFilter === 'admin' && !isAdmin) return false; if (roleFilter === 'member' && isAdmin) return false; if (typeFilter === 'community' && !group.isCommunity) return false; if (typeFilter === 'normal' && group.isCommunity) return false; return true; }).sort((a, b) => (a.name || '').localeCompare(b.name || '')); }, [groups, searchTerm, minMembers, maxMembers, roleFilter, typeFilter, selectedAccount, isClient]);
    const handleNavigateToGroupDetails = (identifier: string) => { const encodedIdentifier = encodeURIComponent(identifier); router.push(`/dashboard/group-details/${encodedIdentifier}`); };

    // ✨ CẬP NHẬT: Hàm submit xử lý FormData để gửi file VÀ timeSend
    const handleBulkSendSubmit = async (message: string, recipientIds: string[], files: File[], timeSend: string) => {
        if (!selectedAccount || !pointCosts || !user) {
            alert("Vui lòng chọn tài khoản và đảm bảo thông tin điểm đã được tải.");
            return;
        }
        
        const costPerAction = pointCosts.send_mess_group || pointCosts.send_mess_friend || 0; 
        const totalCost = recipientIds.length * costPerAction;

        setIsBulkSendModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Không tìm thấy token.");

            // ✨ SỬ DỤNG FORMDATA
            const formData = new FormData();
            formData.append('token', token);
            formData.append('userId', selectedAccount.profile.userId);
            formData.append('message', message);
            formData.append('type', 'group'); // Đánh dấu là gửi nhóm
            
            // ✨ CẬP NHẬT: Gửi timeSend
            formData.append('timeSend', timeSend);
            
            formData.append('list_request', JSON.stringify(recipientIds)); // Đóng gói mảng ID

            // Append files
            if (files.length > 0) {
                files.forEach(file => {
                    formData.append('files[]', file);
                });
            }

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`, 
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            const data = response.data;
            if (data.code !== 0) {
                if(data.code === 3){
                    router.push('/logout');
                } else {
                    throw new Error(data.mess || "Tạo yêu cầu thất bại.");
                }
            }
            
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ count: recipientIds.length });
        } catch (err: any) {
            setError(err.message);
            alert(`Lỗi: ${err.message}`);
        }
    };

    const renderContent = () => { 
        if (!isClient || loading) { 
            return <div className="text-center text-gray-400 mt-10"><FiLoader size={48} className="animate-spin mx-auto" /><p>Đang tải danh sách nhóm...</p></div>; 
        } 

        if (!selectedAccount) { 
            return <div className="text-center text-yellow-400 mt-10"><FiAlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-xl font-semibold">Chưa chọn tài khoản</h3><p>Vui lòng chọn một tài khoản Zalo từ menu ở trên header.</p></div>; 
        } 

        if (error) { 
            return <div className="text-center text-red-400 mt-10 p-4 bg-red-500/10 rounded-md">{error}</div>; 
        } 

        if (filteredGroups.length === 0 && groups.length > 0) { 
            return <div className="text-center text-gray-400 mt-10">Không tìm thấy nhóm nào khớp với bộ lọc.</div>; 
        } 

        if (groups.length === 0) { 
            return <div className="text-center text-gray-400 mt-10">Tài khoản này chưa tham gia nhóm nào.</div>; 
        } 

        // ✨ [SỬA TẠI ĐÂY]: Chỉ báo "Chưa tham gia nhóm nào" nếu mảng rỗng VÀ KHÔNG PHẢI đang trong quá trình Sync ngầm
        if (groups.length === 0 && !syncProgress.isSyncing) { 
            return <div className="text-center text-gray-400 mt-10">Tài khoản này chưa tham gia nhóm nào.</div>; 
        }

        return ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{filteredGroups.map(group => { const isAdmin = Array.isArray(group.admins) && group.admins.includes(selectedAccount.profile.userId); return ( <Link href={`/dashboard/group-details/${group.id}`} key={group.id}><div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center transition-all hover:bg-gray-700 hover:-translate-y-1 h-full"><div className="relative"><Image src={group.avatar || '/avatar-default-crm.png'} alt={group.name} width={64} height={64} className="rounded-full mb-3" onError={(e) => { e.currentTarget.src = '/avatar-default-crm.png'; }}/><div className="absolute bottom-2 right-0 bg-yellow-500 p-1 rounded-full border-2 border-gray-800" title="Bạn là quản trị viên"><FiShield size={10} className="text-white"/></div></div><p className="text-sm font-semibold text-white truncate w-full flex-grow">{group.name}</p><p className="text-xs text-gray-400 mt-1">{group.totalMembers} thành viên</p></div></Link> ) })}</div> );};

    return (
        <div className="flex-1 p-6 md:p-8">
            {isClient && isViewModalOpen && <ViewGroupByLinkModal onClose={() => setIsViewModalOpen(false)} onNavigate={handleNavigateToGroupDetails} />}
            
            {/* CẬP NHẬT: Truyền props điểm vào popup */}
            {isClient && isBulkSendModalOpen && 
                <BulkSendMessageModal 
                    allGroups={groups} 
                    selectedAccount={selectedAccount} 
                    onClose={() => setIsBulkSendModalOpen(false)} 
                    onSubmit={handleBulkSendSubmit}
                    pointCost={pointCosts?.send_mess_group || pointCosts?.send_mess_friend || 0}
                    currentUserPoints={user?.point || 0}
                />
            }
            {successInfo && ( <SuccessModal count={successInfo.count} onClose={() => setSuccessInfo(null)} onViewProgress={() => router.push('/dashboard/listSendMessageStranger')} /> )}

            {/* Phần JSX còn lại được giữ nguyên */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FiUsers />Danh sách nhóm
                </h1>

                {isClient && <div className="flex items-center gap-4">
                    <button onClick={() => setIsBulkSendModalOpen(true)} disabled={groups.length === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <FiMessageSquare /> Gửi tin hàng loạt
                    </button>
                    <Link href="/dashboard/listRequestAddMemberGroup" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm">
                        <FiUserPlus /> Thêm thành viên
                    </Link>
                    <button onClick={() => setIsViewModalOpen(true)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm">
                        <FiLink /> Xem bằng link
                    </button>
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm">
                        <FiSliders /> Bộ lọc
                    </button>
                </div>}
            </div>

            {/* THANH TRẠNG THÁI ĐỒNG BỘ (Bắt chước Mobile) */}
            {isClient && syncProgress.isSyncing && syncProgress.current < syncProgress.total && (
                <div className="bg-blue-900 border border-blue-700 p-3 rounded-md mb-6 flex items-center gap-3 animate-pulse">
                    <FiLoader className="text-blue-400 animate-spin" size={20} />
                    <p className="text-blue-200 text-sm">
                        Đang cập nhật dữ liệu nhóm ({syncProgress.current}/{syncProgress.total}). Bạn vẫn có thể thao tác bình thường...
                    </p>
                </div>
            )}

            {isClient && selectedAccount && !loading && groups.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><StatsCard icon={<FiGrid size={24} className="text-blue-400" />} title="Tổng số nhóm" value={groupStats.total} color="#3b82f6" /><StatsCard icon={<FiShield size={24} className="text-yellow-400" />} title="Nhóm quản lý" value={groupStats.admin} color="#f59e0b" /><StatsCard icon={<FiUserCheck size={24} className="text-green-400" />} title="Nhóm tham gia" value={groupStats.member} color="#10b981" /></div>)}
            {isClient && selectedAccount && !loading && (<div className="space-y-4 mb-6"><div className="flex items-center bg-gray-800 border border-gray-700 rounded-md focus-within:ring-2 focus-within:ring-blue-500"><FiSearch className="text-gray-400 mx-4" /><input type="text" placeholder={`Tìm trong ${groups.length} nhóm...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-white py-3 pr-4 focus:outline-none"/></div>{showFilters && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-md border border-gray-700 animate-fade-in-down"><div className="flex items-center gap-2"><input type="number" placeholder="Tối thiểu" value={minMembers} onChange={e => setMinMembers(e.target.value)} className="w-1/2 bg-gray-700 text-white p-2 rounded-md text-sm" /><span>-</span><input type="number" placeholder="Tối đa" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} className="w-1/2 bg-gray-700 text-white p-2 rounded-md text-sm" /></div><div><select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả vai trò</option><option value="admin">Nhóm tôi quản lý</option><option value="member">Nhóm tôi tham gia</option></select></div><div><select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả loại nhóm</option><option value="community">Nhóm cộng đồng</option><option value="normal">Nhóm thường</option></select></div><button onClick={() => { setSearchTerm(''); setMinMembers(''); setMaxMembers(''); setRoleFilter('all'); setTypeFilter('all'); }} className="bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md">Xóa bộ lọc</button></div>)}</div>)}
            {renderContent()}
        </div>
    );
}
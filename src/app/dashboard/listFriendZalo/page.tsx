'use client';

import { useState, useEffect, useMemo } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
// ✨ THÊM MỚI: Import thêm FiClock
import { FiUsers, FiLoader, FiAlertTriangle, FiSearch, FiMoreVertical, FiMessageSquare, FiInfo, FiUserX, FiX, FiSend, FiCheckCircle, FiHelpCircle, FiChevronDown, FiUserPlus as FiMale, FiUserMinus as FiFemale, FiEye, FiCreditCard, FiPaperclip, FiTrash2, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
interface Friend {
    userId: string;
    displayName: string;
    avatar: string;
    cover: string;
    gender: number;
    sdob: string;
    status: string;
    phoneNumber?: string;
    lastActionTime: number;
    isFr: number;
}

// --- COMPONENTS ---

const StatsCard = ({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string; }) => ( <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border-l-4" style={{ borderColor: color }}><div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>{icon}</div><div><p className="text-gray-400 text-sm">{title}</p><p className="text-2xl font-bold text-white">{value.toLocaleString()}</p></div></div> );

// COMPONENT: BulkUnfriendModal (Hủy kết bạn hàng loạt)
const BulkUnfriendModal = ({ allFriends, onSubmit, onClose, pointCost, currentUserPoints }: { allFriends: Friend[]; onSubmit: (friendIds: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [letterFilter, setLetterFilter] = useState<string>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    const filteredList = useMemo(() => { return allFriends.filter(friend => { const nameMatch = friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()); const phoneMatch = friend.phoneNumber && friend.phoneNumber.includes(searchTerm); if (searchTerm && !nameMatch && !phoneMatch) return false; if (showAdvanced) { if (genderFilter === 'male' && friend.gender !== 0) return false; if (genderFilter === 'female' && friend.gender !== 1) return false; if (letterFilter !== 'all' && !friend.displayName.toLowerCase().startsWith(letterFilter.toLowerCase())) return false; } return true; }); }, [allFriends, searchTerm, genderFilter, letterFilter, showAdvanced]);
    const handleToggleSelect = (friendId: string) => { const newSelectedIds = new Set(selectedIds); newSelectedIds.has(friendId) ? newSelectedIds.delete(friendId) : newSelectedIds.add(friendId); setSelectedIds(newSelectedIds); };
    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(f => f.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());
    const handleSubmit = () => onSubmit(Array.from(selectedIds));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-white text-lg flex items-center gap-2"><FiUserX /> Hủy kết bạn hàng loạt</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-4 space-y-3">{/* Filters JSX */}<div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm theo tên hoặc SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div><button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-blue-400 hover:underline flex items-center gap-1">{showAdvanced ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'} <FiChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /></button>{showAdvanced && (<div className="space-y-3 p-3 bg-gray-900/50 rounded-md animate-fade-in-down"><select value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select><div><label className="text-sm text-gray-400 mb-2 block">Lọc theo chữ cái đầu</label><div className="flex flex-wrap gap-1"><button onClick={() => setLetterFilter('all')} className={`px-3 py-1 text-xs rounded-md ${letterFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>Tất cả</button>{alphabet.map(letter => (<button key={letter} onClick={() => setLetterFilter(letter)} className={`px-3 py-1 text-xs rounded-md ${letterFilter === letter ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>{letter}</button>))}</div></div></div>)}</div>
                <div className="flex justify-between items-center text-sm px-4 pb-2"><p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span> / {filteredList.length}</p><div className="flex gap-4"><button onClick={handleSelectAll} className="text-blue-400 hover:underline">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 hover:underline">Bỏ chọn</button></div></div>
                <div className="flex-grow space-y-2 overflow-y-auto px-4 pr-2">{filteredList.map(friend => (<label key={friend.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={selectedIds.has(friend.userId)} onChange={() => handleToggleSelect(friend.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-red-500 focus:ring-red-500"/><Image src={friend.avatar || '/avatar-default-crm.png'} alt={friend.displayName} width={40} height={40} className="rounded-full" onError={(e) => { e.currentTarget.src = '/avatar-default-crm.png'; }}/><span className="text-white truncate">{friend.displayName}</span></label>))}{filteredList.length === 0 && <div className="text-center text-gray-500 pt-10">Không có bạn bè nào khớp với bộ lọc.</div>}</div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
                    {!hasEnoughPoints && selectedIds.size > 0 && (
                        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mb-3 text-sm">
                            <p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, bạn đang có {currentUserPoints.toLocaleString()}.</p>
                            <Link href="/dashboard/billing" className="font-bold text-blue-400 hover:underline mt-1 block">Nạp thêm điểm?</Link>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <div className="text-sm"><span className="text-gray-400">Chi phí:</span><span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span></div>
                        <div className="flex gap-3"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button><button onClick={handleSubmit} disabled={selectedIds.size === 0 || !hasEnoughPoints} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed"><FiUserX/> Xác nhận hủy ({selectedIds.size})</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// COMPONENT: BulkSendMessageModal (Gửi tin nhắn hàng loạt - CÓ FILE & THỜI GIAN)
const BulkSendMessageModal = ({ allFriends, onSubmit, onClose, pointCost, currentUserPoints }: any) => {
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());
    const [searchTerm, setSearchTerm] = useState('');

    // Lọc danh sách bạn bè để chọn
    const filteredList = allFriends.filter((f: any) => 
        f.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredList.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredList.map((f: any) => f.userId)));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-white text-lg">Gửi tin nhắn hàng loạt cho bạn bè</h3>
                    <button onClick={onClose}><FiX size={20} className="text-white"/></button>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Bên trái: Danh sách chọn bạn bè */}
                    <div className="w-full md:w-2/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden bg-gray-800/30">
                        <input 
                            type="text" 
                            placeholder="Tìm tên bạn bè..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-gray-700 text-white p-2 rounded mb-4 outline-none border border-gray-600 text-sm"
                        />
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === filteredList.length && filteredList.length > 0} className="rounded border-gray-600 bg-gray-900"/>
                                Chọn tất cả ({filteredList.length})
                            </label>
                            <span className="text-xs text-blue-400">Đã chọn: {selectedIds.size}</span>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {filteredList.map((friend: any) => (
                                <label key={friend.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(friend.userId)} 
                                        onChange={() => handleToggleSelect(friend.userId)} 
                                        className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-900"
                                    />
                                    <img src={friend.avatar || '/avatar-default-crm.png'} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="text-white text-sm truncate">{friend.displayName}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Bên phải: Soạn tin nhắn dùng Composer */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar bg-gray-800">
                        <MessageComposer 
                            message={message} onChangeMessage={setMessage}
                            selectedFiles={selectedFiles} onFilesChange={setSelectedFiles}
                            timeSend={sendTime} onTimeSendChange={setSendTime}
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center shrink-0 rounded-b-lg">
                    <div className="text-sm">
                        <span className="text-gray-400">Chi phí: </span>
                        <span className={`font-bold ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold">Hủy</button>
                        <button 
                            onClick={() => onSubmit(message, Array.from(selectedIds), selectedFiles, formatTimeForApi(sendTime))} 
                            disabled={selectedIds.size === 0 || (!message.trim() && selectedFiles.length === 0) || !hasEnoughPoints}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded font-bold disabled:opacity-50 transition-all shadow-lg"
                        >
                            Gửi cho {selectedIds.size} bạn bè
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// COMPONENT: SendMessageModal (Gửi tin nhắn đơn lẻ - CÓ FILE & THỜI GIAN)
const SendMessageModal = ({ friend, onClose, onSend, pointCost, currentUserPoints }: any) => {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());
    const [isSending, setIsSending] = useState(false);

    const hasEnoughPoints = currentUserPoints >= pointCost;

    const handleSend = async () => {
        if ((!message.trim() && selectedFiles.length === 0) || isSending || !hasEnoughPoints) return;
        setIsSending(true);
        await onSend(message, selectedFiles, formatTimeForApi(sendTime));
        setIsSending(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center font-bold text-white">Gửi tin nhắn cho {friend.displayName} <FiX className="cursor-pointer" onClick={onClose}/></div>
                <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <MessageComposer 
                        message={message} onChangeMessage={setMessage}
                        selectedFiles={selectedFiles} onFilesChange={setSelectedFiles}
                        timeSend={sendTime} onTimeSendChange={setSendTime}
                    />
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{pointCost.toLocaleString()} điểm</span>
                    <button onClick={handleSend} disabled={isSending || !hasEnoughPoints} className="bg-blue-600 px-6 py-2 rounded font-bold text-white disabled:opacity-50">
                        {isSending ? <FiLoader className="animate-spin"/> : "Gửi ngay"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Các component hiển thị thông báo
const FriendInfoModal = ({ friend, onClose, onOpenMessage }: { friend: Friend; onClose: () => void; onOpenMessage: () => void; }) => { const formatTimestamp = (ts: number) => ts ? new Date(ts).toLocaleString('vi-VN') : 'Không có'; return ( <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}><div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}><div className="relative h-36 bg-gray-700">{friend.cover && <Image src={friend.cover} alt="Cover Photo" layout="fill" objectFit="cover" unoptimized />}<button onClick={onClose} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white"><FiX size={20}/></button></div><div className="relative px-6"><div className="absolute -top-12"><Image src={friend.avatar} alt={friend.displayName} width={96} height={96} className="rounded-full border-4 border-gray-800" /></div><div className="pt-16"><h2 className="text-2xl font-bold text-white">{friend.displayName}</h2><p className="text-gray-400 text-sm mt-1">{friend.status || 'Không có trạng thái'}</p></div></div><div className="px-6 py-4 space-y-3 border-t border-gray-700 mt-4"><div className="text-sm flex"><span className="font-semibold text-gray-400 w-28">Số điện thoại:</span>{friend.phoneNumber ? (<a href={`tel:${friend.phoneNumber}`} className="text-blue-400 hover:underline">{friend.phoneNumber}</a>) : (<span className="text-gray-200">Không có</span>)}</div><div className="text-sm flex"><span className="font-semibold text-gray-400 w-28">Giới tính:</span><span className="text-gray-200">{friend.gender === 1 ? 'Nữ' : 'Nam'}</span></div><div className="text-sm flex"><span className="font-semibold text-gray-400 w-28">Ngày sinh:</span><span className="text-gray-200">{friend.sdob || 'Không có'}</span></div><div className="text-sm flex"><span className="font-semibold text-gray-400 w-28">Là bạn bè:</span><span className="text-gray-200">{friend.isFr === 1 ? 'Phải' : 'Không'}</span></div><div className="text-sm flex"><span className="font-semibold text-gray-400 w-28">Hoạt động cuối:</span><span className="text-gray-200">{formatTimestamp(friend.lastActionTime)}</span></div></div><div className="p-4 bg-gray-900 flex justify-end"><button onClick={onOpenMessage} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"><FiSend /> Gửi tin nhắn</button></div></div></div> ); };
const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => { useEffect(() => { const timer = setTimeout(() => { onClose(); }, 3000); return () => clearTimeout(timer); }, [onClose]); return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> ); };
const SuccessModal = ({ title, message, onClose, onViewProgress }: { title: string; message: string; onClose: () => void; onViewProgress: () => void; }) => { return ( <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><FiCheckCircle className="text-green-400" size={40} /></div><h3 className="text-lg font-bold text-white mb-2">{title}</h3><p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p><div className="flex flex-col sm:flex-row justify-center gap-4"><button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Đóng</button><button onClick={onViewProgress} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2"><FiEye /> Xem tiến trình</button></div></div></div> ); };


// --- MAIN PAGE COMPONENT ---
export default function ListFriendZaloPage() {
    const { selectedAccount, removeAccount} = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);
    const [messagingFriend, setMessagingFriend] = useState<Friend | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    const [isBulkUnfriendModalOpen, setIsBulkUnfriendModalOpen] = useState(false);
    const [bulkMessageSuccessInfo, setBulkMessageSuccessInfo] = useState<{ count: number } | null>(null);
    const [bulkUnfriendSuccessInfo, setBulkUnfriendSuccessInfo] = useState<{ count: number } | null>(null);
    const [pendingUnfriendIds, setPendingUnfriendIds] = useState<Set<string>>(new Set());
    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => { setIsClient(true); }, []);
    
    useEffect(() => { 
        if (!isClient || !selectedAccount) { 
            if (isClient && !selectedAccount) { setFriends([]); setLoading(false); } 
            return; 
        } 

        const fetchFriends = async () => { 
            setError(null); 
            const myId = selectedAccount.profile.userId;
            const cacheKey = `ztool_friends_${myId}`;
            
            // 1. ĐỌC CACHE VÀ HIỂN THỊ GIAO DIỆN NGAY LẬP TỨC
            let cachedFriends: Friend[] = [];
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                cachedFriends = JSON.parse(cachedData);
                setFriends(cachedFriends);
                setLoading(false); // Có Cache là nhả giao diện ra ngay lập tức
            } else {
                setLoading(true); // Không có cache mới hiện vòng xoay xoay
            }

            try { 
                const { cookie, imei, userAgent } = selectedAccount; 
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friends`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ cookie, imei, userAgent, proxy: savedProxy }), 
                }); 
                const data = await response.json(); 
                
                if (!response.ok || !data.success) throw new Error(data.message || 'Lấy danh sách bạn bè thất bại.'); 
                
                const newFriends = data.friends || [];

                // 2. KHIÊN BẢO VỆ SILENT LIMIT CỦA ZALO
                if (newFriends.length === 0 && cachedFriends.length > 10) {
                    console.warn("🛡️ API Zalo trả về 0 bạn bè. Kích hoạt khiên bảo vệ Cache!");
                    return; // Thoát luôn, giữ nguyên Cache hiển thị
                }

                // 3. CẬP NHẬT UI & LƯU CACHE MỚI NHẤT
                setFriends(newFriends);
                localStorage.setItem(cacheKey, JSON.stringify(newFriends));

                // 4. LƯU ĐỒNG BỘ VÀO DATABASE CỦA PHP
                const authToken = localStorage.getItem('authToken'); 
                if (authToken && newFriends.length > 0) { 
                    try { 
                        await axios.post( 
                            `${process.env.NEXT_PUBLIC_API_URL}/apis/saveZaloAccAPI`, 
                            { token: authToken, listData: newFriends, userId: myId } 
                        ); 
                    } catch (dbError: any) { 
                        console.error("Lỗi khi lưu danh sách bạn bè vào DB:", dbError.message); 
                    } 
                } 
            } catch (err: any) { 
                // Chỉ hiện lỗi nếu không có dữ liệu Cache để hiển thị
                if (friends.length === 0 && cachedFriends.length === 0) {
                    setError(err.message); 
                }
            } finally { 
                setLoading(false); 
            } 
        }; 
        
        fetchFriends(); 
    }, [selectedAccount, isClient, removeAccount]);
    
    const friendStats = useMemo(() => { if (!isClient) return { total: 0, male: 0, female: 0 }; const maleCount = friends.filter(f => f.gender === 0).length; const femaleCount = friends.filter(f => f.gender === 1).length; return { total: friends.length, male: maleCount, female: femaleCount, }; }, [friends, isClient]);
    const filteredAndSortedFriends = useMemo(() => { return friends .filter(friend => friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || (friend.phoneNumber && friend.phoneNumber.includes(searchTerm))) .sort((a, b) => a.displayName.localeCompare(b.displayName)); }, [friends, searchTerm]);
    const toggleMenu = (userId: string) => { setActiveMenu(prev => (prev === userId ? null : userId)); };

    // Xử lý gửi tin nhắn đơn lẻ (Có file & Time)
    const handleSendMessage = async (message: string, files: File[], timeSend: string) => {
        if (!messagingFriend || !selectedAccount || !pointCosts || !user) throw new Error("Thiếu thông tin để gửi tin nhắn.");
        const cost = pointCosts.send_mess_friend || 0;
        
        // Sử dụng FormData
        const formData = new FormData();
        formData.append('token', localStorage.getItem('authToken') || '');
        formData.append('userId', selectedAccount.profile.userId);
        formData.append('message', message);
        formData.append('type', 'friend');
        // ✨ CẬP NHẬT: Gửi timeSend
        formData.append('timeSend', timeSend);
        
        // Đóng gói mảng ID thành JSON string (dù chỉ có 1 ID)
        formData.append('list_request', JSON.stringify([messagingFriend.userId])); 

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
            if (data.code === 3) router.push('/logout'); 
            throw new Error(data.mess || "Tạo yêu cầu thất bại."); 
        }
        
        updateUserPoints(user.point - cost);
        setMessagingFriend(null);
        setNotification(`Đã tạo yêu cầu gửi tin nhắn đến ${messagingFriend.displayName}`);
    };

    // Xử lý gửi tin hàng loạt (Có file & Time)
    const handleBulkSendSubmit = async (message: string, recipientIds: string[], files: File[], timeSend: string) => {
        if (!selectedAccount || !pointCosts || !user) { alert("Vui lòng chọn tài khoản."); return; }
        const cost = (pointCosts.send_mess_friend || 0) * recipientIds.length;
        
        setIsBulkMessageModalOpen(false);
        try {
            const token = localStorage.getItem('authToken'); if (!token) { throw new Error("Không tìm thấy token."); }
            
            // Dùng FormData thay vì JSON
            const formData = new FormData();
            formData.append('token', token);
            formData.append('userId', selectedAccount.profile.userId);
            formData.append('message', message);
            formData.append('type', 'friend');
            
            // ✨ CẬP NHẬT: Gửi timeSend
            formData.append('timeSend', timeSend);
            
            formData.append('list_request', JSON.stringify(recipientIds)); // Đóng gói mảng ID thành JSON string

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
            if (data.code != 0) { if(data.code == 3) router.push('/logout'); else throw new Error(data.message || "Tạo yêu cầu thất bại."); }
            updateUserPoints(user.point - cost);
            setBulkMessageSuccessInfo({ count: recipientIds.length });
        } catch (err: any) { setError(err.message); alert(`Lỗi: ${err.message}`); }
    };

    const createDeleteFriendRequest = async (friendIdsToDelete: string[]) => {
        if (!selectedAccount || !pointCosts || !user) { throw new Error("Thiếu thông tin."); }
        const cost = (pointCosts.delete_friend || 0) * friendIdsToDelete.length;
        if (user.point < cost) { throw new Error(`Không đủ điểm. Cần ${cost}, bạn đang có ${user.point}.`); }
        const token = localStorage.getItem('authToken'); if (!token) { throw new Error("Không tìm thấy token."); }
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestDeleteFriendAPI`, { token, userId: selectedAccount.profile.userId, list_request: friendIdsToDelete });
        const data = response.data;
        if (data.code != 0) { if (data.code == 3) router.push('/logout'); else throw new Error(data.message || "Tạo yêu cầu thất bại."); }
        updateUserPoints(user.point - cost);
        return data;
    };
    const handleBulkUnfriendSubmit = async (friendIdsToDelete: string[]) => {
        setIsBulkUnfriendModalOpen(false);
        try { await createDeleteFriendRequest(friendIdsToDelete); setBulkUnfriendSuccessInfo({ count: friendIdsToDelete.length }); } catch (err: any) { setError(err.message); alert(`Lỗi: ${err.message}`); }
    };
    const handleSingleUnfriendRequest = async (friendToUnfriend: Friend) => {
        setActiveMenu(null);
        if (!pointCosts || !user) { alert("Không thể tải cấu hình điểm."); return; }
        const cost = pointCosts.delete_friend || 0;
        if (user.point < cost) { alert(`Không đủ điểm. Cần ${cost}, bạn đang có ${user.point}.`); return; }
        try {
            await createDeleteFriendRequest([friendToUnfriend.userId]);
            setPendingUnfriendIds(prev => new Set(prev).add(friendToUnfriend.userId));
            setNotification(`Đã tạo yêu cầu hủy kết bạn với ${friendToUnfriend.displayName}.`);
        } catch (err: any) { setError(err.message); alert(`Lỗi: ${err.message}`); }
    };

    const renderContent = () => { if (!isClient || loading) { return <div className="text-center text-gray-400 mt-10"><FiLoader size={48} className="animate-spin mx-auto" /><p>Đang tải danh sách bạn bè...</p></div>; } if (!selectedAccount) { return <div className="text-center text-yellow-400 mt-10"><FiAlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-xl font-semibold">Chưa chọn tài khoản</h3><p>Vui lòng chọn một tài khoản Zalo từ menu ở trên header.</p></div>; } if (error) { return <div className="text-center text-red-400 mt-10 p-4 bg-red-500/10 rounded-md">{error}</div>; } if (filteredAndSortedFriends.length === 0) { return <div className="text-center text-gray-400 mt-10">Không tìm thấy bạn bè nào.</div>; } return ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{filteredAndSortedFriends.map(friend => { const isPending = pendingUnfriendIds.has(friend.userId); return ( <div key={friend.userId} className={`bg-gray-800 p-3 rounded-lg flex items-center gap-3 relative transition-opacity ${isPending ? 'opacity-50' : ''}`}><Image src={friend.avatar} alt={friend.displayName} width={40} height={40} className="rounded-full flex-shrink-0" /><div className="flex-1 overflow-hidden"><p className="text-sm font-medium text-white truncate">{friend.displayName}</p></div><button onClick={() => toggleMenu(friend.userId)} className="p-1 rounded-full hover:bg-gray-700 z-20" disabled={isPending}><FiMoreVertical className="text-gray-400" /></button>{activeMenu === friend.userId && (<div className="absolute top-12 right-0 bg-gray-700 rounded-md shadow-lg p-2 z-10 w-40" onClick={e => e.stopPropagation()}><button onClick={() => { setViewingFriend(friend); setActiveMenu(null); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-blue-600"><FiInfo size={14}/> Xem thông tin</button><button onClick={() => { setMessagingFriend(friend); setActiveMenu(null); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-blue-600"><FiMessageSquare size={14}/> Gửi tin nhắn</button><button onClick={() => handleSingleUnfriendRequest(friend)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-red-600 hover:text-white"><FiUserX size={14}/> Hủy kết bạn</button></div>)}</div> ); })}</div> ); };

    return (
        <div className="flex-1 p-6 md:p-8">
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            {viewingFriend && <FriendInfoModal friend={viewingFriend} onClose={() => setViewingFriend(null)} onOpenMessage={() => { setViewingFriend(null); setMessagingFriend(viewingFriend); }} />}
            {messagingFriend && selectedAccount && ( <SendMessageModal friend={messagingFriend} onClose={() => setMessagingFriend(null)} onSend={handleSendMessage} pointCost={pointCosts?.send_mess_friend || 0} currentUserPoints={user?.point || 0} /> )}
            {isBulkMessageModalOpen && ( <BulkSendMessageModal allFriends={friends} onClose={() => setIsBulkMessageModalOpen(false)} onSubmit={handleBulkSendSubmit} pointCost={pointCosts?.send_mess_friend || 0} currentUserPoints={user?.point || 0} /> )}
            {isBulkUnfriendModalOpen && ( <BulkUnfriendModal allFriends={friends} onClose={() => setIsBulkUnfriendModalOpen(false)} onSubmit={handleBulkUnfriendSubmit} pointCost={pointCosts?.delete_friend || 0} currentUserPoints={user?.point || 0} /> )}
            {bulkMessageSuccessInfo && ( <SuccessModal title="Yêu cầu Gửi Tin nhắn đã được tạo" message={`Đã tạo yêu cầu gửi tin nhắn đến <span class="font-bold">${bulkMessageSuccessInfo.count}</span> thành viên thành công!`} onClose={() => setBulkMessageSuccessInfo(null)} onViewProgress={() => router.push('/dashboard/listSendMessageStranger')} /> )}
            {bulkUnfriendSuccessInfo && ( <SuccessModal title="Yêu cầu Hủy Kết bạn đã được tạo" message={`Đã tạo yêu cầu hủy kết bạn với <span class="font-bold">${bulkUnfriendSuccessInfo.count}</span> thành viên thành công!`} onClose={() => setBulkUnfriendSuccessInfo(null)} onViewProgress={() => router.push('/dashboard/listRequestDeleteFriend')} /> )}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6"><h1 className="text-3xl font-bold text-white flex items-center gap-3"><FiUsers />Danh sách bạn bè</h1>{isClient && selectedAccount && !loading && friends.length > 0 && (<div className="flex items-center gap-2"><button onClick={() => setIsBulkMessageModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm flex items-center gap-2"><FiMessageSquare/> Gửi tin nhắn hàng loạt</button><button onClick={() => setIsBulkUnfriendModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm flex items-center gap-2"><FiUserX/> Hủy kết bạn hàng loạt</button></div>)}</div>
            {isClient && selectedAccount && !loading && friends.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><StatsCard icon={<FiUsers size={24} className="text-blue-400" />} title="Tổng số bạn bè" value={friendStats.total} color="#3b82f6" /><StatsCard icon={<FiMale size={24} className="text-sky-400" />} title="Bạn bè là Nam" value={friendStats.male} color="#38bdf8" /><StatsCard icon={<FiFemale size={24} className="text-pink-400" />} title="Bạn bè là Nữ" value={friendStats.female} color="#f472b6" /></div>)}
            {isClient && selectedAccount && !loading && (<div className="flex items-center bg-gray-800 border border-gray-700 rounded-md mb-6 focus-within:ring-2 focus-within:ring-blue-500"><FiSearch className="text-gray-400 mx-4" /><input type="text" placeholder="Tìm kiếm theo tên hoặc số điện thoại..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-white py-3 pr-4 focus:outline-none"/></div>)}
            {renderContent()}
        </div>
    );
}
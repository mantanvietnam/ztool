'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { 
    FiArrowLeft, FiLoader, FiUser, FiSearch, FiPlus, FiX, 
    FiCheckCircle, FiCheck, FiUsers, FiMoreVertical, FiTrash2,
    FiMessageSquare, FiPaperclip, FiSend, FiChevronDown, FiHelpCircle, FiClock
} from 'react-icons/fi';
import axios from 'axios';
import MessageComposer from '@/components/MessageComposer';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';

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

// --- INTERFACES ---

interface TagMember {
    id: number;
    tag_id: number;
    user_id: number;
    zalo_uid: string;
    zalo_uid_friend: string;
    zalo_name_friend: string;
    zalo_avatar_friend: string;
}

interface ZaloFriend {
    userId: string;
    displayName: string;
    avatar: string;
    gender: number;
    phoneNumber?: string;
}

// --- SUB-COMPONENTS ---

const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    useEffect(() => { const timer = setTimeout(() => { onClose(); }, 3000); return () => clearTimeout(timer); }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

// Modal Thêm Thành Viên
const AddMemberModal = ({ 
    onClose, 
    onSubmit, 
    existingMemberIds 
}: { 
    onClose: () => void; 
    onSubmit: (selectedFriends: ZaloFriend[]) => Promise<void>; 
    tagId: string | string[]; 
    existingMemberIds: string[]; 
}) => {
    const { selectedAccount } = useZaloAccounts();
    const [friends, setFriends] = useState<ZaloFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFriends = async () => {
            if (!selectedAccount) return;
            
            const myId = selectedAccount.profile.userId;
            const cacheKey = `ztool_friends_${myId}`;

            // 1. ĐỌC CACHE & HIỂN THỊ POPUP NGAY LẬP TỨC (0 Giây)
            let cachedFriends: ZaloFriend[] = [];
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                cachedFriends = JSON.parse(cachedData);
                setFriends(cachedFriends);
                setLoading(false); // Có Cache -> Nhả vòng xoay loading ngay lập tức
            } else {
                setLoading(true); // Nếu người dùng mới cứng chưa có Cache thì mới xoay
            }

            try {
                const savedProxyStr = localStorage.getItem('userProxy');
                const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;
                const { cookie, imei, userAgent } = selectedAccount;

                // 2. GỌI API LẤY DANH SÁCH MỚI NHẤT CHẠY NGẦM
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friends`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cookie, imei, userAgent, proxy: savedProxy }),
                });

                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || 'Lấy danh sách bạn bè thất bại.');
                
                const newFriends = data.friends || [];

                // 3. KHIÊN BẢO VỆ SILENT LIMIT (Chống mất Cache)
                if (newFriends.length === 0 && cachedFriends.length > 10) {
                    console.warn("🛡️ API Zalo trả về 0 bạn bè. Kích hoạt khiên bảo vệ Cache!");
                    return; 
                }

                // 4. CẬP NHẬT CACHE & GIAO DIỆN
                localStorage.setItem(cacheKey, JSON.stringify(newFriends));
                setFriends(newFriends);
                
            } catch (err: any) {
                console.error("Lỗi tải bạn bè:", err);
                // Chỉ báo lỗi đỏ lên màn hình nếu chưa có tí Cache nào để dùng tạm
                if (cachedFriends.length === 0) {
                    setError(err.message || "Không thể tải danh sách bạn bè.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, [selectedAccount]);

    const filteredFriends = useMemo(() => {
        return friends.filter(f => 
            !existingMemberIds.includes(f.userId) &&
            (
                f.displayName.toLowerCase().includes(search.toLowerCase()) || 
                (f.phoneNumber && f.phoneNumber.includes(search)) ||
                (f.userId && f.userId.includes(search))
            )
        );
    }, [friends, search, existingMemberIds]);

    const toggleSelection = (friendId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(friendId)) newSet.delete(friendId);
            else newSet.add(friendId);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredFriends.length) setSelectedIds(new Set()); 
        else setSelectedIds(new Set(filteredFriends.map(f => f.userId)));
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) return;
        setIsSubmitting(true);
        const selectedFriendsList = friends.filter(f => selectedIds.has(f.userId));
        await onSubmit(selectedFriendsList);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0 rounded-t-lg">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><FiUsers /> Thêm bạn bè vào thẻ</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button>
                </div>
                <div className="p-4 border-b border-gray-700 space-y-3 bg-gray-800">
                    <div className="relative">
                        <input type="text" placeholder="Tìm theo tên, SĐT hoặc UID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Tìm thấy: <b className="text-white">{filteredFriends.length}</b> (đã lọc trùng)</span>
                        <div className="flex gap-4">
                            <span className="text-gray-400">Đã chọn: <b className="text-white">{selectedIds.size}</b></span>
                            <button onClick={handleSelectAll} className="text-blue-400 hover:underline font-medium">{selectedIds.size === filteredFriends.length && filteredFriends.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-800">
                    {loading ? <div className="text-center text-gray-400 py-10"><FiLoader className="animate-spin inline mr-2"/>Đang tải...</div> : error ? <div className="text-center text-red-400 py-10">{error}</div> : filteredFriends.length === 0 ? <div className="text-center text-gray-500 py-10">Không tìm thấy bạn bè nào.</div> : filteredFriends.map(friend => {
                        const isSelected = selectedIds.has(friend.userId);
                        return (
                            <div key={friend.userId} onClick={() => toggleSelection(friend.userId)} className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition border ${isSelected ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-transparent hover:bg-gray-700'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>{isSelected && <FiCheck size={14} className="text-white"/>}</div>
                                <div className="flex-shrink-0"><img src={friend.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-600" onError={(e) => e.currentTarget.src='/avatar-default.png'} /></div>
                                <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{friend.displayName}</p><p className="text-gray-400 text-xs font-mono truncate">{friend.userId}</p></div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 rounded-b-lg shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm font-medium">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting || selectedIds.size === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Lưu lại ({selectedIds.size})</button>
                </div>
            </div>
        </div>
    );
};

// Modal Gửi Tin Nhắn Hàng Loạt (Cho thành viên trong Tag - CÓ FILE & THỜI GIAN)
const BulkSendMessageTagModal = ({ members, onClose, onSubmit, pointCost, currentUserPoints }: any) => {
    const [message, setMessage] = useState('');
    // Mặc định chọn tất cả thành viên trong thẻ khi mở lên
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(members.map((m: any) => m.zalo_uid_friend)));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());
    const [isSending, setIsSending] = useState(false);

    // Lọc danh sách hiển thị theo từ khóa tìm kiếm
    const filteredList = useMemo(() => {
        return members.filter((m: any) => m.zalo_name_friend.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [members, searchTerm]);

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    // Logic chọn từng người
    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    // Logic chọn tất cả / bỏ chọn
    const handleSelectAll = () => {
        const currentFilteredIds = filteredList.map((m:any) => m.zalo_uid_friend);
        const isAllFilteredSelected = currentFilteredIds.every((id:string) => selectedIds.has(id));

        const next = new Set(selectedIds);
        if (isAllFilteredSelected) {
            // Nếu đã chọn hết danh sách đang lọc -> Bỏ chọn chúng
            currentFilteredIds.forEach((id:string) => next.delete(id));
        } else {
            // Nếu chưa chọn hết -> Chọn tất cả danh sách đang lọc
            currentFilteredIds.forEach((id:string) => next.add(id));
        }
        setSelectedIds(next);
    };

    const handleSend = async () => {
        // Validate lần cuối trước khi gửi
        if (selectedIds.size === 0 || (!message.trim() && selectedFiles.length === 0) || isSending || !hasEnoughPoints) return;
        
        setIsSending(true);
        await onSubmit(message, Array.from(selectedIds), selectedFiles, formatTimeForApi(sendTime));
        setIsSending(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-white text-lg">Gửi tin nhắn cho thành viên thẻ</h3>
                    <button onClick={onClose}><FiX size={20} className="text-white hover:text-red-400 transition"/></button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái: Danh sách thành viên */}
                    <div className="w-full md:w-2/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden bg-gray-800/30">
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm tên thành viên..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600 outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center mb-2 px-1 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                                <input 
                                    type="checkbox" 
                                    checked={filteredList.length > 0 && filteredList.every((m:any) => selectedIds.has(m.zalo_uid_friend))} 
                                    onChange={handleSelectAll} 
                                    className="rounded border-gray-600 bg-gray-900 text-blue-500"
                                />
                                Chọn tất cả ({filteredList.length})
                            </label>
                            <span className="text-blue-400">Đã chọn: <b>{selectedIds.size}</b></span>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {filteredList.map((member: any) => (
                                <label key={member.zalo_uid_friend} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md cursor-pointer transition-colors group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(member.zalo_uid_friend)} 
                                        onChange={() => handleToggleSelect(member.zalo_uid_friend)} 
                                        className="form-checkbox text-blue-500 rounded bg-gray-900 border-gray-600 h-4 w-4"
                                    />
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                                            <FiUser size={14} className="text-gray-300"/>
                                        </div>
                                        <span className="text-white text-sm truncate group-hover:text-blue-300 transition-colors">
                                            {member.zalo_name_friend}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Soạn thảo */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar bg-gray-800">
                        <MessageComposer 
                            message={message} onChangeMessage={setMessage}
                            selectedFiles={selectedFiles} onFilesChange={setSelectedFiles}
                            timeSend={sendTime} onTimeSendChange={setSendTime}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center shrink-0">
                    <div className="text-sm">
                        <span className="text-gray-400">Chi phí dự kiến: </span>
                        <span className={`font-bold ml-1 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>
                            {calculatedCost.toLocaleString()} điểm
                        </span>
                        {!hasEnoughPoints && <span className="text-red-500 text-xs ml-2">(Thiếu {(calculatedCost - currentUserPoints).toLocaleString()})</span>}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-colors">Hủy</button>
                        <button 
                            onClick={handleSend} 
                            disabled={isSending || selectedIds.size === 0 || (!message.trim() && selectedFiles.length === 0) || !hasEnoughPoints} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg"
                        >
                            {isSending ? <FiLoader className="animate-spin"/> : <FiSend />} 
                            Gửi cho {selectedIds.size} người
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---

export default function TagDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts } = useSettings(); // Lấy bảng giá
    const { user, updateUserPoints } = useAuth();

    const tagId = params.id; 
    const tagName = searchParams.get('name') || `Thẻ #${tagId}`;

    const [members, setMembers] = useState<TagMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    
    // State Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    // List UID đã có để lọc khi thêm mới
    const existingMemberIds = useMemo(() => {
        return members.map(m => m.zalo_uid_friend);
    }, [members]);

    const fetchMembers = useCallback(async () => {
        if (!selectedAccount) { setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) { router.push('/logout'); return; }
            
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListMemberTagAPI`, {
                token,
                userId: selectedAccount.profile.userId,
                tag_id: tagId 
            });

            const data = response.data;
            if (data.code === 0) {
                setMembers(data.listData || []);
            } else if (data.code === 3) {
                router.push('/logout');
            } else {
                console.warn(data.message);
                setMembers([]);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [tagId, selectedAccount, router]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    // Xử lý thêm thành viên
    const handleAddMembers = async (selectedFriends: ZaloFriend[]) => {
        const token = localStorage.getItem('authToken');
        if (!token || !selectedAccount) return;

        try {
            const memberPayload = selectedFriends.map(f => ({
                zalo_uid_friend: f.userId,
                zalo_name_friend: f.displayName,
                zalo_avatar_friend: f.avatar
            }));

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/saveMemberTagAPI`, {
                token,
                userId: selectedAccount.profile.userId,
                tag_id: tagId,
                member: memberPayload
            });

            if (response.data.code === 0) {
                setNotification(`Đã thêm ${selectedFriends.length} thành viên vào thẻ!`);
                setIsAddModalOpen(false);
                fetchMembers();
            } else {
                alert(response.data.message || "Thêm thất bại.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi kết nối.");
        }
    };

    // Xử lý xóa thành viên
    const handleRemoveMember = async (memberUidFriend: string, memberName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${memberName} khỏi thẻ này?`)) return;
        setActiveMenu(null); 

        const token = localStorage.getItem('authToken');
        if (!token || !selectedAccount) return;

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/deleteMemberTagAPI`, {
                token,
                userId: selectedAccount.profile.userId,
                tag_id: tagId,
                zalo_uid_friend: memberUidFriend
            });

            if (response.data.code === 0) {
                setNotification(`Đã xóa ${memberName} khỏi thẻ.`);
                setMembers(prev => prev.filter(m => m.zalo_uid_friend !== memberUidFriend));
            } else {
                alert(response.data.message || "Xóa thất bại.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi kết nối.");
        }
    };

    // Xử lý Gửi tin nhắn hàng loạt - ✨ CẬP NHẬT: Thêm tham số timeSend
    const handleBulkSendSubmit = async (message: string, recipientIds: string[], files: File[], timeSend: string) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = recipientIds.length * (pointCosts.send_mess_friend || 0);
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        setIsBulkMessageModalOpen(false);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) { router.push('/logout'); return; }

            // Tạo FormData
            const formData = new FormData();
            formData.append('token', token);
            formData.append('userId', selectedAccount.profile.userId);
            formData.append('message', message);
            formData.append('type', 'friend'); // Gửi cho bạn bè
            
            // ✨ CẬP NHẬT: Gửi thời gian lên API
            formData.append('timeSend', timeSend);
            
            formData.append('list_request', JSON.stringify(recipientIds)); // List UID

            // Append files
            if (files.length > 0) {
                files.forEach(file => {
                    formData.append('files[]', file);
                });
            }

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`, 
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            const data = response.data;
            if (data.code === 0) {
                updateUserPoints(user.point - totalCost);
                setNotification(`Đã tạo yêu cầu gửi tin nhắn cho ${recipientIds.length} người.`);
                setIsBulkMessageModalOpen(false);
                // Có thể điều hướng về trang danh sách tiến trình nếu muốn
                // router.push('/dashboard/listSendMessageStranger'); 
            } else if (data.code === 3) {
                router.push('/logout');
            } else {
                alert(data.message || data.mess || "Gửi tin nhắn thất bại.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Lỗi kết nối.");
        }
    };

    const filteredMembers = useMemo(() => {
        return members.filter(member => 
            (member.zalo_name_friend && member.zalo_name_friend.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (member.zalo_uid_friend && member.zalo_uid_friend.includes(searchTerm))
        );
    }, [members, searchTerm]);

    const toggleMenu = (recordId: number) => {
        setActiveMenu(prev => (prev === recordId ? null : recordId));
    };

    const renderContent = () => {
        if (loading) return <div className="p-12 text-center text-gray-400"><FiLoader className="animate-spin inline mr-2"/>Đang tải danh sách thành viên...</div>;
        if (error) return <div className="p-12 text-center text-red-400">Lỗi: {error}</div>;
        if (members.length === 0) return <div className="p-12 text-center text-gray-500">Thẻ này chưa có thành viên nào. Hãy thêm mới!</div>;
        if (filteredMembers.length === 0) return <div className="p-12 text-center text-gray-500">Không tìm thấy kết quả phù hợp.</div>;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMembers.map((member) => (
                    <div key={member.id} className="bg-gray-800 p-3 rounded-lg flex items-center gap-3 relative transition hover:bg-gray-750 border border-gray-700/50">
                        <div className="flex-shrink-0">
                            {member.zalo_avatar_friend ? (
                                <img src={member.zalo_avatar_friend} alt="Ava" className="w-10 h-10 rounded-full object-cover border border-gray-600" onError={(e) => e.currentTarget.src='/avatar-default.png'} />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300"><FiUser /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate" title={member.zalo_name_friend}>{member.zalo_name_friend || 'Không tên'}</p>
                            <p className="text-xs text-gray-500 font-mono truncate">{member.zalo_uid_friend}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleMenu(member.id); }} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition z-10">
                            <FiMoreVertical size={18} />
                        </button>
                        {activeMenu === member.id && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)}></div>
                                <div className="absolute top-10 right-0 bg-gray-700 rounded-md shadow-xl py-1 z-30 w-40 border border-gray-600 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleRemoveMember(member.zalo_uid_friend, member.zalo_name_friend)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 flex items-center gap-2">
                                        <FiTrash2 size={14} /> Xóa khỏi tag
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8" onClick={() => setActiveMenu(null)}>
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            
            {/* Modal Thêm Thành Viên */}
            {isAddModalOpen && (
                <AddMemberModal 
                    tagId={tagId as string} 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSubmit={handleAddMembers}
                    existingMemberIds={existingMemberIds}
                />
            )}

            {/* Modal Gửi Tin Nhắn (MỚI) */}
            {isBulkMessageModalOpen && members.length > 0 && (
                <BulkSendMessageTagModal 
                    members={members} 
                    onClose={() => setIsBulkMessageModalOpen(false)} 
                    onSubmit={handleBulkSendSubmit}
                    
                    // 👇 BỔ SUNG 2 DÒNG NÀY:
                    pointCost={pointCosts?.send_mess_friend || 0} // Đơn giá gửi tin (thường là gửi bạn bè)
                    currentUserPoints={user?.point || 0}          // Điểm hiện có của user
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tags" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition"><FiArrowLeft size={24} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Chi tiết thẻ: <span className="text-blue-400">{decodeURIComponent(tagName as string)}</span></h1>
                        <p className="text-gray-400 text-sm">Tổng số: {members.length} thành viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="Tìm UID hoặc Tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    {/* Nút Gửi Tin Nhắn (MỚI) */}
                    {members.length > 0 && (
                        <button onClick={() => setIsBulkMessageModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                            <FiMessageSquare size={20} /> Gửi tin nhắn
                        </button>
                    )}

                    <button onClick={() => setIsAddModalOpen(true)} disabled={!selectedAccount} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <FiPlus size={20} /> Thêm thành viên
                    </button>
                </div>
            </div>
            {!selectedAccount ? <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">Vui lòng chọn tài khoản Zalo để xem dữ liệu.</div> : renderContent()}
        </div>
    );
}
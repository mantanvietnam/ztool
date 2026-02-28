'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// ✨ CẬP NHẬT: Thêm FiClock vào import
import { FiUsers, FiMessageSquare, FiSearch, FiLoader, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiPhone, FiHelpCircle, FiChevronDown, FiX, FiSend, FiEye, FiPaperclip, FiTrash2, FiShare, FiClock, FiTag, FiPlus, FiEdit2 } from 'react-icons/fi';
import axios from 'axios';
import MessageComposer from '@/components/MessageComposer';
import { removeVietnameseTones } from '@/utils/stringUtils';

// --- HELPER FUNCTIONS (MỚI - GIỐNG TRANG GỬI NGƯỜI LẠ) ---

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
interface Member {
    userId: string;
    displayName: string;
    avatar: string;
    gender?: number; // 0: Nam, 1: Nữ (Zalo convention)
    phoneNumber?: string;
    isFr?: number; // 0: Chưa bạn, 1: Bạn bè
    status?: string;
}

interface GroupInfo { 
    grId: string; 
    name: string; 
    avt: string; 
    totalMember: number; 
}

interface GroupDetails { 
    groupInfo: GroupInfo; 
    members: Member[]; 
}

// Type cho nhóm mục tiêu (dùng cho chức năng mời)
interface TargetGroup { 
    id: string; 
    name: string; 
    avatar: string; 
    totalMembers: number; 
}

// --- COMPONENTS ---

// 1. POPUP GỬI TIN NHẮN (ĐÃ CẬP NHẬT THÊM THỜI GIAN)
const BulkSendMessageModal = ({ allMembers, onSubmit, onClose, pointCost, currentUserPoints }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[], files: File[], timeSend: string) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    
    const filteredList = useMemo(() => {
        if (!searchTerm) return allMembers;
        const normalizedSearchTerm = removeVietnameseTones(searchTerm.toLowerCase());
        
        return allMembers.filter(member => {
            const normalizedName = removeVietnameseTones(member.displayName.toLowerCase());
            return normalizedName.includes(normalizedSearchTerm) || 
                   (member.phoneNumber && member.phoneNumber.includes(searchTerm));
        });
    }, [allMembers, searchTerm]);

    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><FiMessageSquare /> Gửi tin nhắn thành viên nhóm</h3>
                    <button onClick={onClose}><FiX size={20} className="text-white"/></button>
                </div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái: Chọn thành viên */}
                    <div className="w-full md:w-2/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden bg-gray-800/30">
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" placeholder="Tìm tên hoặc SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600 outline-none focus:border-blue-500"/>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-2">
                            <span className="text-gray-400">Đã chọn: <b className="text-white">{selectedIds.size}</b></span>
                            <div className="flex gap-3">
                                <button onClick={() => setSelectedIds(new Set(filteredList.map(m => m.userId)))} className="text-blue-400 hover:underline">Tất cả</button>
                                <button onClick={() => setSelectedIds(new Set())} className="text-blue-400 hover:underline">Bỏ chọn</button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-2">
                            {filteredList.map(member => (
                                <label key={member.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-900"/>
                                    <img src={member.avatar || '/avatar-default-crm.png'} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="text-white text-sm truncate">{member.displayName}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Cột phải: Soạn tin nhắn */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar bg-gray-800">
                        <MessageComposer 
                            message={message} onChangeMessage={setMessage}
                            selectedFiles={selectedFiles} onFilesChange={setSelectedFiles}
                            timeSend={sendTime} onTimeSendChange={setSendTime}
                        />
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center shrink-0">
                    <div className="text-sm">
                        <span className="text-gray-400">Chi phí: </span>
                        <span className={`font-bold ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold">Hủy</button>
                        <button 
                            onClick={() => onSubmit(message, Array.from(selectedIds), selectedFiles, formatTimeForApi(sendTime))} 
                            disabled={selectedIds.size === 0 || (!message.trim() && selectedFiles.length === 0) || !hasEnoughPoints}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded font-bold disabled:opacity-50 transition-all"
                        >
                            Gửi cho {selectedIds.size} người
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. POPUP KẾT BẠN
const BulkAddFriendModal = ({ allMembers, onSubmit, onClose, pointCost, currentUserPoints }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const nonFriendMembers = useMemo(() => allMembers.filter(m => m.isFr !== 1), [allMembers]);
    const [message, setMessage] = useState('Xin chào, mình kết bạn nhé!');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(nonFriendMembers.map(m => m.userId))); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    
    const filteredList = useMemo(() => {
        if (!searchTerm) return nonFriendMembers;
        const normalizedSearchTerm = removeVietnameseTones(searchTerm.toLowerCase());
        
        return nonFriendMembers.filter(member => {
            const normalizedName = removeVietnameseTones(member.displayName.toLowerCase());
            const nameMatch = normalizedName.includes(normalizedSearchTerm);
            const phoneMatch = member.phoneNumber && member.phoneNumber.includes(searchTerm);
            return nameMatch || phoneMatch;
        });
    }, [nonFriendMembers, searchTerm]);
    
    const handleToggleSelect = (id: string) => { const newSet = new Set(selectedIds); newSet.has(id) ? newSet.delete(id) : newSet.add(id); setSelectedIds(newSet); };
    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(m => m.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700"><h3 className="font-bold text-white text-lg">Kết bạn hàng loạt</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái */}
                    <div className="w-full md:w-1/2 p-4 border-r border-gray-700 flex flex-col overflow-hidden">
                        <div className="relative mb-2"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm người chưa kết bạn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                        <div className="flex justify-between items-center text-sm mb-2 flex-shrink-0"><span className="text-gray-400">Chọn: <b className="text-white">{selectedIds.size}</b></span><div className="flex gap-3"><button onClick={handleSelectAll} className="text-blue-400 text-xs hover:underline">Tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 text-xs hover:underline">Bỏ chọn</button></div></div>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-1">
                            {filteredList.map(m => (
                                <label key={m.userId} className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedIds.has(m.userId)} onChange={() => handleToggleSelect(m.userId)} className="form-checkbox bg-gray-900 border-gray-600 text-blue-500"/>
                                    <Image src={m.avatar || '/avatar-default-crm.png'} alt="" width={32} height={32} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                                    <span className="text-white text-sm truncate">{m.displayName}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Cột phải */}
                    <div className="w-full md:w-1/2 p-4 flex flex-col">
                        <h4 className="font-bold text-white mb-2">Lời chào kết bạn</h4>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="Nhập lời chào..."/>
                        <div className="mt-auto">
                            {!hasEnoughPoints && <p className="text-red-400 text-sm mb-2">Không đủ điểm ({calculatedCost}).</p>}
                            <div className="p-3 bg-gray-900/50 rounded-md text-sm text-gray-400"><p><FiHelpCircle className="inline mr-1"/> Có thể dùng spin content <code>{`{hi|hello}`}</code>.</p></div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold">Hủy</button><button onClick={() => onSubmit(message, Array.from(selectedIds))} disabled={!hasEnoughPoints || selectedIds.size === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50 flex items-center gap-2"><FiUserPlus/> Gửi yêu cầu</button></div>
            </div>
        </div>
    );
};

// 3. POPUP THÊM THÀNH VIÊN
const AddMemberModal = ({ onSubmit, onClose, pointCost, currentUserPoints }: { onSubmit: (phones: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [phoneList, setPhoneList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [phoneCount, setPhoneCount] = useState(0);
    const [calculatedCost, setCalculatedCost] = useState(0);

    const cleanPhoneNumber = (raw: string) => raw.replace(/\D/g, ''); 
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    useEffect(() => {
        const cleanedPhones = phoneList.split('\n').map(p => cleanPhoneNumber(p)).filter(p => p.length >= 9);
        setPhoneCount(cleanedPhones.length);
        setCalculatedCost(cleanedPhones.length * pointCost);
        if (cleanedPhones.length > 0) setError('');
    }, [phoneList, pointCost]);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!hasEnoughPoints) { setError(`Không đủ điểm.`); return; }
        const finalPhones = phoneList.split('\n').map(p => cleanPhoneNumber(p)).filter(p => p.length >= 9 && p.length <= 15);
        if (finalPhones.length === 0) { setError("Vui lòng nhập ít nhất một số điện thoại hợp lệ."); return; }
        
        setIsSubmitting(true);
        try { await onSubmit(finalPhones); } catch (err: any) { setError(err.message); setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-white text-lg">Thêm thành viên (SĐT)</h3><button onClick={onClose}><FiX className="text-gray-400 hover:text-white"/></button></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-sm">Nhập danh sách SĐT, mỗi số một dòng (chấp nhận dấu cách, chấm, gạch ngang).</p>
                    <textarea rows={8} value={phoneList} onChange={(e) => setPhoneList(e.target.value)} placeholder="0912345678&#10;0987.654.321" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 font-mono"/>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Hợp lệ: <b className="text-white">{phoneCount}</b></span><span className={hasEnoughPoints ? "text-yellow-400" : "text-red-500"}>Phí: {calculatedCost.toLocaleString()} điểm</span></div>
                    {error && <div className="bg-red-500/10 border-l-4 border-red-500 p-2 text-sm text-red-300 flex items-center gap-2"><FiAlertTriangle/> {error}</div>}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button><button onClick={handleSubmit} disabled={isSubmitting || phoneCount === 0 || !hasEnoughPoints} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 flex items-center gap-2">{isSubmitting ? <FiLoader className="animate-spin"/> : <FiUserPlus />} Thêm</button></div>
            </div>
        </div>
    );
};

// Modal Tạo Thẻ Mới (Copy từ tags.tsx sang để dùng nội bộ)
const TagModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, color: string) => Promise<void>; }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const presetColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

    const handleSubmit = async () => {
        if (!name.trim()) { setError("Vui lòng nhập tên thẻ."); return; }
        setIsSubmitting(true);
        try { await onSubmit(name, color); onClose(); } 
        catch (err: any) { setError(err.message || "Có lỗi xảy ra."); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center rounded-t-lg">
                    <h3 className="font-bold text-white">Tạo thẻ phân loại mới</h3>
                    <button onClick={onClose}><FiX className="text-gray-400 hover:text-white"/></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên thẻ</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Khách VIP..." className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Màu sắc</label>
                        <div className="flex gap-2 flex-wrap">
                            {presetColors.map(c => (
                                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer" />
                        </div>
                    </div>
                    <div className="p-3 bg-gray-900 rounded border border-gray-700 text-center">
                        <span className="px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: color }}>{name || 'Xem trước'}</span>
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold flex items-center gap-2">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus/>} Tạo thẻ
                    </button>
                </div>
            </div>
        </div>
    );
};

// Thêm thành viên vào thẻ phân loại
const AddMembersToTagModal = ({ 
    members, 
    selectedAccount, 
    onClose, 
    onSuccess 
}: { 
    members: any[]; 
    selectedAccount: any; 
    onClose: () => void; 
    onSuccess: (count: number, tagName: string) => void;
}) => {
    const [tags, setTags] = useState<any[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<string>('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    
    const [searchTag, setSearchTag] = useState('');
    const [searchMember, setSearchMember] = useState('');
    
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ✨ STATE MỚI: Mở modal tạo thẻ
    const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);

    // Hàm tải danh sách thẻ (được tách ra để gọi lại sau khi tạo mới)
    const fetchTags = useCallback(async () => {
        if (!selectedAccount) return;
        setIsLoadingTags(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListTagAPI`, {
                token,
                userId: selectedAccount.profile.userId
            });
            if (response.data.code === 0) {
                setTags(response.data.listData || []);
            }
        } catch (error) {
            console.error("Lỗi tải tags:", error);
        } finally {
            setIsLoadingTags(false);
        }
    }, [selectedAccount]);

    useEffect(() => { fetchTags(); }, [fetchTags]);

    // ✨ HÀM MỚI: Xử lý tạo thẻ xong thì reload list và tự chọn thẻ vừa tạo
    const handleCreateTagSubmit = async (name: string, color: string) => {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/saveTagAPI`, {
            token,
            userId: selectedAccount.profile.userId,
            name,
            color
        });
        if (response.data.code === 0) {
            await fetchTags(); // Tải lại danh sách
            // Tự động tìm và chọn thẻ vừa tạo (logic đơn giản là tìm thẻ có tên khớp)
            // Lưu ý: API saveTagAPI thường không trả về ID ngay, nên ta refresh list
        } else {
            throw new Error(response.data.message);
        }
    };

    const normalizedSearchTag = removeVietnameseTones(searchTag.toLowerCase());
    const filteredTags = tags.filter(t => 
        removeVietnameseTones(t.name.toLowerCase()).includes(normalizedSearchTag)
    );

    const normalizedSearchMember = removeVietnameseTones(searchMember.toLowerCase());
    const filteredMembers = members.filter(m => {
        const normalizedName = removeVietnameseTones(m.displayName.toLowerCase());
        return normalizedName.includes(normalizedSearchMember) || 
               (m.userId && m.userId.includes(searchMember));
    });

    const toggleMember = (id: string) => {
        const newSet = new Set(selectedMemberIds);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setSelectedMemberIds(newSet);
    };
    const handleSelectAll = () => setSelectedMemberIds(new Set(filteredMembers.map(m => m.userId)));

    const handleSubmit = async () => {
        if (!selectedTagId || selectedMemberIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const selectedMembersData = members.filter(m => selectedMemberIds.has(m.userId)).map(m => ({
                zalo_uid_friend: m.userId,
                zalo_name_friend: m.displayName,
                zalo_avatar_friend: m.avatar
            }));

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/saveMemberTagAPI`, {
                token,
                userId: selectedAccount.profile.userId,
                tag_id: selectedTagId,
                member: selectedMembersData
            });

            if (response.data.code === 0) {
                const targetTag = tags.find(t => t.id == selectedTagId);
                onSuccess(selectedMemberIds.size, targetTag ? targetTag.name : '');
                onClose();
            } else {
                alert(response.data.message || "Lỗi khi thêm vào thẻ phân loại.");
            }
        } catch (error: any) {
            alert(error?.response?.data?.message || "Lỗi kết nối.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            {/* Modal tạo thẻ lồng bên trong */}
            {isCreateTagOpen && <TagModal onClose={() => setIsCreateTagOpen(false)} onSubmit={handleCreateTagSubmit} />}

            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><FiTag /> Thêm thành viên vào Thẻ phân loại</h3>
                    <button onClick={onClose}><FiX className="text-gray-400 hover:text-white" size={20}/></button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* CỘT TRÁI: Chọn Thẻ */}
                    <div className="w-full md:w-1/3 border-r border-gray-700 p-4 flex flex-col bg-gray-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-gray-300 font-bold text-sm">Bước 1: Chọn Thẻ</label>
                            {/* ✨ NÚT THÊM MỚI */}
                            <button onClick={() => setIsCreateTagOpen(true)} className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow" title="Tạo thẻ mới">
                                <FiPlus size={16} />
                            </button>
                        </div>
                        
                        <div className="relative mb-2">
                            <input type="text" placeholder="Tìm tên thẻ..." value={searchTag} onChange={e => setSearchTag(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm outline-none focus:border-blue-500"/>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-2 custom-scrollbar pr-1">
                            {isLoadingTags ? <div className="text-center text-gray-500 py-4"><FiLoader className="animate-spin inline"/></div> : 
                            filteredTags.length === 0 ? <div className="text-gray-500 italic text-sm text-center py-4">Chưa có thẻ nào.</div> :
                            filteredTags.map(tag => (
                                <div 
                                    key={tag.id} 
                                    onClick={() => setSelectedTagId(tag.id)} 
                                    className={`p-2 rounded cursor-pointer flex justify-between items-center border transition-all ${selectedTagId === tag.id ? 'bg-gray-700 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    {/* ✨ HIỂN THỊ MÀU NỀN BADGE GIỐNG TRANG TAGS */}
                                    <span className="px-3 py-1 rounded-full text-white text-xs font-bold truncate max-w-[180px]" style={{ backgroundColor: tag.color || '#3B82F6' }}>
                                        {tag.name}
                                    </span>
                                    {selectedTagId === tag.id && <FiCheckCircle className="text-blue-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CỘT PHẢI: Chọn Thành Viên */}
                    <div className="w-full md:w-2/3 p-4 flex flex-col bg-gray-800">
                        <label className="text-gray-300 font-bold mb-2 block text-sm">Bước 2: Chọn Thành viên ({selectedMemberIds.size})</label>
                        <div className="flex gap-2 mb-2">
                            <input type="text" placeholder="Tìm thành viên nhóm..." value={searchMember} onChange={e => setSearchMember(e.target.value)} className="flex-1 bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm outline-none focus:border-blue-500"/>
                            <button onClick={handleSelectAll} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-blue-400 text-xs rounded border border-gray-600">Tất cả</button>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-1 custom-scrollbar pr-1">
                            {filteredMembers.map(m => (
                                <label key={m.userId} className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${selectedMemberIds.has(m.userId) ? 'bg-blue-900/20 border-blue-500/50' : 'hover:bg-gray-700 border-transparent'}`}>
                                    <input type="checkbox" checked={selectedMemberIds.has(m.userId)} onChange={() => toggleMember(m.userId)} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-offset-0"/>
                                    <img src={m.avatar || '/avatar-default-crm.png'} className="w-8 h-8 rounded-full border border-gray-600" onError={(e) => (e.target as HTMLImageElement).src = '/avatar-default-crm.png'}/>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-200 truncate font-medium">{m.displayName}</p>
                                        <p className="text-xs text-gray-500">{m.userId}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-bold">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting || !selectedTagId || selectedMemberIds.size === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Lưu vào thẻ
                    </button>
                </div>
            </div>
        </div>
    );
};

// 4. POPUP MỜI NHÓM (CẬP NHẬT UI CHỌN NHÓM)
const InviteToGroupModal = ({ currentGroupId, allMembers, selectedAccount, onSubmit, onClose, pointCost, currentUserPoints }: { currentGroupId: string; allMembers: Member[]; selectedAccount: any; onSubmit: (targetGroupId: string, memberIds: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    
    // ✨ MỚI: State tìm kiếm nhóm
    const [groupSearchTerm, setGroupSearchTerm] = useState('');
    const [targetGroupId, setTargetGroupId] = useState('');
    
    const [availableGroups, setAvailableGroups] = useState<TargetGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => {
        // Cờ điều khiển để dừng fetch ngầm nếu người dùng tắt popup Modal
        let isActive = true;
        if (!selectedAccount) return;

        const fetchGroups = async () => {
            setLoadingGroups(true);
            const myId = selectedAccount.profile.userId;
            // Dùng chung key cache với trang ListGroup
            const cacheKey = `ztool_groups_${myId}`;
            let cachedGroups: any[] = [];

            try {
                // 1. ĐỌC CACHE TỪ LOCALSTORAGE LÊN TRƯỚC
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    cachedGroups = JSON.parse(cachedData);
                    // Lọc bỏ nhóm hiện tại ra khỏi danh sách mời
                    const otherGroups = cachedGroups.filter(g => g.id !== currentGroupId);
                    if (isActive) {
                        setAvailableGroups(otherGroups);
                        // Chọn mặc định nhóm đầu tiên nếu chưa chọn
                        if (otherGroups.length > 0) setTargetGroupId(otherGroups[0].id);
                        setLoadingGroups(false); // Tắt loading ngay lập tức vì đã có cache
                    }
                }

                const { cookie, imei, userAgent } = selectedAccount;
                const payload = { cookie, imei, userAgent, proxy: savedProxy };

                // 2. LẤY MẢNG ID TỪ SERVER ĐỂ KIỂM TRA ĐỒNG BỘ
                const resIds = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups`, payload);
                const dataIds = resIds.data;

                if (dataIds.success) {
                    const fetchedGroupIds = dataIds.groups || [];

                    // Bảo vệ Silent Limit (Nếu Zalo trả về 0 nhóm bất thường)
                    if (fetchedGroupIds.length === 0 && cachedGroups.length > 5) {
                        console.warn("🛡️ Popup Mời: Zalo trả về 0 nhóm, giữ nguyên cache.");
                        if (isActive) setLoadingGroups(false);
                        return;
                    }

                    if (!isActive) return;

                    // 3. SMART DIFFING & LỌC NHÓM
                    const cachedIds = cachedGroups.map(g => g.id);
                    const newIds = fetchedGroupIds.filter((id: string) => !cachedIds.includes(id));
                    const existingIdsToUpdate = fetchedGroupIds.filter((id: string) => cachedIds.includes(id));
                    
                    // Xóa các nhóm người dùng đã out
                    let accumulatedGroups = cachedGroups.filter(g => fetchedGroupIds.includes(g.id));

                    if (isActive) {
                        const otherAccumulated = accumulatedGroups.filter(g => g.id !== currentGroupId);
                        setAvailableGroups(otherAccumulated);
                        
                        // Cập nhật lại targetGroupId nếu nhóm đang chọn bị out
                        if (otherAccumulated.length > 0 && !otherAccumulated.find(g => g.id === targetGroupId)) {
                            setTargetGroupId(otherAccumulated[0].id);
                        } else if (otherAccumulated.length === 0) {
                            setTargetGroupId('');
                        }

                        localStorage.setItem(cacheKey, JSON.stringify(accumulatedGroups));
                        setLoadingGroups(false);
                    }

                    const prioritizedIds = [...newIds, ...existingIdsToUpdate];
                    if (prioritizedIds.length === 0) return;

                    // 4. VÒNG LẶP TẢI CHI TIẾT NGẦM TRONG POPUP
                    const BATCH_SIZE = 5;
                    for (let i = 0; i < prioritizedIds.length; i += BATCH_SIZE) {
                        if (!isActive) break; // Thoát nếu người dùng đóng Modal

                        const batchIds = prioritizedIds.slice(i, i + BATCH_SIZE);
                        try {
                            const batchRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sync-groups-batch`, {
                                ...payload, batchIds
                            });

                            if (batchRes.data.success && isActive) {
                                const newFetchedGroups = batchRes.data.groups;
                                // Cập nhật đè dữ liệu
                                newFetchedGroups.forEach((newG: any) => {
                                    const idx = accumulatedGroups.findIndex(g => g.id === newG.id);
                                    if (idx >= 0) accumulatedGroups[idx] = newG;
                                    else accumulatedGroups.push(newG);
                                });

                                const otherGroups = accumulatedGroups.filter(g => g.id !== currentGroupId);
                                setAvailableGroups([...otherGroups]);
                                
                                // Nếu popup vừa mở mà cache trống, chọn ngay nhóm đầu tiên tải được
                                setTargetGroupId(prev => prev ? prev : (otherGroups.length > 0 ? otherGroups[0].id : ''));
                                
                                localStorage.setItem(cacheKey, JSON.stringify(accumulatedGroups));
                            }
                        } catch (err) { console.error("Batch Error in Modal:", err); }

                        // Nghỉ ngơi giữa các request
                        if (i + BATCH_SIZE < prioritizedIds.length && isActive) {
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching groups in modal:", err);
            } finally {
                if (isActive) setLoadingGroups(false);
            }
        };

        fetchGroups();

        // Cleanup: Chạy khi Modal đóng
        return () => {
            isActive = false;
        };
    // Lưu ý: Không đưa targetGroupId vào dependencies để tránh gọi lại API khi user bấm chọn nhóm
    }, [selectedAccount, currentGroupId]);

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const filteredList = useMemo(() => {
        if (!searchTerm) return allMembers;
        const normalizedSearchTerm = removeVietnameseTones(searchTerm.toLowerCase());
        return allMembers.filter(m => {
            const normalizedName = removeVietnameseTones(m.displayName.toLowerCase());
            return normalizedName.includes(normalizedSearchTerm) || m.phoneNumber?.includes(searchTerm);
        });
    }, [allMembers, searchTerm]);
    
    const filteredGroups = useMemo(() => {
        if (!groupSearchTerm) return availableGroups;
        const normalizedGroupSearch = removeVietnameseTones(groupSearchTerm.toLowerCase());
        return availableGroups.filter(g => {
            const normalizedName = removeVietnameseTones(g.name.toLowerCase());
            return normalizedName.includes(normalizedGroupSearch);
        });
    }, [availableGroups, groupSearchTerm]);

    const handleToggleSelect = (id: string) => { const newSet = new Set(selectedIds); newSet.has(id) ? newSet.delete(id) : newSet.add(id); setSelectedIds(newSet); };
    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(m => m.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-white text-lg">Mời thành viên sang nhóm khác</h3><button onClick={onClose}><FiX className="text-gray-400 hover:text-white"/></button></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    
                    {/* Cột trái: Chọn thành viên */}
                    <div className="w-full md:w-3/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden">
                        <div className="relative mb-2"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm thành viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                        <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-400">Chọn: <b className="text-white">{selectedIds.size}</b></span><div className="flex gap-3"><button onClick={handleSelectAll} className="text-blue-400 text-xs">Tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 text-xs">Bỏ chọn</button></div></div>
                        <div className="flex-grow overflow-y-auto space-y-1 pr-2">
                            {filteredList.map(m => (
                                <label key={m.userId} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${selectedIds.has(m.userId) ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-gray-700'}`}>
                                    <input type="checkbox" checked={selectedIds.has(m.userId)} onChange={() => handleToggleSelect(m.userId)} className="form-checkbox bg-gray-900 border-gray-600 text-blue-500"/>
                                    <Image src={m.avatar || '/avatar-default-crm.png'} alt="" width={32} height={32} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                                    <span className="text-white text-sm truncate">{m.displayName}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Chọn nhóm đích (Đã cập nhật giao diện) */}
                    <div className="w-full md:w-2/5 p-4 flex flex-col bg-gray-800/50">
                        <label className="text-gray-400 text-sm mb-2 font-bold">Mời vào nhóm:</label>
                        
                        {loadingGroups ? (
                            <div className="text-gray-400 flex items-center gap-2 py-4"><FiLoader className="animate-spin"/> Đang tải danh sách nhóm...</div>
                        ) : (
                            <div className="flex-grow flex flex-col overflow-hidden border border-gray-600 rounded-md bg-gray-900/50 mb-4">
                                {/* Ô tìm kiếm nhóm */}
                                <div className="p-2 border-b border-gray-600 bg-gray-700/50 relative flex-shrink-0">
                                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Gõ tên nhóm..."
                                        value={groupSearchTerm}
                                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                                        className="w-full bg-gray-800 text-white pl-9 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>

                                {/* Danh sách nhóm (Scroll) */}
                                <div className="flex-grow overflow-y-auto custom-scrollbar p-1 space-y-1">
                                    {filteredGroups.length === 0 ? (
                                        <div className="text-center text-gray-500 italic p-4">Không tìm thấy nhóm.</div>
                                    ) : (
                                        filteredGroups.map(g => (
                                            <div 
                                                key={g.id} 
                                                onClick={() => setTargetGroupId(g.id)}
                                                className={`p-2 rounded cursor-pointer flex items-center gap-3 transition-colors border ${targetGroupId === g.id ? 'bg-blue-900/40 border-blue-500' : 'hover:bg-gray-700 border-transparent'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                                                     <img src={g.avatar || '/avatar-default-crm.png'} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${targetGroupId === g.id ? 'text-blue-300' : 'text-gray-200'}`}>{g.name}</p>
                                                    <p className="text-xs text-gray-500">{g.totalMembers} thành viên</p>
                                                </div>
                                                {targetGroupId === g.id && <FiCheckCircle className="text-blue-500 flex-shrink-0" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto flex-shrink-0">
                            {!hasEnoughPoints && <div className="bg-red-500/10 border-l-4 border-red-500 p-2 text-red-300 text-sm mb-2">Thiếu điểm: {calculatedCost.toLocaleString()}</div>}
                            <button onClick={() => onSubmit(targetGroupId, Array.from(selectedIds))} disabled={selectedIds.size === 0 || !targetGroupId || !hasEnoughPoints} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 flex justify-center items-center gap-2"><FiShare/> Mời ngay ({selectedIds.size})</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ title, message, onClose, onViewProgress }: { title: string; message: string; onClose: () => void; onViewProgress: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><FiCheckCircle className="text-green-400" size={40} /></div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
            <div className="flex justify-center gap-4"><button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded text-white font-bold">Đóng</button><button onClick={onViewProgress} className="bg-blue-600 px-4 py-2 rounded text-white flex items-center gap-2 font-bold"><FiEye /> Xem kết quả</button></div>
        </div>
    </div>
);

// --- MAIN PAGE ---
export default function GroupDetailsPage() {
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.groupId as string;

    const [details, setDetails] = useState<GroupDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddToTagModalOpen, setIsAddToTagModalOpen] = useState(false);
    
    // Modal states
    const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);
    const [isBulkAddFriendModalOpen, setIsBulkAddFriendModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteGroupModalOpen, setIsInviteGroupModalOpen] = useState(false);
    
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; redirectUrl: string } | null>(null);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => {
        if (!groupId || !selectedAccount) { if (!selectedAccount) setError("Vui lòng chọn tài khoản."); setLoading(false); return; }
        const fetchDetails = async () => {
            setLoading(true); setError(null);
            try {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-group-details/${groupId}`, { cookie: selectedAccount.cookie, imei: selectedAccount.imei, userAgent: selectedAccount.userAgent, proxy: savedProxy  });
                if (!response.data.success) throw new Error(response.data.message || "Lỗi tải nhóm.");
                setDetails({ groupInfo: response.data.details.groupInfo, members: response.data.details.members || [] });
            } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        };
        fetchDetails();
    }, [groupId, selectedAccount]);

    const filteredMembers = useMemo(() => {
        if (!details) return [];
        if (!searchTerm) return details.members;
        
        const normalizedSearchTerm = removeVietnameseTones(searchTerm.toLowerCase());
        return details.members.filter(m => {
            const normalizedName = removeVietnameseTones(m.displayName.toLowerCase());
            return normalizedName.includes(normalizedSearchTerm) || m.phoneNumber?.includes(searchTerm);
        });
    }, [details, searchTerm]);

    // 1. GỬI TIN NHẮN (API) - ✨ CẬP NHẬT: THÊM THAM SỐ timeSend
    const handleBulkSendSubmit = async (message: string, memberIds: string[], files: File[], timeSend: string) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = memberIds.length * (pointCosts.send_mess_friend || 0);
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        setIsBulkSendModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('token', token!);
            formData.append('userId', selectedAccount.profile.userId);
            formData.append('message', message);
            formData.append('type', 'friend');
            formData.append('list_request', JSON.stringify(memberIds));
            // ✨ CẬP NHẬT: Gửi thời gian lên server
            formData.append('timeSend', timeSend);
            
            files.forEach(f => formData.append('files[]', f));
            
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.code != 0 && res.data.code != 3) throw new Error(res.data.mess || "Lỗi gửi tin.");
            if (res.data.code == 3) router.push('/logout');
            
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ title: "Đã tạo yêu cầu", message: `Gửi tin nhắn đến <span class="font-bold">${memberIds.length}</span> người.`, redirectUrl: '/dashboard/listSendMessageStranger' });
        } catch (err: any) { alert(err.message); }
    };

    // 2. KẾT BẠN (API)
    const handleBulkAddFriendSubmit = async (message: string, memberIds: string[]) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = memberIds.length * (pointCosts.add_friend || 0);
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        setIsBulkAddFriendModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestAddFriendAPI`, { token, userId: selectedAccount.profile.userId, list_request: memberIds, type: 'uid', message });
            if (res.data.code != 0) throw new Error(res.data.message || "Lỗi kết bạn.");
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ title: "Đã tạo yêu cầu", message: `Kết bạn với <span class="font-bold">${memberIds.length}</span> người.`, redirectUrl: '/dashboard/listRequestAddFriend' });
        } catch (err: any) { alert(err.message); }
    };

    // 3. THÊM THÀNH VIÊN (API)
    const handleAddMemberSubmit = async (phones: string[]) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = phones.length * (pointCosts.add_member_group || 0);
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        setIsAddMemberModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/addMemberToGroupAPI`, { token, userId: selectedAccount.profile.userId, groupId, phones });
            if (res.data.code != 0) throw new Error(res.data.message || "Lỗi thêm thành viên.");
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ title: "Đã tạo yêu cầu", message: `Thêm <span class="font-bold">${phones.length}</span> số điện thoại.`, redirectUrl: '/dashboard/listRequestAddMemberGroup' });
        } catch (err: any) { alert(err.message); }
    };

    // 4. MỜI NHÓM (API MỚI)
    const handleInviteToGroupSubmit = async (targetGroupId: string, memberIds: string[]) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = memberIds.length * (pointCosts.add_member_group || 0);
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        setIsInviteGroupModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/addMemberToGroupAPI`, { token, userId: selectedAccount.profile.userId, groupId: targetGroupId, phones: memberIds, type: 'uid' });
            if (res.data.code != 0) throw new Error(res.data.message || "Lỗi mời nhóm.");
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ title: "Đã tạo yêu cầu", message: `Mời <span class="font-bold">${memberIds.length}</span> người sang nhóm mới.`, redirectUrl: '/dashboard/listRequestAddMemberGroup' });
        } catch (err: any) { alert(err.message); }
    };

    if (loading) return <div className="flex-1 p-8 flex justify-center"><FiLoader className="animate-spin text-white" size={48}/></div>;
    if (error || !details) return <div className="flex-1 p-8 text-center text-red-400">{error || "Không có dữ liệu"}</div>;

    return (
        <div className="flex-1 p-6 md:p-8">
            {isBulkSendModalOpen && <BulkSendMessageModal allMembers={details.members} onClose={() => setIsBulkSendModalOpen(false)} onSubmit={handleBulkSendSubmit} pointCost={pointCosts?.send_mess_friend || 0} currentUserPoints={user?.point || 0} />}
            {isBulkAddFriendModalOpen && <BulkAddFriendModal allMembers={details.members} onClose={() => setIsBulkAddFriendModalOpen(false)} onSubmit={handleBulkAddFriendSubmit} pointCost={pointCosts?.add_friend || 0} currentUserPoints={user?.point || 0}/>}
            {isAddMemberModalOpen && <AddMemberModal onClose={() => setIsAddMemberModalOpen(false)} onSubmit={handleAddMemberSubmit} pointCost={pointCosts?.add_member_group || 0} currentUserPoints={user?.point || 0} />}
            {isInviteGroupModalOpen && <InviteToGroupModal currentGroupId={groupId} allMembers={details.members} selectedAccount={selectedAccount} onClose={() => setIsInviteGroupModalOpen(false)} onSubmit={handleInviteToGroupSubmit} pointCost={pointCosts?.add_member_group || 0} currentUserPoints={user?.point || 0} />}
            {isAddToTagModalOpen && (
                <AddMembersToTagModal 
                    // 👇 SỬA Ở ĐÂY: Thay allMembers bằng details.members
                    members={details?.members || []} 
                    selectedAccount={selectedAccount}
                    onClose={() => setIsAddToTagModalOpen(false)}
                    onSuccess={(count, tagName) => {
                        // Thông báo đơn giản hoặc dùng Modal thành công của bạn
                        alert(`Đã thêm thành công ${count} thành viên vào thẻ phân loại "${tagName}"`);
                    }}
                />
            )}
            {successInfo && <SuccessModal title={successInfo.title} message={successInfo.message} onClose={() => setSuccessInfo(null)} onViewProgress={() => router.push(successInfo.redirectUrl)} />}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Image 
                    src={details.groupInfo.avt || '/avatar-default-crm.png'} 
                    alt={details.groupInfo.name} 
                    width={64} height={64} 
                    className="rounded-full border-2 border-gray-600" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}
                />
                <div>
                    <h1 className="text-3xl font-bold text-white">{details.groupInfo.name}</h1>
                    <p className="text-gray-400 flex items-center gap-2"><FiUsers /> {details.groupInfo.totalMember} thành viên</p>
                </div>
            </div>

            {/* Toolbar - ĐÃ CẬP NHẬT GIAO DIỆN NÚT */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:max-w-xs"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm thành viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 pl-10 text-white"/></div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onClick={() => setIsAddMemberModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors"><FiUserPlus/> Thêm Thành Viên</button>
                    <button onClick={() => setIsBulkSendModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors"><FiMessageSquare/> Gửi Tin</button>
                    <button onClick={() => setIsBulkAddFriendModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors"><FiUserPlus/> Kết Bạn</button>
                    <button onClick={() => setIsInviteGroupModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors"><FiShare/> Mời Nhóm</button>
                    <button onClick={() => setIsAddToTagModalOpen(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"><FiTag size={20} /> Thẻ phân loại</button>
                </div>
            </div>

            {/* Grid Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredMembers.map(m => (
                    <div key={m.userId} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center border border-gray-700 hover:border-blue-500 transition">
                        <Image src={m.avatar || '/avatar-default-crm.png'} alt="" width={80} height={80} className="rounded-full mb-3" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                        <p className="font-semibold text-white truncate w-full">{m.displayName}</p>
                        {m.phoneNumber && <p className="text-gray-400 text-sm flex items-center gap-1"><FiPhone size={12}/> {m.phoneNumber}</p>}
                    </div>
                ))}
            </div>
            {details.members.length === 0 && <div className="text-center text-gray-400 mt-10">Nhóm chưa có thành viên nào.</div>}
        </div>
    );
}
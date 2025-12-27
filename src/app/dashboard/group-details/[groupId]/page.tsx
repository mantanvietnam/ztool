'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// ✨ CẬP NHẬT: Thêm FiClock vào import
import { FiUsers, FiMessageSquare, FiSearch, FiLoader, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiPhone, FiHelpCircle, FiChevronDown, FiX, FiSend, FiEye, FiPaperclip, FiTrash2, FiShare, FiClock } from 'react-icons/fi';
import axios from 'axios';

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
    
    // ✨ CẬP NHẬT: State cho thời gian gửi
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState('');
    const MAX_FILES = 10;
    const MAX_SIZE_MB = 2;

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    
    // Filter logic
    const filteredList = useMemo(() => {
        return allMembers.filter(member => {
            const nameMatch = member.displayName.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = member.phoneNumber && member.phoneNumber.includes(searchTerm);
            return !searchTerm || nameMatch || phoneMatch;
        });
    }, [allMembers, searchTerm]);

    const handleToggleSelect = (memberId: string) => { const newSelectedIds = new Set(selectedIds); newSelectedIds.has(memberId) ? newSelectedIds.delete(memberId) : newSelectedIds.add(memberId); setSelectedIds(newSelectedIds); };
    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(m => m.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());
    
    // ✨ CẬP NHẬT: Handle Submit truyền thêm timeSend
    const handleSubmit = () => {
        const formattedTime = formatTimeForApi(sendTime);
        onSubmit(message, Array.from(selectedIds), selectedFiles, formattedTime);
    };
    
    // Xử lý file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const validFiles: File[] = [];
            let err = '';
            if (selectedFiles.length + filesArray.length > MAX_FILES) { setFileError(`Tối đa ${MAX_FILES} file.`); return; }
            filesArray.forEach(file => { 
                if (!file.type.startsWith('image/')) { err = 'Chỉ chấp nhận file ảnh.'; return; }
                if (file.size > MAX_SIZE_MB * 1024 * 1024) { err = `File quá lớn (> ${MAX_SIZE_MB}MB).`; return; }
                validFiles.push(file); 
            });
            if(err) setFileError(err);
            else setFileError('');
            setSelectedFiles(prev => [...prev, ...validFiles]);
            e.target.value = '';
        }
    };
    const handleRemoveFile = (index: number) => { setSelectedFiles(prev => prev.filter((_, i) => i !== index)); };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex-shrink-0"><h3 className="font-bold text-white text-lg">Gửi tin nhắn cho thành viên nhóm</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái: Danh sách thành viên */}
                    <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col space-y-3 overflow-hidden h-1/2 md:h-auto">
                        <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm tên hoặc SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                        <div className="flex justify-between items-center text-sm flex-shrink-0"><p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span> / {filteredList.length}</p><div className="flex gap-4"><button onClick={handleSelectAll} className="text-blue-400 hover:underline">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 hover:underline">Bỏ chọn</button></div></div>
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                            {filteredList.map(member => ( 
                                <label key={member.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500"/>
                                    <Image src={member.avatar || '/avatar-default-crm.png'} alt={member.displayName} width={36} height={36} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                                    <span className="text-white truncate text-sm">{member.displayName}</span>
                                </label> 
                            ))}
                        </div>
                    </div>
                    {/* Cột phải: Form nhập liệu */}
                    <div className="w-full md:w-3/5 p-4 flex flex-col overflow-y-auto">
                        
                        {/* ✨ CẬP NHẬT: Input chọn thời gian */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Thời gian gửi (Hẹn giờ)</label>
                            <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-3">
                                <FiClock className="text-gray-400 mr-2" />
                                <input 
                                    type="datetime-local" 
                                    value={sendTime}
                                    onChange={(e) => setSendTime(e.target.value)}
                                    className="w-full bg-transparent text-white py-2 focus:outline-none placeholder-gray-500"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">* Để mặc định nếu muốn gửi ngay lập tức.</p>
                        </div>

                        <h4 className="font-bold text-white mb-2">Soạn nội dung</h4>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Nhập nội dung tin nhắn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        
                        <div className="mt-3">
                            <input type="file" multiple accept="image/*" id="file-upload-mem" className="hidden" onChange={handleFileChange} />
                            <label htmlFor="file-upload-mem" className="cursor-pointer inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-blue-400 px-3 py-2 rounded-md text-sm border border-gray-600 border-dashed"><FiPaperclip /> Đính kèm ảnh ({selectedFiles.length}/{MAX_FILES})</label>
                            {selectedFiles.length > 0 && (<div className="mt-2 space-y-1">{selectedFiles.map((file, index) => (<div key={index} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md text-sm"><span className="text-gray-300 truncate max-w-[90%]">{file.name}</span><button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300"><FiTrash2 /></button></div>))}</div>)}
                            {fileError && <p className="text-sm text-red-400 mt-1">{fileError}</p>}
                        </div>

                        {!hasEnoughPoints && selectedIds.size > 0 && (<div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mt-3 text-sm"><p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, có {currentUserPoints.toLocaleString()}.</p></div>)}
                        
                        <div className="mt-auto p-3 bg-gray-900/50 rounded-md text-sm text-gray-400 mt-4">
                            <p className="font-bold text-gray-300 flex items-center gap-2"><FiHelpCircle/> Cú pháp Spin</p>
                            <p>Dùng <code className="bg-gray-700 px-1 rounded">{`{a|b|c}`}</code> để random nội dung.</p>
                            <p>Dùng các biến sau: <code className="bg-gray-700 px-1 rounded">%name%</code>, <code className="bg-gray-700 px-1 rounded">%phone%</code>, <code className="bg-gray-700 px-1 rounded">%gender%</code>, <code className="bg-gray-700 px-1 rounded">%birthday%</code> để cá nhân hóa.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="text-sm"><span className="text-gray-400">Chi phí:</span><span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span></div>
                    <div className="flex gap-3"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button>
                    <button onClick={handleSubmit} disabled={(!message.trim() && selectedFiles.length === 0) || selectedIds.size === 0 || !hasEnoughPoints || !sendTime} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:bg-gray-600"> <FiSend/> Gửi ({selectedIds.size})</button></div>
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
        return nonFriendMembers.filter(member => {
            const nameMatch = member.displayName.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = member.phoneNumber && member.phoneNumber.includes(searchTerm);
            return !searchTerm || nameMatch || phoneMatch;
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

// 4. POPUP MỜI NHÓM
const InviteToGroupModal = ({ currentGroupId, allMembers, selectedAccount, onSubmit, onClose, pointCost, currentUserPoints }: { currentGroupId: string; allMembers: Member[]; selectedAccount: any; onSubmit: (targetGroupId: string, memberIds: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [targetGroupId, setTargetGroupId] = useState('');
    const [availableGroups, setAvailableGroups] = useState<TargetGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => {
        const fetchGroups = async () => {
            setLoadingGroups(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups-with-details`, { cookie, imei, userAgent, proxy: savedProxy  });
                if (response.data.success && response.data.groups) {
                    const otherGroups = response.data.groups.filter((g: any) => g.id !== currentGroupId);
                    setAvailableGroups(otherGroups);
                    if (otherGroups.length > 0) setTargetGroupId(otherGroups[0].id);
                }
            } catch (err) { console.error(err); } finally { setLoadingGroups(false); }
        };
        fetchGroups();
    }, [selectedAccount, currentGroupId]);

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const filteredList = useMemo(() => allMembers.filter(m => !searchTerm || m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || m.phoneNumber?.includes(searchTerm)), [allMembers, searchTerm]);
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
                    {/* Cột phải: Chọn nhóm đích */}
                    <div className="w-full md:w-2/5 p-4 flex flex-col bg-gray-800/50">
                        <label className="text-gray-400 text-sm mb-2 font-bold">Mời vào nhóm:</label>
                        {loadingGroups ? <div className="text-gray-400 flex items-center gap-2"><FiLoader className="animate-spin"/> Đang tải nhóm...</div> : 
                        <div className="relative mb-4">
                            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-8 py-3 rounded border border-gray-600 appearance-none">
                                {availableGroups.length === 0 && <option value="">Không có nhóm khác</option>}
                                {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.totalMembers} thành viên)</option>)}
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>}
                        
                        {targetGroupId && availableGroups.find(g => g.id === targetGroupId) && (
                            <div className="bg-gray-700/50 p-3 rounded flex items-center gap-3 border border-gray-600 mb-4">
                                <Image src={availableGroups.find(g => g.id === targetGroupId)?.avatar || '/avatar-default-crm.png'} width={40} height={40} alt="" className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                                <div><p className="text-white font-bold text-sm">{availableGroups.find(g => g.id === targetGroupId)?.name}</p></div>
                            </div>
                        )}

                        <div className="mt-auto">
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
                </div>
            </div>

            {/* Grid Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {details.members.filter(m => !searchTerm || m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || m.phoneNumber?.includes(searchTerm)).map(m => (
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
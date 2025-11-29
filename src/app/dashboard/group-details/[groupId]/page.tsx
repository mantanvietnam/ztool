'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// ✨ THÊM MỚI: Import FiShare và FiArrowRight
import { FiUsers, FiMessageSquare, FiSearch, FiLoader, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiPhone, FiHelpCircle, FiChevronDown, FiX, FiSend, FiEye, FiPaperclip, FiTrash2, FiShare, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';

// --- TYPE DEFINITIONS ---
interface Member {
    userId: string;
    displayName: string;
    avatar: string;
    gender?: number;
    phoneNumber?: string;
    isFr?: number;
    status?: string;
}
interface GroupInfo { grId: string; name: string; avt: string; totalMember: number; }
interface GroupDetails { groupInfo: GroupInfo; members: Member[]; }

// Type cho danh sách nhóm mục tiêu (lấy từ API get-groups-with-details)
interface TargetGroup { 
    id: string; 
    name: string; 
    avatar: string; 
    totalMembers: number; 
}

// --- COMPONENTS ---

// ... [Giữ nguyên BulkSendMessageModal] ...
const BulkSendMessageModal = ({ allMembers, onSubmit, onClose, pointCost, currentUserPoints }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[], files: File[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState('');
    const MAX_FILES = 10;
    const MAX_SIZE_MB = 2;
    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    
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
    const handleSubmit = () => onSubmit(message, Array.from(selectedIds), selectedFiles);
    
    // Logic xử lý file giữ nguyên
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const validFiles: File[] = [];
            if (selectedFiles.length + filesArray.length > MAX_FILES) { setFileError(`Tối đa ${MAX_FILES} file.`); return; }
            filesArray.forEach(file => { if (file.type.startsWith('image/') && file.size <= MAX_SIZE_MB * 1024 * 1024) validFiles.push(file); });
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex-shrink-0"><h3 className="font-bold text-white text-lg">Gửi tin nhắn cho thành viên nhóm</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col space-y-3 overflow-hidden h-1/2 md:h-auto">
                        <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm thành viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                        <div className="flex justify-between items-center text-sm flex-shrink-0"><p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span></p><div className="flex gap-4"><button onClick={handleSelectAll} className="text-blue-400">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400">Bỏ chọn</button></div></div>
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">{filteredList.map(member => ( <label key={member.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500"/><Image src={member.avatar || '/avatar-default-crm.png'} alt={member.displayName} width={40} height={40} className="rounded-full"/><span className="text-white truncate">{member.displayName}</span></label> ))}</div>
                    </div>
                    <div className="w-full md:w-3/5 p-4 flex flex-col"><textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Nhập nội dung..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600"/>
                    <div className="mt-3"><input type="file" multiple accept="image/*" id="file-upload" className="hidden" onChange={handleFileChange}/><label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-gray-700 text-blue-400 px-3 py-2 rounded-md text-sm border border-gray-600 border-dashed"><FiPaperclip/> Đính kèm ảnh ({selectedFiles.length})</label></div>
                    {!hasEnoughPoints && <p className="text-red-400 mt-2 text-sm">Không đủ điểm ({calculatedCost}).</p>}</div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3"><button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-md">Hủy</button><button onClick={handleSubmit} disabled={!hasEnoughPoints || selectedIds.size === 0} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50">Gửi</button></div>
            </div>
        </div>
    );
};

// ... [Giữ nguyên BulkAddFriendModal và AddMemberModal] ...
const BulkAddFriendModal = ({ allMembers, onSubmit, onClose, pointCost, currentUserPoints }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [message, setMessage] = useState('Xin chào, mình kết bạn nhé!');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;
    
    const filteredList = useMemo(() => allMembers.filter(m => m.isFr !== 1 && (m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || m.phoneNumber?.includes(searchTerm))), [allMembers, searchTerm]);
    const handleToggleSelect = (id: string) => { const newSet = new Set(selectedIds); newSet.has(id) ? newSet.delete(id) : newSet.add(id); setSelectedIds(newSet); };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700"><h3 className="font-bold text-white">Kết bạn hàng loạt</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/2 p-4 border-r border-gray-700 flex flex-col"><input type="text" placeholder="Tìm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-700 text-white p-2 rounded mb-2"/><div className="flex-grow overflow-y-auto">{filteredList.map(m => (<label key={m.userId} className="flex items-center gap-2 p-2 hover:bg-gray-700"><input type="checkbox" checked={selectedIds.has(m.userId)} onChange={() => handleToggleSelect(m.userId)}/><span className="text-white">{m.displayName}</span></label>))}</div></div>
                    <div className="w-full md:w-1/2 p-4"><textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded h-32" placeholder="Lời chào..."/>{!hasEnoughPoints && <p className="text-red-400 text-sm mt-2">Không đủ điểm.</p>}</div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-2"><button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded text-white">Hủy</button><button onClick={() => onSubmit(message, Array.from(selectedIds))} disabled={!hasEnoughPoints || selectedIds.size === 0} className="bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-50">Gửi yêu cầu</button></div>
            </div>
        </div>
    );
};

const AddMemberModal = ({ onSubmit, onClose, pointCost, currentUserPoints }: { onSubmit: (phones: string[]) => void; onClose: () => void; pointCost: number; currentUserPoints: number; }) => {
    const [phoneList, setPhoneList] = useState('');
    const phones = phoneList.split('\n').filter(p => p.trim());
    const cost = phones.length * pointCost;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold mb-4">Thêm thành viên (SĐT)</h3>
                <textarea value={phoneList} onChange={e => setPhoneList(e.target.value)} placeholder="Mỗi số một dòng..." className="w-full bg-gray-700 text-white p-3 rounded h-40 mb-2"/>
                <p className="text-gray-400 text-sm mb-4">Phí: {cost} điểm</p>
                <div className="flex justify-end gap-2"><button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded">Hủy</button><button onClick={() => onSubmit(phones.map(p => p.trim()))} disabled={currentUserPoints < cost || phones.length === 0} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">Thêm</button></div>
            </div>
        </div>
    );
};

// ✨ THÊM MỚI: InviteToGroupModal - Logic chọn thành viên + API lấy danh sách nhóm
const InviteToGroupModal = ({ 
    currentGroupId,
    allMembers, 
    selectedAccount,
    onSubmit, 
    onClose, 
    pointCost, 
    currentUserPoints 
}: { 
    currentGroupId: string;
    allMembers: Member[]; 
    selectedAccount: any;
    onSubmit: (targetGroupId: string, memberIds: string[]) => void; 
    onClose: () => void; 
    pointCost: number; 
    currentUserPoints: number; 
}) => {
    // 1. Logic chọn thành viên (Reused)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    
    // 2. Logic chọn nhóm mục tiêu
    const [targetGroupId, setTargetGroupId] = useState('');
    const [availableGroups, setAvailableGroups] = useState<TargetGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Fetch groups on mount
    useEffect(() => {
        const fetchGroups = async () => {
            setLoadingGroups(true);
            try {
                // ✨ SỬ DỤNG API TỪ FILE BẠN GỬI
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups-with-details`, { 
                    cookie, imei, userAgent 
                });
                
                const data = response.data;
                if (data.success && data.groups) {
                    // Lọc bỏ nhóm hiện tại ra khỏi danh sách mời
                    const otherGroups = data.groups.filter((g: any) => g.id !== currentGroupId);
                    setAvailableGroups(otherGroups);
                    if (otherGroups.length > 0) setTargetGroupId(otherGroups[0].id);
                }
            } catch (err) {
                console.error("Lỗi tải danh sách nhóm:", err);
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchGroups();
    }, [selectedAccount, currentGroupId]);

    const calculatedCost = selectedIds.size * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

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

    const handleSubmit = () => {
        if (!targetGroupId) return;
        onSubmit(targetGroupId, Array.from(selectedIds));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg">Mời thành viên sang nhóm khác</h3>
                    <button onClick={onClose}><FiX className="text-gray-400 hover:text-white"/></button>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* CỘT TRÁI: DANH SÁCH THÀNH VIÊN */}
                    <div className="w-full md:w-3/5 border-r border-gray-700 p-4 flex flex-col overflow-hidden">
                        <div className="mb-3 space-y-2">
                            <p className="text-sm text-gray-400">Bước 1: Chọn thành viên muốn mời ({selectedIds.size})</p>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="Tìm thành viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/>
                            </div>
                            <div className="flex gap-4 text-sm"><button onClick={handleSelectAll} className="text-blue-400">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400">Bỏ chọn</button></div>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-1 pr-2">
                            {filteredList.map(member => (
                                <label key={member.userId} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition ${selectedIds.has(member.userId) ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-gray-700'}`}>
                                    <input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500"/>
                                    <Image src={member.avatar || '/avatar-default-crm.png'} alt={member.displayName} width={36} height={36} className="rounded-full"/>
                                    <div className="overflow-hidden">
                                        <p className="text-white text-sm truncate">{member.displayName}</p>
                                        {member.phoneNumber && <p className="text-xs text-gray-500">{member.phoneNumber}</p>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHỌN NHÓM ĐÍCH */}
                    <div className="w-full md:w-2/5 p-4 flex flex-col bg-gray-800/50">
                        <p className="text-sm text-gray-400 mb-2">Bước 2: Chọn nhóm đích</p>
                        
                        {loadingGroups ? (
                            <div className="flex items-center gap-2 text-gray-400 py-4"><FiLoader className="animate-spin"/> Đang tải danh sách nhóm...</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <select 
                                        value={targetGroupId} 
                                        onChange={(e) => setTargetGroupId(e.target.value)}
                                        className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 appearance-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {availableGroups.length === 0 && <option value="">Không có nhóm nào khác</option>}
                                        {availableGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.totalMembers} TV)</option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                </div>

                                {targetGroupId && availableGroups.find(g => g.id === targetGroupId) && (
                                    <div className="bg-gray-700/50 p-3 rounded-md flex items-center gap-3 border border-gray-600">
                                        <Image 
                                            src={availableGroups.find(g => g.id === targetGroupId)?.avatar || '/avatar-default-crm.png'} 
                                            width={48} height={48} alt="Group" className="rounded-full"
                                        />
                                        <div>
                                            <p className="text-white font-bold text-sm">{availableGroups.find(g => g.id === targetGroupId)?.name}</p>
                                            <p className="text-xs text-gray-400">Sẽ mời {selectedIds.size} người vào nhóm này</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-auto">
                            {!hasEnoughPoints && selectedIds.size > 0 && (
                                <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mb-3 text-sm">
                                    <p>Thiếu điểm: Cần {calculatedCost.toLocaleString()}.</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                                <span>Chi phí dự kiến:</span>
                                <span className={hasEnoughPoints ? 'text-yellow-400 font-bold' : 'text-red-500 font-bold'}>{calculatedCost.toLocaleString()} điểm</span>
                            </div>
                            <button 
                                onClick={handleSubmit} 
                                disabled={selectedIds.size === 0 || !targetGroupId || !hasEnoughPoints} 
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <FiShare/> Gửi Lời Mời ({selectedIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... [Giữ nguyên SuccessModal] ...
const SuccessModal = ({ title, message, onClose, onViewProgress }: { title: string; message: string; onClose: () => void; onViewProgress: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><FiCheckCircle className="text-green-400" size={40} /></div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
            <div className="flex justify-center gap-4"><button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded text-white">Đóng</button><button onClick={onViewProgress} className="bg-blue-600 px-4 py-2 rounded text-white flex items-center gap-2"><FiEye /> Xem kết quả</button></div>
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function GroupDetailsPage() {
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.groupId as string;

    const [details, setDetails] = useState<GroupDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals state
    const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);
    const [isBulkAddFriendModalOpen, setIsBulkAddFriendModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteGroupModalOpen, setIsInviteGroupModalOpen] = useState(false); // ✨ State cho Modal mới
    
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; redirectUrl: string } | null>(null);
    const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!groupId || !selectedAccount) { if (!selectedAccount) setError("Vui lòng chọn tài khoản."); setLoading(false); return; }
        const fetchDetails = async () => {
            setLoading(true); setError(null);
            try {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-group-details/${groupId}`, { cookie: selectedAccount.cookie, imei: selectedAccount.imei, userAgent: selectedAccount.userAgent });
                const data = response.data;
                if (!data.success) throw new Error(data.message || "Lỗi tải nhóm.");
                setDetails({ groupInfo: data.details.groupInfo, members: data.details.members || [] });
            } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        };
        fetchDetails();
    }, [groupId, selectedAccount]);

    // ✨ XỬ LÝ API MỜI NHÓM
    const handleInviteToGroupSubmit = async (targetGroupId: string, memberIds: string[]) => {
        if (!selectedAccount || !user || !pointCosts) return;
        const totalCost = memberIds.length * (pointCosts.add_member_group || 0); // Dùng chung cost với thêm thành viên
        if (user.point < totalCost) { alert("Không đủ điểm."); return; }
        
        setIsInviteGroupModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            
            // API CALL
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/addMemberToGroupAPI`, {
                token: token,
                userId: selectedAccount.profile.userId,
                groupId: targetGroupId, // ID nhóm đích
                phones: memberIds,      // Array UIDs (mặc dù tên param là phones theo yêu cầu)
                type: 'uid'             // Fix cứng
            });
            
            const data = response.data;
            if (data.code !== 0) throw new Error(data.message || "Lỗi tạo yêu cầu mời nhóm.");
            
            updateUserPoints(user.point - totalCost);
            setSuccessInfo({ title: "Đã mời thành công", message: `Đã tạo yêu cầu mời <span class="font-bold">${memberIds.length}</span> người sang nhóm mới.`, redirectUrl: '/dashboard/listRequestAddMemberGroup' });
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Các hàm xử lý cũ giữ nguyên
    const handleBulkSendSubmit = async (message: string, memberIds: string[], files: File[]) => { /* ... Logic cũ ... */ }; // (Đã lược bớt để gọn, bạn dùng lại logic cũ)
    const handleBulkAddFriendSubmit = async (message: string, memberIds: string[]) => { /* ... Logic cũ ... */ };
    const handleAddMemberSubmit = async (phones: string[]) => { /* ... Logic cũ ... */ };

    if (loading) return <div className="flex-1 p-8 flex justify-center"><FiLoader className="animate-spin text-white" size={48}/></div>;
    if (error || !details) return <div className="flex-1 p-8 text-center text-red-400">{error || "Không có dữ liệu"}</div>;

    return (
        <div className="flex-1 p-6 md:p-8">
            {/* Render các Modals */}
            {isBulkSendModalOpen && <BulkSendMessageModal allMembers={details.members} onClose={() => setIsBulkSendModalOpen(false)} onSubmit={handleBulkSendSubmit} pointCost={pointCosts?.send_mess_friend || 0} currentUserPoints={user?.point || 0} />}
            {isBulkAddFriendModalOpen && <BulkAddFriendModal allMembers={details.members} onClose={() => setIsBulkAddFriendModalOpen(false)} onSubmit={handleBulkAddFriendSubmit} pointCost={pointCosts?.add_friend || 0} currentUserPoints={user?.point || 0}/>}
            {isAddMemberModalOpen && <AddMemberModal onClose={() => setIsAddMemberModalOpen(false)} onSubmit={handleAddMemberSubmit} pointCost={pointCosts?.add_member_group || 0} currentUserPoints={user?.point || 0} />}
            
            {/* ✨ RENDER MODAL MỜI NHÓM MỚI */}
            {isInviteGroupModalOpen && (
                <InviteToGroupModal 
                    currentGroupId={groupId}
                    allMembers={details.members}
                    selectedAccount={selectedAccount}
                    onClose={() => setIsInviteGroupModalOpen(false)} 
                    onSubmit={handleInviteToGroupSubmit} 
                    pointCost={pointCosts?.add_member_group || 0} 
                    currentUserPoints={user?.point || 0} 
                />
            )}
            
            {successInfo && <SuccessModal title={successInfo.title} message={successInfo.message} onClose={() => setSuccessInfo(null)} onViewProgress={() => router.push(successInfo.redirectUrl)} />}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6"><Image src={details.groupInfo.avt} alt="" width={64} height={64} className="rounded-full"/><h1 className="text-3xl font-bold text-white">{details.groupInfo.name}</h1></div>
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div className="relative w-full max-w-sm"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm thành viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 pl-10 text-white"/></div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setIsAddMemberModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"><FiUserPlus/> Thêm TV</button>
                    <button onClick={() => setIsBulkSendModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"><FiMessageSquare/> Gửi Tin</button>
                    <button onClick={() => setIsBulkAddFriendModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"><FiUserPlus/> Kết Bạn</button>
                    
                    {/* ✨ NÚT CHỨC NĂNG MỚI */}
                    <button onClick={() => setIsInviteGroupModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"><FiShare/> Mời Nhóm Khác</button>
                </div>
            </div>

            {/* Grid Thành viên (Giữ nguyên hiển thị) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {details.members.filter(m => m.displayName.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                    <div key={m.userId} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center">
                        <Image src={m.avatar || '/avatar-default-crm.png'} alt="" width={80} height={80} className="rounded-full mb-2"/>
                        <p className="font-semibold text-white truncate w-full">{m.displayName}</p>
                        {m.phoneNumber && <p className="text-gray-400 text-sm">{m.phoneNumber}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import Image from 'next/image';
import { FiUsers, FiMessageSquare, FiSearch, FiLoader, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiPhone, FiHelpCircle, FiChevronDown, FiX, FiSend, FiEye } from 'react-icons/fi';

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

// --- COMPONENTS ---

// ✨ THÊM MỚI: Popup gửi tin nhắn hàng loạt cho thành viên
const BulkSendMessageModal = ({ allMembers, onSubmit, onClose }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[]) => void; onClose: () => void; }) => {
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [friendFilter, setFriendFilter] = useState<'all' | 'friend' | 'not_friend'>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const filteredList = useMemo(() => {
        return allMembers.filter(member => {
            const nameMatch = member.displayName.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = member.phoneNumber && member.phoneNumber.includes(searchTerm);
            if (searchTerm && !nameMatch && !phoneMatch) return false;
            
            if (showAdvanced) {
                if (genderFilter === 'male' && member.gender !== 0) return false;
                if (genderFilter === 'female' && member.gender !== 1) return false;
                if (friendFilter === 'friend' && member.isFr !== 1) return false;
                if (friendFilter === 'not_friend' && member.isFr === 1) return false;
            }
            return true;
        });
    }, [allMembers, searchTerm, genderFilter, friendFilter, showAdvanced]);

    const handleToggleSelect = (memberId: string) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(memberId) ? newSelectedIds.delete(memberId) : newSelectedIds.add(memberId);
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(m => m.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());
    const handleSubmit = () => onSubmit(message, Array.from(selectedIds));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex-shrink-0"><h3 className="font-bold text-white text-lg">Gửi tin nhắn cho thành viên nhóm</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col space-y-3 overflow-hidden h-1/2 md:h-auto">
                        <div className="flex-shrink-0 space-y-3">
                            <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm theo tên hoặc SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                                {showAdvanced ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'} <FiChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </button>
                            {showAdvanced && (
                                <div className="space-y-3 p-3 bg-gray-900/50 rounded-md animate-fade-in-down">
                                    <select value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select>
                                    <select value={friendFilter} onChange={e => setFriendFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả trạng thái</option><option value="friend">Đã là bạn bè</option><option value="not_friend">Chưa là bạn bè</option></select>
                                </div>
                            )}
                        </div>
                        <hr className="border-gray-600 flex-shrink-0"/>
                        <div className="flex justify-between items-center text-sm flex-shrink-0"><p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span> / {filteredList.length}</p><div className="flex gap-4"><button onClick={handleSelectAll} className="text-blue-400 hover:underline">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 hover:underline">Bỏ chọn</button></div></div>
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                            {filteredList.map(member => (
                                <label key={member.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500"/><Image src={member.avatar || '/avatar-default-crm.png'} alt={member.displayName} width={40} height={40} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/><span className="text-white truncate">{member.displayName}</span></label>    
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-3/5 p-4 flex flex-col overflow-hidden h-1/2 md:h-auto">
                        <h4 className="font-bold text-white mb-4 flex-shrink-0">Soạn nội dung</h4>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Nhập nội dung tin nhắn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 md:flex-grow"/>
                        <div className="mt-4 p-3 bg-gray-900/50 rounded-md text-sm text-gray-400 flex-shrink-0">
                            <p className="font-bold text-gray-300 flex items-center gap-2"><FiHelpCircle/> Hướng dẫn cú pháp Spin</p>
                            <p>Dùng các biến sau: <code className="bg-gray-700 px-1 rounded">%name%</code>, <code className="bg-gray-700 px-1 rounded">%phone%</code>, <code className="bg-gray-700 px-1 rounded">%gender%</code>, <code className="bg-gray-700 px-1 rounded">%birthday%</code>.</p>
                            <p>Dùng <code className="bg-gray-700 px-1 rounded">{`{a|b|c}`}</code> để tạo spin nội dung.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button>
                    <button onClick={handleSubmit} disabled={!message.trim() || selectedIds.size === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"><FiSend/> Gửi ({selectedIds.size})</button>
                </div>
            </div>
        </div>
    );
};

// ✨ THÊM MỚI: Popup kết bạn hàng loạt
const BulkAddFriendModal = ({ allMembers, onSubmit, onClose }: { allMembers: Member[]; onSubmit: (message: string, memberIds: string[]) => void; onClose: () => void; }) => {
    const nonFriendMembers = useMemo(() => allMembers.filter(m => m.isFr !== 1), [allMembers]);
    
    const [message, setMessage] = useState('Xin chào, mình kết bạn nhé!');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(nonFriendMembers.map(m => m.userId)));
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const filteredList = useMemo(() => {
        return nonFriendMembers.filter(member => {
            const nameMatch = member.displayName.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = member.phoneNumber && member.phoneNumber.includes(searchTerm);
            if (searchTerm && !nameMatch && !phoneMatch) return false;
            
            if (showAdvanced) {
                if (genderFilter === 'male' && member.gender !== 0) return false;
                if (genderFilter === 'female' && member.gender !== 1) return false;
            }
            return true;
        });
    }, [nonFriendMembers, searchTerm, genderFilter, showAdvanced]);

    const handleToggleSelect = (memberId: string) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(memberId) ? newSelectedIds.delete(memberId) : newSelectedIds.add(memberId);
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = () => setSelectedIds(new Set(filteredList.map(m => m.userId)));
    const handleDeselectAll = () => setSelectedIds(new Set());
    const handleSubmit = () => onSubmit(message, Array.from(selectedIds));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex-shrink-0"><h3 className="font-bold text-white text-lg">Gửi yêu cầu kết bạn hàng loạt</h3></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col space-y-3 overflow-hidden h-1/2 md:h-auto">
                        <div className="flex-shrink-0 space-y-3">
                            <p className="text-sm text-gray-300">Chọn thành viên để gửi yêu cầu kết bạn.</p>
                            <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Tìm theo tên hoặc SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/></div>
                            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                                {showAdvanced ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'} <FiChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </button>
                            {showAdvanced && (
                                <div className="space-y-3 p-3 bg-gray-900/50 rounded-md animate-fade-in-down">
                                    <select value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)} className="w-full bg-gray-700 text-white p-2 rounded-md text-sm"><option value="all">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select>
                                </div>
                            )}
                        </div>
                        <hr className="border-gray-600 flex-shrink-0"/>
                        <div className="flex justify-between items-center text-sm flex-shrink-0"><p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span> / {filteredList.length}</p><div className="flex gap-4"><button onClick={handleSelectAll} className="text-blue-400 hover:underline">Chọn tất cả</button><button onClick={handleDeselectAll} className="text-blue-400 hover:underline">Bỏ chọn</button></div></div>
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                            {filteredList.map(member => (
                                <label key={member.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={selectedIds.has(member.userId)} onChange={() => handleToggleSelect(member.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500"/><Image src={member.avatar || '/avatar-default-crm.png'} alt={member.displayName} width={40} height={40} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/><span className="text-white truncate">{member.displayName}</span></label>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-3/5 p-4 flex flex-col overflow-hidden h-1/2 md:h-auto">
                        <h4 className="font-bold text-white mb-4 flex-shrink-0">Soạn lời mời kết bạn</h4>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={120} placeholder="Nhập lời mời..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <div className="text-right text-xs text-gray-400 mt-1">{message.length} / 120</div>
                        <div className="mt-2 p-3 bg-gray-900/50 rounded-md text-sm text-gray-400 flex-shrink-0">
                           <p className="font-bold text-gray-300 flex items-center gap-2"><FiHelpCircle/> Hướng dẫn</p>
                            <p>Dùng <code className="bg-gray-700 px-1 rounded">{`{a|b|c}`}</code> để tạo spin nội dung.</p>
                            <p>Dùng các biến sau: <code className="bg-gray-700 px-1 rounded">%name%</code>, <code className="bg-gray-700 px-1 rounded">%phone%</code>, <code className="bg-gray-700 px-1 rounded">%gender%</code>, <code className="bg-gray-700 px-1 rounded">%birthday%</code>.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button>
                    <button onClick={handleSubmit} disabled={selectedIds.size === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"><FiUserPlus/> Gửi Yêu Cầu ({selectedIds.size})</button>
                </div>
            </div>
        </div>
    );
};

// ✨ THÊM MỚI: Popup thêm thành viên vào nhóm
const AddMemberModal = ({ onSubmit, onClose }: { onSubmit: (phones: string[]) => void; onClose: () => void; }) => {
    const [phoneList, setPhoneList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!phoneList.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError('');
        try {
            const cleanedPhones = phoneList.split('\n')
                .map(phone => phone.replace(/[\s.,]/g, ''))
                .filter(phone => phone.length > 0 && /^\d+$/.test(phone));

            if (cleanedPhones.length === 0) {
                throw new Error("Vui lòng nhập ít nhất một số điện thoại hợp lệ.");
            }
            await onSubmit(cleanedPhones);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-900 border-b border-gray-700"><h3 className="font-bold text-white text-lg">Thêm thành viên vào nhóm</h3></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Nhập danh sách số điện thoại, mỗi số một dòng.</p>
                    <textarea 
                        rows={10} 
                        value={phoneList} 
                        onChange={(e) => setPhoneList(e.target.value)} 
                        placeholder="0912345678&#10;0987.654.321..." 
                        className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiUserPlus />} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};

// ✨ THÊM MỚI: Popup thông báo thành công
const SuccessModal = ({ title, message, onClose, onViewProgress }: { title: string; message: string; onClose: () => void; onViewProgress: () => void; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-green-400" size={40} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Đóng</button>
                    <button onClick={onViewProgress} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2">
                        <FiEye /> Xem kết quả
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function GroupDetailsPage() {
    const { selectedAccount } = useZaloAccounts();
    const router = useRouter();
    const params = useParams();
    const groupId = params.groupId as string;

    const [details, setDetails] = useState<GroupDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; redirectUrl: string } | null>(null);
    const [isBulkAddFriendModalOpen, setIsBulkAddFriendModalOpen] = useState(false);
    const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    useEffect(() => {
        if (!groupId || !selectedAccount) {
            if (!selectedAccount) setError("Vui lòng chọn một tài khoản Zalo để xem chi tiết nhóm.");
            setLoading(false);
            return;
        }

        const fetchGroupDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-group-details/${groupId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cookie: selectedAccount.cookie,
                        imei: selectedAccount.imei,
                        userAgent: selectedAccount.userAgent,
                    }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    if (data.code === 179) {
                        throw new Error("Phiên đăng nhập Zalo đã hết hạn. Vui lòng đăng nhập lại.");
                    }
                    throw new Error(data.message || "Không thể tải chi tiết nhóm.");
                }

                setDetails({
                    groupInfo: data.details.groupInfo,
                    members: data.details.members || []
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupId, selectedAccount]);

    const filteredMembers = useMemo(() => {
        if (!details) return [];
        if (!searchTerm) return details.members;
        return details.members.filter(member =>
            member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phoneNumber?.includes(searchTerm)
        );
    }, [details, searchTerm]);
    
    // ✨ CẬP NHẬT: Hàm xử lý kết bạn tất cả
    const handleBulkAddFriendSubmit = async (message: string, memberUids: string[]) => {
        if (!selectedAccount || memberUids.length === 0) {
            alert("Vui lòng chọn ít nhất một thành viên để kết bạn.");
            return;
        }
        setIsBulkAddFriendModalOpen(false);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestAddFriendAPI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    userId: selectedAccount.profile.userId,
                    list_request: memberUids,
                    type: 'uid',
                    message: message
                }),
            });
            const data = await response.json();
            if (!response.ok || data.code != 0) {
                if(data.code == 3){
                    router.push('/logout');
                } else {
                    throw new Error(data.message || "Tạo yêu cầu kết bạn thất bại.");
                }
            }
            
            setSuccessInfo({
                title: "Yêu cầu đã được tạo",
                message: `Đã tạo yêu cầu kết bạn đến <span class="font-bold">${memberUids.length}</span> thành viên thành công!`,
                redirectUrl: '/dashboard/listRequestAddFriend'
            });

        } catch (err: any) {
            setError(err.message);
            alert(`Lỗi: ${err.message}`);
        }
    };

    // ✨ THÊM MỚI: Hàm xử lý gửi yêu cầu tạo job gửi tin
    const handleBulkSendSubmit = async (message: string, memberIds: string[]) => {
        if (!selectedAccount || memberIds.length === 0) {
            alert("Vui lòng chọn tài khoản và ít nhất một thành viên để gửi.");
            return;
        }
        setIsBulkSendModalOpen(false);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    userId: selectedAccount.profile.userId,
                    message: message,
                    list_request: memberIds,
                    type: 'friend'
                }),
            });
            const data = await response.json();
            if (!response.ok || data.code != 0) {
                if(data.code == 3){
                    router.push('/logout');
                }else{
                    throw new Error(data.message || "Tạo yêu cầu gửi tin thất bại.");
                }
            }
            
            setSuccessInfo({
                title: "Yêu cầu đã được tạo",
                message: `Đã tạo yêu cầu gửi tin nhắn đến <span class="font-bold">${memberIds.length}</span> thành viên thành công!`,
                redirectUrl: '/dashboard/listSendMessageStranger'
            });

        } catch (err: any) {
            setError(err.message);
            alert(`Lỗi: ${err.message}`);
        }
    };

    // ✨ THÊM MỚI: Hàm xử lý kết bạn cho từng thành viên
    const handleAddFriend = async (memberId: string) => {
        if (!selectedAccount) {
            alert("Vui lòng chọn một tài khoản Zalo.");
            return;
        }

        setSendingRequests(prev => new Set(prev).add(memberId));

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Không tìm thấy token xác thực.");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestAddFriendAPI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    userId: selectedAccount.profile.userId,
                    list_request: [memberId],
                    type: 'uid'
                }),
            });

            const data = await response.json();
            if (!response.ok || data.code != 0) {
                if(data.code == 3) router.push('/logout');
                else throw new Error(data.message || "Tạo yêu cầu kết bạn thất bại.");
            }
            
            // Đánh dấu là đã gửi thành công
            setSentRequests(prev => new Set(prev).add(memberId));

        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        } finally {
            setSendingRequests(prev => {
                const next = new Set(prev);
                next.delete(memberId);
                return next;
            });
        }
    };

    // ✨ THÊM MỚI: Hàm xử lý thêm thành viên vào nhóm
    const handleAddMemberSubmit = async (phones: string[]) => {
        if (!selectedAccount || !groupId) {
            alert("Thiếu thông tin tài khoản hoặc nhóm.");
            return;
        }
        setIsAddMemberModalOpen(false);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Không tìm thấy token xác thực.");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/addMemberToGroupAPI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    userId: selectedAccount.profile.userId,
                    groupId: groupId,
                    phones: phones,
                }),
            });

            const data = await response.json();
            if (!response.ok || data.code != 0) {
                if(data.code == 3) router.push('/logout');
                else throw new Error(data.message || "Tạo yêu cầu thêm thành viên thất bại.");
            }
            
            setSuccessInfo({
                title: "Yêu cầu đã được tạo",
                message: `Đã tạo yêu cầu thêm <span class="font-bold">${phones.length}</span> thành viên vào nhóm!`,
                redirectUrl: '/dashboard/listRequestAddMemberGroup'
            });

        } catch (err: any) {
            setError(err.message);
            alert(`Lỗi: ${err.message}`);
        }
    };

    // --- RENDER FUNCTIONS ---
    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center text-white">
                <FiLoader size={48} className="animate-spin text-blue-400" />
                <span className="ml-4 text-xl">Đang tải chi tiết nhóm...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-white">
                <FiAlertTriangle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    if (!details) {
        return <div className="flex-1 p-8 text-center text-gray-400">Không có dữ liệu.</div>;
    }

    return (
        <div className="flex-1 p-6 md:p-8">
            {isBulkSendModalOpen && details && <BulkSendMessageModal allMembers={details.members} onClose={() => setIsBulkSendModalOpen(false)} onSubmit={handleBulkSendSubmit} />}
            {isBulkAddFriendModalOpen && details && <BulkAddFriendModal allMembers={details.members} onClose={() => setIsBulkAddFriendModalOpen(false)} onSubmit={handleBulkAddFriendSubmit} />}
            {isAddMemberModalOpen && <AddMemberModal onClose={() => setIsAddMemberModalOpen(false)} onSubmit={handleAddMemberSubmit} />}
            {successInfo && (
                <SuccessModal 
                    title={successInfo.title}
                    message={successInfo.message}
                    onClose={() => setSuccessInfo(null)}
                    onViewProgress={() => router.push(successInfo.redirectUrl)}
                />
            )}
            <div className="flex items-center gap-4 mb-6">
                 <Image
                    src={details.groupInfo.avt || '/avatar-default-crm.png'}
                    alt={`Avatar of ${details.groupInfo.name}`}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-gray-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}
                />
                <div>
                    <h1 className="text-3xl font-bold text-white">{details.groupInfo.name}</h1>
                    <p className="text-gray-400 flex items-center gap-2">
                        <FiUsers />
                        {filteredMembers.length} / {details.groupInfo.totalMember} thành viên
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:max-w-xs lg:max-w-sm">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc SĐT..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {/* ✨ CẬP NHẬT: Nút bấm và chức năng */}
                    <button onClick={() => setIsAddMemberModalOpen(true)} className="flex-1 md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition whitespace-nowrap">
                        <FiUserPlus /> Thêm thành viên
                    </button>
                    <button onClick={() => setIsBulkSendModalOpen(true)} className="flex-1 md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition whitespace-nowrap">
                        <FiMessageSquare /> Gửi tin thành viên
                    </button>
                    <button 
                        onClick={() => setIsBulkAddFriendModalOpen(true)}
                        className="flex-1 md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md transition whitespace-nowrap">
                        <FiUserPlus /> Kết bạn tất cả
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMembers.map(member => {
                    const isFriend = member.isFr === 1;
                    const isSending = sendingRequests.has(member.userId);
                    const hasSent = sentRequests.has(member.userId);

                    return (
                        <div key={member.userId} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center border border-gray-700 hover:border-blue-500 transition-all duration-300">
                            <Image
                                src={member.avatar || '/avatar-default-crm.png'}
                                alt={member.displayName}
                                width={80}
                                height={80}
                                className="rounded-full mb-3"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}
                            />
                            <p className="font-semibold text-white truncate w-full">{member.displayName}</p>
                            {member.phoneNumber && (
                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                    <FiPhone size={12} /> {member.phoneNumber}
                                </p>
                            )}
                            <div className="mt-4 flex gap-2 w-full">
                                <button
                                    onClick={() => !isFriend && !hasSent && handleAddFriend(member.userId)}
                                    className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md transition ${
                                        isFriend ? 'bg-green-800 text-green-300 cursor-default' :
                                        hasSent ? 'bg-gray-600 text-gray-400 cursor-default' :
                                        'bg-blue-700 hover:bg-blue-600 text-white'
                                    }`}
                                    disabled={isFriend || isSending || hasSent}
                                >
                                    {isSending ? <FiLoader className="animate-spin" /> : 
                                     isFriend ? <><FiCheckCircle size={16} /> Bạn bè</> : 
                                     hasSent ? <><FiCheckCircle size={16} /> Đã gửi</> : 
                                     <><FiUserPlus size={16} /> Kết bạn</>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredMembers.length === 0 && searchTerm && (
                <div className="text-center py-12 text-gray-400">
                    <p>Không tìm thấy thành viên nào khớp với "{searchTerm}".</p>
                </div>
            )}
        </div>
    );
}

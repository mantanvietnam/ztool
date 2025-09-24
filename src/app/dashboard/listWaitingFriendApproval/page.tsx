'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Giả định rằng useZaloAccounts() trả về một object có chứa token và userId
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import Image from 'next/image';
import { FiSend, FiLoader, FiAlertTriangle, FiSearch, FiUserX, FiX, FiCheckCircle } from 'react-icons/fi';

// --- TYPE DEFINITIONS ---
interface SentRequest {
    userId: string;
    displayName: string;
    avatar: string;
    timestamp: number;
}

// --- COMPONENTS (Không thay đổi) ---

const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    useEffect(() => {
        const timer = setTimeout(() => { onClose(); }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

const CancelMultipleModal = ({ requests, onClose, onConfirm }: { requests: SentRequest[]; onClose: () => void; onConfirm: (userIds: string[]) => void; }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequestsInModal = useMemo(() => {
        if (!searchTerm) return requests;
        return requests.filter(req =>
            req.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requests, searchTerm]);

    const handleToggle = (userId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(userId)) { newSelected.delete(userId); } else { newSelected.add(userId); }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        const newSelected = new Set(selectedIds);
        filteredRequestsInModal.forEach(r => newSelected.add(r.userId));
        setSelectedIds(newSelected);
    };
    
    const handleDeselectAll = () => {
        const newSelected = new Set(selectedIds);
        const filteredIds = new Set(filteredRequestsInModal.map(r => r.userId));
        newSelected.forEach(id => { if (filteredIds.has(id)) { newSelected.delete(id); } });
        setSelectedIds(newSelected);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onConfirm(Array.from(selectedIds));
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Hủy các yêu cầu đã gửi</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 flex-grow overflow-y-auto space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-gray-400">Đã chọn: <span className="font-bold text-white">{selectedIds.size}</span> / {requests.length}</p>
                        <div className="flex gap-4">
                            <button onClick={handleSelectAll} className="text-blue-400 hover:underline">Chọn (đã lọc)</button>
                            <button onClick={handleDeselectAll} className="text-blue-400 hover:underline">Bỏ chọn (đã lọc)</button>
                        </div>
                    </div>
                    <div className="relative">
                         <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
                         <input type="text" placeholder="Lọc theo tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        {filteredRequestsInModal.map(req => (
                            <label key={req.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                <input type="checkbox" checked={selectedIds.has(req.userId)} onChange={() => handleToggle(req.userId)} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"/>
                                <Image src={req.avatar.startsWith('//') ? `https:${req.avatar}` : req.avatar} alt={req.displayName} width={40} height={40} className="rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                                <span className="text-white truncate">{req.displayName}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-900 flex justify-end">
                    <button onClick={handleSubmit} disabled={isSubmitting || selectedIds.size === 0} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiUserX/>} Hủy {selectedIds.size} yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function ListWaitingFriendApprovalPage() {
    const { selectedAccount } = useZaloAccounts();
    const router = useRouter();
    const [requests, setRequests] = useState<SentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingCancellationIds, setPendingCancellationIds] = useState<Set<string>>(new Set());

    const fetchRequests = useCallback(async (isInitialLoad = false) => {
        if (!selectedAccount) {
            setRequests([]);
            if (isInitialLoad) setLoading(false);
            return;
        }
        if (isInitialLoad) {
            setLoading(true);
        }
        setError(null);
        try {
            const { cookie, imei, userAgent } = selectedAccount;
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-sent-friend-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cookie, imei, userAgent }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                if (isInitialLoad) throw new Error(data.message || 'Lấy danh sách thất bại.');
                return;
            }
            const requestsObject = data.requests;
            if (requestsObject && typeof requestsObject === 'object') {
                setRequests(Object.values(requestsObject));
            } else {
                setRequests([]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, [selectedAccount, router]);

    useEffect(() => {
        if (selectedAccount) {
            fetchRequests(true);
            const intervalId = setInterval(() => {
                fetchRequests(false);
            }, 30000);
            return () => clearInterval(intervalId);
        } else {
            setRequests([]);
            setLoading(false);
        }
    }, [selectedAccount, fetchRequests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => req.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [requests, searchTerm]);

    // ✅ HÀM ĐÃ ĐƯỢỢC CẬP NHẬT LẦN CUỐI
    const handleCancelRequest = async (userIds: string[]) => {
        // ✅ ĐÃ SỬA: Kiểm tra đường dẫn lồng nhau `profile.userId` một cách an toàn
        if (!selectedAccount?.profile?.userId) {
            setError("Tài khoản đang chọn không hợp lệ hoặc thiếu thông tin profile.userId.");
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
                return;
            }

            // ✅ ĐÃ SỬA: Lấy userId từ đường dẫn chính xác
            const payload = {
                token: token,
                userId: selectedAccount.profile.userId, // userId của tài khoản Zalo đang dùng
                userIds: userIds, // mảng các userId cần hủy yêu cầu
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/cancelFriendRequestAPI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (data.code === 0) {
                setNotification(data.message || `Đã gửi yêu cầu hủy cho ${userIds.length} người. Dữ liệu sẽ được cập nhật sau ít phút.`);

                setPendingCancellationIds(prevPendingIds => {
                    const newPendingIds = new Set(prevPendingIds);
                    userIds.forEach(id => newPendingIds.add(id));
                    return newPendingIds;
                });
            } else if (data.code === 3) {
                alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
                if (router) router.push('/logout');
            } else {
                throw new Error(data.message || 'Gửi yêu cầu hủy thất bại.');
            }

            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const renderContent = () => {
        if (loading) return <div className="text-center text-gray-400 mt-10"><FiLoader size={48} className="animate-spin mx-auto" /><p>Đang tải danh sách...</p></div>;
        if (error) return <div className="text-center text-red-400 mt-10 p-4 bg-red-500/10 rounded-md">{error}</div>;
        if (!selectedAccount) return <div className="text-center text-yellow-400 mt-10"><FiAlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-xl font-semibold">Chưa chọn tài khoản</h3><p>Vui lòng chọn một tài khoản Zalo để xem danh sách.</p></div>;
        if (filteredRequests.length === 0 && searchTerm) return <div className="text-center text-gray-400 mt-10">Không tìm thấy yêu cầu nào khớp với tìm kiếm.</div>;
        if (requests.length === 0) return <div className="text-center text-gray-400 mt-10">Không có yêu cầu nào đang chờ.</div>;

        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRequests.map(req => {
                    // ✅ THAY ĐỔI 3: Kiểm tra xem request này có đang trong trạng thái chờ hủy không
                    const isPending = pendingCancellationIds.has(req.userId);
                    return (
                        <div key={req.userId} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center">
                            <Image src={req.avatar.startsWith('//') ? `https:${req.avatar}` : req.avatar} alt={req.displayName} width={80} height={80} className="rounded-full mb-3" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-default-crm.png'; }}/>
                            <p className="font-semibold text-white truncate w-full">{req.displayName}</p>
                        
                            <button 
                                onClick={() => handleCancelRequest([req.userId])} 
                                disabled={isPending} // Vô hiệu hóa nút nếu đang chờ hủy
                                className={`mt-4 w-full flex items-center justify-center gap-2 text-white text-sm py-2 px-3 rounded-md transition ${
                                    isPending
                                        ? 'bg-yellow-600 cursor-not-allowed' // Style mới cho trạng thái chờ
                                        : 'bg-red-600 hover:bg-red-700' // Style cũ
                                }`}
                            >
                                {isPending ? (
                                    <><FiLoader className="animate-spin" /> Đang chờ hủy</> // Text và icon mới
                                ) : (
                                    <><FiUserX/> Hủy yêu cầu</> // Text và icon cũ
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8">
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            {isModalOpen && <CancelMultipleModal requests={requests} onClose={() => setIsModalOpen(false)} onConfirm={handleCancelRequest} />}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><FiSend />Yêu cầu kết bạn đã gửi</h1>
                    {!loading && requests.length > 0 && (
                        <span className="text-sm font-medium bg-gray-700 text-blue-400 py-1 px-3 rounded-full">{requests.length}</span>
                    )}
                </div>
                {requests.length > 0 && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 text-sm">
                        <FiUserX className="inline-block mr-2"/> Hủy hàng loạt
                    </button>
                )}
            </div>
            {requests.length > 0 && (
                <div className="flex items-center bg-gray-800 border border-gray-700 rounded-md mb-6 focus-within:ring-2 focus-within:ring-blue-500">
                    <FiSearch className="text-gray-400 mx-4" />
                    <input type="text" placeholder="Tìm kiếm theo tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-white py-3 pr-4 focus:outline-none"/>
                </div>
            )}
            {renderContent()}
        </div>
    );
}
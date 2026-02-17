'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FiUsers, FiClock, FiPauseCircle, FiPlayCircle, FiPlus, FiLoader, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiXCircle, FiBarChart2, FiCreditCard, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';

// --- CÁC COMPONENT CON ---

interface AddFriendJob {
    id: string | number;
    quantity_total: number;
    quantity_done: number;
    message: string;
    list_request: string[];
    list_process: string[];
    list_done: string[];
    list_error: string[];
    create_at: string;
    update_at: string;
    status: 'process' | 'pause' | 'done' | 'cancel';
}

// Popup thông báo không đủ điểm
const InsufficientPointsModal = ({ onClose, requiredPoints, currentPoints }: { onClose: () => void; requiredPoints: number; currentPoints: number; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <FiAlertTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Không đủ điểm hành động</h3>
                    <p className="text-gray-300 mb-6">
                        Bạn cần <span className="font-bold text-yellow-400">{requiredPoints.toLocaleString()}</span> điểm để thực hiện thao tác này, nhưng tài khoản chỉ còn <span className="font-bold text-white">{currentPoints.toLocaleString()}</span> điểm.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-md">
                            Đóng
                        </button>
                        <Link href="/dashboard/billing" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md">
                            <FiCreditCard/> Nạp Điểm
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const JobStatsModal = ({ job, onClose }: { job: AddFriendJob, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white flex items-center gap-2"><FiBarChart2 /> Thống kê chi tiết</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="text-sm"><span className="font-semibold text-gray-400 w-40 inline-block">ID yêu cầu:</span><span className="text-gray-200">{job.id}</span></div>
                    <div className="text-sm"><span className="font-semibold text-gray-400 w-40 inline-block">Thời gian tạo:</span><span className="text-gray-200">{job.create_at}</span></div>
                    <div className="text-sm"><span className="font-semibold text-gray-400 w-40 inline-block">Cập nhật cuối:</span><span className="text-gray-200">{job.update_at}</span></div>
                    <div><h4 className="font-semibold text-white mb-2">Lời mời đã gửi</h4><textarea readOnly value={job.message} rows={3} className="w-full bg-gray-900 text-gray-300 text-sm p-2 rounded-md border border-gray-600"/></div>
                    <div><h4 className="font-semibold text-white mt-4 mb-2">Chờ xử lý ({job.list_process.length})</h4><textarea readOnly value={job.list_process.join('\n')} rows={5} className="w-full bg-gray-900 text-gray-300 text-sm p-2 rounded-md border border-gray-600"/></div>
                    <div><h4 className="font-semibold text-green-400 mb-2">Gửi thành công ({job.list_done.length})</h4><textarea readOnly value={job.list_done.join('\n')} rows={5} className="w-full bg-gray-900 text-green-300 text-sm p-2 rounded-md border border-gray-600"/></div>
                    <div><h4 className="font-semibold text-red-400 mb-2">Gửi lỗi ({job.list_error.length})</h4><textarea readOnly value={job.list_error.join('\n')} rows={5} className="w-full bg-gray-900 text-red-400 text-sm p-2 rounded-md border border-gray-600"/></div>
                </div>
                <div className="p-4 bg-gray-900 flex justify-end"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md">Đóng</button></div>
            </div>
        </div>
    );
};

const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    useEffect(() => { const timer = setTimeout(() => { onClose(); }, 3000); return () => clearTimeout(timer); }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

const AddFriendModal = ({ onClose, onSubmit, pointCost, currentUserPoints }: { onClose: () => void; onSubmit: (message: string, phones: string[]) => Promise<void>; pointCost: number; currentUserPoints: number; }) => {
    const [phoneList, setPhoneList] = useState('');
    const [message, setMessage] = useState('Xin chào {tôi|mình} là %name%, {mình|tôi} kết bạn nhé!');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [phoneCount, setPhoneCount] = useState(0);
    const [calculatedCost, setCalculatedCost] = useState(0);

    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    useEffect(() => {
        const cleanedPhones = phoneList.split('\n').map(phone => phone.replace(/[\s.,]/g, '')).filter(phone => phone.length > 0);
        const count = cleanedPhones.length;
        setPhoneCount(count);
        setCalculatedCost(count * pointCost);
        setError('');
    }, [phoneList, pointCost]);

    const handleSubmit = async () => {
        // Các kiểm tra ban đầu
        if (isSubmitting || !hasEnoughPoints) return;
        if (!phoneList.trim()) {
            setError("Vui lòng nhập danh sách số điện thoại.");
            return;
        }
        
        // Logic gửi yêu cầu
        setIsSubmitting(true);
        setError('');
        try {
            const cleanedPhones = phoneList.split('\n').map(phone => phone.replace(/[\s.,]/g, '')).filter(phone => phone.length > 0);
            if (cleanedPhones.length === 0) throw new Error("Vui lòng nhập ít nhất một số điện thoại.");
            if (message.length > 120) throw new Error("Lời mời kết bạn không được quá 120 ký tự.");
            await onSubmit(message, cleanedPhones);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Tạo yêu cầu kết bạn</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Phần JSX cho lời mời và SĐT không đổi */}
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Lời mời kết bạn</label><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={120} placeholder="Xin chào, mình kết bạn nhé!" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/><div className="text-right text-xs text-gray-400 mt-1">{message.length} / 120</div><div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded-md mt-2"><p><strong>Gợi ý:</strong> Dùng spin <code className="bg-gray-700 px-1 rounded">{`{a|b}`}</code> và biến <code className="bg-gray-700 px-1 rounded">%name%</code> để cá nhân hóa.</p></div></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Danh sách số điện thoại (mỗi số 1 dòng)</label>
                        <textarea rows={10} value={phoneList} onChange={(e) => setPhoneList(e.target.value)} placeholder="Dán danh sách SĐT vào đây..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <div className="text-right text-xs text-gray-400 mt-1">Số lượng: {phoneCount}</div>
                    </div>
                    
                    {/* Hiển thị lỗi nếu có */}
                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                    
                    {/* THÊM MỚI: Hiển thị cảnh báo không đủ điểm (chỉ khi chưa có lỗi nào khác) */}
                    {!hasEnoughPoints && phoneCount > 0 && !error && (
                        <div className="text-sm text-red-400 mt-2">
                            <p>Không đủ điểm để thực hiện. Cần {calculatedCost.toLocaleString()} điểm, bạn đang có {currentUserPoints.toLocaleString()} điểm.</p>
                            <Link href="/dashboard/billing" className="text-blue-400 hover:underline">Nhấn vào đây để nạp thêm điểm.</Link>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-900 flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-gray-400">Chi phí:</span>
                        <span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span>
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        // CẬP NHẬT: Vô hiệu hóa nút khi đang gửi HOẶC không đủ điểm
                        disabled={isSubmitting || !hasEnoughPoints} 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: AddFriendJob['status'] }) => {
    const statusMap = { process: { text: 'Đang chạy', className: 'bg-sky-500/20 text-sky-300' }, pause: { text: 'Tạm dừng', className: 'bg-yellow-500/20 text-yellow-300' }, done: { text: 'Hoàn thành', className: 'bg-green-500/20 text-green-300' }, cancel: { text: 'Đã hủy', className: 'bg-red-500/20 text-red-300' }, };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-500/20 text-gray-300' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>{text}</span>;
};

const Pagination = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (<nav className="flex items-center justify-center gap-2 mt-8"><Link href={`${basePath}?page=${currentPage - 1}`} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronLeft /></Link>{pages.map(page => <Link key={page} href={`${basePath}?page=${page}`} className={`px-4 py-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-white hover:bg-blue-600'}`}>{page}</Link>)}<Link href={`${basePath}?page=${currentPage + 1}`} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronRight /></Link></nav>);
};

const StatsCard = ({ icon, title, value, href, isLoading }: { icon: React.ReactNode, title: string, value: string | number, href: string, isLoading?: boolean }) => (
    <Link href={href}><div className="bg-gray-800 p-6 rounded-lg flex items-center gap-4 transition-all hover:bg-gray-700 hover:ring-2 hover:ring-blue-500"><div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">{icon}</div><div><p className="text-gray-400 text-sm">{title}</p>{isLoading ? (<div className="h-8 w-16 bg-gray-700 rounded animate-pulse mt-1"></div>) : (<p className="text-2xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>)}</div></div></Link>
);


// --- COMPONENT CHÍNH ---
export default function ListRequestAddFriendPage() {
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [jobs, setJobs] = useState<AddFriendJob[]>([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [stats, setStats] = useState({ friends: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loadingFriendCount, setLoadingFriendCount] = useState(false);
    const [loadingPendingCount, setLoadingPendingCount] = useState(false);
    const [updatingJobId, setUpdatingJobId] = useState<string | number | null>(null);
    const [viewingStatsJob, setViewingStatsJob] = useState<AddFriendJob | null>(null);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    const fetchData = useCallback(async (page: number) => {
        if (!selectedAccount) { setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
            const limit = 10;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListRequestAddFriendAPI`, { token, page, limit, userId: selectedAccount.profile.userId });
            const data = response.data;
            if (data.code === 0) {
                const jobsWithId = (data.listData || []).map((item: any, index: number) => ({ ...item, id: item.id || `job-${index}-${Date.now()}` }));
                setJobs(jobsWithId);
                setPagination({ currentPage: page, totalPages: data.totalData || 1 });
            } else if (data.code === 3) {
                alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."); router.push('/logout');
            } else { throw new Error(data.message || 'Lỗi khi tải dữ liệu.'); }
        } catch (err: any) { setError(err.response?.data?.message || err.message); } finally { setLoading(false); }
    }, [router, selectedAccount]);
    
    useEffect(() => { const page = parseInt(searchParams.get('page') || '1', 10); fetchData(page); }, [searchParams, fetchData]);
    useEffect(() => { const intervalId = setInterval(() => { const currentPage = parseInt(searchParams.get('page') || '1', 10); fetchData(currentPage); }, 60000); return () => clearInterval(intervalId); }, [searchParams, fetchData]);

    useEffect(() => {
        const fetchFriendCount = async () => {
            if (!selectedAccount) { setStats(prev => ({ ...prev, friends: 0 })); return; }
            setLoadingFriendCount(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friend-count`, { cookie, imei, userAgent, proxy: savedProxy  });
                if (response.data.success) { setStats(prev => ({ ...prev, friends: response.data.count })); }
            } catch (error) { console.error("Lỗi khi lấy số lượng bạn bè:", error); } finally { setLoadingFriendCount(false); }
        };
        fetchFriendCount();
    }, [selectedAccount]);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            if (!selectedAccount) { setStats(prev => ({ ...prev, pending: 0 })); return; }
            setLoadingPendingCount(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-sent-friend-requests`, { cookie, imei, userAgent, proxy: savedProxy  });
                if (response.data.success) { setStats(prev => ({ ...prev, pending: Object.keys(response.data.requests).length })); }
            } catch (error) { console.error("Lỗi khi lấy số lượng yêu cầu đang chờ:", error); } finally { setLoadingPendingCount(false); }
        };
        fetchPendingRequests();
    }, [selectedAccount]);

    const handleAddFriendSubmit = async (message: string, phoneNumbers: string[]) => {
        const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
        if (!selectedAccount) { throw new Error("Vui lòng chọn một tài khoản Zalo để thực hiện."); }
        if (!pointCosts || !user) { throw new Error("Không thể xác định chi phí hoặc thông tin người dùng."); }

        const costPerAction = pointCosts.add_friend || 0;
        const totalCost = phoneNumbers.length * costPerAction;
        
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestAddFriendAPI`, { token, userId: selectedAccount.profile.userId, list_request: phoneNumbers, type: 'phone', message });
            const data = response.data;

            if (data.code === 0) {
                const newPoints = user.point - totalCost;
                updateUserPoints(newPoints);
                setIsAddModalOpen(false);
                setNotification(data.mess || "Tạo yêu cầu kết bạn thành công!");
                const currentPage = parseInt(searchParams.get('page') || '1', 10);
                await fetchData(currentPage);
            } else if (data.code === 3) {
                router.push('/logout');
            } else {
                throw new Error(data.mess || "Tạo yêu cầu thất bại.");
            }
        } catch (err: any) {
            throw new Error(err.response?.data?.mess || err.message);
        }
    };
    
    const handleUpdateStatus = async (jobId: string | number, status: 'cancel' | 'pause' | 'process') => {
        if (status === 'cancel') { if (!confirm(`Bạn có chắc chắn muốn Hủy bỏ công việc #${jobId} không?`)) { return; } }
        setUpdatingJobId(jobId); const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/updateStatusRequestAddFriendAPI`, { token, id: jobId, status });
            const data = response.data;
            if (data.code === 0) {
                setNotification(data.mess || "Cập nhật trạng thái thành công!");
                const currentPage = parseInt(searchParams.get('page') || '1', 10);
                await fetchData(currentPage);
            } else if (data.code === 3) { router.push('/logout'); } else { throw new Error(data.mess || "Cập nhật thất bại."); }
        } catch (err: any) { setNotification(`Lỗi: ${err.response?.data?.mess || err.message}`); } finally { setUpdatingJobId(null); }
    };

    const renderMainContent = () => {
        if (loading) return <div className="p-8 text-center text-white">Đang tải dữ liệu...</div>;
        if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
        return (
            <>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Thời gian tạo</th>
                                    <th scope="col" className="px-6 py-3">Đã gửi / Tổng số</th>
                                    <th scope="col" className="px-6 py-3">Trạng thái</th>
                                    <th scope="col" className="px-6 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4">{job.create_at}</td>
                                        <td className="px-6 py-4 font-mono">{job.quantity_done} / {job.quantity_total}</td>
                                        <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-4">
                                                <button onClick={() => setViewingStatsJob(job)} className="text-blue-400 hover:text-blue-300" title="Xem thống kê"><FiBarChart2 size={18} /></button>
                                                {updatingJobId === job.id ? <FiLoader className="animate-spin" /> : (
                                                    <>
                                                        {job.status === 'process' && (<><button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button><button onClick={() => handleUpdateStatus(job.id, 'pause')} className="text-yellow-400 hover:text-yellow-300" title="Tạm dừng"><FiPauseCircle size={18} /></button></>)}
                                                        {job.status === 'pause' && (<><button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button><button onClick={() => handleUpdateStatus(job.id, 'process')} className="text-green-400 hover:text-green-300" title="Tiếp tục"><FiPlayCircle size={18} /></button></>)}
                                                        {(job.status === 'done' || job.status === 'cancel') && (<span>--</span>)}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} basePath="/dashboard/listRequestAddFriend" />
            </>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8">
            {viewingStatsJob && <JobStatsModal job={viewingStatsJob} onClose={() => setViewingStatsJob(null)} />}
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            
            {isAddModalOpen && 
                <AddFriendModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSubmit={handleAddFriendSubmit} 
                    pointCost={isLoadingSettings ? 0 : (pointCosts?.add_friend || 0)}
                    currentUserPoints={user?.point || 0}
                />
            }
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Yêu cầu kết bạn</h1>
                <button onClick={() => setIsAddModalOpen(true)} disabled={isLoadingSettings || !user} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {isLoadingSettings ? <FiLoader className="animate-spin"/> : <FiPlus />} Tạo mới
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <StatsCard icon={<FiUsers size={24} />} title="Tổng số bạn bè" value={stats.friends} href="/dashboard/listFriendZalo" isLoading={loadingFriendCount} />
                 <StatsCard icon={<FiClock size={24} />} title="Yêu cầu đang chờ" value={stats.pending} href="/dashboard/listWaitingFriendApproval" isLoading={loadingPendingCount} />
            </div>
            
            {renderMainContent()}
        </div>
    );
}
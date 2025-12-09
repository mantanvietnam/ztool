'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { FiUsers, FiClock, FiPauseCircle, FiPlayCircle, FiLoader, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiXCircle, FiBarChart2 } from 'react-icons/fi';

import axios from 'axios';

// Cấu trúc Job
interface DeleteFriendJob {
    id: string | number;
    quantity_total: number;
    quantity_done: number;
    list_request: string[];
    list_process: string[];
    list_done: string[];
    list_error: string[];
    create_at: string;
    update_at: string;
    status: 'process' | 'pause' | 'done' | 'cancel';
}

// COMPONENT POPUP THỐNG KÊ CHI TIẾT
const JobStatsModal = ({ job, onClose }: { job: DeleteFriendJob, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FiBarChart2 /> Thống kê chi tiết</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="text-sm"><span className="font-semibold text-gray-400 w-40 inline-block">Thời gian tạo:</span><span className="text-gray-200">{job.create_at}</span></div>
                    <div className="text-sm"><span className="font-semibold text-gray-400 w-40 inline-block">Cập nhật cuối:</span><span className="text-gray-200">{job.update_at}</span></div>
                    
                    <div><h4 className="font-semibold text-white mt-4 mb-2">Chờ xử lý ({job.list_process.length})</h4><textarea readOnly value={job.list_process.join('\n')} rows={5} className="w-full bg-gray-900 text-gray-300 text-sm p-2 rounded-md border border-gray-600"/></div>
                    <div><h4 className="font-semibold text-green-400 mb-2">Xóa thành công ({job.list_done.length})</h4><textarea readOnly value={job.list_done.join('\n')} rows={5} className="w-full bg-gray-900 text-green-300 text-sm p-2 rounded-md border border-gray-600"/></div>
                    <div><h4 className="font-semibold text-red-400 mb-2">Xóa lỗi ({job.list_error.length})</h4><textarea readOnly value={job.list_error.join('\n')} rows={5} className="w-full bg-gray-900 text-red-400 text-sm p-2 rounded-md border border-gray-600"/></div>
                </div>
                <div className="p-4 bg-gray-900 flex justify-end"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md">Đóng</button></div>
            </div>
        </div>
    );
};

// COMPONENT POPUP THÔNG BÁO
const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    useEffect(() => {
        const timer = setTimeout(() => { onClose(); }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

// COMPONENT CHO ZNAK TRẠNG THÁI
const StatusBadge = ({ status }: { status: DeleteFriendJob['status'] }) => {
    const statusMap = {
        process: { text: 'Đang chạy', className: 'bg-sky-500/20 text-sky-300' },
        pause: { text: 'Tạm dừng', className: 'bg-yellow-500/20 text-yellow-300' },
        done: { text: 'Hoàn thành', className: 'bg-green-500/20 text-green-300' },
        cancel: { text: 'Đã hủy', className: 'bg-red-500/20 text-red-300' },
    };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-500/20 text-gray-300' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>{text}</span>;
};

// COMPONENT PHÂN TRANG
const Pagination = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
        <nav className="flex items-center justify-center gap-2 mt-8">
            <Link href={`${basePath}?page=${currentPage - 1}`} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronLeft /></Link>
            {pages.map(page => <Link key={page} href={`${basePath}?page=${page}`} className={`px-4 py-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-white hover:bg-blue-600'}`}>{page}</Link>)}
            <Link href={`${basePath}?page=${currentPage + 1}`} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronRight /></Link>
        </nav>
    );
};

// COMPONENT THẺ THỐNG KÊ
const StatsCard = ({ icon, title, value, href, isLoading }: { icon: React.ReactNode, title: string, value: string | number, href: string, isLoading?: boolean }) => (
    <Link href={href}>
        <div className="bg-gray-800 p-6 rounded-lg flex items-center gap-4 transition-all hover:bg-gray-700 hover:ring-2 hover:ring-blue-500">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mt-1"></div>
                ) : (
                    // ✨ SỬA LỖI: Thêm `?? 0` để tránh lỗi khi value là undefined
                    <p className="text-2xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>
                )}
            </div>
        </div>
    </Link>
);


export default function ListRequestDeleteFriendPage() {
    const { selectedAccount } = useZaloAccounts();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [jobs, setJobs] = useState<DeleteFriendJob[]>([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [stats, setStats] = useState<{friends: number; pending: number;}>({ friends: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [loadingFriendCount, setLoadingFriendCount] = useState(false);
    const [loadingPendingCount, setLoadingPendingCount] = useState(false);
    const [updatingJobId, setUpdatingJobId] = useState<string | number | null>(null);
    const [viewingStatsJob, setViewingStatsJob] = useState<DeleteFriendJob | null>(null);
    
    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;
    
    const fetchData = useCallback(async (page: number) => {
        if (!selectedAccount) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/logout');
                return;
            }
            const limit = 10;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListRequestDeleteFriendAPI`, {
                token: token,
                page: page,
                limit: limit,
                userId: selectedAccount.profile.userId
            });
            const data = response.data;
            if (data.code === 0) {
                const jobsWithId = (data.listData || []).map((item: any, index: number) => ({ ...item, id: item.id || `job-${index}-${Date.now()}` }));
                setJobs(jobsWithId);
                setPagination({ currentPage: page, totalPages: data.totalData || 1 });
            } else if (data.code === 3) {
                alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
                router.push('/logout');
            } else {
                throw new Error(data.message || 'Lỗi khi tải dữ liệu.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [router, selectedAccount]);
    
    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        fetchData(page);
    }, [searchParams, fetchData]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentPage = parseInt(searchParams.get('page') || '1', 10);
            fetchData(currentPage);
        }, 60000); // 1 phút
        return () => clearInterval(intervalId);
    }, [searchParams, fetchData]);


    useEffect(() => {
        const fetchFriendCount = async () => {
            if (!selectedAccount) {
                setStats(prev => ({ ...prev, friends: 0 }));
                return;
            }
            setLoadingFriendCount(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friend-count`, {
                    cookie, imei, userAgent, proxy: savedProxy 
                });
                if (response.data.success) {
                    setStats(prev => ({ ...prev, friends: response.data.count }));
                }
            } catch (error) {
                console.error("Lỗi khi lấy số lượng bạn bè:", error);
                setStats(prev => ({ ...prev, friends: 0 }));
            } finally {
                setLoadingFriendCount(false);
            }
        };
        fetchFriendCount();
    }, [selectedAccount]);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            if (!selectedAccount) {
                setStats(prev => ({ ...prev, pending: 0 }));
                return;
            }
            setLoadingPendingCount(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-sent-friend-requests`, {
                    cookie, imei, userAgent, proxy: savedProxy 
                });
                if (response.data.success) {
                    setStats(prev => ({ ...prev, pending: Object.keys(response.data.requests).length}));
                }
            } catch (error) {
                console.error("Lỗi khi lấy số lượng yêu cầu đang chờ:", error);
                setStats(prev => ({ ...prev, pending: 0 }));
            } finally {
                setLoadingPendingCount(false);
            }
        };
        fetchPendingRequests();
    }, [selectedAccount]);
    
    const handleUpdateStatus = async (jobId: string | number, status: 'cancel' | 'pause' | 'process') => {
        if (status === 'cancel') {
            if (!confirm(`Bạn có chắc chắn muốn Hủy bỏ công việc #${jobId} không?`)) {
                return;
            }
        }
        setUpdatingJobId(jobId);
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/logout');
            return;
        }
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/updateStatusRequestDeleteFriendAPI`, {
                token: token,
                id: jobId,
                status: status
            });
            const data = response.data;
            if (data.code === 0) {
                setNotification(data.mess || "Cập nhật trạng thái thành công!");
                const currentPage = parseInt(searchParams.get('page') || '1', 10);
                await fetchData(currentPage);
            } else if (data.code === 3) {
                router.push('/logout');
            } else {
                throw new Error(data.mess || "Cập nhật thất bại.");
            }
        } catch (err: any) {
            setNotification(`Lỗi: ${err.response?.data?.mess || err.message}`);
        } finally {
            setUpdatingJobId(null);
        }
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
                                    <th scope="col" className="px-6 py-3">Đã xóa / Tổng số</th>
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
                                                <button onClick={() => setViewingStatsJob(job)} className="text-blue-400 hover:text-blue-300" title="Xem thống kê">
                                                    <FiBarChart2 size={18} />
                                                </button>
                                                
                                                {updatingJobId === job.id ? <FiLoader className="animate-spin" /> : (
                                                    <>
                                                        {job.status === 'process' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button>
                                                                <button onClick={() => handleUpdateStatus(job.id, 'pause')} className="text-yellow-400 hover:text-yellow-300" title="Tạm dừng"><FiPauseCircle size={18} /></button>
                                                            </>
                                                        )}
                                                        {job.status === 'pause' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button>
                                                                <button onClick={() => handleUpdateStatus(job.id, 'process')} className="text-green-400 hover:text-green-300" title="Tiếp tục"><FiPlayCircle size={18} /></button>
                                                            </>
                                                        )}
                                                        {(job.status === 'done' || job.status === 'cancel') && (
                                                            <span>--</span>
                                                        )}
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
                <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} basePath="/dashboard/listRequestDeleteFriend" />
            </>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8">
            {viewingStatsJob && <JobStatsModal job={viewingStatsJob} onClose={() => setViewingStatsJob(null)} />}
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <StatsCard 
                    icon={<FiUsers size={24} />} 
                    title="Tổng số bạn bè" 
                    value={stats.friends} 
                    href="/dashboard/listFriendZalo"
                    isLoading={loadingFriendCount}
                />
                 <StatsCard 
                    icon={<FiClock size={24} />} 
                    title="Yêu cầu đang chờ" 
                    value={stats.pending} 
                    href="/dashboard/listWaitingFriendApproval"
                    isLoading={loadingPendingCount} 
                />
            </div>
            
            {renderMainContent()}
        </div>
    );
}
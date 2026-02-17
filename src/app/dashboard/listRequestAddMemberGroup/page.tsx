'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
// 1. IMPORT CÁC HOOK CẦN THIẾT
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FiUsers, FiClock, FiPauseCircle, FiPlayCircle, FiPlus, FiLoader, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiXCircle, FiBarChart2, FiSearch, FiCreditCard } from 'react-icons/fi';
import axios from 'axios';

// --- TYPE DEFINITIONS ---

interface AddMemberJob {
    id: string | number;
    group_id: string;
    quantity_total: number;
    quantity_done: number;
    list_request: string[];
    list_process: string[];
    list_done: string[];
    list_error: string[];
    create_at: string;
    update_at: string;
    status: 'process' | 'pause' | 'done' | 'cancel';
    group_name?: string;
    group_total_members?: number;
}

interface ZaloGroup {
    id: string;
    name: string;
    avatar: string;
    totalMembers: number;
}

// --- COMPONENTS ---

const JobStatsModal = ({ job, onClose }: { job: AddMemberJob, onClose: () => void }) => {
    // Giữ nguyên code gốc của bạn
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white flex items-center gap-2"><FiBarChart2 /> Thống kê chi tiết</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400 w-40 inline-block">ID yêu cầu:</span>
                        <span className="text-gray-200 font-bold">{job.id}</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400 w-40 inline-block">Nhóm:</span>
                        <span className="text-gray-200 font-bold">{job.group_name || 'Không rõ'}</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400 w-40 inline-block">Thành viên:</span>
                        <span className="text-gray-200">{job.group_total_members?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400 w-40 inline-block">Thời gian tạo:</span>
                        <span className="text-gray-200">{job.create_at}</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400 w-40 inline-block">Cập nhật cuối:</span>
                        <span className="text-gray-200">{job.update_at}</span>
                    </div>
                    <div><h4 className="font-semibold text-white mb-2">Chờ xử lý ({job.list_process.length})</h4><textarea readOnly value={job.list_process.join('\n')} rows={5} className="w-full bg-gray-900 text-gray-300 text-sm p-2 rounded-md border border-gray-600"/></div><div><h4 className="font-semibold text-green-400 mb-2">Thêm thành công ({job.list_done.length})</h4><textarea readOnly value={job.list_done.join('\n')} rows={5} className="w-full bg-gray-900 text-green-300 text-sm p-2 rounded-md border border-gray-600"/></div><div><h4 className="font-semibold text-red-400 mb-2">Thêm lỗi ({job.list_error.length})</h4><textarea readOnly value={job.list_error.join('\n')} rows={5} className="w-full bg-gray-900 text-red-400 text-sm p-2 rounded-md border border-gray-600"/></div></div>
                <div className="p-4 bg-gray-900 flex justify-end"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md">Đóng</button></div>
            </div>
        </div>
    );
};

const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    // Giữ nguyên code gốc của bạn
    useEffect(() => { const timer = setTimeout(() => { onClose(); }, 3000); return () => clearTimeout(timer); }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

// 2. CẬP NHẬT HOÀN CHỈNH: Popup thêm thành viên
const AddMemberToGroupModal = ({ onClose, onSubmit, pointCost, currentUserPoints }: { onClose: () => void; onSubmit: (groupId: string, phones: string[]) => Promise<void>; pointCost: number; currentUserPoints: number; }) => {
    const { selectedAccount } = useZaloAccounts();
    const [groups, setGroups] = useState<ZaloGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [phoneList, setPhoneList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // State cho tính điểm
    const [phoneCount, setPhoneCount] = useState(0);
    const [calculatedCost, setCalculatedCost] = useState(0);
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => {
        const fetchGroups = async () => {
            if (!selectedAccount) return;
            setIsLoadingGroups(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups-with-details`, { cookie, imei, userAgent, proxy: savedProxy  });
                if (response.data.success) {
                    setGroups(response.data.groups || []);
                }
            } catch (err) {
                setError('Không thể tải danh sách nhóm.');
            } finally {
                setIsLoadingGroups(false);
            }
        };
        fetchGroups();
    }, [selectedAccount]);

    useEffect(() => {
        const cleanedPhones = phoneList.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        setPhoneCount(cleanedPhones.length);
        setCalculatedCost(cleanedPhones.length * pointCost);
        setError('');
    }, [phoneList, pointCost]);


    const filteredGroups = useMemo(() => {
        return groups.filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [groups, searchTerm]);

    const handleSubmit = async () => {
        if (isSubmitting || !hasEnoughPoints) return;
        if (!selectedGroupId || !phoneList.trim()) {
            setError("Vui lòng chọn nhóm và nhập danh sách số điện thoại.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const cleanedPhones = phoneList.split('\n').map(phone => phone.replace(/[\s.,]/g, '')).filter(phone => phone.length > 0);
            if (cleanedPhones.length === 0) {
                throw new Error("Vui lòng nhập ít nhất một số điện thoại.");
            }
            await onSubmit(selectedGroupId, cleanedPhones);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Tạo yêu cầu thêm thành viên</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Cột trái: Chọn nhóm */}
                    <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col space-y-3 h-1/2 md:h-auto">
                        <h4 className="font-semibold text-white flex-shrink-0">1. Chọn nhóm để thêm thành viên</h4>
                        <div className="relative flex-shrink-0">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" placeholder="Tìm kiếm nhóm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 text-white pl-10 pr-4 py-2 rounded-md border border-gray-600"/>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                            {isLoadingGroups ? <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin" /></div> : 
                            filteredGroups.map(group => (
                                <div key={group.id} onClick={() => setSelectedGroupId(group.id)} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedGroupId === group.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                    <Image src={group.avatar || '/avatar-default-crm.png'} alt={group.name} width={40} height={40} className="rounded-full"/>
                                    <div className="overflow-hidden">
                                        <p className="text-white truncate font-semibold">{group.name}</p>
                                        <p className="text-xs text-gray-400">{group.totalMembers} thành viên</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Cột phải: Nhập SĐT */}
                    <div className="w-full md:w-1/2 p-4 flex flex-col space-y-3 h-1/2 md:h-auto">
                        <h4 className="font-semibold text-white flex-shrink-0">2. Nhập danh sách số điện thoại</h4>
                        <textarea rows={8} value={phoneList} onChange={(e) => setPhoneList(e.target.value)} placeholder="Mỗi số điện thoại trên một dòng..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"/>
                        <div className="text-right text-xs text-gray-400 mt-1 flex-shrink-0">Số lượng: {phoneCount}</div>
                        {error && <p className="text-sm text-red-400 flex-shrink-0">{error}</p>}
                        {!hasEnoughPoints && phoneCount > 0 && !error && (
                            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mt-2 text-sm flex-shrink-0">
                                <p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, bạn đang có {currentUserPoints.toLocaleString()}.</p>
                                <Link href="/dashboard/billing" className="font-bold text-blue-400 hover:underline mt-1 block">Nạp thêm điểm?</Link>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-900 flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-gray-400">Chi phí:</span>
                        <span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span>
                    </div>
                    <button onClick={handleSubmit} disabled={isSubmitting || isLoadingGroups || !hasEnoughPoints} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: AddMemberJob['status'] }) => {
    // Giữ nguyên code gốc của bạn
    const statusMap = { process: { text: 'Đang chạy', className: 'bg-sky-500/20 text-sky-300' }, pause: { text: 'Tạm dừng', className: 'bg-yellow-500/20 text-yellow-300' }, done: { text: 'Hoàn thành', className: 'bg-green-500/20 text-green-300' }, cancel: { text: 'Đã hủy', className: 'bg-red-500/20 text-red-300' }, };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-500/20 text-gray-300' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>{text}</span>;
};

const Pagination = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    // Giữ nguyên code gốc của bạn
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (<nav className="flex items-center justify-center gap-2 mt-8"><Link href={`${basePath}?page=${currentPage - 1}`} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronLeft /></Link>{pages.map(page => <Link key={page} href={`${basePath}?page=${page}`} className={`px-4 py-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-white hover:bg-blue-600'}`}>{page}</Link>)}<Link href={`${basePath}?page=${currentPage + 1}`} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronRight /></Link></nav>);
};

// --- MAIN PAGE COMPONENT ---
export default function ListRequestAddMemberGroupPage() {
    // 3. SỬ DỤNG HOOK ĐỂ LẤY DỮ LIỆU TỪ CONTEXT
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [jobs, setJobs] = useState<AddMemberJob[]>([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [updatingJobId, setUpdatingJobId] = useState<string | number | null>(null);
    const [viewingStatsJob, setViewingStatsJob] = useState<AddMemberJob | null>(null);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    // Toàn bộ logic fetchData và các useEffect khác của bạn được giữ nguyên
    const fetchData = useCallback(async (page: number) => {
        if (!selectedAccount) { setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
            const limit = 10;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListRequestAddMemberToGroupAPI`, { token: token, page: page, limit: limit, userId: selectedAccount.profile.userId });
            const data = response.data;
            if (data.code === 0) {
                const initialJobs = (data.listData || []).map((item: any, index: number) => ({ ...item, id: item.id || `job-${index}-${Date.now()}` }));
                if (initialJobs.length > 0) {
                    const groupIds = [...new Set(initialJobs.map((job: AddMemberJob) => job.group_id).filter(Boolean))];
                    const groupInfoPromises = groupIds.map(groupId => axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-group-info/${groupId}`, { cookie: selectedAccount.cookie, imei: selectedAccount.imei, userAgent: selectedAccount.userAgent, proxy: savedProxy  }).catch(() => null) );
                    const groupInfoResults = await Promise.all(groupInfoPromises);
                    const groupInfoMap = new Map<string, { name: string, totalMembers: number }>();
                    groupInfoResults.forEach(result => { if (result && result.data.success) { const groupInfo = result.data.details.groupInfo; groupInfoMap.set(groupInfo.groupId, { name: groupInfo.name, totalMembers: groupInfo.totalMember }); } });
                    const jobsWithGroupNames = initialJobs.map((job: AddMemberJob) => ({ ...job, group_name: groupInfoMap.get(job.group_id)?.name || 'Không tìm thấy nhóm', group_total_members: groupInfoMap.get(job.group_id)?.totalMembers }));
                    setJobs(jobsWithGroupNames);
                } else { setJobs(initialJobs); }
                setPagination({ currentPage: page, totalPages: data.totalData || 1 });
            } else if (data.code === 3) { alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."); router.push('/logout'); } 
            else { throw new Error(data.message || 'Lỗi khi tải dữ liệu.'); }
        } catch (err: any) { setError(err.response?.data?.message || err.message); } finally { setLoading(false); }
    }, [router, selectedAccount]);
    useEffect(() => { const page = parseInt(searchParams.get('page') || '1', 10); fetchData(page); }, [searchParams, fetchData]);
    useEffect(() => { const intervalId = setInterval(() => { const currentPage = parseInt(searchParams.get('page') || '1', 10); fetchData(currentPage); }, 60000); return () => clearInterval(intervalId); }, [searchParams, fetchData]);

    // 4. CẬP NHẬT HÀM SUBMIT ĐỂ TRỪ ĐIỂM
    const handleAddMemberSubmit = async (groupId: string, phoneNumbers: string[]) => {
        const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
        if (!selectedAccount) throw new Error("Vui lòng chọn một tài khoản Zalo để thực hiện.");
        if (!pointCosts || !user) throw new Error("Không thể xác định chi phí hoặc thông tin người dùng.");

        const costPerAction = pointCosts.add_member_group || 0;
        const totalCost = phoneNumbers.length * costPerAction;
        
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/addMemberToGroupAPI`, { token, userId: selectedAccount.profile.userId, groupId, phones: phoneNumbers });
            const data = response.data;
            if (data.code === 0) {
                // Trừ điểm sau khi thành công
                updateUserPoints(user.point - totalCost);
                setIsAddModalOpen(false);
                setNotification(data.message || "Tạo yêu cầu thành công!");
                const currentPage = parseInt(searchParams.get('page') || '1', 10);
                await fetchData(currentPage);
            } else if (data.code === 3) { router.push('/logout'); } 
            else { throw new Error(data.message || "Tạo yêu cầu thất bại."); }
        } catch (err: any) { throw new Error(err.response?.data?.message || err.message); }
    };
    
    const handleUpdateStatus = async (jobId: string | number, status: 'cancel' | 'pause' | 'process') => {
        // Giữ nguyên code gốc của bạn
        if (status === 'cancel') { if (!confirm(`Bạn có chắc chắn muốn Hủy bỏ công việc #${jobId} không?`)) { return; } }
        setUpdatingJobId(jobId);
        const token = localStorage.getItem('authToken'); if (!token) { router.push('/logout'); return; }
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/updateStatusRequestAddMemberToGroupAPI`, { token, id: jobId, status });
            const data = response.data;
            if (data.code === 0) {
                setNotification(data.mess || "Cập nhật trạng thái thành công!");
                const currentPage = parseInt(searchParams.get('page') || '1', 10);
                await fetchData(currentPage);
            } else if (data.code === 3) { router.push('/logout'); } 
            else { throw new Error(data.mess || "Cập nhật thất bại."); }
        } catch (err: any) { setNotification(`Lỗi: ${err.response?.data?.mess || err.message}`); } finally { setUpdatingJobId(null); }
    };

    const renderMainContent = () => {
        // Giữ nguyên code gốc của bạn
        if (loading) return <div className="p-8 text-center text-white">Đang tải dữ liệu...</div>;
        if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
        return ( <> <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-300"><thead className="text-xs text-gray-400 uppercase bg-gray-700"><tr><th scope="col" className="px-6 py-3">Thời gian tạo</th><th scope="col" className="px-6 py-3">Nhóm</th><th scope="col" className="px-6 py-3">Thành viên</th><th scope="col" className="px-6 py-3">Đã thêm / Tổng số</th><th scope="col" className="px-6 py-3">Trạng thái</th><th scope="col" className="px-6 py-3 text-center">Hành động</th></tr></thead><tbody>{jobs.map((job) => (<tr key={job.id} className="border-b border-gray-700 hover:bg-gray-700/50"><td className="px-6 py-4">{job.create_at}</td><td className="px-6 py-4 font-semibold">{job.group_name || job.group_id}</td><td className="px-6 py-4">{job.group_total_members?.toLocaleString() ?? 'N/A'}</td><td className="px-6 py-4 font-mono">{job.quantity_done} / {job.quantity_total}</td><td className="px-6 py-4"><StatusBadge status={job.status} /></td><td className="px-6 py-4"><div className="flex justify-center items-center gap-4"><button onClick={() => setViewingStatsJob(job)} className="text-blue-400 hover:text-blue-300" title="Xem thống kê"><FiBarChart2 size={18} /></button>{updatingJobId === job.id ? <FiLoader className="animate-spin" /> : (<>{job.status === 'process' && (<><button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button><button onClick={() => handleUpdateStatus(job.id, 'pause')} className="text-yellow-400 hover:text-yellow-300" title="Tạm dừng"><FiPauseCircle size={18} /></button></>)}{job.status === 'pause' && (<><button onClick={() => handleUpdateStatus(job.id, 'cancel')} className="text-red-400 hover:text-red-300" title="Hủy bỏ"><FiXCircle size={18} /></button><button onClick={() => handleUpdateStatus(job.id, 'process')} className="text-green-400 hover:text-green-300" title="Tiếp tục"><FiPlayCircle size={18} /></button></>)}{(job.status === 'done' || job.status === 'cancel') && (<span>--</span>)}</>)}</div></td></tr>))}</tbody></table></div></div><Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} basePath="/dashboard/listRequestAddMemberGroup" /> </> );
    };

    return (
        <div className="flex-1 p-6 md:p-8">
            {viewingStatsJob && <JobStatsModal job={viewingStatsJob} onClose={() => setViewingStatsJob(null)} />}
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            
            {/* 5. TRUYỀN DỮ LIỆU ĐIỂM VÀO POPUP */}
            {isAddModalOpen && 
                <AddMemberToGroupModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSubmit={handleAddMemberSubmit} 
                    pointCost={isLoadingSettings ? 0 : (pointCosts?.add_member_group || 0)}
                    currentUserPoints={user?.point || 0}
                />
            }
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Yêu cầu thêm thành viên vào nhóm</h1>
                <button onClick={() => setIsAddModalOpen(true)} disabled={isLoadingSettings || !user} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {isLoadingSettings ? <FiLoader className="animate-spin" /> : <FiPlus />} Tạo mới
                </button>
            </div>
            
            {renderMainContent()}
        </div>
    );
}
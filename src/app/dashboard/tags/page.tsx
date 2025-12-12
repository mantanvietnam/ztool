'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { FiTag, FiPlus, FiLoader, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import axios from 'axios';

// --- INTERFACES ---

interface Tag {
    id: string | number;
    name: string;
    color: string;
    number_member: number;
}

// --- SUB-COMPONENTS ---

// 1. Notification Component
const SuccessNotification = ({ message, onClose }: { message: string; onClose: () => void; }) => {
    useEffect(() => { const timer = setTimeout(() => { onClose(); }, 3000); return () => clearTimeout(timer); }, [onClose]);
    return ( <div className="fixed top-5 right-5 bg-gray-800 border border-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-50 animate-fade-in-down"><FiCheckCircle className="text-green-500" size={24} /><p className="text-sm">{message}</p><button onClick={onClose} className="ml-4 text-gray-400 hover:text-white"><FiX /></button></div> );
};

// 2. Pagination Component
const Pagination = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (<nav className="flex items-center justify-center gap-2 mt-8"><Link href={`${basePath}?page=${currentPage - 1}`} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronLeft /></Link>{pages.map(page => <Link key={page} href={`${basePath}?page=${page}`} className={`px-4 py-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-white hover:bg-blue-600'}`}>{page}</Link>)}<Link href={`${basePath}?page=${currentPage + 1}`} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-white bg-gray-700 hover:bg-blue-600'}`}><FiChevronRight /></Link></nav>);
};

// 3. Modal Tạo/Sửa Thẻ
const TagModal = ({ onClose, onSubmit, initialData }: { onClose: () => void; onSubmit: (name: string, color: string) => Promise<void>; initialData?: Tag }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [color, setColor] = useState(initialData?.color || '#3B82F6'); // Mặc định màu xanh blue
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) { setError("Vui lòng nhập tên thẻ."); return; }
        setIsSubmitting(true);
        setError('');
        try {
            await onSubmit(name, color);
            onClose();
        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Danh sách màu gợi ý
    const presetColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white">{initialData ? 'Chỉnh sửa thẻ' : 'Tạo thẻ mới'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tên thẻ</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Khách VIP, Bạn bè..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Màu sắc hiển thị</label>
                        <div className="flex gap-2 mb-3">
                            {presetColors.map(c => (
                                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded bg-transparent cursor-pointer" />
                            <span className="text-gray-400 text-sm">{color}</span>
                        </div>
                    </div>
                    {/* Preview Badge */}
                    <div className="p-4 bg-gray-900 rounded border border-gray-700 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full text-white text-sm font-medium" style={{ backgroundColor: color }}>
                            {name || 'Xem trước tên thẻ'}
                        </span>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <div className="p-4 bg-gray-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm font-medium">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : (initialData ? <FiEdit2/> : <FiPlus/>)}
                        {initialData ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---

export default function TagsPage() {
    const { selectedAccount } = useZaloAccounts();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // State
    const [tags, setTags] = useState<Tag[]>([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);

    // 1. Hàm lấy danh sách thẻ
    const fetchTags = useCallback(async (page: number) => {
        if (!selectedAccount) { setLoading(false); return; }
        setLoading(true); setError('');
        
        try {
            const token = localStorage.getItem('authToken'); 
            if (!token) { router.push('/logout'); return; }
            
            const limit = 10;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/getListTagAPI`, { 
                token, 
                page, 
                limit, 
                userId: selectedAccount.profile.userId 
            });
            
            const data = response.data;
            if (data.code === 0) {
                setTags(data.listData || []);
                setPagination({ currentPage: page, totalPages: data.totalData ? Math.ceil(data.totalData / limit) : 1 });
            } else if (data.code === 3) {
                alert("Phiên đăng nhập hết hạn."); router.push('/logout');
            } else { 
                throw new Error(data.message || 'Lỗi khi tải danh sách thẻ.'); 
            }
        } catch (err: any) { 
            setError(err.response?.data?.message || err.message); 
        } finally { 
            setLoading(false); 
        }
    }, [router, selectedAccount]);

    // Effects: Gọi API khi load trang hoặc đổi page
    useEffect(() => { const page = parseInt(searchParams.get('page') || '1', 10); fetchTags(page); }, [searchParams, fetchTags]);

    // Handlers mở Modal
    const handleOpenCreate = () => {
        setEditingTag(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tag: Tag) => {
        setEditingTag(tag);
        setIsModalOpen(true);
    };

    // 2. Hàm Xóa Thẻ
    const handleDeleteTag = async (id: string | number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thẻ này? Dữ liệu thành viên trong thẻ sẽ mất liên kết.")) return;
        
        const token = localStorage.getItem('authToken');
        if (!token) { router.push('/logout'); return; }

        if (!selectedAccount) {
            alert("Vui lòng chọn tài khoản Zalo.");
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/deleteTagAPI`, {
                token,
                id,
                userId: selectedAccount.profile.userId
            });

            const data = response.data;
            if (data.code === 0) {
                setNotification("Xóa thẻ thành công!");
                fetchTags(pagination.currentPage);
            } else if (data.code === 3) {
                router.push('/logout');
            } else {
                alert(data.message || data.mess || "Xóa thất bại.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Lỗi kết nối.");
        }
    };

    // 3. Hàm Lưu Thẻ (Tạo mới hoặc Sửa)
    const handleSaveTag = async (name: string, color: string) => {
        const token = localStorage.getItem('authToken');
        if (!token) { router.push('/logout'); return; }

        if (!selectedAccount) throw new Error("Vui lòng chọn tài khoản Zalo.");

        // Chuẩn bị payload
        const payload: any = {
            token,
            userId: selectedAccount.profile.userId,
            name,
            color
        };
        // Nếu là sửa thì thêm id
        if (editingTag) {
            payload.id = editingTag.id;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/saveTagAPI`, payload);
            const data = response.data;

            if (data.code === 0) {
                setNotification(editingTag ? "Cập nhật thẻ thành công!" : "Tạo thẻ mới thành công!");
                fetchTags(pagination.currentPage);
            } else if (data.code === 3) {
                router.push('/logout');
                throw new Error("Phiên đăng nhập hết hạn.");
            } else {
                throw new Error(data.message || data.mess || "Thao tác thất bại.");
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || error.message || "Lỗi kết nối.");
        }
    };

    // Render Table
    const renderTable = () => {
        if (loading) return <div className="p-8 text-center text-white"><FiLoader className="animate-spin inline mr-2"/>Đang tải danh sách thẻ...</div>;
        if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
        if (tags.length === 0) return <div className="p-8 text-center text-gray-400">Chưa có thẻ phân loại nào. Hãy tạo thẻ mới!</div>;

        return (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID</th>
                                <th scope="col" className="px-6 py-3">Tên thẻ</th>
                                <th scope="col" className="px-6 py-3 text-center">Thành viên</th>
                                <th scope="col" className="px-6 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map((tag) => (
                                <tr key={tag.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition duration-150">
                                    <td className="px-6 py-4 text-gray-500 font-mono">#{tag.id}</td>
                                    
                                    {/* SỬA: Bấm vào tên thẻ để xem chi tiết, truyền thêm name qua URL để hiển thị đẹp */}
                                    <td className="px-6 py-4">
                                        <Link 
                                            href={`/dashboard/tags/${tag.id}?name=${encodeURIComponent(tag.name)}`}
                                            className="group flex items-center gap-2 cursor-pointer"
                                        >
                                            <span className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: tag.color }}>
                                                {tag.name}
                                            </span>
                                        </Link>
                                    </td>

                                    {/* SỬA: Bấm vào số lượng cũng xem chi tiết */}
                                    <td className="px-6 py-4 text-center">
                                        <Link 
                                            href={`/dashboard/tags/${tag.id}?name=${encodeURIComponent(tag.name)}`}
                                            className="inline-flex items-center justify-center gap-1 text-gray-300 hover:text-blue-400 cursor-pointer transition"
                                        >
                                            <FiUsers size={16}/> 
                                            <span className="font-bold">{tag.number_member.toLocaleString()}</span>
                                        </Link>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button onClick={() => handleOpenEdit(tag)} className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-600 rounded" title="Chỉnh sửa">
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteTag(tag.id)} className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded" title="Xóa thẻ">
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8">
            {/* Notification */}
            {notification && <SuccessNotification message={notification} onClose={() => setNotification(null)} />}
            
            {/* Create/Edit Modal */}
            {isModalOpen && (
                <TagModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSubmit={handleSaveTag}
                    initialData={editingTag}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 text-blue-400 rounded-lg">
                        <FiTag size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Quản lý thẻ phân loại</h1>
                        <p className="text-gray-400 text-sm">Tạo và quản lý các nhóm khách hàng tùy chỉnh</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenCreate} 
                    disabled={!selectedAccount}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <FiPlus size={20} /> Tạo thẻ mới
                </button>
            </div>

            {/* Main Content */}
            {!selectedAccount ? (
                <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                    Vui lòng chọn tài khoản Zalo để xem danh sách thẻ.
                </div>
            ) : (
                <>
                    {renderTable()}
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} basePath="/dashboard/tags" />
                </>
            )}
        </div>
    );
}
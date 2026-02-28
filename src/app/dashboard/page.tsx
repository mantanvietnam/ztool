'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { 
    FiUsers, 
    FiUserCheck, 
    FiLayers, 
    FiUserPlus, 
    FiSend,
    FiPhone,
    FiMail,
    FiFacebook,
    FiBell,
    FiChevronRight,
    FiLoader 
} from 'react-icons/fi';

// --- Types & Interfaces ---
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number | React.ReactNode;
    href: string;
    colorClass?: string;
}

// --- Mock Data: Tin tức ---
const NEWS_DATA = [
    { id: 1, title: "Cập nhật Ztool v2.5: Tối ưu hóa tốc độ gửi tin nhắn hàng loạt", date: "27/11/2025", type: "Update" },
    { id: 2, title: "Thông báo bảo trì máy chủ định kỳ (00:00 - 02:00 ngày 01/12)", date: "26/11/2025", type: "System" },
    { id: 3, title: "Hướng dẫn sử dụng tính năng mới: Lọc bạn bè không tương tác", date: "25/11/2025", type: "Guide" },
    { id: 4, title: "Chính sách mới về giới hạn kết bạn của Zalo năm 2025", date: "24/11/2025", type: "Policy" },
    { id: 5, title: "Khắc phục sự cố không hiển thị danh sách nhóm trên một số tài khoản", date: "23/11/2025", type: "Fix" },
    { id: 6, title: "Ra mắt gói Vip Pro cho doanh nghiệp Bất động sản", date: "22/11/2025", type: "Promo" },
];

// --- Components ---
const StatCard = ({ icon, title, value, href, colorClass = "text-blue-400" }: StatCardProps) => (
    <Link href={href} className="block group">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg transition-all duration-300 transform group-hover:-translate-y-1 group-hover:bg-gray-750 group-hover:shadow-xl border border-transparent group-hover:border-blue-500/30 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                    <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        {value}
                    </div>
                </div>
                <div className={`p-3 bg-gray-700/50 rounded-lg ${colorClass} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-500">
                <span className="group-hover:text-gray-300 transition-colors">Xem chi tiết &rarr;</span>
            </div>
        </div>
    </Link>
);

const SupportItem = ({ icon, label, value, href, actionLabel }: { icon: React.ReactNode, label: string, value: string, href: string, actionLabel: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/60 transition-colors border border-gray-700 hover:border-blue-500/50 group">
        <div className="p-3 bg-gray-800 rounded-full text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
            <p className="text-white font-medium">{value}</p>
            <span className="text-xs text-blue-400 group-hover:underline mt-1 block">{actionLabel}</span>
        </div>
    </a>
);

export default function DashboardHomePage() {
    const { selectedAccount } = useZaloAccounts();
    
    // State lưu dữ liệu thống kê
    const [friendCount, setFriendCount] = useState<number | null>(null);
    const [waitingCount, setWaitingCount] = useState<number | null>(null);
    const [groupCount, setGroupCount] = useState<number | null>(null);
    
    // State mới: Lưu thống kê tiến trình chạy (Kết bạn & Gửi tin)
    const [processStats, setProcessStats] = useState({
        addFriend: { done: 0, total: 0 },
        sendMessage: { done: 0, total: 0 }
    });

    // State loading
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [isLoadingWaiting, setIsLoadingWaiting] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingProcess, setIsLoadingProcess] = useState(false);

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    // --- GỘP EFFECT 1, 2, 3: ĐỌC CACHE & GỌI API NGẦM (SMART CACHE & SAFE LIMIT) ---
    useEffect(() => {
        let isActive = true; // ✨ CỜ ĐIỀU KHIỂN CHỐNG MEMORY LEAK

        const fetchDashboardZaloData = async () => {
            if (!selectedAccount) { 
                if (isActive) { setFriendCount(0); setWaitingCount(0); setGroupCount(0); }
                return; 
            }

            const myId = selectedAccount.profile.userId;
            const { cookie, imei, userAgent } = selectedAccount;
            const payload = { cookie, imei, userAgent, proxy: savedProxy };

            // 1. ĐỌC CACHE VÀ HIỂN THỊ GIAO DIỆN NGAY LẬP TỨC
            let cachedFriendsCount = 0;
            let cachedGroupsCount = 0;

            // Đọc Cache Bạn bè
            const cachedFriendsStr = localStorage.getItem(`ztool_friends_${myId}`);
            if (cachedFriendsStr) {
                const cachedFriends = JSON.parse(cachedFriendsStr);
                cachedFriendsCount = cachedFriends.length;
                if (isActive) {
                    setFriendCount(cachedFriendsCount);
                    setIsLoadingFriends(false); // Có cache thì tắt loading luôn
                }
            } else {
                if (isActive) setIsLoadingFriends(true);
            }

            if (isActive) setIsLoadingWaiting(true); // Chờ đồng ý chưa làm cache

            // Đọc Cache Nhóm
            const cachedGroupsStr = localStorage.getItem(`ztool_groups_${myId}`);
            if (cachedGroupsStr) {
                const cachedGroups = JSON.parse(cachedGroupsStr);
                cachedGroupsCount = cachedGroups.length;
                if (isActive) {
                    setGroupCount(cachedGroupsCount);
                    setIsLoadingGroups(false); // Có cache thì tắt loading luôn
                }
            } else {
                if (isActive) setIsLoadingGroups(true);
            }

            // 2. GỌI API NGẦM ĐỂ CẬP NHẬT SỐ LIỆU MỚI NHẤT
            try {
                const [friendsData, requestsData, groupsData] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friends`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    }).then(res => res.json()).catch(() => ({ success: false })),
                    
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-sent-friend-requests`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    }).then(res => res.json()).catch(() => ({ success: false })),
                    
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    }).then(res => res.json()).catch(() => ({ success: false }))
                ]);

                if (!isActive) return; // Thoát nếu người dùng đã chuyển trang

                // Xử lý Bạn bè + 🛡️ KHIÊN BẢO VỆ SILENT LIMIT
                if (friendsData.success && Array.isArray(friendsData.friends)) {
                    const newFriendsCount = friendsData.friends.length;
                    if (newFriendsCount === 0 && cachedFriendsCount > 10) {
                        console.warn("🛡️ Dashboard: Zalo trả về 0 bạn bè. Giữ nguyên cache.");
                    } else {
                        setFriendCount(newFriendsCount);
                        localStorage.setItem(`ztool_friends_${myId}`, JSON.stringify(friendsData.friends));
                    }
                }
                
                // Xử lý Chờ đồng ý
                if (requestsData.success && requestsData.requests && typeof requestsData.requests === 'object') {
                    setWaitingCount(Object.keys(requestsData.requests).length);
                }
                
                // Xử lý Nhóm + 🛡️ KHIÊN BẢO VỆ SILENT LIMIT
                if (groupsData.success && Array.isArray(groupsData.groups)) {
                    const newGroupsCount = groupsData.groups.length;
                    if (newGroupsCount === 0 && cachedGroupsCount > 5) {
                        console.warn("🛡️ Dashboard: Zalo trả về 0 nhóm. Hiển thị số lượng từ cache.");
                    } else {
                        setGroupCount(newGroupsCount);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu Dashboard:", error);
            } finally {
                if (isActive) {
                    setIsLoadingFriends(false);
                    setIsLoadingWaiting(false);
                    setIsLoadingGroups(false);
                }
            }
        };

        fetchDashboardZaloData();

        return () => { isActive = false; };
    }, [selectedAccount]);

    // --- Effect 4: Gọi API lấy thống kê tiến trình từ BE PHP ---
    useEffect(() => {
        let isActive = true; // ✨ CỜ ĐIỀU KHIỂN CHỐNG MEMORY LEAK

        const fetchProcessStats = async () => {
            if (!selectedAccount) {
                if (isActive) setProcessStats({ addFriend: { done: 0, total: 0 }, sendMessage: { done: 0, total: 0 } });
                return;
            }
            if (isActive) setIsLoadingProcess(true);
            try {
                const formData = new FormData();
                formData.append('userId', selectedAccount.profile.userId);
                const token = localStorage.getItem('authToken');
                if (token) formData.append('token', token);

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/staticDashboardAPI`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.code === 0 && isActive) {
                    setProcessStats({
                        addFriend: { 
                            done: data.requestAddFriendDone || 0, 
                            total: data.requestAddFriendTotal || 0 
                        },
                        sendMessage: { 
                            done: data.requestSendMessageDone || 0, 
                            total: data.requestSendMessageTotal || 0 
                        }
                    });
                }
            } catch (error) {
                console.error("Lỗi staticDashboardAPI:", error);
            } finally {
                if (isActive) setIsLoadingProcess(false);
            }
        };

        fetchProcessStats();

        return () => { isActive = false; };
    }, [selectedAccount]);

    return (
        <div className="flex-1 p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tổng Quan Ztool</h1>
                </div>
                <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                    Phiên bản: 2.5.0
                </span>
            </div>

            {/* Phần 1: Các thẻ thống kê (Stats Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Tổng số bạn bè */}
                <StatCard 
                    icon={<FiUsers size={24} />} 
                    title="Tổng số bạn bè" 
                    value={isLoadingFriends ? <FiLoader className="animate-spin" /> : friendCount?.toLocaleString() ?? "0"} 
                    href="/dashboard/listFriendZalo" 
                    colorClass="text-green-400" 
                />
                
                {/* 2. Chờ đồng ý kết bạn */}
                <StatCard 
                    icon={<FiUserCheck size={24} />} 
                    title="Chờ đồng ý kết bạn" 
                    value={isLoadingWaiting ? <FiLoader className="animate-spin" /> : waitingCount?.toLocaleString() ?? "0"} 
                    href="/dashboard/listWaitingFriendApproval" 
                    colorClass="text-yellow-400" 
                />

                {/* 3. Nhóm đã tham gia */}
                <StatCard 
                    icon={<FiLayers size={24} />} 
                    title="Nhóm đã tham gia" 
                    value={isLoadingGroups ? <FiLoader className="animate-spin" /> : groupCount?.toLocaleString() ?? "0"} 
                    href="/dashboard/listGroupZalo" 
                    colorClass="text-purple-400" 
                />

                {/* 4. Kết bạn đang chạy (Dữ liệu từ staticDashboardAPI) */}
                <StatCard 
                    icon={<FiUserPlus size={24} />} 
                    title="Kết bạn đang chạy" 
                    value={isLoadingProcess ? <FiLoader className="animate-spin" /> : `${processStats.addFriend.done}/${processStats.addFriend.total}`} 
                    href="/dashboard/listRequestAddFriend" 
                    colorClass="text-blue-400" 
                />

                {/* 5. Gửi tin đang chạy (Dữ liệu từ staticDashboardAPI) */}
                <StatCard 
                    icon={<FiSend size={24} />} 
                    title="Gửi tin đang chạy" 
                    value={isLoadingProcess ? <FiLoader className="animate-spin" /> : `${processStats.sendMessage.done}/${processStats.sendMessage.total}`} 
                    href="/dashboard/listSendMessageStranger" 
                    colorClass="text-pink-400" 
                />
            </div>

            {/* Phần 2: Trung tâm hỗ trợ */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Trung tâm hỗ trợ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SupportItem 
                        icon={<FiPhone size={20} />} 
                        label="Hotline 24/7" 
                        value="081.656.0000" 
                        href="tel:0816560000"
                        actionLabel="Gọi ngay"
                    />
                    <SupportItem 
                        icon={<FiMail size={20} />} 
                        label="Email hỗ trợ" 
                        value="ztool.ai.vn@gmail.com" 
                        href="mailto:ztool.ai.vn@gmail.com"
                        actionLabel="Gửi email"
                    />
                    <SupportItem 
                        icon={<FiFacebook size={20} />} 
                        label="Facebook Admin" 
                        value="Ztool" 
                        href="https://www.facebook.com/ztoolvn"
                        actionLabel="Nhắn tin"
                    />
                </div>
            </div>

            {/* Phần 3: Tin tức - Thông báo */}

            {/*
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <FiBell className="text-yellow-500" />
                        <h2 className="text-lg font-bold text-white">Tin tức & Thông báo</h2>
                    </div>
                    <Link href="/dashboard/news" className="text-sm text-blue-400 hover:text-blue-300">Xem tất cả</Link>
                </div>
                <div className="divide-y divide-gray-700/50">
                    {NEWS_DATA.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-700/30 transition-colors cursor-pointer group flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'Update' ? 'bg-green-500' : item.type === 'System' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                <div>
                                    <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{item.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{item.date} • {item.type}</p>
                                </div>
                            </div>
                            <FiChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
            */}
        </div>      
    );
}
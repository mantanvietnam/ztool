'use client';

import React from 'react';
import { ZaloAccountProvider } from '@/contexts/ZaloAccountContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// 1. IMPORT SETTINGSPROVIDER
import { SettingsProvider } from '@/contexts/SettingsContext';
import Header from '@/components/layout/Header';
import ZaloSessionGuard from '@/components/ZaloSessionGuard';
import Link from 'next/link';
import { FiUserPlus, FiMessageSquare, FiUsers, FiMapPin, FiSettings, FiLogOut, FiSend, FiLoader, FiUserCheck } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';

// Component AuthGuard (không thay đổi)
function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <FiLoader className="animate-spin mx-auto text-blue-500" size={48} />
                    <p className="mt-4">Đang xác thực tài khoản...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return null;
}

// Component SidebarLink (không thay đổi)
const SidebarLink = ({ icon, text, href, active }: { icon: React.ReactNode, text: string, href: string, active?: boolean }) => (
    <Link href={href} className={`flex items-center p-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
        {icon}
        <span className="ml-4 font-medium">{text}</span>
    </Link>
);

// Component DashboardContent (không thay đổi)
function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <ZaloSessionGuard />
            <aside className="hidden md:flex flex-col w-64 bg-gray-800 p-4 space-y-4">
                <div className="text-2xl font-bold text-white text-center py-4">ZTOOL</div>
                <nav className="flex-grow space-y-2">
                    <SidebarLink icon={<FiUserPlus size={20} />} text="Kết bạn tự động" href="/dashboard/listRequestAddFriend" active={pathname === '/dashboard/listRequestAddFriend'} />
                    <SidebarLink icon={<FiSend size={20} />} text="Yêu cầu kết bạn" href="/dashboard/listWaitingFriendApproval" active={pathname === '/dashboard/listWaitingFriendApproval'} />
                    <SidebarLink icon={<FiMessageSquare size={20} />} text="Nhắn tin người lạ" href="/dashboard/listSendMessageStranger" active={pathname === '/dashboard/listSendMessageStranger'} />
                    <SidebarLink icon={<FiUsers size={20} />} text="Nhắn tin bạn bè" href="/dashboard/listFriendZalo" active={pathname === '/dashboard/listFriendZalo'} />
                    <SidebarLink icon={<FiUserCheck size={20} />} text="Tương tác nhóm" href="/dashboard/listGroupZalo" active={pathname === '/dashboard/listGroupZalo'} />
                    <SidebarLink icon={<FiMapPin size={20} />} text="Tìm kiếm bản đồ" href="/dashboard/searchOnMap" active={pathname === '/dashboard/searchOnMap'} />
                </nav>
                <div>
                    <SidebarLink icon={<FiSettings size={20} />} text="Cài Đặt" href="/dashboard/settings" active={pathname === '/dashboard/settings'}/>
                    <button onClick={logout} className="flex items-center w-full p-3 rounded-lg transition-colors text-gray-400 hover:bg-gray-700 hover:text-white">
                        <FiLogOut size={20} />
                        <span className="ml-4 font-medium">Đăng Xuất</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Cấu trúc layout đã được cập nhật
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ZaloAccountProvider>
                {/* 2. BỌC SETTINGSPROVIDER Ở ĐÂY */}
                <SettingsProvider>
                    <AuthGuard>
                        <DashboardContent>{children}</DashboardContent>
                    </AuthGuard>
                </SettingsProvider>
            </ZaloAccountProvider>
        </AuthProvider>
    );
}
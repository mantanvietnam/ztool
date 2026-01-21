'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZaloAccountProvider } from '@/contexts/ZaloAccountContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import Header from '@/components/layout/Header';
import ZaloSessionGuard from '@/components/ZaloSessionGuard';
import Link from 'next/link';
import {
    FiUserPlus, FiMessageSquare, FiUsers, FiMapPin, FiSettings,
    FiLogOut, FiSend, FiLoader, FiUserCheck, FiChevronRight, FiCode, FiTag,
    FiMenu, FiX, FiCreditCard, FiStar
} from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';

// --- GIỮ NGUYÊN LOGIC AUTH ---
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

const SidebarLink = ({ icon, text, href, active, onClick }: { icon: React.ReactNode, text: string, href: string, active?: boolean, onClick?: () => void }) => (
    <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg transition-colors mb-1 ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
    >
        <span className="shrink-0">{icon}</span>
        <span className="ml-4 font-medium truncate">{text}</span>
    </Link>
);

// --- GIỮ NGUYÊN MENU FLYOUT (FIXED) ---
function SidebarDropdown({
    icon, text, items, isFooter = false, onMobileClick
}: {
    icon?: React.ReactNode,
    text: string,
    items: { label: string, href: string }[],
    isFooter?: boolean,
    onMobileClick?: () => void
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const pathname = usePathname();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleGlobalClick(event: MouseEvent) {
            if (
                buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        function handleScroll() {
            if (open) setOpen(false);
        }
        document.addEventListener("mousedown", handleGlobalClick);
        window.addEventListener("scroll", handleScroll, true);
        return () => {
            document.removeEventListener("mousedown", handleGlobalClick);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [open]);

    const handleToggle = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.top, left: rect.right });
        }
        setOpen(!open);
    };

    const isActiveParent = items.some(i => i.href === pathname);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`flex items-center justify-between w-full p-3 text-left rounded-lg transition-colors mb-1 ${isActiveParent ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700'}`}
            >
                <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="shrink-0">{icon}</span>
                    <span className="font-medium truncate">{text}</span>
                </div>
                <FiChevronRight size={16} className={`transition-transform duration-200 ${open ? 'rotate-90 md:rotate-0' : ''}`} />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        left: `${coords.left + 8}px`,
                        top: isFooter ? 'auto' : `${coords.top}px`,
                        bottom: isFooter ? '16px' : 'auto', 
                        zIndex: 9999
                    }}
                    className="w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className={`absolute w-3 h-3 bg-gray-800 border-l border-b border-gray-700 transform rotate-45 -left-1.5 ${isFooter ? 'bottom-6' : 'top-4'}`}></div>

                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    setOpen(false);
                                    if (onMobileClick) onMobileClick();
                                }}
                                className={`px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}

// --- DASHBOARD CONTENT ---
function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth(); // Thêm user để lấy điểm
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden relative">
            <ZaloSessionGuard />
            
            {/* Overlay Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                ></div>
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 h-full border-r border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo & Close Button */}
                <div className="p-4 shrink-0 flex items-center justify-between">
                    <Link href="/dashboard" onClick={closeMobileMenu} className="block text-2xl font-bold text-white tracking-wider">
                        ZTOOL
                    </Link>
                    <button onClick={closeMobileMenu} className="md:hidden text-gray-400 hover:text-white p-1">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Menu List */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                    
                    {/* --- PHẦN SỬA ĐỔI: Chỉ hiện Nạp Điểm trên Mobile (md:hidden) --- */}
                    {/* Trên Desktop sẽ ẩn đi để không làm thay đổi menu cũ của bạn */}
                    <div className="md:hidden">
                        <SidebarLink 
                            icon={<FiCreditCard size={20} />} 
                            text="Nạp điểm" 
                            href="/dashboard/billing" 
                            active={pathname === '/dashboard/billing'} 
                            onClick={closeMobileMenu} 
                        />
                        <div className="my-2 border-t border-gray-700/50"></div>
                    </div>
                    {/* ----------------------------------------------------------- */}

                    {/* MENU CŨ GIỮ NGUYÊN */}
                    <SidebarLink icon={<FiUserPlus size={20} />} text="Kết bạn tự động" href="/dashboard/listRequestAddFriend" active={pathname === '/dashboard/listRequestAddFriend'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiSend size={20} />} text="Yêu cầu kết bạn" href="/dashboard/listWaitingFriendApproval" active={pathname === '/dashboard/listWaitingFriendApproval'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiMessageSquare size={20} />} text="Nhắn tin người lạ" href="/dashboard/listSendMessageStranger" active={pathname === '/dashboard/listSendMessageStranger'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiUsers size={20} />} text="Nhắn tin bạn bè" href="/dashboard/listFriendZalo" active={pathname === '/dashboard/listFriendZalo'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiUserCheck size={20} />} text="Nhóm - Cộng đồng" href="/dashboard/listGroupZalo" active={pathname === '/dashboard/listGroupZalo'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiTag size={20} />} text="Thẻ phân loại" href="/dashboard/tags" active={pathname === '/dashboard/tags'} onClick={closeMobileMenu} />
                    <SidebarLink icon={<FiMapPin size={20} />} text="Tìm kiếm bản đồ" href="/dashboard/searchOnMap" active={pathname === '/dashboard/searchOnMap'} onClick={closeMobileMenu} />

                    <div className="mt-2"> 
                        <SidebarDropdown
                            icon={<FiCode size={20} />}
                            text="Tích hợp API"
                            onMobileClick={closeMobileMenu}
                            items={[
                                { label: "API kết bạn", href: "/dashboard/api/add-friend" },
                                { label: "API gửi tin nhắn", href: "/dashboard/api/send-message" },
                                { label: "API thêm vào nhóm", href: "/dashboard/api/add-group" },
                            ]}
                        />
                    </div>
                </nav>
                
                {/* Footer Sidebar */}
                <div className="p-3 bg-gray-800 border-t border-gray-700 shrink-0">
                    <SidebarDropdown
                        icon={<FiSettings size={20} />}
                        text="Cài Đặt"
                        isFooter={true}
                        onMobileClick={closeMobileMenu}
                        items={[
                            { label: "Thông tin tài khoản", href: "/dashboard/settings" },
                            { label: "Mã giới thiệu", href: "/dashboard/referral" },
                            { label: "Đổi mật khẩu", href: "/dashboard/settings/password" },
                        ]}
                    />
                    <button
                        onClick={logout}
                        className="flex items-center w-full p-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-1"
                    >
                        <FiLogOut size={20} />
                        <span className="ml-4 font-medium">Đăng Xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* HEADER MOBILE: 3 GẠCH (Chỉ hiện trên Mobile) */}
                <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shrink-0">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 mr-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700"
                        >
                            <FiMenu size={24} />
                        </button>
                        <span className="font-bold text-lg text-white">ZTOOL</span>
                    </div>

                    {/* --- MỚI: HIỂN THỊ ĐIỂM SỐ TRÊN MOBILE (Vùng khoanh đỏ) --- */}
                    {user && (
                        <div className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-600/50">
                            <FiStar className="text-yellow-400 text-sm" />
                            <span className="text-white font-bold text-sm">
                                {user.point.toLocaleString()}
                            </span>
                        </div>
                    )}
                    {/* -------------------------------------------------------- */}
                </div>

                {/* HEADER DESKTOP (Vẫn render nhưng component Header.tsx sẽ tự ẩn nút nạp trên mobile) */}
                <div className="hidden md:block">
                     <Header /> 
                </div>
                
                {/* Nội dung trang */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 md:p-6">
                    {/* Header hiện trong vùng cuộn ở Mobile */}
                    <div className="md:hidden mb-4">
                        <Header /> 
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ZaloAccountProvider>
                <SettingsProvider>
                    <AuthGuard>
                        <DashboardContent>{children}</DashboardContent>
                    </AuthGuard>
                </SettingsProvider>
            </ZaloAccountProvider>
        </AuthProvider>
    );
}
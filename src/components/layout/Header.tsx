'use client';

import { useAuth } from '@/contexts/AuthContext';
import AccountSwitcher from '@/components/AccountSwitcher';
import Link from 'next/link';
import { FiPlusCircle, FiStar } from 'react-icons/fi';

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700 min-h-[70px]">
            {/* AccountSwitcher: Tự động co giãn */}
            <AccountSwitcher />

            <div className="flex items-center gap-3 md:gap-4 pl-2">
                {/* PHẦN ĐIỂM SỐ: Luôn hiển thị (Không có class hidden) */}
                {user && (
                    <div className="flex items-center gap-1.5 md:gap-2 bg-gray-700 px-2 md:px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <FiStar className="text-yellow-400 shrink-0" />
                        <span className="text-white font-bold text-sm md:text-base">
                            {user.point.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-xs md:text-sm">điểm</span>
                    </div>
                )}
                
                {/* NÚT NẠP ĐIỂM: Thêm 'hidden md:flex' để CHỈ ẨN TRÊN MOBILE */}
                <Link 
                    href="/dashboard/billing" 
                    className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
                >
                    <FiPlusCircle />
                    <span>Nạp điểm</span>
                </Link>
            </div>
        </header>
    );
}
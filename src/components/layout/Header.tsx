'use client';

import { useAuth } from '@/contexts/AuthContext';
import AccountSwitcher from '@/components/AccountSwitcher';
import Link from 'next/link';
import { FiPlusCircle, FiStar } from 'react-icons/fi';

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
            {/* Phần chọn tài khoản Zalo */}
            <AccountSwitcher />

            {/* Phần hiển thị điểm và nút nạp */}
            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
                        <FiStar className="text-yellow-400" />
                        <span className="text-white font-bold">
                            {user.point.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm">điểm</span>
                    </div>
                )}
                <Link href="/dashboard/billing" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors">
                    <FiPlusCircle />
                    <span>Nạp điểm</span>
                </Link>
            </div>
        </header>
    );
}

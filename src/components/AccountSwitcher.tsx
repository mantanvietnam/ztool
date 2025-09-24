'use client';

import { useState, useEffect } from 'react'; // Import thêm useState và useEffect
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import Image from 'next/image';
import Link from 'next/link';
import { FiPlusCircle } from 'react-icons/fi';

export default function AccountSwitcher() {
    const { accounts, selectedAccount, selectAccount } = useZaloAccounts();
    const [hasMounted, setHasMounted] = useState(false); // ✨ 1. Thêm state để kiểm tra component đã mount chưa

    // ✨ 2. Dùng useEffect để set state là đã mount sau lần render đầu tiên
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // ✨ 3. Nếu chưa mount, render ra một placeholder để tránh lỗi hydration
    if (!hasMounted) {
        // Render một khung chờ có kích thước tương tự để giao diện không bị "nhảy"
        return (
            <div className="flex items-center gap-2 h-[40px] w-[200px]">
                <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="h-6 w-32 rounded-md bg-gray-700 animate-pulse"></div>
            </div>
        );
    }
    
    // Sau khi đã mount, component sẽ render giao diện thật dựa trên localStorage
    if (accounts.length === 0) {
        return (
            <Link href="/dashboard/loginZalo" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                <FiPlusCircle />
                Thêm tài khoản Zalo
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {selectedAccount && (
                <Image 
                    src={selectedAccount.profile.avatar} 
                    alt={selectedAccount.profile.displayName}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-gray-600"
                />
            )}
            <select
                value={selectedAccount?.profile.userId || ''}
                onChange={(e) => selectAccount(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {accounts.map(acc => (
                    <option key={acc.profile.userId} value={acc.profile.userId}>
                        {acc.profile.displayName}
                    </option>
                ))}
            </select>
             <Link href="/dashboard/loginZalo" title="Thêm tài khoản mới">
                <FiPlusCircle className="text-gray-400 hover:text-white cursor-pointer" size={20}/>
            </Link>
        </div>
    );
}
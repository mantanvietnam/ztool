'use client';

import { useState, useEffect } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import Image from 'next/image';
import Link from 'next/link';
import { FiPlusCircle, FiTrash2, FiLoader } from 'react-icons/fi'; // ✨ Import thêm icon
import axios from 'axios'; // ✨ Import axios để gọi API xóa

export default function AccountSwitcher() {
    const { accounts, selectedAccount, selectAccount } = useZaloAccounts();
    const [hasMounted, setHasMounted] = useState(false);
    
    // ✨ State cho trạng thái đang xóa
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // ✨ Hàm xử lý xóa tài khoản (Đã cập nhật logic làm sạch localStorage)
    const handleDeleteAccount = async () => {
        if (!selectedAccount) return;

        const confirmDelete = window.confirm(`Bạn có chắc muốn xóa tài khoản "${selectedAccount.profile.displayName}" khỏi hệ thống?`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                // 1. Gọi API báo server xóa
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/deleteInfoZaloAPI`, {
                    token: token,
                    userId: selectedAccount.profile.userId
                });
                
                // 2. ✨ CẬP NHẬT LOCALSTORAGE NGAY LẬP TỨC
                // Lấy danh sách hiện tại từ LocalStorage
                const currentAccountsStr = localStorage.getItem('zaloAccounts');
                if (currentAccountsStr) {
                    const currentAccounts = JSON.parse(currentAccountsStr);
                    // Lọc bỏ tài khoản vừa xóa
                    const newAccounts = currentAccounts.filter((acc: any) => acc.profile.userId !== selectedAccount.profile.userId);
                    // Lưu lại danh sách mới
                    localStorage.setItem('zaloAccounts', JSON.stringify(newAccounts));
                }

                // 3. Xóa luôn ID đang chọn trong localStorage nếu trùng
                const currentSelectedId = localStorage.getItem('selectedZaloAccountId');
                if (currentSelectedId === selectedAccount.profile.userId) {
                    localStorage.removeItem('selectedZaloAccountId');
                }

                alert("Đã xóa tài khoản thành công!");
                
                // 4. Reload để Context nhận diện dữ liệu mới từ LocalStorage
                window.location.reload();
            }
        } catch (error) {
            console.error("Lỗi khi xóa tài khoản:", error);
            alert("Có lỗi xảy ra khi xóa tài khoản.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!hasMounted) {
        return (
            <div className="flex items-center gap-2 h-[40px] w-[200px]">
                <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="h-6 w-32 rounded-md bg-gray-700 animate-pulse"></div>
            </div>
        );
    }
    
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
            {/* ✨ Nút Xóa Tài khoản */}
            <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || !selectedAccount}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-md transition-colors"
                title="Xóa tài khoản này"
            >
                {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 size={18} />}
            </button>

            {selectedAccount && (
                <Image 
                    src={selectedAccount.profile.avatar} 
                    alt={selectedAccount.profile.displayName}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-gray-600"
                    onError={(e) => (e.currentTarget.srcset = '/avatar-default.png')} // Fallback ảnh lỗi
                />
            )}
            
            <select
                value={selectedAccount?.profile.userId || ''}
                onChange={(e) => selectAccount(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px] sm:max-w-[200px]"
            >
                {accounts.map(acc => (
                    <option key={acc.profile.userId} value={acc.profile.userId}>
                        {acc.profile.displayName}
                    </option>
                ))}
            </select>

            {/* ✨ Nút Thêm Mới */}
             <Link href="/dashboard/loginZalo" title="Thêm tài khoản mới" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
                <FiPlusCircle size={20}/>
            </Link>
        </div>
    );
}
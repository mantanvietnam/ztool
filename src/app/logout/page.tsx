'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        // Xóa token đăng nhập chính của ứng dụng
        localStorage.removeItem('authToken');
        
        // Xóa danh sách tài khoản Zalo đã lưu
        localStorage.removeItem('zaloAccounts');

        // Chuyển hướng người dùng về trang đăng nhập
        router.replace('/login');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <FiLoader size={48} className="animate-spin mb-4" />
            <p>Đang đăng xuất, vui lòng chờ...</p>
        </div>
    );
}
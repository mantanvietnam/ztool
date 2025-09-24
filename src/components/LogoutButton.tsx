'use client'; 

import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        // Xóa token đăng nhập chính của ứng dụng
        localStorage.removeItem('authToken');
        
        // ✨ Xóa danh sách tài khoản Zalo đã lưu
        localStorage.removeItem('zaloAccounts');

        // Chuyển hướng người dùng về trang đăng nhập
        router.replace('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg transition-colors text-gray-400 hover:bg-gray-700 hover:text-white"
        >
            <FiLogOut size={20} />
            <span className="ml-4 font-medium">Đăng Xuất</span>
        </button>
    );
}
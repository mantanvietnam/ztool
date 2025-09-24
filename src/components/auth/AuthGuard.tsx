'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiLoader } from 'react-icons/fi';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Nếu không đang tải và người dùng chưa được xác thực
        if (!isLoading && !isAuthenticated) {
            console.log("AuthGuard: Người dùng chưa xác thực, chuyển đến trang đăng nhập.");
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Trong khi đang tải, hiển thị màn hình loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <FiLoader className="animate-spin mx-auto text-blue-500" size={48} />
                    <p className="mt-4">Đang tải dữ liệu người dùng...</p>
                </div>
            </div>
        );
    }

    // Nếu đã xác thực, hiển thị nội dung trang
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Trả về null trong các trường hợp khác để tránh render nội dung không mong muốn
    return null;
}

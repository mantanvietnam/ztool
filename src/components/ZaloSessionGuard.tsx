'use client';

import { useEffect } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import axios from 'axios';
import { usePathname } from 'next/navigation';

// Component này chỉ chạy logic ngầm, không render ra giao diện
export default function ZaloSessionGuard() {
    const { selectedAccount, removeAccount, isLoading } = useZaloAccounts();
    const pathname = usePathname();

    useEffect(() => {
        // Bỏ qua kiểm tra ở trang loginZalo, khi đang tải, hoặc khi chưa có tài khoản
        if (isLoading || !selectedAccount || pathname === '/dashboard/loginZalo') {
            return;
        }

        const validateSession = async () => {
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/check-session`, {
                    cookie, imei, userAgent
                });

                if (!response.data.isValid) {
                    const expiredAccountName = selectedAccount.profile.displayName;
                    const expiredAccountId = selectedAccount.profile.userId;

                    removeAccount(expiredAccountId);
                    
                    try {
                        const token = localStorage.getItem('authToken');
                        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/deleteInfoZaloAPI`, {
                            token: token,
                            userId: expiredAccountId
                        });
                    } catch (deleteError) {
                        console.error("Lỗi khi xóa tài khoản Zalo khỏi DB:", deleteError);
                    }
                    
                    alert(`Phiên đăng nhập của tài khoản "${expiredAccountName}" đã hết hạn và được tự động xóa.`);
                }
            } catch (err) {
                console.error("Lỗi kết nối khi kiểm tra tài khoản Zalo.", err);
            }
        };

        validateSession();
    }, [selectedAccount, isLoading, pathname, removeAccount]);

    // Component này không render ra bất kỳ HTML nào
    return null;
}
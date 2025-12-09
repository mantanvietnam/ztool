'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

// Giữ nguyên interface cũ, chỉ thêm field proxy (tùy chọn) để code không báo lỗi
interface User {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    point: number;
    proxy?: any; // ✨ Thêm dòng này
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    updateUserPoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('zaloAccounts');
        localStorage.removeItem('selectedZaloAccountId');
        localStorage.removeItem('userProxy'); // ✨ Bổ sung: Xóa proxy khi logout
        setUser(null);
        router.push('/login');
    }, [router]);

    const updateUserPoints = useCallback((newPoints: number) => {
        setUser(currentUser => {
            if (currentUser) {
                // console.log(`Cập nhật điểm từ ${currentUser.point} -> ${newPoints}`);
                return { ...currentUser, point: newPoints };
            }
            return null;
        });
    }, []);

    useEffect(() => {
        let isMounted = true;
        const verifyAuthAndFetchUser = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                if (isMounted) setIsLoading(false);
                return;
            }
            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/apis/getInfoMemberAPI`,
                    { token }
                );
                if (!isMounted) return;
                const data = response.data;

                if (data.code === 0) {
                    setUser(data.data);

                    // ======================================================
                    // ✨ PHẦN BỔ SUNG DUY NHẤT: CẬP NHẬT PROXY
                    // ======================================================
                    // Kiểm tra xem dữ liệu user trả về có chứa thông tin proxy không
                    const userData = data.data; 
                    if (userData && userData.proxy) {
                        const proxyRaw = userData.proxy;
                        // Chuyển đổi sang định dạng server cần (host, port, user, pass)
                        const formattedProxy = {
                            id: proxyRaw.id,
                            host: proxyRaw.ip,
                            port: proxyRaw.port,
                            user: proxyRaw.username,
                            pass: proxyRaw.password,
                            protocol: proxyRaw.protocol
                        };
                        localStorage.setItem('userProxy', JSON.stringify(formattedProxy));
                    } else {
                        // Nếu user không có proxy, xóa dữ liệu cũ trong localStorage đi
                        localStorage.removeItem('userProxy');
                    }
                    // ======================================================

                } else {
                    logout();
                }
            } catch (error) {
                console.error("Lỗi khi xác thực hoặc lấy thông tin người dùng:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        verifyAuthAndFetchUser();
        return () => { isMounted = false; };
    }, [pathname, logout]);

    const value = { user, isAuthenticated: !!user, isLoading, logout, updateUserPoints };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được dùng trong AuthProvider');
    }
    return context;
}
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho thông tin người dùng (đã có sẵn)
interface User {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    point: number;
}

// CẬP NHẬT: Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    // THÊM MỚI: Khai báo hàm cập nhật điểm
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
        setUser(null);
        router.push('/login');
    }, [router]);

    // THÊM MỚI: Hàm để cập nhật điểm từ các component con
    const updateUserPoints = useCallback((newPoints: number) => {
        setUser(currentUser => {
            if (currentUser) {
                console.log(`Cập nhật điểm từ ${currentUser.point} -> ${newPoints}`);
                // Trả về một object user mới với số điểm đã được cập nhật
                return { ...currentUser, point: newPoints };
            }
            return null; // Trả về null nếu không có user hiện tại
        });
    }, []); // useCallback với mảng rỗng để hàm không bị tạo lại mỗi lần render


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


    // CẬP NHẬT: Thêm `updateUserPoints` vào giá trị của context
    const value = { user, isAuthenticated: !!user, isLoading, logout, updateUserPoints };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook để sử dụng AuthContext (không thay đổi)
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được dùng trong AuthProvider');
    }
    return context;
}
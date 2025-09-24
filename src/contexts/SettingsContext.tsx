// file: contexts/SettingsContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Định nghĩa cấu trúc dữ liệu cho chi phí điểm
interface PointCosts {
    send_mess_stranger: number;
    send_mess_friend: number;
    add_friend: number;
    add_member_group: number;
    delete_friend: number;
    [key: string]: number; // Cho phép các key khác trong tương lai
}

// Định nghĩa cấu trúc của Context
interface SettingsContextType {
    pointCosts: PointCosts | null;
    isLoading: boolean;
}

// Tạo Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Tạo Provider - "Nhà cung cấp" dữ liệu
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [pointCosts, setPointCosts] = useState<PointCosts | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Hàm này sẽ chỉ chạy MỘT LẦN khi ứng dụng được tải
        const fetchSettings = async () => {
            console.log("Fetching global settings (point costs)...");
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apis/getPointActionAPI`);
                setPointCosts(response.data);
                console.log("Global settings loaded:", response.data);
            } catch (error) {
                console.error("Failed to load global settings:", error);
                // Bạn có thể xử lý lỗi ở đây, ví dụ set giá trị mặc định
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần duy nhất

    return (
        <SettingsContext.Provider value={{ pointCosts, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

// Tạo custom hook - "Người tiêu dùng" dữ liệu
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
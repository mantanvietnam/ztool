'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho một tài khoản
interface ZaloProfile {
    userId: string;
    displayName: string;
    avatar: string;
    [key: string]: any;
}

interface ZaloAccount {
    profile: ZaloProfile;
    imei: string;
    cookie: any;
    userAgent: string;
}

// Định nghĩa kiểu dữ liệu cho Context
interface ZaloContextType {
    accounts: ZaloAccount[];
    selectedAccount: ZaloAccount | null;
    isLoading: boolean;
    addAccount: (newAccount: ZaloAccount) => void;
    selectAccount: (accountId: string) => void;
    removeAccount: (accountId: string) => void;
}

const ZaloAccountContext = createContext<ZaloContextType | null>(null);

export function ZaloAccountProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<ZaloAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedAccounts = localStorage.getItem('zaloAccounts');
            const lastSelectedId = localStorage.getItem('selectedZaloAccountId');

            if (storedAccounts) {
                const parsedAccounts = JSON.parse(storedAccounts);
                setAccounts(parsedAccounts);

                if (parsedAccounts.length > 0) {
                    const lastSelectedAccount = lastSelectedId 
                        ? parsedAccounts.find((acc: ZaloAccount) => acc.profile.userId === lastSelectedId) 
                        : null;
                    
                    setSelectedAccount(lastSelectedAccount || parsedAccounts[0]);
                }
            }
        } catch (error) {
            console.error("Lỗi khi đọc tài khoản từ localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addAccount = (newAccount: ZaloAccount) => {
        setAccounts(prevAccounts => {
            const existingAccount = prevAccounts.find(acc => acc.profile.userId === newAccount.profile.userId);
            let updatedAccounts;
            if (existingAccount) {
                updatedAccounts = prevAccounts.map(acc => 
                    acc.profile.userId === newAccount.profile.userId ? newAccount : acc
                );
            } else {
                updatedAccounts = [...prevAccounts, newAccount];
            }
            localStorage.setItem('zaloAccounts', JSON.stringify(updatedAccounts));
            return updatedAccounts;
        });
        setSelectedAccount(newAccount);
        localStorage.setItem('selectedZaloAccountId', newAccount.profile.userId);
    };

    const selectAccount = (accountId: string) => {
        const accountToSelect = accounts.find(acc => acc.profile.userId === accountId);
        if (accountToSelect) {
            setSelectedAccount(accountToSelect);
            localStorage.setItem('selectedZaloAccountId', accountId);
        }
    };

    // ✨ SỬA LỖI: Viết lại hàm removeAccount để tránh lỗi type 'never'
    const removeAccount = (accountId: string) => {
        // Tính toán danh sách tài khoản mới trước
        const updatedAccounts = accounts.filter(acc => acc.profile.userId !== accountId);
        
        // Cập nhật state và localStorage
        setAccounts(updatedAccounts);
        localStorage.setItem('zaloAccounts', JSON.stringify(updatedAccounts));

        // Xử lý logic chọn lại tài khoản sau khi xóa
        if (selectedAccount?.profile.userId === accountId) {
            if (updatedAccounts.length > 0) {
                // Nếu còn tài khoản, chọn tài khoản đầu tiên
                setSelectedAccount(updatedAccounts[0]);
                localStorage.setItem('selectedZaloAccountId', updatedAccounts[0].profile.userId);
            } else {
                // Nếu không còn tài khoản nào
                setSelectedAccount(null);
                localStorage.removeItem('selectedZaloAccountId');
            }
        }
    };

    const value = { accounts, selectedAccount, isLoading, addAccount, selectAccount, removeAccount };

    return <ZaloAccountContext.Provider value={value}>{children}</ZaloAccountContext.Provider>;
}

export function useZaloAccounts() {
    const context = useContext(ZaloAccountContext);
    if (!context) {
        throw new Error('useZaloAccounts phải được dùng trong ZaloAccountProvider');
    }
    return context;
}

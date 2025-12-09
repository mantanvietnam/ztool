'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import axios from 'axios'; 

export default function LoginZaloPage() {
    const { addAccount } = useZaloAccounts();
    const [statusData, setStatusData] = useState<any>({ status: 'INITIALIZING', message: 'Đang khởi tạo phiên...' });
    const [sessionId, setSessionId] = useState<string | null>(null);
    const router = useRouter();
    
    // Sử dụng useRef để giữ cờ kiểm tra component đã mount chưa, tránh gọi 2 lần ở React.StrictModel (nếu có)
    const isMounted = useRef(false);

    // ✨ KHẮC PHỤC: Không đọc localStorage ở đây để tránh tạo object mới mỗi lần render
    // const savedProxyStr = localStorage.getItem('userProxy'); ... (XÓA DÒNG NÀY)

    const startNewSession = useCallback(async () => {
        try {
            setStatusData({ status: 'INITIALIZING', message: 'Đang yêu cầu mã QR mới...' });
            
            // ✨ ĐỌC PROXY Ở TRONG HÀM NÀY
            const savedProxyStr = localStorage.getItem('userProxy');
            const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

            const startRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/start-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ proxy: savedProxy }) 
            });
            
            const startData = await startRes.json(); 

            if (!startData.success) throw new Error(startData.message);
            setSessionId(startData.sessionId);
        } catch (error: any) {
            setStatusData({ status: 'FAILED', message: error.message || 'Không thể bắt đầu phiên đăng nhập.' });
        }
    }, []); // ✨ QUAN TRỌNG: Dependency array để rỗng để hàm này chỉ tạo 1 lần duy nhất

    useEffect(() => {
        // Chỉ gọi khi chưa có session
        if (!sessionId) {
            startNewSession();
        }
    }, [startNewSession, sessionId]); // Thêm sessionId vào để đảm bảo không gọi lại nếu đã có

    useEffect(() => {
        if (!sessionId) return;

        const intervalId = setInterval(async () => {
            try {
                // ✨ ĐỌC PROXY Ở TRONG INTERVAL
                const savedProxyStr = localStorage.getItem('userProxy');
                const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

                const statusRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/zalo-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ proxy: savedProxy, sessionId: sessionId })
                });

                const data = await statusRes.json();
                
                setStatusData(data);

                if (data.status === 'LOGGED_IN' && data.session && data.profile) {
                    if (intervalId) clearInterval(intervalId);

                    setStatusData({ status: 'FAILED', message: 'Đang lưu thông tin tài khoản vào database' });

                    const authToken = localStorage.getItem('authToken');
                    if (!authToken) {
                        throw new Error("Không tìm thấy token xác thực người dùng.");
                    }
                    
                    try {
                        const response = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/apis/saveInfoZaloAPI`,
                            { 
                                token: authToken,
                                profile: data.profile.profile,
                                session: data.session
                            }
                        );

                        if(response.data.code === 0){
                            setStatusData({ status: 'FAILED', message: 'Thêm tài khoản thành công!' });
                            addAccount({ profile: data.profile.profile, ...data.session });
                            setTimeout(() => router.push('/dashboard/listFriendZalo'), 2000);
                        }else{
                            setStatusData({ status: 'FAILED', message: response.data.mess });
                            if(response.data.code === 3){
                                setTimeout(() => router.push('/logout'), 2000);
                            }
                        }
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.message || error.message;
                        throw new Error(errorMessage);
                    }
                }
                
                if (data.status === 'QR_EXPIRED') {
                    clearInterval(intervalId);
                    setTimeout(() => startNewSession(), 1500); 
                }

                if(data.status === 'FAILED') {
                    clearInterval(intervalId);
                }
            } catch (error: any) {
                const errorMessage = error.message; 
                setStatusData({ status: 'FAILED', message: errorMessage });
                clearInterval(intervalId);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [sessionId, addAccount, router, startNewSession]); // ✨ Bỏ savedProxy khỏi dependency

    const renderContent = () => {
        switch (statusData.status) {
            case 'QR_REQUIRED':
                return statusData.qrData ? <Image src={`data:image/png;base64,${statusData.qrData}`} alt="Zalo Login QR Code" width={256} height={256} unoptimized={true} className="rounded-lg" /> : null;
            
            case 'LOGGED_IN':
                return (
                    <div className="text-center text-green-400 flex flex-col items-center gap-4">
                        <FiCheckCircle size={64} />
                        <p className="font-bold text-xl">Thêm tài khoản thành công!</p>
                        <p className="text-white">{statusData.profile?.profile.displayName}</p>
                    </div>
                );
            
            case 'QR_EXPIRED':
                 return (
                    <div className="text-center text-yellow-400 flex flex-col items-center gap-4">
                        <FiLoader size={64} className="animate-spin" />
                        <p>{statusData.message}</p>
                    </div>
                );

            case 'FAILED':
                 return <div className="text-center text-red-400 p-4">{statusData.message}</div>;

            default: // INITIALIZING
                return (
                    <div className="text-center text-gray-400 flex flex-col items-center gap-4">
                        <FiLoader size={64} className="animate-spin" />
                        <p>{statusData.message}</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex-1 p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">Thêm tài khoản Zalo</h1>
            <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center">
                <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center mb-6">
                    {renderContent()}
                </div>

                <div className="w-full text-left space-y-4">
                    <h3 className="font-bold text-gray-300 border-b border-gray-600 pb-2">Hướng dẫn:</h3>
                    <p className="text-sm text-gray-400">
                        - Hệ thống đang tự động kiểm tra trạng thái đăng nhập.
                        <br/>
                        - Nếu mã QR hiện ra, vui lòng dùng Zalo trên điện thoại để quét.
                        <br/>
                        - <strong>Lưu ý:</strong> nên sử dụng nick Zalo phụ, chúng tôi không chịu trách nhiệm trong mọi trường hợp nếu nick Zalo của bạn bị khóa.
                    </p>
                </div>
            </div>
        </div>
    );
}
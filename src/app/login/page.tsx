// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true); // State để kiểm tra token
    const router = useRouter();

    const loadAndValidateZaloAccounts = async (token: string) => {
        localStorage.removeItem('zaloAccounts');

        //GỌI API LẤY DANH SÁCH TÀI KHOẢN ZALO
        try {
            console.log("Đang lấy danh sách tài khoản Zalo đã lưu...");
            const zaloAccountsResponse = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/apis/getListInfoZaloAPI`,
                    {
                        token: token
                    });
            
            if (zaloAccountsResponse.data?.code === 0 && zaloAccountsResponse.data?.data) {
                const accountsFromApi = Object.values(zaloAccountsResponse.data.data);
                const validAccounts = [];

                // ✨ BƯỚC 3: KIỂM TRA HIỆU LỰC TỪNG TÀI KHOẢN
                for (const account of accountsFromApi) {
                    try {
                        const session = JSON.parse((account as any).session);
                        const profile = JSON.parse((account as any).profile);
                        
                        // Gọi API backend để kiểm tra
                        const checkRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/check-session`, session);

                        if (checkRes.data.isValid) {
                            // Nếu hợp lệ, thêm vào danh sách sẽ lưu
                            validAccounts.push({ profile, ...session });
                        } else {
                            // Nếu không hợp lệ, gọi API xóa
                            console.log(`Tài khoản ${profile.displayName} đã hết hạn, đang xóa...`);
                            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/deleteInfoZaloAPI`, {
                                token: token,
                                userId: profile.userId
                            });
                        }
                    } catch (e) {
                        console.log("Lỗi xử lý hoặc kiểm tra một tài khoản Zalo:", e);
                    }
                }
                
                // ✨ BƯỚC 4: LƯU DANH SÁCH TÀI KHOẢN CÒN HIỆU LỰC
                localStorage.setItem('zaloAccounts', JSON.stringify(validAccounts));
                console.log(`Đã lưu ${validAccounts.length} tài khoản Zalo còn hiệu lực.`);
            }

            
        } catch (zaloError) {
            // Nếu lỗi ở bước này, vẫn cho phép đăng nhập nhưng không có tài khoản Zalo nào
            console.log("Không thể lấy danh sách tài khoản Zalo:", zaloError);
        }
    };


    useEffect(() => {
        const checkExistingToken = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/apis/getInfoMemberAPI`,
                        { token: token }
                    );
                    
                    // ✨ 2. NẾU TOKEN HỢP LỆ (CODE === 0)
                    if (response.data.code === 0) {
                        await loadAndValidateZaloAccounts(token);
                        router.push('/dashboard');
                    } else {
                        // ✨ 3. NẾU TOKEN KHÔNG HỢP LỆ, ĐĂNG XUẤT
                        router.push('/logout');
                    }
                } catch (error) {
                    // Nếu API bị lỗi, cũng coi như token không hợp lệ và đăng xuất
                    console.error("Lỗi xác thực token:", error);
                    router.push('/logout');
                }
            } else {
                setIsCheckingToken(false);
            }
        };

        checkExistingToken();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/apis/checkLoginMemberAPI`;
            const response = await axios.post(apiEndpoint, {
                phone: phone,
                pass: password,
            });

            if (response.data.code === 1 && response.data.infoUser.token) {
                const authToken = response.data.infoUser.token;

                localStorage.setItem('authToken', response.data.infoUser.token);

                await loadAndValidateZaloAccounts(authToken);
                
                // Chuyển đến dashboard
                router.push('/dashboard');
            } else {
                setError(response.data.messages[0].text || 'Thông tin đăng nhập không chính xác.');
            }
        } catch (err) {
            console.error('API call failed:', err);
            setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị màn hình chờ trong khi kiểm tra token
    if (isCheckingToken) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                Đang kiểm tra phiên đăng nhập...
            </div>
        );
    }
    
    // Nếu không có token, hiển thị form đăng nhập như bình thường
    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">ZTOOL</h1>
                    <p className="text-gray-400 mt-2">Đăng nhập để tiếp tục</p>
                </div>

                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>

                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
                        {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                    </button>
                </form>

                <div className="text-center text-gray-400">
                    <span>Chưa có tài khoản? </span>
                    <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                        Tạo tài khoản
                    </Link>
                </div>
            </div>
        </main>
    );
}
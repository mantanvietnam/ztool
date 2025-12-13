// app/register/RegisterForm.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiPhone, FiMail, FiLock, FiEye, FiEyeOff, FiGift } from 'react-icons/fi';

export default function RegisterForm() {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passAgain, setPassAgain] = useState('');
    const [affCode, setAffCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPassAgain, setShowPassAgain] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            router.push('/dashboard');
        } else {
            const aff = searchParams.get('aff');
            if (aff) {
                setAffCode(aff);
            }
            setIsCheckingToken(false);
        }
    }, [router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== passAgain) {
            setError('Mật khẩu nhập lại không khớp.');
            return;
        }

        setLoading(true);

        try {
            const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/apis/saveRegisterMemberAPI`;
            const response = await axios.post(apiEndpoint, {
                full_name: fullName,
                phone: phone,
                email: email,
                pass: password,
                passAgain: passAgain,
                aff: affCode,
            });

            if (response.data.code === 1 && response.data.infoUser.token) {
                const userInfo = response.data.infoUser;
                
                // 1. Lưu Token
                localStorage.setItem('authToken', userInfo.token);
                localStorage.setItem('authTokenAPI', userInfo.token_api);

                // 2. ✨ CẬP NHẬT: Xử lý và lưu Proxy
                if (userInfo.proxy) {
                    const proxyData = userInfo.proxy;
                    // Chuẩn hóa dữ liệu về dạng { host, port, user, pass }
                    const formattedProxy = {
                        id: proxyData.id,
                        host: proxyData.ip,
                        port: proxyData.port,
                        user: proxyData.username,
                        pass: proxyData.password,
                        protocol: proxyData.protocol,
                    };
                    localStorage.setItem('userProxy', JSON.stringify(formattedProxy));
                    // console.log("Đã lưu proxy khi đăng ký:", formattedProxy.host);
                } else {
                    localStorage.removeItem('userProxy');
                }

                // 3. Chuyển hướng
                router.push('/dashboard');
            } else {
                setError(response.data.messages || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin.');
            }
        } catch (_err) {
            console.error('API call failed:', _err);
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    if (isCheckingToken) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                Đang kiểm tra phiên đăng nhập...
            </div>
        );
    }

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8 space-y-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Tạo tài khoản mới</h1>
                    <p className="text-gray-400 mt-2">Bắt đầu quản lý chiến dịch của bạn</p>
                </div>

                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>
                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPassAgain ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={passAgain} onChange={(e) => setPassAgain(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <button type="button" onClick={() => setShowPassAgain(!showPassAgain)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassAgain ? <FiEyeOff /> : <FiEye />}</button>
                    </div>
                    <div className="relative">
                        <FiGift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Mã người giới thiệu (nếu có)" value={affCode} onChange={(e) => setAffCode(e.target.value)} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
                        {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                    </button>
                </form>

                <div className="text-center text-gray-400">
                    <span>Đã có tài khoản? </span>
                    <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                        Đăng nhập ngay
                    </Link>
                </div>
            </div>
        </main>
    );
}
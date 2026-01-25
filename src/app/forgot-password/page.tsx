// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPhone, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    // State quản lý các bước: 1 (Nhập SĐT) -> 2 (Nhập OTP & Đổi mật khẩu)
    const [step, setStep] = useState(1);
    
    // Form Data
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const router = useRouter();

    // BƯỚC 1: Gửi yêu cầu lấy OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/requestForgotPasswordAPI`, {
                phone: phone
            });

            // Giả sử API trả về code 1 là thành công (theo logic chung của dự án bạn)
            if (response.data.code === 1) {
                setSuccessMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra.');
                setStep(2); // Chuyển sang bước 2
                setError('');
            } else {
                setError(response.data.mess || 'Số điện thoại không tồn tại hoặc có lỗi xảy ra.');
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    // BƯỚC 2: Xác thực OTP và Đổi mật khẩu
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validate phía Client
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (newPassword.length < 6) {
             setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
             return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createNewPasswordAPI`, {
                phone: phone,
                otp: otp,
                pass: newPassword, // Lưu ý: Kiểm tra lại tên trường này với Backend (ví dụ: pass, new_pass, password...)
                passAgain: confirmPassword
            });

            if (response.data.code === 1) {
                setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...');
                // Đợi 2 giây để người dùng đọc thông báo rồi chuyển trang
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setError(response.data.mess || 'Mã OTP không đúng hoặc hết hạn.');
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối khi đổi mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Khôi Phục Mật Khẩu</h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        {step === 1 ? 'Nhập số điện thoại để nhận mã xác thực' : 'Nhập mã OTP và mật khẩu mới'}
                    </p>
                </div>

                {/* Thông báo lỗi & thành công */}
                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm border border-red-500/50">{error}</div>}
                {successMessage && <div className="bg-green-500/20 text-green-300 p-3 rounded-md text-sm border border-green-500/50">{successMessage}</div>}

                {step === 1 ? (
                    /* FORM BƯỚC 1: NHẬP SĐT */
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="tel" 
                                placeholder="Số điện thoại đã đăng ký" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                required 
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
                            {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                        </button>
                    </form>
                ) : (
                    /* FORM BƯỚC 2: NHẬP OTP & MK MỚI */
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        {/* OTP Input */}
                        <div className="relative">
                            <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Nhập mã OTP (từ Email)" 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)} 
                                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                required 
                            />
                        </div>

                        {/* Mật khẩu mới */}
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Mật khẩu mới" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                required 
                            />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        {/* Xác nhận mật khẩu mới */}
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Nhập lại mật khẩu mới" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                required 
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
                            {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                        </button>
                        
                        {/* Nút quay lại nếu nhập sai SĐT */}
                        <button type="button" onClick={() => { setStep(1); setError(''); }} className="w-full text-sm text-gray-400 hover:text-white mt-2">
                            Nhập sai số điện thoại? Quay lại
                        </button>
                    </form>
                )}

                <div className="text-center mt-4">
                    <Link href="/login" className="flex items-center justify-center text-blue-400 hover:text-blue-300 font-medium transition">
                        <FiArrowLeft className="mr-2" /> Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </main>
    );
}
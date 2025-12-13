'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    FiCopy, 
    FiDownload, 
    FiCheck, 
    FiGift, 
    FiPhone, 
    FiMail, 
    FiFacebook, 
    FiShare2 
} from 'react-icons/fi';
import toast from 'react-hot-toast'; // Giả sử bạn dùng react-hot-toast, nếu không có thể dùng alert

// --- Component Hỗ trợ (Tái sử dụng từ Dashboard) ---
const SupportItem = ({ icon, label, value, href, actionLabel }: { icon: React.ReactNode, label: string, value: string, href: string, actionLabel: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/60 transition-colors border border-gray-700 hover:border-blue-500/50 group">
        <div className="p-3 bg-gray-800 rounded-full text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
            <p className="text-white font-medium">{value}</p>
            <span className="text-xs text-blue-400 group-hover:underline mt-1 block">{actionLabel}</span>
        </div>
    </a>
);

export default function ReferralPage() {
    // State lưu thông tin User (Lấy số điện thoại)
    const [userPhone, setUserPhone] = useState<string>('');
    const [referralLink, setReferralLink] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // --- Effect: Lấy thông tin user đăng nhập ---
    useEffect(() => {
        const phone = localStorage.getItem('userPhone') || '0816560000';

        setUserPhone(phone);
        setReferralLink(`https://ztool.ai.vn/register/?aff=${phone}`);
    }, []);

    // --- Hàm xử lý: Sao chép link ---
    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        // Nếu có thư viện toast: toast.success("Đã sao chép link giới thiệu!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Hàm xử lý: Tải mã QR ---
    const handleDownloadQR = () => {
        const canvas = document.getElementById('referral-qr-code') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `ztool-qr-${userPhone}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FiShare2 className="text-blue-500"/> Mã Giới Thiệu
                </h1>
                <p className="text-gray-400 mt-2">Chia sẻ Ztool cùng bạn bè để nhận những phần quà hấp dẫn.</p>
            </div>

            {/* Main Content: Khu vực QR và Link */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Cột Trái: Thông tin chương trình & Link */}
                <div className="space-y-6">
                    {/* Thẻ thông báo thưởng */}
                    <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-6 rounded-xl flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                            <FiGift size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Thưởng 200 Điểm Hành Động</h3>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                                Với mỗi người bạn đăng ký tài khoản thành công qua đường dẫn giới thiệu của bạn, 
                                hệ thống sẽ tự động cộng <span className="text-yellow-400 font-bold">200 điểm</span> hành động cho bạn.
                            </p>
                        </div>
                    </div>

                    {/* Khu vực Copy Link */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <label className="text-sm text-gray-400 font-medium mb-2 block">Liên kết giới thiệu của bạn</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-300 truncate font-mono text-sm">
                                {referralLink}
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                    isCopied 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {isCopied ? <FiCheck /> : <FiCopy />}
                                {isCopied ? "Đã chép" : "Sao chép"}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            * Mã giới thiệu chính là số điện thoại đăng ký tài khoản Ztool của bạn: <span className="text-white">{userPhone}</span>
                        </p>
                    </div>
                </div>

                {/* Cột Phải: Mã QR Code */}
                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg flex flex-col items-center justify-center text-center">
                    <h3 className="text-white font-bold mb-6 text-lg">Quét mã QR để đăng ký</h3>
                    
                    <div className="p-4 bg-white rounded-xl shadow-inner mb-6">
                        <QRCodeCanvas 
                            id="referral-qr-code"
                            value={referralLink}
                            size={200}
                            level={"H"}
                            imageSettings={{
                                src: "/logo-ztool-icon.png", // Thay bằng đường dẫn icon Ztool của bạn nếu có
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleDownloadQR}
                        className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        <FiDownload />
                        Tải xuống mã QR
                    </button>
                </div>
            </div>

            <hr className="border-gray-700" />

            {/* Phần: Trung tâm hỗ trợ (Giống Dashboard) */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Trung tâm hỗ trợ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SupportItem 
                        icon={<FiPhone size={20} />} 
                        label="Hotline 24/7" 
                        value="081.656.0000" 
                        href="tel:0816560000"
                        actionLabel="Gọi ngay"
                    />
                    <SupportItem 
                        icon={<FiMail size={20} />} 
                        label="Email hỗ trợ" 
                        value="tranmanhbk179@gmail.com" 
                        href="mailto:tranmanhbk179@gmail.com"
                        actionLabel="Gửi email"
                    />
                    <SupportItem 
                        icon={<FiFacebook size={20} />} 
                        label="Facebook Admin" 
                        value="Mạnh Trần (ManMo)" 
                        href="https://www.facebook.com/manh.tran.manmo"
                        actionLabel="Nhắn tin"
                    />
                </div>
            </div>
        </div>
    );
}
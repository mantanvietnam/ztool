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
    FiShare2,
    FiEdit2, 
    FiX      
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// --- Component Hỗ trợ ---
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
    // --- State ---
    const [userPhone, setUserPhone] = useState<string>('');
    const [referralCode, setReferralCode] = useState<string>('');
    const [referralLink, setReferralLink] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // State cho Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newAffiliateCode, setNewAffiliateCode] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // State hiển thị lỗi text đỏ trong modal (thay thế dòng chú thích)
    const [modalError, setModalError] = useState<string>('');

    // --- Effect: Init Data ---
    useEffect(() => {
        const phone = localStorage.getItem('userPhone') || '0816560000';
        const affCode = localStorage.getItem('affiliate_code'); 

        // Ưu tiên affiliate_code, nếu không có thì dùng phone
        const finalCode = affCode && affCode.trim() !== '' ? affCode : phone;

        setUserPhone(phone);
        setReferralCode(finalCode);
        setReferralLink(`https://ztool.ai.vn/register/?aff=${finalCode}`);
    }, []);

    // --- Helper: Xử lý Logout ---
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('affiliate_code');
        window.location.href = '/logout';
    };

    // --- Actions ---
    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        toast.success("Đã sao chép liên kết!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('referral-qr-code') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `ztool-qr-${referralCode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const openEditModal = () => {
        setNewAffiliateCode(referralCode); 
        setModalError(''); // Reset lỗi cũ mỗi khi mở lại modal
        setIsEditModalOpen(true);
    };

    // --- LOGIC XỬ LÝ CHÍNH ---
    const handleUpdateCode = async () => {
        // 1. Validate Client
        if (!newAffiliateCode.trim()) {
            setModalError("Vui lòng nhập mã giới thiệu mới.");
            return;
        }

        if (newAffiliateCode.includes(' ')) {
            setModalError("Mã giới thiệu không được chứa khoảng trắng.");
            return;
        }

        setIsUpdating(true);
        setModalError(''); // Xóa lỗi trước khi gọi API

        try {
            const token = localStorage.getItem('authToken'); 
            
            if (!token) {
                toast.error("Phiên đăng nhập hết hạn.");
                handleLogout();
                return;
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_URL;

            // --- BƯỚC 1: CHECK MÃ TỒN TẠI (checkAffiliateCodeApi) ---
            const checkRes = await fetch(`${baseUrl}/apis/checkAffiliateCodeApi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, affiliate_code: newAffiliateCode })
            });
            const checkData = await checkRes.json();

            // Xử lý kết quả check
            if (checkData.code === 2) {
                // Code 2: Sai token -> Logout ngay
                handleLogout();
                return;
            }

            if (checkData.code !== 1) {
                // Nếu khác 1 và 2 -> Hiển thị lỗi ngay tại modal
                setModalError("Mã giới thiệu này đã có người sử dụng.");
                setIsUpdating(false);
                return; // Dừng, không cho update
            }

            // --- BƯỚC 2: UPDATE MÃ (updateAffiliateCodeApi) ---
            // Chỉ chạy khi checkData.code === 1
            const updateRes = await fetch(`${baseUrl}/apis/updateAffiliateCodeApi`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, affiliate_code: newAffiliateCode })
            });

            const updateData = await updateRes.json();

            // Xử lý kết quả update
            if (updateData.code === 3) {
                // Code 3: Sai token -> Logout ngay
                handleLogout();
                return;
            }

            if (updateData.code === 1 || updateData.success) {
                toast.success("Cập nhật thành công!");
                localStorage.setItem('affiliate_code', newAffiliateCode);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(updateData.message || "Lỗi khi lưu mã mới.");
                setIsUpdating(false);
            }

        } catch (error) {
            console.error(error);
            toast.error("Lỗi kết nối đến máy chủ.");
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FiShare2 className="text-blue-500"/> Mã Giới Thiệu
                </h1>
                <p className="text-gray-400 mt-2">Chia sẻ Ztool cùng bạn bè để nhận những phần quà hấp dẫn.</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
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
                        
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <span>* Mã giới thiệu của bạn là:</span>
                            <span className="text-white font-bold text-sm bg-gray-700 px-2 py-0.5 rounded border border-gray-600">
                                {referralCode}
                            </span>
                            
                            <button 
                                onClick={openEditModal}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1 rounded transition-colors"
                                title="Chỉnh sửa mã giới thiệu"
                            >
                                <FiEdit2 size={14} />
                            </button>

                            {referralCode === userPhone && <span className="text-gray-600 italic ml-1">(Mặc định SĐT)</span>}
                        </div>
                    </div>
                </div>

                {/* Right Column: QR Code */}
                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg flex flex-col items-center justify-center text-center">
                    <h3 className="text-white font-bold mb-6 text-lg">Quét mã QR để đăng ký</h3>
                    
                    <div className="p-4 bg-white rounded-xl shadow-inner mb-6">
                        <QRCodeCanvas 
                            id="referral-qr-code"
                            value={referralLink}
                            size={200}
                            level={"H"}
                            imageSettings={{
                                src: "/logo-ztool-icon.png", 
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

            {/* Support Center */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Trung tâm hỗ trợ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SupportItem icon={<FiPhone size={20} />} label="Hotline 24/7" value="081.656.0000" href="tel:0816560000" actionLabel="Gọi ngay"/>
                    <SupportItem icon={<FiMail size={20} />} label="Email hỗ trợ" value="tranmanhbk179@gmail.com" href="mailto:tranmanhbk179@gmail.com" actionLabel="Gửi email"/>
                    <SupportItem icon={<FiFacebook size={20} />} label="Facebook Admin" value="Mạnh Trần (ManMo)" href="https://www.facebook.com/manh.tran.manmo" actionLabel="Nhắn tin"/>
                </div>
            </div>

            {/* === MODAL CHỈNH SỬA MÃ (ĐÃ CẬP NHẬT) === */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white">Chỉnh sửa mã giới thiệu</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-400 mb-4">
                                Hãy đặt một mã dễ nhớ (Ví dụ: bietdanh, tencongty...). 
                                <br/>Link giới thiệu và QR Code sẽ thay đổi theo mã này.
                            </p>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Mã giới thiệu mới</label>
                                <input 
                                    type="text" 
                                    value={newAffiliateCode}
                                    onChange={(e) => {
                                        setNewAffiliateCode(e.target.value.replace(/\s/g, ''));
                                        setModalError(''); // Xóa lỗi khi gõ lại
                                    }} 
                                    placeholder="Nhập mã mong muốn..."
                                    className={`w-full bg-gray-900 border ${modalError ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono`}
                                />
                                
                                {/* --- KHU VỰC HIỂN THỊ LỖI --- */}
                                {modalError ? (
                                    // Nếu có lỗi -> Hiện chữ đỏ (đúng chỗ mũi tên)
                                    <p className="text-xs text-red-500 font-bold mt-1 animate-pulse flex items-center gap-1">
                                        ⚠ {modalError}
                                    </p>
                                ) : (
                                    // Nếu không lỗi -> Hiện chữ chú thích mặc định
                                    <p className="text-xs text-blue-400/80 italic">
                                        * Mã chỉ bao gồm chữ và số, viết liền không dấu.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-900/50 border-t border-gray-700">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleUpdateCode}
                                disabled={isUpdating}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang kiểm tra...
                                    </>
                                ) : (
                                    'Lưu thay đổi'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
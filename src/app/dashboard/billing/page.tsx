'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiLoader, FiX, FiCopy } from 'react-icons/fi';
// ✨ SỬA LỖI: Import useAuth từ file context mới
import { useAuth } from '@/contexts/AuthContext';

// --- TYPE DEFINITIONS ---
interface Package {
    name: string;
    interactions: number;
    price: number;
    price_old?: number; // Thêm trường giá cũ (optional)
    percent?: number;   // Thêm trường phần trăm (optional)
    description: string;
    isPopular: boolean;
}

interface TransactionDetails {
    id: string;
    qrCodeUrl: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    amount: number;
    content: string;
}

// --- COMPONENTS ---

// Component cho Popup thanh toán
const PaymentModal = ({ details, onClose }: { details: TransactionDetails; onClose: () => void; }) => {
    const router = useRouter();
    //const { refetchUser } = useAuth(); // Lấy hàm refetchUser từ context
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/checkBuyPackageAPI`, {
                    token: token,
                    id: details.id,
                });

                if (response.data.status === 'done') {
                    setPaymentStatus('success');
                    clearInterval(intervalId); // Dừng kiểm tra
                    
                    // Cập nhật lại thông tin điểm ở header
                    //await refetchUser(); 
                    
                    // Sau 3 giây, chuyển về trang dashboard
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
            }
        };

        const intervalId = setInterval(checkStatus, 10000); // Kiểm tra mỗi 10 giây

        // Dọn dẹp khi component bị unmount
        return () => clearInterval(intervalId);
    }, [details.id, router]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Đã sao chép!');
        }).catch(err => {
            console.error('Không thể sao chép:', err);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><FiX size={24} /></button>
                
                {paymentStatus === 'pending' && (
                    <>
                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Quét mã QR để thanh toán</h2>
                            <p className="text-gray-400 mb-4">Mở ứng dụng ngân hàng của bạn và quét mã dưới đây.</p>
                            <img src={details.qrCodeUrl} alt="Mã QR thanh toán" className="mx-auto rounded-lg border-4 border-white" />
                        </div>
                        <div className="bg-gray-900 p-6 rounded-b-lg space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Số tiền:</span>
                                <span className="font-bold text-white text-lg">{details.amount.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Nội dung:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-yellow-400">{details.content}</span>
                                    <FiCopy onClick={() => copyToClipboard(details.content)} className="cursor-pointer text-gray-400 hover:text-white" />
                                </div>
                            </div>
                             <div className="text-center pt-4">
                                <p className="text-yellow-400 text-xs flex items-center justify-center gap-2"><FiLoader className="animate-spin" /> Đang chờ thanh toán... Vui lòng không tắt cửa sổ này.</p>
                            </div>
                        </div>
                    </>
                )}
                {paymentStatus === 'success' && (
                    <div className="p-8 text-center">
                        <FiCheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                        <h2 className="text-2xl font-bold text-white">Thanh toán thành công!</h2>
                        <p className="text-gray-300 mt-2">Điểm đã được cộng vào tài khoản của bạn. Đang chuyển hướng...</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// Component cho thẻ gói cước
const PricingCard = ({ pkg, onSelect, isLoading }: { pkg: Package; onSelect: () => void; isLoading: boolean; }) => (
    <div className={`bg-gray-800 p-8 rounded-lg border ${pkg.isPopular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'} relative flex flex-col transform transition-transform hover:scale-105`}>
        {/* Tag Phổ biến nhất */}
        {pkg.isPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                PHỔ BIẾN NHẤT
            </div>
        )}

        {/* Tag Giảm giá (Mới) */}
        {pkg.percent && pkg.percent > 0 && (
            <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500 text-red-400 text-xs font-bold px-2 py-1 rounded">
                Giảm {pkg.percent}%
            </div>
        )}

        <h3 className="text-2xl font-bold text-white text-center mt-2">{pkg.name}</h3>
        
        <div className="text-center my-4">
            {/* Hiển thị giá cũ gạch ngang (Mới) */}
            {pkg.price_old && pkg.price_old > pkg.price && (
                <div className="text-gray-500 text-sm line-through mb-1">
                    {pkg.price_old.toLocaleString()}đ
                </div>
            )}
            <span className="text-4xl font-extrabold text-white">{pkg.price.toLocaleString()}đ</span>
        </div>

        <p className="text-center text-gray-400 text-sm mb-6">{pkg.interactions.toLocaleString()} lượt tương tác</p>
        <p className="text-gray-300 text-center flex-grow mb-8 border-t border-gray-700 pt-4">{pkg.description}</p>
        
        <button onClick={onSelect} disabled={isLoading} className={`mt-auto w-full text-center font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center ${pkg.isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 hover:bg-blue-600 text-white'} disabled:bg-gray-500 disabled:cursor-not-allowed`}>
            {isLoading ? <FiLoader className="animate-spin" /> : 'Chọn Gói Này'}
        </button>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function BillingPage() {
    const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [transaction, setTransaction] = useState<TransactionDetails | null>(null);

    const packages: Package[] = [
        { 
            name: 'Gói 1K', 
            interactions: 1000, 
            price: 200000, 
            price_old: 300000, 
            percent: 40, 
            description: 'Phù hợp cho các chiến dịch nhỏ hoặc thử nghiệm.', 
            isPopular: false 
        },
        { 
            name: 'Gói 2K', 
            interactions: 2000, 
            price: 500000, 
            price_old: 600000, // 600k giảm 15% còn 510k
            percent: 16, 
            description: 'Tiết kiệm chi phí cho các hoạt động thường xuyên.', 
            isPopular: false 
        },
        { 
            name: 'Gói 5K', 
            interactions: 5000, 
            price: 750000, 
            price_old: 1000000, // 1tr giảm 25% còn 750k
            percent: 25, 
            description: 'Gói phổ biến nhất, tối ưu cho doanh nghiệp nhỏ, chưa có bộ phận marketing riêng.', 
            isPopular: true 
        },
        { 
            name: 'Gói 10K', 
            interactions: 10000, 
            price: 1400000, 
            price_old: 2000000, // 2tr giảm 30% còn 1tr4
            percent: 30, 
            description: 'Phù hợp doanh nghiệp lớn, nhu cầu chăm sóc khách hàng thường xuyên.', 
            isPopular: false 
        },
        { 
            name: 'Gói 30K', 
            interactions: 30000, 
            price: 4000000, 
            price_old: 6150000, // ~6tr150 giảm 35%
            percent: 35, 
            description: 'Gói dành cho các chương trình sự kiện lớn.', 
            isPopular: false 
        },
        { 
            name: 'Gói 50K', 
            interactions: 50000, 
            price: 6000000, 
            price_old: 10000000, // 10tr giảm 40% còn 6tr
            percent: 40, 
            description: 'Phù hợp cho các đơn vị làm dịch vụ marketing.', 
            isPopular: false 
        },
    ];

    const handleSelectPackage = async (pkg: Package) => {
        setLoadingPackage(pkg.name);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            }

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/buyPackageAPI`, {
                token: token,
                amount: pkg.price,
            });
            
            const data = response.data;
            if (data.id && data.link) {
                setTransaction({
                    id: data.id,
                    qrCodeUrl: data.link,
                    bankName: data.bankName,
                    accountName: data.accountName,
                    accountNumber: data.accountNumber,
                    amount: data.amount,
                    content: data.content,
                });
            } else {
                throw new Error(data.message || "Không thể tạo giao dịch.");
            }
        } catch (err: any) {
            setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoadingPackage(null);
        }
    };

    return (
        <div className="p-6 md:p-8">
            {transaction && <PaymentModal details={transaction} onClose={() => setTransaction(null)} />}

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Nạp Điểm</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">Chọn gói tương tác phù hợp với nhu cầu của bạn. Điểm không có thời hạn sử dụng.</p>
            </div>

            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm max-w-3xl mx-auto mb-8">{error}</div>}

            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {packages.map(pkg => (
                    <PricingCard 
                        key={pkg.name} 
                        pkg={pkg} 
                        onSelect={() => handleSelectPackage(pkg)} 
                        isLoading={loadingPackage === pkg.name}
                    />
                ))}
            </div>
        </div>
    );
}

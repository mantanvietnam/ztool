// app/page.tsx
"use client"; // Vẫn cần client vì Header bên trong có dùng state (mobile menu)

import React from 'react';
import Link from 'next/link';
import { 
    FiSend, FiUserPlus, FiMapPin, FiCheckCircle, 
    FiUsers, FiTarget, FiXCircle
} from 'react-icons/fi';

// Import Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// === CẤU HÌNH DỮ LIỆU ===
interface Package {
    name: string;
    interactions: number;
    price: number;
    price_old?: number;
    percent?: number;
    isPopular: boolean;
}

const homepagePackages: Package[] = [
    { name: 'Gói 1K', interactions: 1000, price: 200000, price_old: 200000, percent: 0, isPopular: false },
    { name: 'Gói 2K', interactions: 2000, price: 500000, price_old: 600000, percent: 16, isPopular: false },
    { name: 'Gói 5K', interactions: 5000, price: 750000, price_old: 1000000, percent: 25, isPopular: true },
    { name: 'Gói 10K', interactions: 10000, price: 1400000, price_old: 2000000, percent: 30, isPopular: false },
    { name: 'Gói 30K', interactions: 30000, price: 4000000, price_old: 6150000, percent: 35, isPopular: false },
    { name: 'Gói 50K', interactions: 50000, price: 6000000, price_old: 10000000, percent: 40, isPopular: false },
];

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 hover:-translate-y-1 transition-transform">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

const PricingCard = ({ pkg }: { pkg: Package }) => {
    const features = [
        `${pkg.interactions.toLocaleString()} lượt tương tác`,
        "Không giới hạn thời gian sử dụng",
        "1 tương tác = 1 tin nhắn hoặc 1 kết bạn",
        "Bao gồm tất cả các tính năng",
        pkg.price >= 4000000 ? "Hỗ trợ ưu tiên 1:1" : "Hỗ trợ kỹ thuật 24/7"
    ];

    return (
        <div className={`bg-gray-800 p-8 rounded-lg border ${pkg.isPopular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'} relative flex flex-col transform transition-transform hover:-translate-y-2`}>
            {pkg.isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">PHỔ BIẾN NHẤT</div>}
            {pkg.percent !== undefined && pkg.percent > 0 && (
                <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500 text-red-400 text-xs font-bold px-2 py-1 rounded">
                    Giảm {pkg.percent}%
                </div>
            )}
            <h3 className="text-2xl font-bold text-white text-center mt-2">{pkg.name}</h3>
            <div className="text-center my-4">
                {pkg.price_old && pkg.price_old > pkg.price && (
                    <div className="text-gray-500 text-sm line-through mb-1">{pkg.price_old.toLocaleString()}đ</div>
                )}
                <span className="text-4xl font-extrabold text-white">{pkg.price.toLocaleString()}đ</span>
            </div>
            <ul className="space-y-4 text-gray-300 my-6 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <FiCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Link href="/register" className={`mt-auto block w-full text-center font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center ${pkg.isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 hover:bg-blue-600 text-white'}`}>
                Chọn Gói Này
            </Link>
        </div>
    );
};

export default function LandingPage() {
    return (
        // 👇 EM ĐÃ THÊM LẠI: bg-gray-900 text-white vào đây
        <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                {/* === HERO SECTION === */}
                <section className="text-center pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
                    <div className="container mx-auto px-6">
                        {/* Vì class text-white đã được khai báo ở thẻ cha div ngoài cùng, 
                            nên h1 và p ở đây sẽ tự động trắng lại, không bị đen nữa */}
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
                            Tự Động Hóa Zalo Marketing Với <span className="text-blue-500">ZTOOL</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                            Tiếp cận hàng ngàn khách hàng tiềm năng, tăng trưởng doanh thu vượt bậc bằng cách tự động hóa các tác vụ trên Zalo và Google Maps.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition duration-300 shadow-lg shadow-blue-500/20">
                                Dùng Thử Miễn Phí
                            </Link>
                            <Link href="#pricing" className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600 font-bold py-3 px-8 rounded-md transition duration-300">
                                Xem Bảng Giá
                            </Link>
                        </div>
                    </div>
                </section>

                 {/* === VIDEO & PAIN POINTS SECTION === */}
                 <section className="py-20 bg-gray-800/50 border-y border-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700 relative w-full aspect-video group">
                               <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                               <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.youtube.com/embed/9FC4VkVcuSY" 
                                    title="ZTOOL Demo Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                    className="absolute inset-0"
                                ></iframe>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-6 leading-tight text-white">
                                    Kinh Doanh Trên Zalo: <br/><span className="text-red-400">Nỗi Đau</span> Của Bạn?
                                </h2>
                                <ul className="space-y-5">
                                    <li className="flex items-start">
                                        <FiXCircle className="text-red-500 mr-4 mt-1 flex-shrink-0" size={24}/>
                                        <p className="text-gray-300 text-lg">Tốn hàng giờ mỗi ngày để gửi tin nhắn thủ công, kết bạn từng người một.</p>
                                    </li>
                                    <li className="flex items-start">
                                        <FiXCircle className="text-red-500 mr-4 mt-1 flex-shrink-0" size={24}/>
                                        <p className="text-gray-300 text-lg">Bỏ sót khách hàng tiềm năng, tin nhắn bị trôi liên tục.</p>
                                    </li>
                                    <li className="flex items-start">
                                        <FiXCircle className="text-red-500 mr-4 mt-1 flex-shrink-0" size={24}/>
                                        <p className="text-gray-300 text-lg">Bế tắc trong việc tìm kiếm nguồn data khách hàng mới đúng mục tiêu.</p>
                                    </li>
                                    <li className="flex items-start">
                                        <FiXCircle className="text-red-500 mr-4 mt-1 flex-shrink-0" size={24}/>
                                        <p className="text-gray-300 text-lg">Chi phí quảng cáo đắt đỏ, không đo lường được hiệu quả cụ thể.</p>
                                    </li>
                                </ul>
                                <p className="mt-8 text-xl text-blue-400 font-bold">
                                    👉 ZTOOL giải quyết triệt để những vấn đề này.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === FEATURES SECTION === */}
                <section id="features" className="py-20 scroll-mt-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Tính Năng Vượt Trội</h2>
                            <p className="text-gray-400 mt-2">Mọi thứ bạn cần để thống lĩnh thị trường.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard icon={<FiSend size={24} />} title="Gửi Tin Nhắn Hàng Loạt" description="Gửi tin nhắn quảng cáo, chăm sóc khách hàng đến hàng ngàn người dùng Zalo nhanh chóng." />
                            <FeatureCard icon={<FiUserPlus size={24} />} title="Kết Bạn Tự Động" description="Tự động gửi lời mời kết bạn theo danh sách SĐT có sẵn, mở rộng mạng lưới khách hàng." />
                            <FeatureCard icon={<FiMapPin size={24} />} title="Quét Dữ Liệu Google Maps" description="Khai thác thông tin khách hàng (tên, SĐT, địa chỉ) từ Google Maps." />
                            <FeatureCard icon={<FiUsers size={24} />} title="Chăm sóc nhóm" description="Quét thành viên, tự động kết bạn và gửi tin nhắn chăm sóc trong nhóm Zalo." />
                            <FeatureCard icon={<FiTarget size={24} />} title="Nhắm Chọn Đối Tượng" description="Lọc và nhắm chọn đúng đối tượng khách hàng mục tiêu để tăng tỷ lệ chuyển đổi." />
                            <FeatureCard icon={<span>📊</span>} title="Báo Cáo Chi Tiết" description="Theo dõi hiệu quả chiến dịch qua các báo cáo trực quan." />
                        </div>
                    </div>
                </section>

                {/* === PRICING SECTION === */}
                <section id="pricing" className="py-20 bg-gray-800 scroll-mt-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Bảng Giá Linh Hoạt</h2>
                            <p className="text-gray-400 mt-2 text-lg">Chỉ tính phí trên lượt tương tác thực tế. <span className="text-blue-400 font-semibold">Không giới hạn thời gian sử dụng.</span></p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {homepagePackages.map((pkg, index) => (
                                <PricingCard key={index} pkg={pkg} />
                            ))}
                        </div>
                    </div>
                </section>

                 {/* === FINAL CTA SECTION === */}
                <section className="text-center py-20 pb-24 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Sẵn Sàng Tăng Trưởng Cùng ZTOOL?
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                            Đừng bỏ lỡ cơ hội tiếp cận khách hàng và tự động hóa công việc kinh doanh của bạn.
                        </p>
                        <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-md transition duration-300 text-lg shadow-lg shadow-blue-500/30">
                            Bắt Đầu Ngay Hôm Nay
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
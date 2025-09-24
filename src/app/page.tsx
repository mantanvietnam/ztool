// app/page.tsx
import Link from 'next/link';
import { FiSend, FiUserPlus, FiMapPin, FiCheckCircle, FiUsers, FiTarget } from 'react-icons/fi';

// Component FeatureCard để tái sử dụng
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 hover:-translate-y-1 transition-transform">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

// Component PricingCard để tái sử dụng
const PricingCard = ({ plan, price, features, popular }: { plan: string, price: string, features: string[], popular?: boolean }) => (
    <div className={`bg-gray-800 p-8 rounded-lg border ${popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'} relative flex flex-col`}>
        {popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">PHỔ BIẾN NHẤT</div>}
        <h3 className="text-2xl font-bold text-white text-center">{plan}</h3>
        <p className="text-center my-4">
            <span className="text-4xl font-extrabold text-white">{price}</span>
            {/* ✨ THAY ĐỔI: Xóa đơn vị /tháng */}
        </p>
        <ul className="space-y-4 text-gray-300 my-6 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <FiCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Link href="/register" className={`mt-auto block w-full text-center font-bold py-3 px-4 rounded-md transition duration-300 ${popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-blue-600 text-white'}`}>
            Chọn Gói Này
        </Link>
    </div>
);


export default function LandingPage() {
    return (
        <div className="bg-gray-900 text-white">
            {/* === HERO SECTION === */}
            <section className="text-center py-20 md:py-32 bg-gradient-to-b from-gray-900 to-gray-800">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
                        Tự Động Hóa Zalo Marketing Với <span className="text-blue-400">ZTOOL</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                        Tiếp cận hàng ngàn khách hàng tiềm năng, tăng trưởng doanh thu vượt bậc bằng cách tự động hóa các tác vụ trên Zalo và Google Maps.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition duration-300">
                            Dùng Thử Miễn Phí
                        </Link>
                        <Link href="#pricing" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-md transition duration-300">
                            Xem Bảng Giá
                        </Link>
                    </div>
                </div>
            </section>

            {/* === FEATURES SECTION === */}
            <section id="features" className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Tính Năng Vượt Trội</h2>
                        <p className="text-gray-400 mt-2">Mọi thứ bạn cần để thống lĩnh thị trường.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={<FiSend size={24} />} title="Gửi Tin Nhắn Hàng Loạt" description="Gửi tin nhắn quảng cáo, chăm sóc khách hàng đến hàng ngàn người dùng Zalo một cách nhanh chóng và cá nhân hóa." />
                        <FeatureCard icon={<FiUserPlus size={24} />} title="Kết Bạn Tự Động" description="Tự động gửi lời mời kết bạn theo danh sách số điện thoại có sẵn, mở rộng mạng lưới khách hàng không giới hạn." />
                        <FeatureCard icon={<FiMapPin size={24} />} title="Quét Dữ Liệu Google Maps" description="Khai thác thông tin khách hàng tiềm năng (tên, SĐT, địa chỉ) từ bất kỳ địa điểm nào trên Google Maps." />
                        {/* ✨ THAY ĐỔI: Cập nhật tính năng Chăm sóc nhóm */}
                        <FeatureCard icon={<FiUsers size={24} />} title="Chăm sóc nhóm" description="Quét danh sách thành viên, tự động kết bạn và gửi tin nhắn chăm sóc đến các thành viên trong nhóm Zalo của bạn." />
                        <FeatureCard icon={<FiTarget size={24} />} title="Nhắm Chọn Đối Tượng" description="Dễ dàng lọc và nhắm chọn đúng đối tượng khách hàng mục tiêu để tăng tỷ lệ chuyển đổi cho chiến dịch." />
                        <FeatureCard icon={<span>📊</span>} title="Báo Cáo Chi Tiết" description="Theo dõi và đo lường hiệu quả của từng chiến dịch thông qua các báo cáo trực quan, chi tiết." />
                    </div>
                </div>
            </section>

            {/* === PRICING SECTION === */}
            <section id="pricing" className="py-20 bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Bảng Giá Theo Tương Tác</h2>
                        <p className="text-gray-400 mt-2">Chọn gói phù hợp nhất với nhu cầu của bạn. Không giới hạn thời gian sử dụng.</p>
                    </div>
                    {/* ✨ THAY ĐỔI: Cập nhật lại toàn bộ bảng giá */}
                    <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PricingCard 
                            plan="Gói 1K" 
                            price="200.000đ"
                            features={[
                                "1.000 lượt tương tác",
                                "1 tương tác = 1 tin nhắn hoặc 1 kết bạn",
                                "Không giới hạn số lượng tài khoản Zalo",
                                "Bao gồm tất cả các tính năng",
                                "Hỗ trợ cơ bản qua email"
                            ]}
                        />
                        <PricingCard 
                            plan="Gói 3K" 
                            price="450.000đ"
                            popular
                            features={[
                                "3.000 lượt tương tác",
                                "Tiết kiệm 25% so với gói 1K",
                                "Không giới hạn số lượng tài khoản Zalo",
                                "Bao gồm tất cả các tính năng",
                                "Hỗ trợ ưu tiên qua Zalo"
                            ]}
                        />
                        <PricingCard 
                            plan="Gói 5K" 
                            price="600.000đ"
                            features={[
                                "5.000 lượt tương tác",
                                "Tiết kiệm 40% so với gói 1K",
                                "Không giới hạn số lượng tài khoản Zalo",
                                "Bao gồm tất cả các tính năng",
                                "Hỗ trợ trực tiếp qua điện thoại"
                            ]}
                        />
                    </div>
                </div>
            </section>

             {/* === FINAL CTA SECTION === */}
            <section className="text-center py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Sẵn Sàng Tăng Trưởng Cùng ZTOOL?
                    </h2>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                        Đừng bỏ lỡ cơ hội tiếp cận khách hàng và tự động hóa công việc kinh doanh của bạn.
                    </p>
                    <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-md transition duration-300 text-lg">
                        Bắt Đầu Ngay
                    </Link>
                </div>
            </section>
        </div>
    );
}

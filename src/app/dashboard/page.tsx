import { FiSend, FiUsers, FiBarChart2 } from 'react-icons/fi';

// Component cho các card thống kê
const StatCard = ({ icon, title, value, change }: { icon: React.ReactNode, title: string, value: string, change: string }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
        <p className="text-sm text-green-400 mt-4">{change}</p>
    </div>
);

export default function DashboardHomePage() {
    // Giả sử trang Tổng quan đang active
    // Trong thực tế bạn sẽ dùng usePathname() để xác định trang active
    var activePage = '/dashboard'; 

    return (
        <div className="flex-1 p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Tổng Quan</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<FiUsers size={24} />} title="Số lượng bạn bè" value="1,250" change="+15% so với tháng trước" />
                <StatCard icon={<FiSend size={24} />} title="Email Đã Gửi" value="25,600" change="+5.2% so với tuần trước" />
                <StatCard icon={<FiBarChart2 size={24} />} title="Tỷ Lệ Mở" value="24.5%" change="-1.1% so với chiến dịch trước" />
            </div>
            <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Chiến dịch gần đây</h2>
                <p className="text-gray-400">Đây là nơi hiển thị bảng dữ liệu các chiến dịch của bạn...</p>
            </div>
        </div>      
    );
}
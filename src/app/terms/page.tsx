// app/terms/page.tsx
import { FiAlertTriangle, FiShield, FiUserX, FiCheckCircle, FiLock } from 'react-icons/fi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
    title: "Điều khoản sử dụng (EULA) - ZTOOL",
    description: "Thỏa thuận cấp phép người dùng cuối và chính sách sử dụng dịch vụ ZTOOL.",
};

export default function TermsPage() {
    return (
        <div className="bg-gray-900 text-gray-300 min-h-screen font-sans flex flex-col">
            <Header />

            <main className="flex-grow pt-24 md:pt-28"> 
                {/* pt-24 để bù cho Header fixed */}
                <div className="container mx-auto px-6 py-12 max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Điều Khoản Sử Dụng</h1>
                        <p className="text-gray-400">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>

                    {/* === KHỐI CẢNH BÁO QUAN TRỌNG === */}
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FiAlertTriangle size={100} className="text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-xl md:text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                                <FiAlertTriangle /> MIỄN TRỪ TRÁCH NHIỆM & KHÓA TÀI KHOẢN
                            </h2>
                            <ul className="space-y-3 text-gray-200">
                                <li className="flex items-start gap-3">
                                    <FiCheckCircle className="mt-1 text-red-400 shrink-0" />
                                    <span>
                                        <strong>Người dùng tự chịu trách nhiệm dữ liệu:</strong> Bạn hoàn toàn chịu trách nhiệm về nội dung tin nhắn, hình ảnh và danh sách khách hàng mà bạn gửi đi thông qua ZTOOL. Chúng tôi không kiểm soát và không chịu trách nhiệm về tính hợp pháp của nội dung bạn tạo ra.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <FiCheckCircle className="mt-1 text-red-400 shrink-0" />
                                    <span>
                                        <strong>Rủi ro khóa tài khoản Zalo:</strong> Việc gửi tin nhắn hàng loạt hoặc kết bạn tự động có thể vi phạm chính sách chống Spam của Zalo. ZTOOL chỉ là công cụ hỗ trợ thao tác, <strong>chúng tôi KHÔNG chịu trách nhiệm và KHÔNG hoàn tiền</strong> trong trường hợp tài khoản Zalo của bạn bị khóa, hạn chế hoặc xóa vĩnh viễn do sử dụng công cụ này.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* === CÁC ĐIỀU KHOẢN CHI TIẾT === */}
                    <div className="space-y-10">
                        
                        {/* 1. Chấp thuận EULA */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Thỏa thuận cấp phép người dùng cuối (EULA)</h2>
                            <p className="mb-4">
                                Bằng cách tải xuống, cài đặt hoặc sử dụng ứng dụng ZTOOL, bạn đồng ý ràng buộc bởi các điều khoản này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.
                            </p>
                        </section>

                        {/* 2. Chính sách Nội dung */}
                        <section className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <FiShield /> 2. Chính sách nội dung & Không khoan nhượng
                            </h2>
                            <p className="mb-4 font-semibold text-white">
                                Chúng tôi áp dụng chính sách "KHÔNG KHOAN NHƯỢNG" (Zero Tolerance) đối với các nội dung bị phản đối hoặc người dùng lạm dụng.
                            </p>
                            <p className="mb-4">Bạn bị nghiêm cấm tạo, tải lên hoặc chia sẻ các nội dung sau trên ZTOOL:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-300">
                                <li>Nội dung khiêu dâm, đồi trụy, khỏa thân.</li>
                                <li>Nội dung đe dọa, bắt nạt, quấy rối hoặc kích động bạo lực.</li>
                                <li>Ngôn từ thù địch, phân biệt chủng tộc, tôn giáo hoặc giới tính.</li>
                                <li>Hoạt động lừa đảo, spam ác ý hoặc vi phạm pháp luật hiện hành.</li>
                            </ul>
                            <p className="text-sm text-gray-400 italic">
                                Vi phạm các điều này sẽ dẫn đến việc chấm dứt tài khoản ngay lập tức mà không cần báo trước.
                            </p>
                        </section>

                        {/* 3. Cơ chế Kiểm duyệt & Báo cáo */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <FiLock /> 3. Kiểm duyệt, Báo cáo & Chặn người dùng
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">3.1. Lọc nội dung (Filtering)</h3>
                                    <p>Hệ thống ZTOOL sử dụng các biện pháp kỹ thuật và danh sách từ khóa đen để tự động quét và ngăn chặn các nội dung không phù hợp trước khi chúng được hiển thị.</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">3.2. Báo cáo vi phạm (Flagging)</h3>
                                    <p>Người dùng có thể báo cáo bất kỳ nội dung hoặc người dùng nào vi phạm bằng nút chức năng <strong>"Báo cáo" (Report)</strong> hoặc <strong>"Gắn cờ" (Flag)</strong> hiển thị cạnh nội dung đó.</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">3.3. Chặn người dùng (Blocking)</h3>
                                    <p>ZTOOL cung cấp tính năng <strong>"Chặn" (Block)</strong>. Khi bạn chặn một người dùng:</p>
                                    <ul className="list-disc pl-6 mt-2 text-gray-400">
                                        <li>Mọi nội dung từ người dùng đó sẽ bị ẩn khỏi nguồn cấp dữ liệu của bạn <strong>ngay lập tức</strong>.</li>
                                        <li>Hệ thống sẽ tự động gửi thông báo về người dùng bị chặn tới đội ngũ quản trị viên của ZTOOL để xem xét.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. Cam kết xử lý của Nhà phát triển */}
                        <section className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">
                                <FiUserX /> 4. Cam kết xử lý vi phạm trong 24 giờ
                            </h2>
                            <p className="mb-3">
                                Đội ngũ phát triển ZTOOL cam kết duy trì môi trường an toàn. Đối với các báo cáo về nội dung bị phản đối (objectionable content reports):
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">24 GIỜ</span>
                                    <span>Chúng tôi sẽ xem xét và hành động trong vòng 24 giờ kể từ khi nhận được báo cáo.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">HÀNH ĐỘNG</span>
                                    <span>Nội dung vi phạm sẽ bị xóa bỏ và người dùng cung cấp nội dung đó sẽ bị khóa tài khoản vĩnh viễn (eject user).</span>
                                </li>
                            </ul>
                        </section>

                        {/* 5. Quyền sở hữu trí tuệ */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Quyền sở hữu trí tuệ</h2>
                            <p>
                                ZTOOL và toàn bộ nội dung, tính năng và chức năng ban đầu của nó thuộc sở hữu độc quyền của Công ty TNHH Giải Pháp Số TOP TOP. Bạn không được sao chép, sửa đổi hoặc phân phối mã nguồn của chúng tôi mà không có sự cho phép.
                            </p>
                        </section>

                        {/* 6. Liên hệ */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Liên hệ</h2>
                            <p>Nếu bạn có bất kỳ câu hỏi nào về Điều khoản này, vui lòng liên hệ:</p>
                            <ul className="mt-2 text-gray-400">
                                <li>Email: ztool.ai.vn@gmail.com</li>
                                <li>Hotline: 081.656.0000</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
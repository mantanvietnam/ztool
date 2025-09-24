// app/addFriend/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { FiSend } from 'react-icons/fi';

export default function AddFriendAutoPage() {
    // State để lưu danh sách số điện thoại từ textarea
    const [phoneList, setPhoneList] = useState('');
    // State cho các thông báo và trạng thái loading
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    //const activePage = '/addFriendAuto'; 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // 1. Tách chuỗi thành mảng các dòng
        const lines = phoneList.split('\n');

        // 2. Dọn dẹp từng số điện thoại và loại bỏ các dòng trống
        const cleanedPhones = lines
            .map(phone => phone.replace(/[\s.,]/g, '')) // Xóa dấu cách, chấm, phẩy
            .filter(phone => phone.length > 0); // Lọc ra các dòng rỗng

        if (cleanedPhones.length === 0) {
            setError('Vui lòng nhập ít nhất một số điện thoại.');
            return;
        }

        setLoading(true);

        try {
            const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/apis/addFriendAutoAPI`;
            
            // 3. Gửi yêu cầu đến API
            // Giả sử API nhận một object có key là `phones` chứa mảng số điện thoại
            const response = await axios.post(apiEndpoint, {
                phones: cleanedPhones,
            });

            // 4. Xử lý kết quả trả về
            if (response.data.code === 1) {
                setSuccessMessage('Yêu cầu kết bạn đã được gửi thành công!');
                setPhoneList(''); // Xóa nội dung textarea sau khi thành công
            } else {
                setError(response.data.messages || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (err) {
            console.error('API Error:', err);
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Giao diện chính của trang, sẽ nằm bên trong layout của Dashboard
        <div className="flex-1 p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">Kết Bạn Tự Động</h1>

            <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="phoneList" className="block text-sm font-medium text-gray-300 mb-2">
                            Danh sách số điện thoại (mỗi số một dòng)
                        </label>
                        <textarea
                            id="phoneList"
                            rows={10}
                            value={phoneList}
                            onChange={(e) => setPhoneList(e.target.value)}
                            className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="0912345678&#10;0987.654.321&#10;0123 456 789"
                        />
                    </div>

                    {/* Hiển thị thông báo Lỗi hoặc Thành công */}
                    {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}
                    {successMessage && <div className="bg-green-500/20 text-green-300 p-3 rounded-md text-sm">{successMessage}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
                        >
                            {loading ? (
                                'Đang xử lý...'
                            ) : (
                                <>
                                    <FiSend />
                                    Gửi yêu cầu
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
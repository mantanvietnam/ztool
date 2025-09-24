// app/register/page.tsx

import { Suspense } from 'react';
import RegisterForm from './RegisterForm'; // Import component bạn vừa đổi tên

// Component hiển thị khi form đang được tải
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            Đang tải trang đăng ký...
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <RegisterForm />
        </Suspense>
    );
}
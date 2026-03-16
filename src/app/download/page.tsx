// src/app/download/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { FiDownload, FiSmartphone } from 'react-icons/fi';
import { FaApple, FaAndroid, FaWindows, FaLinux } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// TẬP TRUNG CÁC LINK TẢI VỀ TẠI ĐÂY ĐỂ DỄ QUẢN LÝ VERSION
const DOWNLOAD_LINKS = {
    android: "https://play.google.com/store/apps/details?id=vn.ai.ztool",
    ios: "https://apps.apple.com/us/app/ztool-ch%C4%83m-s%C3%B3c-kh%C3%A1ch-h%C3%A0ng/id6757388487",
    macos: "https://ztool.phoenixtech.vn/downloads/Ztool-1.0.0-arm64.dmg", 
    windows: "https://ztool.phoenixtech.vn/downloads/Ztool%20Setup%201.0.0.exe", 
    linux: "https://ztool.phoenixtech.vn/downloads/Ztool-1.0.0.AppImage",
};

type OS = 'android' | 'ios' | 'macos' | 'windows' | 'linux' | 'unknown';

export default function DownloadPage() {
    const [os, setOs] = useState<OS>('unknown');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/android/i.test(userAgent)) {
            setOs('android');
        } else if (/iphone|ipad|ipod/i.test(userAgent)) {
            setOs('ios');
        } else if (/mac/i.test(userAgent)) {
            setOs('macos');
        } else if (/win/i.test(userAgent)) {
            setOs('windows');
        } else if (/linux/i.test(userAgent)) {
            setOs('linux');
        }
        setIsLoading(false);
    }, []);

    const getMainDownloadInfo = () => {
        switch (os) {
            case 'android':
                return { name: 'Android', icon: <FaAndroid size={32} />, link: DOWNLOAD_LINKS.android, desc: 'Tải trực tiếp từ Google Play' };
            case 'ios':
                return { name: 'iOS', icon: <FaApple size={32} />, link: DOWNLOAD_LINKS.ios, desc: 'Tải trực tiếp từ App Store' };
            case 'macos':
                return { name: 'macOS', icon: <FaApple size={32} />, link: DOWNLOAD_LINKS.macos, desc: 'Tải bộ cài đặt cho Mac (Apple Silicon / Intel)' };
            case 'windows':
                return { name: 'Windows', icon: <FaWindows size={32} />, link: DOWNLOAD_LINKS.windows, desc: 'Tải bộ cài đặt cho Windows 10/11' };
            case 'linux':
                return { name: 'Linux', icon: <FaLinux size={32} />, link: DOWNLOAD_LINKS.linux, desc: 'Tải gói .deb cho Debian/Ubuntu' };
            default:
                return null;
        }
    };

    const mainInfo = getMainDownloadInfo();

    return (
        <div className="bg-gray-900 text-gray-300 min-h-screen font-sans flex flex-col">
            <Header />

            <main className="flex-grow pt-24 md:pt-32 pb-12">
                <div className="container mx-auto px-6 max-w-6xl">
                    
                    {/* KHỐI 1: TỰ ĐỘNG NHẬN DIỆN VÀ ĐỀ XUẤT */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                            Tải <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">ZTOOL</span> cho thiết bị của bạn
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
                            Trải nghiệm công cụ chăm sóc khách hàng toàn diện. Hệ thống tự động nhận diện thiết bị để cung cấp phiên bản phù hợp nhất.
                        </p>

                        {!isLoading && mainInfo && (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 border border-blue-500/30 rounded-3xl max-w-xl mx-auto backdrop-blur-sm shadow-2xl shadow-blue-900/20">
                                <div className="text-blue-400 mb-4">{mainInfo.icon}</div>
                                <h2 className="text-2xl font-bold text-white mb-2">ZTOOL cho {mainInfo.name}</h2>
                                <p className="text-gray-400 mb-8">{mainInfo.desc}</p>
                                
                                <a 
                                    href={mainInfo.link} 
                                    target={['android', 'ios'].includes(os) ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30"
                                >
                                    <FiDownload size={24} />
                                    Tải Về Ngay
                                </a>
                            </div>
                        )}
                        
                        {!isLoading && !mainInfo && (
                            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl max-w-xl mx-auto">
                                <p className="text-gray-400">Vui lòng chọn nền tảng của bạn ở danh sách bên dưới.</p>
                            </div>
                        )}
                    </div>

                    {/* KHỐI 2: TÙY CHỌN DANH SÁCH ĐẦY ĐỦ CÁC NỀN TẢNG */}
                    <div className="mt-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-gray-700 flex-grow"></div>
                            <h3 className="text-xl font-semibold text-gray-400 px-4 uppercase tracking-wider text-sm">Tất cả các phiên bản Ztool hỗ trợ</h3>
                            <div className="h-px bg-gray-700 flex-grow"></div>
                        </div>

                        {/* Sử dụng lg:grid-cols-5 để hiển thị 5 nền tảng trên 1 hàng ở màn hình lớn */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            
                            {/* Windows */}
                            <a href={DOWNLOAD_LINKS.windows} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaWindows size={40} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                <h4 className="text-lg font-bold text-white mb-1">Windows</h4>
                                <p className="text-xs text-gray-400 mb-4">Windows 10, 11</p>
                                <span className="mt-auto text-sm font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải file .exe <FiDownload />
                                </span>
                            </a>

                            {/* macOS */}
                            <a href={DOWNLOAD_LINKS.macos} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-gray-300/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaApple size={40} className="text-gray-500 group-hover:text-gray-200 mb-4 transition-colors" />
                                <h4 className="text-lg font-bold text-white mb-1">macOS</h4>
                                <p className="text-xs text-gray-400 mb-4">Apple Silicon & Intel</p>
                                <span className="mt-auto text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải file .dmg <FiDownload />
                                </span>
                            </a>

                            {/* Linux */}
                            <a href={DOWNLOAD_LINKS.linux} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-yellow-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaLinux size={40} className="text-gray-500 group-hover:text-yellow-400 mb-4 transition-colors" />
                                <h4 className="text-lg font-bold text-white mb-1">Linux</h4>
                                <p className="text-xs text-gray-400 mb-4">Debian / Ubuntu</p>
                                <span className="mt-auto text-sm font-medium text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải file .deb <FiDownload />
                                </span>
                            </a>

                            {/* iOS */}
                            <a href={DOWNLOAD_LINKS.ios} target="_blank" rel="noopener noreferrer" className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FiSmartphone size={40} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                <h4 className="text-lg font-bold text-white mb-1">iOS</h4>
                                <p className="text-xs text-gray-400 mb-4">iPhone & iPad</p>
                                <span className="mt-auto text-sm font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    App Store <FiDownload />
                                </span>
                            </a>

                            {/* Android */}
                            <a href={DOWNLOAD_LINKS.android} target="_blank" rel="noopener noreferrer" className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaAndroid size={40} className="text-gray-500 group-hover:text-emerald-400 mb-4 transition-colors" />
                                <h4 className="text-lg font-bold text-white mb-1">Android</h4>
                                <p className="text-xs text-gray-400 mb-4">Từ Android 8.0</p>
                                <span className="mt-auto text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Google Play <FiDownload />
                                </span>
                            </a>

                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
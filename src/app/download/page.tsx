// src/app/download/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { FiDownload, FiSmartphone } from 'react-icons/fi';
import { FaApple, FaAndroid, FaWindows, FaLinux } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// === CẬP NHẬT: TÍCH HỢP BIẾN MÔI TRƯỜNG ===
const DOWNLOAD_LINKS = {
    android: "https://play.google.com/store/apps/details?id=vn.ai.ztool",
    ios: "https://apps.apple.com/us/app/ztool-ch%C4%83m-s%C3%B3c-kh%C3%A1ch-h%C3%A0ng/id6757388487",
    
    // Links cho Mac (Tách biệt Chip M và Intel)
    macApple: process.env.NEXT_PUBLIC_LINK_MAC_APPLE || "https://ztool.phoenixtech.vn/downloads/latest/ztool-arm64-mac.dmg", 
    macIntel: process.env.NEXT_PUBLIC_LINK_MAC_INTEL || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x64-mac.dmg",
    
    // Links cho Windows (Tách biệt 64-bit và 32-bit)
    windows64: process.env.NEXT_PUBLIC_LINK_WIN64 || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x64-setup.exe", 
    windows32: process.env.NEXT_PUBLIC_LINK_WIN32 || "https://ztool.phoenixtech.vn/downloads/latest/ztool-ia32-setup.exe", 
    
    // Link cho Linux
    linux: process.env.NEXT_PUBLIC_LINK_LINUX || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x86_64.AppImage",
};

type OS = 'android' | 'ios' | 'mac-intel' | 'mac-apple' | 'mac-unknown' | 'windows-32' | 'windows-64' | 'linux' | 'unknown';

export default function DownloadPage() {
    const [os, setOs] = useState<OS>('unknown');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const detectOS = async () => {
            try {
                // Lấy chuỗi định danh trình duyệt và chuyển hết về chữ thường để dễ quét
                const ua = window.navigator.userAgent.toLowerCase();

                // 1. Nhận diện Mobile (iOS / Android)
                if (/android/.test(ua)) return 'android';
                if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';

                // 2. Nhận diện Windows (Chính xác đến từng Bit)
                if (/windows|win32|win64/.test(ua)) {
                    // Nếu trong chuỗi có chứa x64, win64 hoặc wow64 -> Chắc chắn là máy 64-bit
                    if (/win64|x64|wow64/.test(ua)) return 'windows-64';
                    // Ngược lại, đích thị là máy tính Windows đời cũ 32-bit
                    return 'windows-32'; 
                }

                // 3. Nhận diện MacBook / iMac
                if (/macintosh|mac os x/.test(ua)) {
                    const nav = navigator as any;
                    // Thử dùng API hiện đại của Chromium để quét sâu vào con chip (M-series hay Intel)
                    if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
                        try {
                            const values = await nav.userAgentData.getHighEntropyValues(['architecture']);
                            if (values.architecture === 'arm') return 'mac-apple'; // Chip M1, M2, M3...
                            if (values.architecture === 'x86') return 'mac-intel'; // Chip Intel
                        } catch (e) {
                            console.warn("Không thể quét sâu kiến trúc chip Mac");
                        }
                    }
                    // Nếu người dùng dùng Safari (Apple giấu thông tin chip), ta đành hiện cả 2 nút cho họ chọn
                    return 'mac-unknown';
                }

                // 4. Nhận diện Linux
                if (/linux/.test(ua)) return 'linux';

                return 'unknown';
            } catch (error) {
                console.error("Lỗi kịch bản nhận diện OS:", error);
                return 'unknown'; // Nếu lỗi, fallback về unknown thay vì sập web
            }
        };

        detectOS().then((detectedOS) => {
            setOs(detectedOS as OS);
            setIsLoading(false);
        });
    }, []);

    // Render nút tải chính dựa trên hệ điều hành đã nhận diện
    const renderPrimaryDownload = () => {
        if (isLoading) {
            return <div className="h-16 w-64 bg-gray-800 animate-pulse rounded-2xl mx-auto"></div>;
        }

        switch (os) {
            case 'windows-64':
            case 'windows-32':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <a href={os === 'windows-64' ? DOWNLOAD_LINKS.windows64 : DOWNLOAD_LINKS.windows32} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30">
                            <FaWindows size={24} /> Tải {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} cho Windows
                        </a>
                        <p className="text-gray-400 text-sm">
                            Đã nhận diện: Windows {os === 'windows-64' ? '64-bit' : '32-bit'}
                            <span className="mx-2">•</span>
                            <a href={os === 'windows-64' ? DOWNLOAD_LINKS.windows32 : DOWNLOAD_LINKS.windows64} className="text-blue-400 hover:underline">
                                Tải bản {os === 'windows-64' ? '32-bit' : '64-bit'}
                            </a>
                        </p>
                    </div>
                );
            
            case 'mac-apple':
            case 'mac-intel':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <a href={os === 'mac-apple' ? DOWNLOAD_LINKS.macApple : DOWNLOAD_LINKS.macIntel} className="flex items-center gap-3 bg-gray-100 hover:bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-white/10">
                            <FaApple size={24} /> Tải {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} cho macOS
                        </a>
                        <p className="text-gray-400 text-sm">
                            Đã nhận diện: Mac {os === 'mac-apple' ? '(Apple Silicon)' : '(Intel)'}
                            <span className="mx-2">•</span>
                            <a href={os === 'mac-apple' ? DOWNLOAD_LINKS.macIntel : DOWNLOAD_LINKS.macApple} className="text-gray-300 hover:underline">
                                Tải bản cho chip {os === 'mac-apple' ? 'Intel' : 'Apple M-Series'}
                            </a>
                        </p>
                    </div>
                );
            
            case 'mac-unknown':
                // Dành riêng cho trình duyệt Safari trên Mac không nhận diện được chip
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href={DOWNLOAD_LINKS.macApple} className="flex items-center gap-3 bg-gray-100 hover:bg-white text-black px-6 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg">
                            <FaApple size={24} /> Mac (Chip M1/M2/M3...)
                        </a>
                        <a href={DOWNLOAD_LINKS.macIntel} className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-6 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg">
                            <FaApple size={24} /> Mac (Chip Intel)
                        </a>
                    </div>
                );

            case 'linux':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <a href={DOWNLOAD_LINKS.linux} className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30">
                            <FaLinux size={24} /> Tải {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} cho Linux (.AppImage)
                        </a>
                    </div>
                );

            case 'android':
                return (
                    <a href={DOWNLOAD_LINKS.android} className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30">
                        <FaAndroid size={24} /> Tải App {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} trên Android
                    </a>
                );

            case 'ios':
                return (
                    <a href={DOWNLOAD_LINKS.ios} className="flex items-center gap-3 bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30">
                        <FaApple size={24} /> Tải App {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} trên iOS
                    </a>
                );

            default:
                // Fallback nếu không nhận diện được OS
                return (
                    <div className="text-gray-400">
                        Vui lòng chọn phiên bản phù hợp ở danh sách bên dưới.
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-blue-500/30">
            <Header />

            <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl w-full relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Tải Xuống {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'}
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Trải nghiệm công cụ quản lý và tự động hóa mạnh mẽ nhất. 
                            Hoạt động mượt mà trên mọi nền tảng thiết bị của bạn.
                        </p>
                    </div>

                    {/* Vùng Render Nút Tải Động */}
                    <div className="flex justify-center mb-24 min-h-[100px]">
                        {renderPrimaryDownload()}
                    </div>

                    {/* Lưới hiển thị TẤT CẢ các phiên bản (Cho người dùng tải hộ máy khác) */}
                    <div>
                        <h3 className="text-center text-gray-500 font-medium tracking-widest uppercase text-sm mb-8 flex items-center justify-center gap-4">
                            <span className="w-12 h-[1px] bg-gray-800"></span>
                            Hoặc tải cho nền tảng khác
                            <span className="w-12 h-[1px] bg-gray-800"></span>
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            
                            {/* Windows 64 */}
                            <a href={DOWNLOAD_LINKS.windows64} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaWindows size={40} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Win 64-bit</h4>
                                <span className="mt-auto text-xs font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Windows 32 */}
                            <a href={DOWNLOAD_LINKS.windows32} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaWindows size={40} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Win 32-bit</h4>
                                <span className="mt-auto text-xs font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Mac Apple Silicon */}
                            <a href={DOWNLOAD_LINKS.macApple} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-white/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaApple size={40} className="text-gray-500 group-hover:text-white mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Mac M-Series</h4>
                                <span className="mt-auto text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Mac Intel */}
                            <a href={DOWNLOAD_LINKS.macIntel} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-white/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaApple size={40} className="text-gray-500 group-hover:text-white mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Mac Intel</h4>
                                <span className="mt-auto text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Linux */}
                            <a href={DOWNLOAD_LINKS.linux} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-yellow-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaLinux size={40} className="text-gray-500 group-hover:text-yellow-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Linux</h4>
                                <span className="mt-auto text-xs font-medium text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Mobile (iOS/Android) */}
                            <div className="flex flex-col gap-2">
                                <a href={DOWNLOAD_LINKS.ios} className="group flex-1 flex items-center justify-center gap-2 p-2 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all">
                                    <FiSmartphone className="text-gray-400 group-hover:text-blue-400" />
                                    <span className="text-xs font-bold text-gray-300 group-hover:text-white">iOS App</span>
                                </a>
                                <a href={DOWNLOAD_LINKS.android} className="group flex-1 flex items-center justify-center gap-2 p-2 bg-gray-800/40 border border-gray-700 hover:border-emerald-500/50 rounded-xl transition-all">
                                    <FaAndroid className="text-gray-400 group-hover:text-emerald-400" />
                                    <span className="text-xs font-bold text-gray-300 group-hover:text-white">Android App</span>
                                </a>
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
// src/app/download/page.tsx
"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import { FiCheckCircle, FiDownload, FiDownloadCloud, FiLogIn, FiSmartphone } from 'react-icons/fi';
import { FaApple, FaAndroid, FaWindows, FaLinux } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DOWNLOAD_LINKS = {
    android: "https://play.google.com/store/apps/details?id=vn.ai.ztool",
    ios: "https://apps.apple.com/us/app/ztool-ch%C4%83m-s%C3%B3c-kh%C3%A1ch-h%C3%A0ng/id6757388487",

    macApple: process.env.NEXT_PUBLIC_LINK_MAC_APPLE || "https://ztool.phoenixtech.vn/downloads/latest/ztool-arm64-mac.dmg",
    macIntel: process.env.NEXT_PUBLIC_LINK_MAC_INTEL || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x64-mac.dmg",

    windows64: process.env.NEXT_PUBLIC_LINK_WIN64 || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x64-setup.exe",
    windows32: process.env.NEXT_PUBLIC_LINK_WIN32 || "https://ztool.phoenixtech.vn/downloads/latest/ztool-ia32-setup.exe",
    windowsArm: process.env.NEXT_PUBLIC_LINK_WIN_ARM || "https://ztool.phoenixtech.vn/downloads/latest/ztool-arm64-setup.exe",

    linux64: process.env.NEXT_PUBLIC_LINK_LINUX || "https://ztool.phoenixtech.vn/downloads/latest/ztool-x86_64.AppImage",
    linuxArm: process.env.NEXT_PUBLIC_LINK_LINUX_ARM || "https://ztool.phoenixtech.vn/downloads/latest/ztool-arm64.AppImage",
};

type OS =
    | 'android'
    | 'ios'
    | 'mac-intel'
    | 'mac-apple'
    | 'mac-unknown'
    | 'windows-32'
    | 'windows-64'
    | 'windows-arm'
    | 'linux-64'
    | 'linux-arm'
    | 'unknown';

type NavigatorWithUserAgentData = Navigator & {
    userAgentData?: {
        getHighEntropyValues?: (hints: string[]) => Promise<{
            architecture?: string;
            bitness?: string;
        }>;
    };
};

const FIREWORK_BURSTS = [
    { top: '8%', left: '12%', delay: 0 },
    { top: '14%', left: '84%', delay: 0.35 },
    { top: '34%', left: '24%', delay: 0.7 },
    { top: '38%', left: '76%', delay: 1.05 },
];

const FIREWORK_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185'];
const FIREWORK_PARTICLES = Array.from({ length: 12 }, (_, index) => index);

function RegistrationCelebration() {
    return (
        <div className="celebration-fireworks fixed inset-0 z-[60] overflow-hidden pointer-events-none" aria-hidden="true">
            {FIREWORK_BURSTS.map((burst, burstIndex) => (
                <div
                    key={`${burst.top}-${burst.left}`}
                    className="firework-burst absolute"
                    style={{ top: burst.top, left: burst.left }}
                >
                    {FIREWORK_PARTICLES.map((particleIndex) => (
                        <span
                            key={particleIndex}
                            className="firework-particle absolute rounded-full"
                            style={{
                                '--firework-angle': `${particleIndex * 30}deg`,
                                '--firework-delay': `${burst.delay + burstIndex * 0.05}s`,
                                '--firework-distance': `-${52 + (particleIndex % 3) * 12}px`,
                                backgroundColor: FIREWORK_COLORS[(particleIndex + burstIndex) % FIREWORK_COLORS.length],
                                color: FIREWORK_COLORS[(particleIndex + burstIndex) % FIREWORK_COLORS.length],
                            } as CSSProperties}
                        />
                    ))}
                </div>
            ))}

            <style jsx>{`
                .firework-particle {
                    width: 7px;
                    height: 7px;
                    box-shadow: 0 0 10px currentColor;
                    animation: firework-particle 1.8s ease-out var(--firework-delay) 3 both;
                }

                @keyframes firework-particle {
                    0%, 10% {
                        opacity: 0;
                        transform: rotate(var(--firework-angle)) translateY(0) scale(0.2);
                    }
                    20% {
                        opacity: 1;
                    }
                    75%, 100% {
                        opacity: 0;
                        transform: rotate(var(--firework-angle)) translateY(var(--firework-distance)) scale(1);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .celebration-fireworks {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}

export default function DownloadPage() {
    const [os, setOs] = useState<OS>('unknown');
    const [isLoading, setIsLoading] = useState(true);
    const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

    useEffect(() => {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('registered') === 'success') {
            setShowRegistrationSuccess(true);
            currentUrl.searchParams.delete('registered');
            window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        }

        const detectOS = async () => {
            try {
                const ua = window.navigator.userAgent.toLowerCase();

                if (/android/.test(ua)) return 'android';
                if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';

                const nav = navigator as NavigatorWithUserAgentData;
                let architecture = '';
                let bitness = '';

                if (nav.userAgentData?.getHighEntropyValues) {
                    try {
                        const values = await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
                        architecture = values.architecture?.toLowerCase() || '';
                        bitness = values.bitness || '';
                    } catch {
                        console.warn("Không thể nhận diện chính xác kiến trúc thiết bị");
                    }
                }

                const isArm = architecture === 'arm' || /arm64|aarch64|armv8/.test(ua);
                const is64Bit = bitness === '64' || /win64|x64|wow64|x86_64|amd64/.test(ua);

                if (/windows|win32|win64/.test(ua)) {
                    if (isArm) return 'windows-arm';
                    if (is64Bit) return 'windows-64';
                    return 'windows-32';
                }

                if (/macintosh|mac os x/.test(ua)) {
                    if (isArm) return 'mac-apple';
                    if (architecture === 'x86') return 'mac-intel';
                    return 'mac-unknown';
                }

                if (/linux/.test(ua)) {
                    if (isArm) return 'linux-arm';
                    return 'linux-64';
                }

                return 'unknown';
            } catch (error) {
                console.error("Lỗi kịch bản nhận diện OS:", error);
                return 'unknown';
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
            case 'windows-arm':
            case 'windows-64':
            case 'windows-32': {
                const windowsVersions = [
                    { os: 'windows-64', label: '64-bit', href: DOWNLOAD_LINKS.windows64 },
                    { os: 'windows-32', label: '32-bit', href: DOWNLOAD_LINKS.windows32 },
                    { os: 'windows-arm', label: 'ARM64', href: DOWNLOAD_LINKS.windowsArm },
                ];
                const detectedVersion = windowsVersions.find((version) => version.os === os) || windowsVersions[0];

                return (
                    <div className="flex flex-col items-center gap-4">
                        <a href={detectedVersion.href} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30">
                            <FaWindows size={24} /> Tải {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} cho Windows
                        </a>
                        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-gray-400 text-sm">
                            <span>Đã nhận diện: Windows {detectedVersion.label}</span>
                            {windowsVersions
                                .filter((version) => version.os !== os)
                                .map((version) => (
                                    <span key={version.os} className="flex items-center gap-2">
                                        <span>•</span>
                                        <a href={version.href} className="text-blue-400 hover:underline">
                                            Tải bản {version.label}
                                        </a>
                                    </span>
                                ))}
                        </div>
                    </div>
                );
            }
            
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

            case 'linux-arm':
            case 'linux-64': {
                const isLinuxArm = os === 'linux-arm';

                return (
                    <div className="flex flex-col items-center gap-4">
                        <a href={isLinuxArm ? DOWNLOAD_LINKS.linuxArm : DOWNLOAD_LINKS.linux64} className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30">
                            <FaLinux size={24} /> Tải {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} cho Linux (.AppImage)
                        </a>
                        <p className="text-gray-400 text-sm">
                            Đã nhận diện: Linux {isLinuxArm ? 'ARM64' : '64-bit'}
                            <span className="mx-2">•</span>
                            <a href={isLinuxArm ? DOWNLOAD_LINKS.linux64 : DOWNLOAD_LINKS.linuxArm} className="text-yellow-400 hover:underline">
                                Tải bản {isLinuxArm ? '64-bit' : 'ARM64'}
                            </a>
                        </p>
                    </div>
                );
            }

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
            {showRegistrationSuccess && <RegistrationCelebration />}
            <Header />

            <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl w-full relative z-10">
                    {showRegistrationSuccess && (
                        <section
                            role="status"
                            aria-live="polite"
                            className="animate-fade-in-down relative overflow-hidden mb-12 rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-violet-500/15 p-6 md:p-8 shadow-2xl shadow-emerald-500/10"
                        >
                            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"></div>
                            <div className="relative flex flex-col items-center text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                                    <FiCheckCircle size={36} />
                                </div>
                                <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-emerald-300">
                                    Đăng ký thành công
                                </p>
                                <h2 className="text-2xl font-black text-white md:text-4xl">
                                    Chúc mừng bạn đã gia nhập {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'}!
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
                                    Hãy tải ứng dụng hoặc phần mềm phù hợp với thiết bị để bắt đầu sử dụng. Các tính năng chính của {process.env.NEXT_PUBLIC_NAME_APP || 'ZTOOL'} được vận hành trên ứng dụng đã cài đặt.
                                </p>

                                <div className="mt-7 grid w-full max-w-3xl gap-3 text-left md:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="mb-2 flex items-center gap-2 font-bold text-white">
                                            <FiDownloadCloud className="text-blue-300" size={20} />
                                            <span>1. Chọn bộ cài</span>
                                        </div>
                                        <p className="text-sm leading-5 text-gray-400">Tải đúng phiên bản được gợi ý cho thiết bị của bạn.</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="mb-2 flex items-center gap-2 font-bold text-white">
                                            <FiSmartphone className="text-violet-300" size={20} />
                                            <span>2. Cài đặt ứng dụng</span>
                                        </div>
                                        <p className="text-sm leading-5 text-gray-400">Mở file vừa tải và hoàn tất các bước cài đặt.</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="mb-2 flex items-center gap-2 font-bold text-white">
                                            <FiLogIn className="text-emerald-300" size={20} />
                                            <span>3. Đăng nhập</span>
                                        </div>
                                        <p className="text-sm leading-5 text-gray-400">Dùng số điện thoại và mật khẩu bạn vừa đăng ký.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

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
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            
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

                            {/* Windows ARM */}
                            <a href={DOWNLOAD_LINKS.windowsArm} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaWindows size={40} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Win ARM64</h4>
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

                            {/* Linux 64 */}
                            <a href={DOWNLOAD_LINKS.linux64} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-yellow-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaLinux size={40} className="text-gray-500 group-hover:text-yellow-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Linux 64-bit</h4>
                                <span className="mt-auto text-xs font-medium text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Tải về <FiDownload />
                                </span>
                            </a>

                            {/* Linux ARM */}
                            <a href={DOWNLOAD_LINKS.linuxArm} className="group p-6 bg-gray-800/40 border border-gray-700 hover:border-yellow-500/50 rounded-2xl transition-all duration-300 flex flex-col items-center text-center">
                                <FaLinux size={40} className="text-gray-500 group-hover:text-yellow-400 mb-4 transition-colors" />
                                <h4 className="text-sm font-bold text-white mb-1">Linux ARM64</h4>
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

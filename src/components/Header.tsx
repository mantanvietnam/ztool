"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 transition-all duration-300">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 overflow-hidden rounded-lg bg-white/10 p-1">
                        <Image 
                            src="/logo-ztool-icon.png" 
                            alt="ZTOOL Logo" 
                            width={40} 
                            height={40} 
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <span className="text-2xl font-extrabold tracking-wide text-white">
                        ZTOOL<span className="text-blue-500">.</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-gray-300 hover:text-white font-medium transition-colors">Trang chủ</Link>
                    {/* Dùng /# để đảm bảo hoạt động từ trang con */}
                    <Link href="/#features" className="text-gray-300 hover:text-white font-medium transition-colors">Tính năng</Link>
                    <Link href="/#pricing" className="text-gray-300 hover:text-white font-medium transition-colors">Bảng giá</Link>
                    <Link href="/terms" className="text-gray-300 hover:text-white font-medium transition-colors">Điều khoản</Link>
                </nav>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                    <Link href="/login" className="text-gray-300 hover:text-white font-bold px-4 py-2 transition-colors">
                        Đăng nhập
                    </Link>
                    <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
                        Đăng ký
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button onClick={toggleMenu} className="md:hidden text-gray-300 hover:text-white focus:outline-none">
                    {isMobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-800 border-t border-gray-700 absolute w-full shadow-2xl h-screen">
                    <div className="flex flex-col px-6 py-4 space-y-4">
                        <Link href="/" onClick={toggleMenu} className="text-gray-300 hover:text-white py-2 block border-b border-gray-700/50">Trang chủ</Link>
                        <Link href="/#features" onClick={toggleMenu} className="text-gray-300 hover:text-white py-2 block border-b border-gray-700/50">Tính năng</Link>
                        <Link href="/#pricing" onClick={toggleMenu} className="text-gray-300 hover:text-white py-2 block border-b border-gray-700/50">Bảng giá</Link>
                        <Link href="/terms" onClick={toggleMenu} className="text-gray-300 hover:text-white py-2 block mb-4">Điều khoản</Link>
                        <div className="flex flex-col gap-3">
                            <Link href="/login" onClick={toggleMenu} className="text-center w-full border border-gray-600 text-gray-300 py-3 rounded-md font-bold hover:bg-gray-700 transition">
                                Đăng nhập
                            </Link>
                            <Link href="/register" onClick={toggleMenu} className="text-center w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition">
                                Đăng ký ngay
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
import React from 'react';
import { FiMapPin, FiPhone, FiMail, FiFacebook, FiYoutube } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="bg-gray-950 border-t border-gray-800 text-gray-400 py-12">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-10">
                    <div>
                        <h3 className="text-white text-xl font-bold mb-6 uppercase">
                            CÔNG TY TNHH GIẢI PHÁP SỐ TOP TOP
                        </h3>
                        <div className="space-y-3 text-sm leading-relaxed">
                            <p><strong>Mã số thuế:</strong> 0110048533</p>
                            <p><strong>Đại diện pháp luật:</strong> Nguyễn Thị Kim Oanh</p>
                            <p><strong>Ngày cấp giấy phép:</strong> 01/07/2022</p>
                            <div className="flex items-start gap-2">
                                <FiMapPin className="mt-1 flex-shrink-0 text-blue-500" />
                                <span><strong>Địa chỉ:</strong> 18 Thanh Bình, Mỗ Lao, Hà Đông, Hà Nội</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:text-right flex flex-col md:items-end">
                            <h3 className="text-white text-xl font-bold mb-6">LIÊN HỆ VỚI CHÚNG TÔI</h3>
                            <div className="space-y-4">
                            <a href="tel:0816560000" className="flex items-center gap-3 md:justify-end hover:text-white transition-colors">
                                <span className="text-lg">081.656.0000</span>
                                <div className="bg-blue-600/20 p-2 rounded-full text-blue-500"><FiPhone /></div>
                            </a>
                            <a href="mailto:ztool.ai.vn@gmail.com" className="flex items-center gap-3 md:justify-end hover:text-white transition-colors">
                                <span>ztool.ai.vn@gmail.com</span>
                                <div className="bg-blue-600/20 p-2 rounded-full text-blue-500"><FiMail /></div>
                            </a>
                            
                            <div className="pt-4 flex gap-4 md:justify-end">
                                <a href="https://www.facebook.com/ztoolvn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-700/10 border border-blue-700/30 px-4 py-2 rounded-lg text-blue-400 hover:bg-blue-700 hover:text-white transition-all">
                                    <FiFacebook size={20}/>
                                    <span>Fanpage</span>
                                </a>
                                <a href="https://www.youtube.com/@ztoolaivn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 px-4 py-2 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all">
                                    <FiYoutube size={20}/>
                                    <span>Youtube</span>
                                </a>
                            </div>
                            </div>
                    </div>
                </div>
                
                <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-600">
                    &copy; {new Date().getFullYear()} ZTOOL. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
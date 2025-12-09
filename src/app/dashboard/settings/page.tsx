"use client";
import React, { useEffect, useState } from "react";
import { FiSend, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

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

const Input = ({ label, type = 'text', value, onChange, placeholder }: { label: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => (
    <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
        />
    </div>
);

const Button = ({ children, onClick, type = 'button' }: { children: React.ReactNode, onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, type?: "button" | "submit" | "reset" }) => (
    <button
        type={type}
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
        {children}
    </button>
);


export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [Email, setEmail] = useState('');
  const [Phone, setPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState(""); 
  const [successDosenotmatch, setSuccessDosenotmatch] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");    
  
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
     
        const formData = new FormData();
        formData.append("token", token);

        const response = await fetch("https://ztool.phoenixtech.vn/apis/getInfoMemberAPI", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.code === 0) {
          
          setUsername(data.data.full_name || '');
          setEmail(data.data.email || '');
          setPhone(data.data.phone || '');

          // ======================================================
          // ✨ PHẦN BỔ SUNG: CẬP NHẬT PROXY VÀO LOCALSTORAGE
          // ======================================================
          const userData = data.data;
          if (userData && userData.proxy) {
              const proxyRaw = userData.proxy;
              // Chuyển đổi sang định dạng chuẩn (host, port, user, pass, id)
              const formattedProxy = {
                  id: proxyRaw.id,
                  host: proxyRaw.ip,
                  port: proxyRaw.port,
                  user: proxyRaw.username,
                  pass: proxyRaw.password,
                  protocol: proxyRaw.protocol
              };
              localStorage.setItem('userProxy', JSON.stringify(formattedProxy));
          } else {
              // Nếu API trả về không có proxy -> Xóa cache cũ để tránh dùng proxy chết
              localStorage.removeItem('userProxy');
          }
          // ======================================================

        } else {
          console.log("Lỗi API:", data.mess);
        }
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
      }
    };

    fetchData();
  }, []);





    return (
        <div className="flex-1 p-6 md:p-8"> 
            <h1 className="text-3xl font-bold mb-6">Cài Đặt</h1>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center border-b border-gray-700 pb-2">
                    <FiUsers className="mr-2 text-blue-400" /> Thông tin tài khoản
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                    <label className="text-sm text-gray-400 mb-1">Tên tài khoản</label>
                    <input
                        type="text"
                        value={username}
                        disabled
                        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none cursor-not-allowed"
                    />
                    </div>

                    <div className="flex flex-col">
                    <label className="text-sm text-gray-400 mb-1">Email</label>
                    <input
                        type="email"
                        value={Email}
                        disabled
                        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none cursor-not-allowed"
                    />
                    </div>

                    <div className="flex flex-col md:col-span-2">
                    <label className="text-sm text-gray-400 mb-1">Số điện thoại</label>
                    <input
                        type="tel"
                        value={Phone}
                        disabled
                        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none cursor-not-allowed"
                    />
                    </div>
                </div>
            </div>
        </div>
    );
}
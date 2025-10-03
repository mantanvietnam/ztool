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


export default function PasswordPage() {
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
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
          setSuccessDosenotmatch("MẬT KHẨU MỚI VÀ XÁC NHẬN MẬT KHẨU KHÔNG KHỚP!");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert('Bạn chưa đăng nhập!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmNewPassword", confirmNewPassword);

      const response = await fetch("https://ztool.phoenixtech.vn/apis/changePasswordAPI", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.code === 0) {
        setSuccessMessage("ĐỔI MẬT KHẨU THÀNH CÔNG!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
         setErrorMessage(data.messages?.[0]?.text || "ĐỔI MẬT KHẨU THẤT BẠI!");
      }
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };


    return (
        <div className="flex-1 p-6 md:p-8"> 
            <h1 className="text-3xl font-bold mb-6">Cài Đặt</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FiLock className="mr-2" /> Đổi Mật Khẩu
                </h2>
                 {successMessage && (
                        <div className="mb-4 p-2 bg-green-600 text-white rounded">{successMessage}</div>
                    )}
                    {errorMessage && (
                        <div className="mb-4 p-2 bg-red-600 text-white rounded">{errorMessage}</div>
                )}     {successDosenotmatch && (
                        <div className="mb-4 p-2 bg-red-600 text-white rounded">{successDosenotmatch}</div>
                )}
                <form onSubmit={handleChangePassword}>
                    <div className="mb-4 ">
                        <label className="block text-white mb-1">Mật khẩu hiện tại</label>
                        
                      <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                            type={showCurrent ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            />
                            <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                            {showCurrent ? <FiEyeOff /> : <FiEye />}
                            </button>
                      </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-white mb-1">Mật khẩu mới</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showNew ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-white mb-1">Xác nhận mật khẩu mới</label>
                        <div className="relative ">
                              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Xác nhận mật khẩu mới"
                                className="w-full bg-gray-700 text-white pl-10 pr-10 py-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showConfirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
                    >
                        Đổi Mật Khẩu
                    </button>
                </form>

            </div>
        </div>
    );
}
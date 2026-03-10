'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiZap, FiX, FiShare2 } from 'react-icons/fi';

const REWARD_CONFIG = [
  { day: 1, point: 50 },
  { day: 2, point: 100 },
  { day: 3, point: 150 },
  { day: 4, point: 200 },
  { day: 5, point: 250 },
  { day: 6, point: 300 },
  { day: 7, point: 500, big: true },
];

export default function DailyCheckInModal() {
  const [visible, setVisible] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const [rewardPoint, setRewardPoint] = useState(0);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    checkAttendance();
    prepareReferralLink();
  }, []);

  const prepareReferralLink = () => {
    try {
        const affiliate_code = localStorage.getItem('affiliate_code');
        const phone = localStorage.getItem('userPhone');

        let code = 'ZTOOL';
        
        code = affiliate_code || phone || 'ZTOOLWEB';

        setReferralLink(`https://ztool.ai.vn/register/?aff=${code}`);
    } catch (e) {
        console.error(e);
    }
  };

  const checkAttendance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/saveLastLoginAPI`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token})
      });
      
      const data = await res.json();
      
      if (data && data.point_reward > 0) {
        setCurrentDay(data.number_day_login || 1);
        setRewardPoint(data.point_reward);
        setVisible(true);
      }
    } catch (error) { 
        console.error('Check Attendance Error:', error); 
    }
  };

  const handleShareToFacebook = () => {
    const promotionalText = `🚀 Ztool - Trợ lý ảo Zalo Marketing đỉnh cao!\n\n🎁 Nhận ngay bộ công cụ miễn phí tại: ${referralLink}`;
    // Mở popup share của Facebook trên nền web
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(promotionalText)}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-300">
      <div className="bg-gray-800 w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transform transition-all scale-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🎉</span>
            <h2 className="text-lg font-bold text-white">Điểm danh nhận quà</h2>
          </div>
          <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center w-full">
          <p className="text-gray-200 text-sm text-center mb-1">
            Chúc mừng bạn đã nhận được <span className="text-yellow-400 font-bold text-base">{rewardPoint} điểm</span> thưởng!
          </p>
          <p className="text-gray-400 text-xs text-center mb-5">Điểm danh liên tục 7 ngày để nhận quà lớn nhé.</p>

          {/* Grid Layout 4 cột */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {REWARD_CONFIG.map((item, index) => {
              const isToday = item.day === currentDay;
              const isPassed = item.day < currentDay;
              
              let bgClass = 'bg-gray-700 border-transparent';
              let textClass = 'text-gray-400';
              let iconColor = 'text-gray-500';

              if (isPassed) {
                bgClass = 'bg-emerald-900 border-transparent';
                textClass = 'text-emerald-400';
                iconColor = 'text-emerald-400';
              } else if (isToday) {
                bgClass = 'bg-blue-600 border-blue-400 border-2 shadow-lg';
                textClass = 'text-white';
                iconColor = 'text-yellow-400';
              }

              return (
                <div 
                    key={index} 
                    className={`flex flex-col items-center justify-center rounded-lg p-2 h-20 transition-all ${item.big ? 'col-span-2' : 'col-span-1'} ${bgClass}`}
                >
                  <span className={`text-[10px] font-semibold mb-1 ${textClass}`}>Ngày {item.day}</span>
                  <div className="my-1">
                    {isPassed ? (
                        <FiCheck className={iconColor} size={item.big ? 24 : 18} />
                    ) : (
                        <FiZap className={iconColor} size={item.big ? 24 : 18} />
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${isToday ? 'text-yellow-400' : textClass}`}>
                    +{item.point}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <button 
            onClick={handleShareToFacebook}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <FiShare2 size={20} className="mr-2" />
          Chia sẻ để nhận điểm
        </button>
        
        <button 
            onClick={() => setVisible(false)}
            className="mt-4 mx-auto block text-gray-400 text-sm hover:text-white underline"
        >
          Để sau
        </button>
      </div>
    </div>
  );
}
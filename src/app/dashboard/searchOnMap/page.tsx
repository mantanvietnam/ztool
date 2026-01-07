'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiSearch, FiCrosshair, FiLoader, FiAlertTriangle, FiDownload, FiUserPlus, FiMessageSquare, FiUsers, FiX, FiCheckCircle, FiEye, FiPlus, FiCreditCard, FiHelpCircle, FiPaperclip, FiTrash2, FiClock } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import axios from 'axios';

// --- HELPER FUNCTIONS (MỚI) ---
const MAP_SOURCE = process.env.NEXT_PUBLIC_MAP_SOURCE || 'osm';

const SEARCH_ENDPOINT_MAP: Record<string, string> = {
  google: 'search-places-google',
  osm: 'search-places-osm',
  serpapi: 'search-places-serpapi'
};

const SEARCH_ENDPOINT =
  SEARCH_ENDPOINT_MAP[MAP_SOURCE] || SEARCH_ENDPOINT_MAP.google;


// Lấy thời gian hiện tại cho input datetime-local (YYYY-MM-DDTHH:mm)
const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localISOTime = (new Date(now.getTime() - offsetMs)).toISOString().slice(0, 16);
    return localISOTime;
};

// Format thời gian từ input sang định dạng API yêu cầu (H:i d/m/Y)
const formatTimeForApi = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${h}:${m} ${d}/${month}/${y}`;
};

// --- TYPE DEFINITIONS ---
interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
}

interface ZaloGroup {
    id: string;
    name: string;
    avatar: string;
    totalMembers: number;
}

// --- COMPONENTS (MODALS & HELPERS) ---

const PersonalizationGuide = () => (
    <div className="mt-3 p-3 bg-gray-900/50 rounded-md text-sm text-gray-400 space-y-2">
        <p className="font-bold text-gray-300">💡 Hướng dẫn để không bị khóa nick Zalo:</p>
        <p>- Dùng <span className="italic text-gray-500">{`{a|b|c}`}</span> để tạo spin nội dung.</p>
        <p>- Dùng các biến sau: <span className="italic text-gray-500"><code className="bg-gray-700 px-1 rounded">%name%</code>, <code className="bg-gray-700 px-1 rounded">%phone%</code>, <code className="bg-gray-700 px-1 rounded">%gender%</code>, <code className="bg-gray-700 px-1 rounded">%birthday%</code></span> để cá nhân hóa tin nhắn.</p>
    </div>
);

const SuccessModal = ({ title, message, onClose, onViewProgress }: { title: string; message: string; onClose: () => void; onViewProgress: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><FiCheckCircle className="text-green-400" size={40} /></div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Đóng</button>
                <button onClick={onViewProgress} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2"><FiEye /> Xem tiến trình</button>
            </div>
        </div>
    </div>
);

const AddFriendModal = ({ count, onClose, onSubmit, pointCost, currentUserPoints }: { count: number; onClose: () => void; onSubmit: (message: string) => void; pointCost: number; currentUserPoints: number; }) => {
    const [message, setMessage] = useState('Xin chào, mình kết bạn nhé!');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const charCount = message.length;
    const isOverLimit = charCount > 120;
    const calculatedCost = count * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const handleSubmit = async () => {
        if (!message.trim() || isOverLimit || isSubmitting || !hasEnoughPoints) return;
        setIsSubmitting(true);
        await onSubmit(message);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Gửi yêu cầu kết bạn hàng loạt</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Bạn sẽ gửi lời mời kết bạn đến <span className="font-bold text-white">{count}</span> số điện thoại đã tìm thấy.</p>
                    <div className="relative"><textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Nhập lời mời kết bạn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/><span className={`absolute bottom-2 right-3 text-sm font-medium ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>{charCount}/120</span></div>
                    {!hasEnoughPoints && count > 0 && (<div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mt-2 text-sm"><p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, bạn đang có {currentUserPoints.toLocaleString()}.</p><Link href="/dashboard/billing" className="font-bold text-blue-400 hover:underline mt-1 block">Nạp thêm điểm?</Link></div>)}
                    <PersonalizationGuide />
                </div>
                <div className="p-4 bg-gray-900 flex justify-between items-center">
                    <div className="text-sm"><span className="text-gray-400">Chi phí:</span><span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span></div>
                    <button onClick={handleSubmit} disabled={isSubmitting || !message.trim() || isOverLimit || !hasEnoughPoints} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">{isSubmitting ? <FiLoader className="animate-spin"/> : <FiUserPlus/>} Gửi yêu cầu</button>
                </div>
            </div>
        </div>
    );
};

const SendMessageModal = ({ count, onClose, onSubmit, pointCost, currentUserPoints }: { count: number; onClose: () => void; onSubmit: (message: string, files: File[], timeSend: string) => void; pointCost: number; currentUserPoints: number; }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState('');
    
    const [sendTime, setSendTime] = useState(getCurrentDateTimeLocal());

    const MAX_FILES = 10;
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const calculatedCost = count * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const validFiles: File[] = [];
            let validationError = '';
            if (selectedFiles.length + filesArray.length > MAX_FILES) {
                setFileError(`Bạn chỉ được gửi tối đa ${MAX_FILES} file ảnh.`);
                e.target.value = '';
                return;
            }
            filesArray.forEach(file => {
                if (!file.type.startsWith('image/')) { validationError = `File "${file.name}" không hợp lệ. Chỉ chấp nhận file ảnh.`; return; }
                if (file.size > MAX_SIZE_BYTES) { validationError = `File "${file.name}" quá lớn. Tối đa ${MAX_SIZE_MB}MB.`; return; }
                validFiles.push(file);
            });
            if (validationError) { setFileError(validationError); } else { setFileError(''); }
            if (validFiles.length > 0) { setSelectedFiles(prev => [...prev, ...validFiles]); }
            e.target.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFileError('');
    };

    const handleSubmit = async () => {
        if ((!message.trim() && selectedFiles.length === 0) || isSubmitting || !hasEnoughPoints || !sendTime) return;
        setIsSubmitting(true);
        
        const formattedTime = formatTimeForApi(sendTime);
        await onSubmit(message, selectedFiles, formattedTime);
        
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Gửi tin nhắn hàng loạt</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <p className="text-gray-300">Bạn sẽ gửi tin nhắn đến <span className="font-bold text-white">{count}</span> số điện thoại đã tìm thấy.</p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Thời gian gửi (Hẹn giờ)</label>
                        <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-3">
                            <FiClock className="text-gray-400 mr-2" />
                            <input 
                                type="datetime-local" 
                                value={sendTime}
                                onChange={(e) => setSendTime(e.target.value)}
                                className="w-full bg-transparent text-white py-2 focus:outline-none placeholder-gray-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">* Để mặc định nếu muốn gửi ngay lập tức.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nội dung</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Nhập nội dung tin nhắn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div className="mt-2">
                        <input type="file" multiple accept="image/*" id="file-upload-map" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="file-upload-map" className="cursor-pointer inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-blue-400 px-3 py-2 rounded-md text-sm border border-gray-600 border-dashed transition-colors">
                            <FiPaperclip /> Đính kèm ảnh ({selectedFiles.length}/{MAX_FILES})
                        </label>
                        {selectedFiles.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md text-sm">
                                        <span className="text-gray-300 truncate max-w-[80%]">{file.name} <span className="text-gray-500 text-xs">({(file.size / 1024).toFixed(0)} KB)</span></span>
                                        <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300"><FiTrash2 /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {fileError && <p className="text-sm text-red-400 mt-1 font-semibold">{fileError}</p>}
                    </div>
                    {!hasEnoughPoints && count > 0 && (<div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mt-2 text-sm"><p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, bạn đang có {currentUserPoints.toLocaleString()}.</p><Link href="/dashboard/billing" className="font-bold text-blue-400 hover:underline mt-1 block">Nạp thêm điểm?</Link></div>)}
                    <PersonalizationGuide />
                </div>
                <div className="p-4 bg-gray-900 flex justify-between items-center">
                    <div className="text-sm"><span className="text-gray-400">Chi phí:</span><span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span></div>
                    <button onClick={handleSubmit} disabled={isSubmitting || (!message.trim() && selectedFiles.length === 0) || !hasEnoughPoints || !sendTime} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">{isSubmitting ? <FiLoader className="animate-spin"/> : <FiMessageSquare/>} Gửi yêu cầu</button>
                </div>
            </div>
        </div>
    );
};

const AddToGroupModal = ({ count, onClose, onSubmit, pointCost, currentUserPoints }: { count: number; onClose: () => void; onSubmit: (groupId: string) => void; pointCost: number; currentUserPoints: number; }) => {
    const { selectedAccount } = useZaloAccounts();
    const [groups, setGroups] = useState<ZaloGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');

    const calculatedCost = count * pointCost;
    const hasEnoughPoints = currentUserPoints >= calculatedCost;

    const savedProxyStr = localStorage.getItem('userProxy');
    const savedProxy = savedProxyStr ? JSON.parse(savedProxyStr) : null;

    useEffect(() => {
        const fetchGroups = async () => {
            if (!selectedAccount) return;
            setIsLoading(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups-with-details`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cookie, imei, userAgent, proxy: savedProxy  }), });
                const data = await response.json();
                if (data.success) setGroups(data.groups || []);
            } catch (error) { console.error("Lỗi khi tải danh sách nhóm:", error); } 
            finally { setIsLoading(false); }
        };
        fetchGroups();
    }, [selectedAccount]);

    const handleSubmit = async () => {
        if (!selectedGroupId || isSubmitting || !hasEnoughPoints) return;
        setIsSubmitting(true);
        await onSubmit(selectedGroupId);
        setIsSubmitting(false);
    };

    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Thêm vào nhóm</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Chọn nhóm để thêm <span className="font-bold text-white">{count}</span> số điện thoại đã tìm thấy.</p>
                    
                    <div className="border border-gray-600 rounded-md overflow-hidden bg-gray-900/50">
                        <div className="p-2 border-b border-gray-600 bg-gray-700/50 relative">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nhập tên nhóm để tìm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800 text-white pl-9 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                                    <FiLoader className="animate-spin text-2xl" /> <span>Đang tải danh sách nhóm...</span>
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 italic">
                                    {searchTerm ? 'Không tìm thấy nhóm nào phù hợp.' : 'Không có nhóm nào.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {filteredGroups.map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => setSelectedGroupId(group.id)}
                                            className={`p-3 cursor-pointer flex items-center gap-3 transition-colors ${selectedGroupId === group.id ? 'bg-blue-900/40 border-l-4 border-blue-500' : 'hover:bg-gray-700 border-l-4 border-transparent'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                                                {group.avatar && group.avatar !== '0' ? (
                                                    <img src={group.avatar} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500"><FiUsers /></div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${selectedGroupId === group.id ? 'text-blue-300' : 'text-gray-200'}`}>
                                                    {group.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {group.totalMembers} thành viên
                                                </p>
                                            </div>
                                            
                                            {selectedGroupId === group.id && <FiCheckCircle className="text-blue-500 flex-shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {!hasEnoughPoints && count > 0 && (<div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-3 rounded-md mt-2 text-sm"><p>Không đủ điểm. Cần {calculatedCost.toLocaleString()}, bạn đang có {currentUserPoints.toLocaleString()}.</p><Link href="/dashboard/billing" className="font-bold text-blue-400 hover:underline mt-1 block">Nạp thêm điểm?</Link></div>)}
                </div>
                
                <div className="p-4 bg-gray-900 flex justify-between items-center">
                    <div className="text-sm"><span className="text-gray-400">Chi phí:</span><span className={`font-bold ml-2 ${hasEnoughPoints ? 'text-yellow-400' : 'text-red-500'}`}>{calculatedCost.toLocaleString()} điểm</span></div>
                    <button onClick={handleSubmit} disabled={isSubmitting || !selectedGroupId || !hasEnoughPoints} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">{isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Thêm vào nhóm</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function SearchOnMapPage() {
    const { selectedAccount } = useZaloAccounts();
    const { pointCosts, isLoading: isLoadingSettings } = useSettings();
    const { user, updateUserPoints } = useAuth();
    const router = useRouter();
    const addressInputRef = useRef<HTMLInputElement>(null);

    const isSelection = useRef(false);

    const [keyword, setKeyword] = useState('');
    const [radius, setRadius] = useState('1000');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState('');
    
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [modalState, setModalState] = useState<'none' | 'sendMessage' | 'addFriend' | 'addToGroup'>('none');
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; redirectUrl: string } | null>(null);

    // Xử lý lấy vị trí GPS
    const handleGetGPS = useCallback(async () => { 
        if (!navigator.geolocation) { setError("Trình duyệt không hỗ trợ định vị."); return; } 
        try { 
            const permission = await navigator.permissions.query({ name: 'geolocation' }); 
            if (permission.state === 'granted' || permission.state === 'prompt') { 
                setAddress('Đang lấy vị trí...');
                isSelection.current = true;
                
                navigator.geolocation.getCurrentPosition( 
                    (position) => { 
                        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }); 
                        setAddress('📍 Vị trí GPS hiện tại của bạn');
                        setSuggestions([]); 
                    }, 
                    () => {
                        setAddress('');
                        setError("Không thể lấy vị trí GPS."); 
                    }
                ); 
            } else if (permission.state === 'denied') { 
                setError("Bạn đã chặn quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt."); 
            } 
        } catch (err) { 
            console.error("Lỗi khi yêu cầu quyền GPS:", err); 
            setError("Có lỗi xảy ra khi yêu cầu quyền vị trí."); 
        } 
    }, []);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isSelection.current = false;
        setAddress(e.target.value);
        setCoords(null); 

        if (!e.target.value) {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = async (prediction: any) => {
        isSelection.current = true;
        setAddress(prediction.description);
        setSuggestions([]);
        setShowSuggestions(false);

        try {
            console.log("Đang lấy tọa độ cho:", prediction.description);
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-place-detail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: prediction.place_id }),
            });
            const data = await response.json();
            if (data.success && data.location) {
                setCoords({ lat: data.location.lat, lng: data.location.lng });
                console.log("Đã cập nhật tọa độ:", data.location);
            }
        } catch (err) {
            console.error("Lỗi khi lấy tọa độ chi tiết:", err);
        }
    };

    useEffect(() => {
        if (isSelection.current) return;
        if (!address || address.length < 3) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            console.log("Đang tìm gợi ý địa chỉ cho:", address);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/place-autocomplete`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ input: address }), 
                });
                const data = await response.json();
                if (data.success) {
                    setSuggestions(data.predictions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Lỗi Autocomplete:", err);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [address]);

    const searchCost = pointCosts?.search_data_map || 0;

    const handleSearch = async () => { 
        if (!keyword) { setError("Vui lòng nhập từ khóa tìm kiếm."); return; } 
        if (!address && !coords) { setError("Vui lòng nhập địa chỉ hoặc lấy vị trí GPS."); return; } 
        
        if (user && user.point < searchCost) {
            setError(`Bạn không đủ điểm. Phí tìm kiếm: ${searchCost.toLocaleString()} điểm (Hiện có: ${user.point.toLocaleString()}).`);
            return;
        }

        if (searchCost > 0) {
            const confirmed = window.confirm(`Thao tác này sẽ tốn ${searchCost.toLocaleString()} điểm. Bạn chắc chắn muốn tìm kiếm?`);
            if (!confirmed) return;
        }
        
        setLoading(true); 
        setError(null); 
        setResults([]); 
        
        try { 
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${SEARCH_ENDPOINT}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ keyword, radius, lat: coords?.lat, lng: coords?.lng, address: coords ? undefined : address }), 
            }); 
            const data = await response.json(); 
            if (!response.ok || !data.success) { throw new Error(data.message || 'Có lỗi xảy ra từ server.'); } 
            
            setResults(data.results || []); 

            if (data.results && data.results.length > 0 && searchCost > 0) {
                try {
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/updatePointSearchMapAPI`, { token });
                        if (user) updateUserPoints(user.point - searchCost);
                    }
                } catch (pointErr) {
                    console.error("Lỗi khi trừ điểm:", pointErr);
                }
            }

        } catch (err: any) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        } 
    };

    const handleExport = () => {
        if (!pointCosts || !user) { alert("Chưa tải được cấu hình điểm."); return; }
        const cost = pointCosts.export_data_map || 0;
        if (user.point < cost) { alert(`Không đủ điểm để xuất dữ liệu. Cần ${cost}, bạn đang có ${user.point}.`); return; }
        const phoneNumbers = results.map(r => r.international_phone_number).filter(Boolean);
        if (phoneNumbers.length === 0) { alert("Không có số điện thoại nào trong danh sách để xuất."); return; }
        const dataForExcel = results.map(place => ({ "Tên Địa Điểm": place.name, "Địa Chỉ": place.formatted_address, "Số Điện Thoại": place.international_phone_number, "Website": place.website, "Đánh Giá": place.rating, "Link Bản Đồ": place.url }));
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Địa Điểm");
        XLSX.writeFile(workbook, "Danh_Sach_Dia_Diem_VN.xlsx");
        updateUserPoints(user.point - cost);
        alert(`Xuất file thành công! Đã trừ ${cost} điểm.`);
    };

    const createRequest = async (endpoint: string, payload: object) => { 
        const token = localStorage.getItem('authToken'); 
        if (!token) throw new Error("Không tìm thấy token xác thực."); 
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apis/${endpoint}`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...payload, token }), 
        }); 
        const data = await response.json(); 
        if (!response.ok || data.code !== 0) { 
            if(data.code === 3) router.push('/logout'); 
            throw new Error(data.message || "Tạo yêu cầu thất bại."); 
        } 
    };

    // Xử lý hành động: Tin nhắn, Kết bạn, Thêm nhóm
    // ✨ CẬP NHẬT: Thêm tham số timeSend (mặc định là chuỗi rỗng)
    const handleSubmitAction = async (messageOrGroupId: string, actionType: 'message' | 'addFriend' | 'addToGroup', files: File[] = [], timeSend: string = '') => {
        if (!selectedAccount) { setError("Vui lòng chọn tài khoản Zalo để thực hiện."); return; }
        if (!pointCosts || !user) { alert("Chưa tải được cấu hình điểm."); return; }
        
        // 1. Chỉ lấy danh sách số điện thoại (Array of Strings)
        const phoneNumbers = results.map(r => r.international_phone_number?.replace(/\s/g, '')).filter(Boolean) as string[];
        
        if (phoneNumbers.length === 0) { setError("Không có số điện thoại nào để thực hiện hành động."); return; }
        
        let costPerAction = 0;
        switch (actionType) {
            case 'message': costPerAction = pointCosts.send_mess_stranger || 0; break;
            case 'addFriend': costPerAction = pointCosts.add_friend || 0; break;
            case 'addToGroup': costPerAction = pointCosts.add_member_group || 0; break;
        }
        const totalCost = phoneNumbers.length * costPerAction;

        // ✨ CẬP NHẬT: Không còn dùng mảng object {phone, name} nữa
        // const listRequest = ... (Đã bỏ)
        
        setModalState('none');
        try {
            if (actionType === 'message') {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error("Không tìm thấy token.");

                const formData = new FormData();
                formData.append('token', token);
                formData.append('userId', selectedAccount.profile.userId);
                formData.append('message', messageOrGroupId);
                formData.append('type', 'stranger');
                formData.append('timeSend', timeSend);
                
                // ✨ CẬP NHẬT: Gửi mảng string thay vì mảng object
                formData.append('list_request', JSON.stringify(phoneNumbers));

                if (files && files.length > 0) {
                    files.forEach(file => formData.append('files[]', file));
                }

                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`, 
                    formData, 
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                const data = response.data;
                if (data.code !== 0) { if(data.code === 3) router.push('/logout'); throw new Error(data.mess || "Tạo yêu cầu thất bại."); }

                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu gửi tin đến <b>${phoneNumbers.length}</b> SĐT.`, redirectUrl: '/dashboard/listSendMessageStranger' });
            } else if (actionType === 'addFriend') {
                // ✨ CẬP NHẬT: Gửi mảng string (phoneNumbers) vào list_request
                await createRequest('createRequestAddFriendAPI', { userId: selectedAccount.profile.userId, message: messageOrGroupId, list_request: phoneNumbers, type: 'phone' });
                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu kết bạn đến <b>${phoneNumbers.length}</b> SĐT.`, redirectUrl: '/dashboard/listRequestAddFriend' });
            } else if (actionType === 'addToGroup') {
                // Action này đã dùng phoneNumbers từ trước, giữ nguyên
                await createRequest('addMemberToGroupAPI', { userId: selectedAccount.profile.userId, groupId: messageOrGroupId, phones: phoneNumbers });
                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu thêm <b>${phoneNumbers.length}</b> SĐT vào nhóm.`, redirectUrl: '/dashboard/listRequestAddMemberGroup' });
            }
            updateUserPoints(user.point - totalCost);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const phoneCount = useMemo(() => results.map(r => r.international_phone_number).filter(Boolean).length, [results]);
    const exportCost = pointCosts?.export_data_map ?? 0;
    const canExport = user && user.point >= exportCost;

    return (
        <div className="flex-1 p-6 md:p-8 text-white">
            {successInfo && <SuccessModal {...successInfo} onClose={() => setSuccessInfo(null)} onViewProgress={() => router.push(successInfo.redirectUrl)} />}
            
            {modalState === 'sendMessage' && <SendMessageModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(msg, files, timeSend) => handleSubmitAction(msg, 'message', files, timeSend)} pointCost={pointCosts?.send_mess_stranger || 0} currentUserPoints={user?.point || 0}/>}
            
            {modalState === 'addFriend' && <AddFriendModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(msg) => handleSubmitAction(msg, 'addFriend')} pointCost={pointCosts?.add_friend || 0} currentUserPoints={user?.point || 0}/>}
            {modalState === 'addToGroup' && <AddToGroupModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(groupId) => handleSubmitAction(groupId, 'addToGroup')} pointCost={pointCosts?.add_member_group || 0} currentUserPoints={user?.point || 0}/>}

            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><FiMapPin /> Quét dữ liệu bản đồ</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Từ khóa tìm kiếm</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="VD: spa, nhà hàng chay, salon tóc..." className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bán kính</label>
                        <select value={radius} onChange={e => setRadius(e.target.value)} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="1000">1 km</option><option value="3000">3 km</option><option value="5000">5 km</option><option value="10000">10 km</option></select>
                    </div>
                </div>
                
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ hoặc vị trí</label>
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <input 
                                ref={addressInputRef}
                                value={address}
                                onChange={handleAddressChange}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                type="text" 
                                placeholder="Nhập địa chỉ (VD: Quận 1, TP HCM) hoặc dùng GPS" 
                                className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                    {suggestions.map((item) => (
                                        <li 
                                            key={item.place_id} 
                                            onMouseDown={() => selectSuggestion(item)}
                                            className="p-3 hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-600 last:border-0"
                                        >
                                            <p className="font-bold text-white">{item.structured_formatting.main_text}</p>
                                            <p className="text-gray-400 text-xs">{item.structured_formatting.secondary_text}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={handleGetGPS} title="Lấy vị trí GPS hiện tại" className="bg-gray-600 hover:bg-gray-500 p-3 rounded-md"><FiCrosshair size={20}/></button>
                    </div>
                </div>

                <button onClick={handleSearch} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 font-bold py-3 px-4 rounded-md disabled:opacity-50">
                    {loading ? (
                        <><FiLoader className="animate-spin"/> Đang tìm kiếm...</>
                    ) : (
                        <div className="flex flex-col items-center leading-tight">
                            <span className="flex items-center gap-2"><FiSearch/> Tìm kiếm</span>
                            {searchCost > 0 && <span className="text-xs font-normal text-blue-200">(Phí: {searchCost.toLocaleString()} điểm)</span>}
                        </div>
                    )}
                </button>
            </div>

            {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-md mb-6 text-center">{error}</div>}
            
            {results.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold">Tìm thấy {results.length} kết quả ({phoneCount} SĐT)</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                            <button onClick={handleExport} disabled={!canExport || isLoadingSettings} title={!canExport ? `Không đủ điểm. Cần ${exportCost}` : ""} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-sm py-2 px-3 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"><FiDownload/> Xuất Excel</button>
                            <button onClick={() => setModalState('addFriend')} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-sm py-2 px-3 rounded-md"><FiUserPlus/> Kết bạn</button>
                            <button onClick={() => setModalState('sendMessage')} className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-sm py-2 px-3 rounded-md"><FiMessageSquare/> Nhắn tin</button>
                            <button onClick={() => setModalState('addToGroup')} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-sm py-2 px-3 rounded-md"><FiUsers/> Thêm nhóm</button>
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {results.map(place => (
                            <div key={place.place_id} className="bg-gray-700/50 p-4 rounded-md mb-3">
                                <h3 className="font-bold text-white">{place.name}</h3>
                                <p className="text-sm text-gray-300">{place.formatted_address}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
                                    {place.international_phone_number && <p className="text-blue-400 font-semibold">{place.international_phone_number}</p>}
                                    {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Website</a>}
                                    {place.rating && <p className="text-yellow-400">{place.rating} ⭐ ({place.user_ratings_total})</p>}
                                    {place.url && <a href={place.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">Xem bản đồ</a>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
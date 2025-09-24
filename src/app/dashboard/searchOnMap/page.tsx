'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiSearch, FiCrosshair, FiLoader, FiAlertTriangle, FiDownload, FiUserPlus, FiMessageSquare, FiUsers, FiX, FiCheckCircle, FiEye, FiPlus } from 'react-icons/fi';
import * as XLSX from 'xlsx';

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

// --- COMPONENTS ---

// --- NEW --- Hướng dẫn cá nhân hóa tin nhắn
const PersonalizationGuide = () => (
    <div className="mt-3 p-3 bg-gray-900/50 rounded-md text-sm text-gray-400 space-y-2">
        <p className="font-bold text-gray-300">💡 Hướng dẫn để không bị khóa nick Zalo:</p>
        <p>- Dùng <span className="italic text-gray-500">{`{a|b|c}`}</span> để tạo spin nội dung.</p>
        <p>- Dùng các biến sau: <span className="italic text-gray-500"><code className="bg-gray-700 px-1 rounded">%name%</code>, <code className="bg-gray-700 px-1 rounded">%phone%</code>, <code className="bg-gray-700 px-1 rounded">%gender%</code>, <code className="bg-gray-700 px-1 rounded">%birthday%</code></span> để cá nhân hóa tin nhắn.</p>
    </div>
);


// Popup thông báo thành công chung
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

// --- UPDATED --- Popup gửi yêu cầu kết bạn
const AddFriendModal = ({ count, onClose, onSubmit }: { count: number; onClose: () => void; onSubmit: (message: string) => void; }) => {
    const [message, setMessage] = useState('Xin chào, mình kết bạn nhé!');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const charCount = message.length;
    const isOverLimit = charCount > 120;

    const handleSubmit = async () => {
        if (!message.trim() || isOverLimit) return;
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
                    <div className="relative">
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Nhập lời mời kết bạn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <span className={`absolute bottom-2 right-3 text-sm font-medium ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
                            {charCount}/120
                        </span>
                    </div>
                     <PersonalizationGuide />
                </div>
                <div className="p-4 bg-gray-900 flex justify-end">
                    <button onClick={handleSubmit} disabled={isSubmitting || !message.trim() || isOverLimit} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiUserPlus/>} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NEW --- Popup gửi tin nhắn
const SendMessageModal = ({ count, onClose, onSubmit }: { count: number; onClose: () => void; onSubmit: (message: string) => void; }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;
        setIsSubmitting(true);
        await onSubmit(message);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Gửi tin nhắn hàng loạt</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Bạn sẽ gửi tin nhắn đến <span className="font-bold text-white">{count}</span> số điện thoại đã tìm thấy.</p>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Nhập nội dung tin nhắn..." className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    <PersonalizationGuide />
                </div>
                <div className="p-4 bg-gray-900 flex justify-end">
                    <button onClick={handleSubmit} disabled={isSubmitting || !message.trim()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiMessageSquare/>} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};


// Popup thêm vào nhóm
const AddToGroupModal = ({ count, onClose, onSubmit }: { count: number; onClose: () => void; onSubmit: (groupId: string) => void; }) => {
    const { selectedAccount } = useZaloAccounts();
    const [groups, setGroups] = useState<ZaloGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!selectedAccount) return;
            setIsLoading(true);
            try {
                const { cookie, imei, userAgent } = selectedAccount;
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-groups-with-details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cookie, imei, userAgent }),
                });
                const data = await response.json();
                if (data.success) setGroups(data.groups || []);
            } catch (error) { console.error("Lỗi khi tải danh sách nhóm:", error); } 
            finally { setIsLoading(false); }
        };
        fetchGroups();
    }, [selectedAccount]);

    const handleSubmit = async () => {
        if (!selectedGroupId) return;
        setIsSubmitting(true);
        await onSubmit(selectedGroupId);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Thêm vào nhóm</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600 text-white"><FiX size={20}/></button></div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Chọn nhóm để thêm <span className="font-bold text-white">{count}</span> số điện thoại đã tìm thấy.</p>
                    <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} disabled={isLoading} className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">{isLoading ? 'Đang tải nhóm...' : '-- Chọn một nhóm --'}</option>
                        {groups.map(group => <option key={group.id} value={group.id}>{group.name} ({group.totalMembers} TV)</option>)}
                    </select>
                </div>
                <div className="p-4 bg-gray-900 flex justify-end">
                    <button onClick={handleSubmit} disabled={isSubmitting || !selectedGroupId} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {isSubmitting ? <FiLoader className="animate-spin"/> : <FiPlus />} Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function SearchOnMapPage() {
    const { selectedAccount } = useZaloAccounts();
    const router = useRouter();
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    
    const [keyword, setKeyword] = useState('');
    const [radius, setRadius] = useState('1000');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState('');
    
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [modalState, setModalState] = useState<'none' | 'sendMessage' | 'addFriend' | 'addToGroup'>('none');
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; redirectUrl: string } | null>(null);
    
    // Load Google Maps Script
    useEffect(() => {
        // Thay key bằng biến môi trường để bảo mật
        const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!GOOGLE_MAPS_API_KEY) {
            console.error("Google Maps API Key is missing!");
            setError("Lỗi cấu hình: Không tìm thấy Google Maps API Key.");
            return;
        }

        if ((window as any).google) {
            setIsScriptLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        (window as any).initMap = () => setIsScriptLoaded(true);
        document.head.appendChild(script);
    }, []);

    // Init Autocomplete
    useEffect(() => {
        if (isScriptLoaded && addressInputRef.current && (window as any).google) {
            const autocomplete = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
                types: ['address'],
                componentRestrictions: { 'country': 'vn' }
            });
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry?.location) {
                    setCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                    setAddress(addressInputRef.current?.value || '');
                }
            });
        }
    }, [isScriptLoaded]);

    const handleGetGPS = useCallback(async () => {
        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ định vị.");
            return;
        }
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'granted' || permission.state === 'prompt') {
                if (addressInputRef.current) addressInputRef.current.value = 'Đang lấy vị trí...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                        if (addressInputRef.current) {
                            addressInputRef.current.value = `📍 Vị trí GPS của bạn`;
                            setAddress('Vị trí GPS của bạn');
                        }
                    },
                    () => setError("Không thể lấy vị trí GPS.")
                );
            } else if (permission.state === 'denied') {
                setError("Bạn đã chặn quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.");
            }
        } catch (err) {
            console.error("Lỗi khi yêu cầu quyền GPS:", err);
            setError("Có lỗi xảy ra khi yêu cầu quyền vị trí.");
        }
    }, []);

    const handleSearch = async () => {
        if (!keyword) {
            setError("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }
        if (!address && !coords) {
            setError("Vui lòng nhập địa chỉ hoặc lấy vị trí GPS.");
            return;
        }
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/search-places`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword,
                    radius,
                    lat: coords?.lat,
                    lng: coords?.lng,
                    address: coords ? undefined : address
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Có lỗi xảy ra từ server.');
            }
            setResults(data.results || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const phoneNumbers = results.map(r => r.international_phone_number).filter(Boolean);
        if (phoneNumbers.length === 0) {
            alert("Không có số điện thoại nào trong danh sách để xuất.");
            return;
        }
        const dataForExcel = results.map(place => ({
            "Tên Địa Điểm": place.name,
            "Địa Chỉ": place.formatted_address,
            "Số Điện Thoại": place.international_phone_number,
            "Website": place.website,
            "Đánh Giá": place.rating,
            "Link Google Maps": place.url
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Địa Điểm");
        XLSX.writeFile(workbook, "Danh_Sach_Dia_Diem.xlsx");
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

    const handleSubmitAction = async (messageOrGroupId: string, actionType: 'message' | 'addFriend' | 'addToGroup') => {
        if (!selectedAccount) {
            setError("Vui lòng chọn tài khoản Zalo để thực hiện.");
            return;
        }
        const phoneNumbers = results.map(r => r.international_phone_number?.replace(/\s/g, '')).filter(Boolean) as string[];
        if (phoneNumbers.length === 0) {
            setError("Không có số điện thoại nào để thực hiện hành động.");
            return;
        }
        
        // --- UPDATED --- Tạo danh sách request có kèm tên địa điểm để cá nhân hóa
        const listRequest = results
            .filter(r => r.international_phone_number)
            .map(r => ({
                phone: r.international_phone_number!.replace(/\s/g, ''),
                name: r.name // `name` sẽ được dùng để thay thế biến `[ten_dia_diem]` ở backend
            }));

        setModalState('none');
        try {
            if (actionType === 'message') {
                await createRequest('createRequestSendMessageAPI', { userId: selectedAccount.profile.userId, message: messageOrGroupId, list_request: listRequest, type: 'stranger' });
                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu gửi tin đến <b>${listRequest.length}</b> SĐT.`, redirectUrl: '/dashboard/listSendMessageStranger' });
            } else if (actionType === 'addFriend') {
                await createRequest('createRequestAddFriendAPI', { userId: selectedAccount.profile.userId, message: messageOrGroupId, list_request: listRequest, type: 'phone' });
                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu kết bạn đến <b>${listRequest.length}</b> SĐT.`, redirectUrl: '/dashboard/listRequestAddFriend' });
            } else if (actionType === 'addToGroup') {
                 // addToGroup không cần cá nhân hóa message nên vẫn dùng list phone cũ
                await createRequest('addMemberToGroupAPI', { userId: selectedAccount.profile.userId, groupId: messageOrGroupId, phones: phoneNumbers });
                setSuccessInfo({ title: "Thành công", message: `Đã tạo yêu cầu thêm <b>${phoneNumbers.length}</b> SĐT vào nhóm.`, redirectUrl: '/dashboard/listRequestAddMemberGroup' });
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const phoneCount = useMemo(() => results.map(r => r.international_phone_number).filter(Boolean).length, [results]);

    return (
        <div className="flex-1 p-6 md:p-8 text-white">
            {successInfo && <SuccessModal {...successInfo} onClose={() => setSuccessInfo(null)} onViewProgress={() => router.push(successInfo.redirectUrl)} />}
            
            {/* --- UPDATED --- Gọi các modal mới */}
            {modalState === 'sendMessage' && <SendMessageModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(msg) => handleSubmitAction(msg, 'message')} />}
            {modalState === 'addFriend' && <AddFriendModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(msg) => handleSubmitAction(msg, 'addFriend')} />}
            {modalState === 'addToGroup' && <AddToGroupModal count={phoneCount} onClose={() => setModalState('none')} onSubmit={(groupId) => handleSubmitAction(groupId, 'addToGroup')} />}

            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><FiMapPin /> Quét dữ liệu Google Maps</h1>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Từ khóa tìm kiếm</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="VD: spa, nhà hàng chay, salon tóc..." className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bán kính</label>
                        <select value={radius} onChange={e => setRadius(e.target.value)} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="1000">1 km</option>
                            <option value="3000">3 km</option>
                            <option value="5000">5 km</option>
                            <option value="10000">10 km</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ hoặc vị trí</label>
                    <div className="flex gap-2">
                        <input ref={addressInputRef} onChange={e => setAddress(e.target.value)} type="text" placeholder="Nhập địa chỉ hoặc dùng GPS" className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <button onClick={handleGetGPS} title="Lấy vị trí GPS hiện tại" className="bg-gray-600 hover:bg-gray-500 p-3 rounded-md"><FiCrosshair size={20}/></button>
                    </div>
                </div>
                <button onClick={handleSearch} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 font-bold py-3 px-4 rounded-md disabled:opacity-50">
                    {loading ? <><FiLoader className="animate-spin"/> Đang tìm kiếm...</> : <><FiSearch/> Tìm kiếm</>}
                </button>
            </div>

            {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-md mb-6 text-center">{error}</div>}

            {results.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold">Tìm thấy {results.length} kết quả ({phoneCount} SĐT)</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                            <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-sm py-2 px-3 rounded-md"><FiDownload/> Xuất Excel</button>
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
                                    <a href={place.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">Xem trên Maps</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
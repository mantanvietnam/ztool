'use client';

import React, { useState, useEffect } from 'react';
import { useZaloAccounts } from '@/contexts/ZaloAccountContext';
import { FiServer, FiCopy, FiCheck, FiCode, FiAlertCircle, FiFile } from 'react-icons/fi';

// --- HÀM TIỆN ÍCH (Giữ nguyên logic từ trang trước để đảm bảo tính ổn định) ---
const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            throw new Error('Clipboard API unavailable');
        }
    } catch (err) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (fallbackErr) {
            return false;
        }
    }
};

// --- COMPONENTS CON ---
const CodeBlock = ({ title, code, language = 'javascript' }: { title: string, code: string, language?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        const success = await copyToClipboard(code);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 my-4">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm font-mono text-gray-300">{title}</span>
                <button onClick={handleCopy} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                    {copied ? <><FiCheck className="text-green-400" /> Đã sao chép</> : <><FiCopy /> Sao chép</>}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-blue-300 whitespace-pre-wrap"><code>{code}</code></pre>
            </div>
        </div>
    );
};

const InlineCopy = ({ value, label, truncate = false, showValue = true }: { value: string, label?: string, truncate?: boolean, showValue?: boolean }) => {
    const [copied, setCopied] = useState(false);
    const displayValue = showValue ? (truncate && value.length > 25 ? value.substring(0, 25) + '...' : value) : '';
    const handleCopy = async () => {
        const success = await copyToClipboard(value);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (
        <div className="flex items-center gap-2 mt-1">
            {label && <span className="text-gray-400 text-xs">{label}:</span>}
            <div className="flex items-center bg-gray-900 border border-gray-600 rounded px-2 py-1 group hover:border-blue-500 transition-colors cursor-pointer select-none" onClick={handleCopy} title="Bấm để sao chép">
                {showValue && <code className="text-xs font-mono text-green-400 mr-2">{displayValue || 'Chưa có dữ liệu'}</code>}
                <span className="text-gray-500 group-hover:text-white">
                    {copied ? <FiCheck size={14} className="text-green-500"/> : <FiCopy size={14}/>}
                </span>
            </div>
        </div>
    );
};

const ParamRow = ({ name, type, required, desc }: { name: string, type: string, required: boolean, desc: React.ReactNode }) => (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50">
        <td className="px-6 py-4 font-mono text-blue-400">{name}</td>
        <td className="px-6 py-4 text-purple-400">{type}</td>
        <td className="px-6 py-4">
            {required ? <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">Bắt buộc</span> : <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">Tùy chọn</span>}
        </td>
        <td className="px-6 py-4 text-gray-300">{desc}</td>
    </tr>
);

// --- MAIN PAGE ---
export default function ApiSendMessageDocPage() {
    const { selectedAccount } = useZaloAccounts();
    const [token, setToken] = useState('');
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/apis/createRequestSendMessageAPI`;
    const [endpointCopied, setEndpointCopied] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('authTokenAPI');
        if (storedToken) setToken(storedToken);
    }, []);

    const userId = selectedAccount?.profile?.userId || '';

    const handleCopyEndpoint = async () => {
        const success = await copyToClipboard(apiUrl);
        if (success) {
            setEndpointCopied(true);
            setTimeout(() => setEndpointCopied(false), 2000);
        }
    };

    // Mẫu code JavaScript (FormData)
    const exampleJsCode = `const myHeaders = new Headers();
// Không cần set 'Content-Type': 'multipart/form-data' thủ công khi dùng FormData, 
// trình duyệt/client sẽ tự động thêm boundary.

const formdata = new FormData();
formdata.append("token", "${token || 'YOUR_API_TOKEN'}");
formdata.append("userId", "${userId || 'USER_ID_ZALO'}");
formdata.append("type", "stranger"); // 'stranger' | 'friend' | 'group'
formdata.append("message", "Xin chào %name%, chúc ngày mới vui vẻ!");

// Lưu ý: list_request phải là chuỗi JSON
formdata.append("list_request", JSON.stringify(["0912345678", "0987654321"]));

// (Tùy chọn) Thêm file ảnh
// formdata.append("files[]", fileInput.files[0], "image.png");

const requestOptions = {
  method: "POST",
  body: formdata,
  redirect: "follow"
};

fetch("${apiUrl}", requestOptions)
  .then((response) => response.json())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));`;

    // Mẫu cURL
    const exampleCurl = `curl --location '${apiUrl}' \\
--form 'token="${token || 'YOUR_API_TOKEN'}"' \\
--form 'userId="${userId || 'USER_ID_ZALO'}"' \\
--form 'type="stranger"' \\
--form 'message="Xin chào %name%"' \\
--form 'list_request="[\\"0912345678\\",\\"0987654321\\"]"'`;

    const exampleResponseSuccess = `{
    "code": 0,
    "mess": "Tạo yêu cầu gửi tin thành công!",
    "data": { "jobId": 6789, "total": 2 }
}`;

    return (
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="border-b border-gray-700 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <FiServer className="text-blue-500 text-3xl" />
                    <h1 className="text-3xl font-bold text-white">API Gửi Tin Nhắn</h1>
                </div>
                <p className="text-gray-400 mt-2">
                    Tài liệu tích hợp tính năng gửi tin nhắn tự động (hỗ trợ đính kèm ảnh). 
                </p>
            </div>

            {/* Endpoint Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiCode /> Thông tin Endpoint
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-900 p-4 rounded-md border border-gray-600">
                    <span className="px-3 py-1 bg-green-600 text-white font-bold rounded text-sm w-fit">POST</span>
                    <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        <span className="font-mono text-gray-300 truncate text-sm sm:text-base" title={apiUrl}>
                            {apiUrl}
                        </span>
                        <button onClick={handleCopyEndpoint} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors flex-shrink-0" title="Sao chép đường dẫn">
                            {endpointCopied ? <FiCheck className="text-green-500" size={18} /> : <FiCopy size={18} />}
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                    <FiAlertCircle />
                    <span>Lưu ý: API này sử dụng <strong>multipart/form-data</strong> để hỗ trợ upload file.</span>
                </div>
            </div>

            {/* Request Parameters */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Tham số gửi lên (FormData)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">Key</th>
                                <th className="px-6 py-3">Kiểu</th>
                                <th className="px-6 py-3">Yêu cầu</th>
                                <th className="px-6 py-3">Mô tả & Giá trị của bạn</th>
                            </tr>
                        </thead>
                        <tbody>
                            <ParamRow name="token" type="String" required={true} 
                                desc={<div><p>Token xác thực API.</p><InlineCopy value={token} label="Token" truncate={true} /></div>} 
                            />
                            <ParamRow name="userId" type="String" required={true} 
                                desc={<div><p>ID tài khoản Zalo gửi tin.</p>{userId ? <InlineCopy value={userId} label="UserId" /> : <span className="text-xs text-yellow-500 italic">Vui lòng chọn tài khoản Zalo</span>}</div>} 
                            />
                            <ParamRow name="type" type="String" required={true} 
                                desc={<div><p>Loại tin nhắn. Các giá trị hợp lệ:</p><code className="text-xs bg-gray-700 px-1 rounded text-purple-300">stranger</code> (Người lạ)</div>} 
                            />
                            <ParamRow name="message" type="String" required={true} 
                                desc="Nội dung tin nhắn. Hỗ trợ spin {a|b} và biến %name%." 
                            />
                            <ParamRow name="list_request" type="JSON String" required={true} 
                                desc={<div><p>Chuỗi JSON chứa danh sách người nhận.</p><p className="text-xs text-gray-500 mt-1">VD: <code>JSON.stringify(["098...", "091..."])</code></p></div>} 
                            />
                            <ParamRow name="files[]" type="Binary" required={false} 
                                desc="File ảnh đính kèm (Có thể gửi nhiều file cùng key 'files[]'). Tối đa 2MB/file." 
                            />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Examples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Ví dụ JavaScript (Fetch)</h2>
                        <CodeBlock title="JavaScript Code" code={exampleJsCode} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Ví dụ cURL</h2>
                        <CodeBlock title="Terminal Command" code={exampleCurl} language="bash" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Kết quả thành công</h2>
                        <CodeBlock title="Response 200 OK" code={exampleResponseSuccess} />
                    </div>
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                        <h3 className="flex items-center gap-2 text-blue-400 font-bold mb-2"><FiAlertCircle /> Quy định & Giới hạn</h3>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                            <li><strong>Định dạng gửi:</strong> Bắt buộc dùng <code>multipart/form-data</code>.</li>
                            <li><strong>Dữ liệu danh sách:</strong> Tham số <code>list_request</code> phải được convert sang chuỗi JSON trước khi gửi.</li>
                            <li><strong>File đính kèm:</strong> Hỗ trợ các định dạng ảnh phổ biến (jpg, png). Giới hạn dung lượng khuyến nghị dưới 2MB.</li>
                            <li><strong>Chi phí:</strong> Hệ thống sẽ trừ điểm tương ứng với loại tin nhắn (người lạ/bạn bè) và số lượng người nhận.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';

import React, { useRef, useState } from 'react';
import { FiClock, FiImage, FiTrash2, FiInfo, FiAlertCircle } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Bọc ReactQuill để tránh lỗi SSR của Next.js
const ReactQuillWrapper = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    return function ForwardedQuill({ forwardedRef, ...props }: any) {
      return <RQ ref={forwardedRef} {...props} />;
    };
  },
  { 
    ssr: false, 
    loading: () => <div className="h-[120px] flex items-center justify-center text-gray-500 bg-gray-700 rounded-md border border-gray-600">Đang tải trình soạn thảo...</div> 
  }
);

// Quy ước 5 màu cố định của Zalo
const ZALO_COLORS = ['#db342e', '#f27806', '#f7b503', '#15a85f', ''];

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': ZALO_COLORS }], 
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const QUICK_EMOJIS = ['👍', '❤️', '😄', '😊', '😂', '😅', '😭', '😍', '😘', '🤔', '😞', '😠', '😯', '👉', '👏', '🤝', '🙏', '🚫', '❎', '✅', '🌸', '⛔', '💯', '🔥', '🇻🇳'];
const QUICK_VARIABLES = [
    { label: '%name%', desc: 'Tên' },
    { label: '%phone%', desc: 'SĐT' },
    { label: '%gender%', desc: 'Anh/Chị' },
    { label: '%birthday%', desc: 'Ngày sinh' }
];

interface MessageComposerProps {
    message: string;
    onChangeMessage: (text: string) => void;
    selectedFiles: File[];
    onFilesChange: (files: File[]) => void;
    timeSend: string;
    onTimeSendChange: (time: string) => void;
    placeholder?: string;
}

const MessageComposer = ({
    message,
    onChangeMessage,
    selectedFiles,
    onFilesChange,
    timeSend,
    onTimeSendChange,
    placeholder = "Nội dung tin nhắn..."
}: MessageComposerProps) => {
    const quillRef = useRef<any>(null);
    const [error, setError] = useState('');

    const MAX_FILES = 10;
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const handleInsertText = (textToInsert: string) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        const position = range ? range.index : editor.getLength();
        const textWithSpace = " " + textToInsert + " "; 
        
        editor.insertText(position, textWithSpace);
        editor.setSelection(position + textWithSpace.length, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const validFiles: File[] = [];
            
            if (selectedFiles.length + filesArray.length > MAX_FILES) {
                setError(`Bạn chỉ được gửi tối đa ${MAX_FILES} ảnh.`);
                e.target.value = '';
                return;
            }

            for (const file of filesArray) {
                if (!file.type.startsWith('image/')) {
                    setError(`File "${file.name}" không phải là ảnh.`);
                    continue;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    setError(`Ảnh "${file.name}" vượt quá ${MAX_SIZE_MB}MB.`);
                    continue;
                }
                validFiles.push(file);
            }

            if (validFiles.length > 0) {
                onFilesChange([...selectedFiles, ...validFiles]);
            }
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <FiClock className="text-blue-400" /> Thời gian gửi (Hẹn giờ)
                </label>
                <input 
                    type="datetime-local" 
                    value={timeSend}
                    onChange={(e) => onTimeSendChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <FiInfo className="text-blue-400" /> Nội dung tin nhắn
                </label>
                
                <style>{`
                    .quill-dark .ql-toolbar {
                        border: none !important;
                        border-bottom: 1px solid #4b5563 !important;
                        background-color: #374151;
                        border-top-left-radius: 0.375rem;
                        border-top-right-radius: 0.375rem;
                    }
                    .quill-dark .ql-container {
                        border: none !important;
                        background-color: #374151;
                        border-bottom-left-radius: 0.375rem;
                        border-bottom-right-radius: 0.375rem;
                        color: white;
                        font-size: 14px;
                    }
                    .quill-dark .ql-editor { min-height: 120px; max-height: 250px; }
                    .quill-dark .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; }
                    .quill-dark .ql-stroke { stroke: #9ca3af !important; }
                    .quill-dark .ql-fill { fill: #9ca3af !important; }
                    .quill-dark button:hover .ql-stroke { stroke: #60a5fa !important; }
                    .quill-dark button:hover .ql-fill { fill: #60a5fa !important; }
                `}</style>

                <div className="border border-gray-600 rounded-md overflow-hidden mb-1 quill-dark focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <ReactQuillWrapper
                        forwardedRef={quillRef}
                        theme="snow"
                        value={message}
                        onChange={onChangeMessage}
                        modules={quillModules}
                        placeholder={placeholder}
                    />
                </div>

                <div className="flex overflow-x-auto gap-1.5 py-2 no-scrollbar border-b border-gray-700 mb-2">
                    {QUICK_EMOJIS.map((emoji, idx) => (
                        <button key={idx} type="button" onClick={() => handleInsertText(emoji)} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 w-9 h-9 flex items-center justify-center rounded text-lg transition-colors">{emoji}</button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-md p-3">
                <p className="text-[11px] text-gray-500 italic py-2">Sử dụng cấu trúc spin {"{a|b}"} để tạo nội dung ngẫu nhiên. Bấm biến để chèn nhanh:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                    {QUICK_VARIABLES.map((v) => (
                        <button key={v.label} type="button" onClick={() => handleInsertText(v.label)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-full transition-all">{v.desc}</button>
                    ))}
                </div>
            </div>

            <div>
                <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-blue-400 px-4 py-2.5 rounded-md text-sm border border-gray-600 border-dashed transition-all w-full justify-center">
                    <FiImage className="text-lg" /> Chọn ảnh đính kèm ({selectedFiles.length}/10)
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><FiAlertCircle /> {error}</p>}

                {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md border border-gray-600 overflow-hidden group">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                <button type="button" onClick={() => onFilesChange(selectedFiles.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageComposer;
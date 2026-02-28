// src/utils/stringUtils.ts

export const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các dấu thanh, dấu mũ, dấu râu...
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};
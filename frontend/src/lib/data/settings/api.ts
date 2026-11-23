import { api, ApiResponse } from '../../../lib/api';

export interface Settings {
    id: string;
    key: string;
    value: string;
    description?: string;
    category: string;
    isActive: boolean;
    updatedAt: string;
}

export interface SettingsResponse {
    status: number;
    data: Settings[];
}

export interface SettingResponse {
    status: number;
    data: Settings;
}

// Get all settings
export const getSettings = (): Promise<SettingsResponse> => {
    return api.get<SettingsResponse>('/settings').then(response => {
        if (!response.data) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Get settings by category
export const getSettingsByCategory = (category: string): Promise<SettingsResponse> => {
    return api.get<SettingsResponse>(`/settings/category/${category}`).then(response => {
        if (!response.data) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Get single setting by key
export const getSettingByKey = (key: string): Promise<SettingResponse> => {
    return api.get<SettingResponse>(`/settings/${key}`).then(response => {
        if (!response.data) {
            throw new Error('Setting not found');
        }
        return response.data;
    });
};

// Create new setting
export const createSetting = (data: Partial<Settings>): Promise<SettingResponse> => {
    return api.post<SettingResponse>('/settings', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create setting');
        }
        return response.data;
    });
};

// Update setting
export const updateSetting = (key: string, data: Partial<Settings>): Promise<SettingResponse> => {
    return api.put<SettingResponse>(`/settings/${key}`, data).then(response => {
        if (!response.data) {
            throw new Error('Setting not found');
        }
        return response.data;
    });
};

// Delete setting
export const deleteSetting = (key: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/settings/${key}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete setting');
        }
        return response.data;
    });
};

// Update multiple settings
export const updateMultipleSettings = (settings: Array<{ key: string; value: string }>): Promise<{ status: number; message: string }> => {
    return api.put<{ status: number; message: string }>('/settings/bulk', { settings }).then(response => {
        if (!response.data) {
            throw new Error('Failed to update settings');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allSettings = () => {
    return getSettings();
};
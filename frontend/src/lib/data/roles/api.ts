import { api, PaginationParams } from "../../api";

export const allRoles = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/others/roles', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response?.data?.roles;
    });
};
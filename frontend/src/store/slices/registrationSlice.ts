import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Registration } from '../../types';

interface RegistrationState {
    registrations: Registration[];
    loading: boolean;
    searchTerm: string;
}

const initialState: RegistrationState = {
    registrations: [],
    loading: false,
    searchTerm: '',
};

const resgistrationSlice = createSlice({
    name: 'registrations',
    initialState,
    reducers: {
        setRegistrations: (state, action: PayloadAction<Registration[]>) => {
            state.registrations = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
        },
        addRegistration: (state, action) => {
            state.registrations.unshift({
                id: Math.floor(100000 + Math.random() * 900000).toString(),
                applicationId: action.payload.applicationId,
                societyName: action.payload.societyName,
                typeOfSociety: action.payload.typeOfSociety,
                mobileNumber: action.payload.mobileNumber,
                status: action.payload.status,
                isActive: 1,
                createdAt: new Date().toLocaleDateString()
            });
        },
    },
});

export const { setRegistrations, setLoading, setSearchTerm, addRegistration } = resgistrationSlice.actions;
export default resgistrationSlice.reducer;

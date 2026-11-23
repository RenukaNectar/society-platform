import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UserState {
  users: User[];
  loading: boolean;
  searchTerm: string;
}

const initialState: UserState = {
  users: [],
  loading: false,
  searchTerm: '',
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.unshift({
        id: Math.floor(100000 + Math.random() * 900000).toString(),
        first_name: action.payload.first_name,
        last_name: action.payload.last_name,
        email: action.payload.email,
        phone: action.payload.phone,
        role: action.payload.role,
        is_active: true,
        created_at: new Date().toLocaleDateString(),
      });
    }
  },
});

export const { setUsers, setLoading, setSearchTerm, addUser } = userSlice.actions;
export default userSlice.reducer;
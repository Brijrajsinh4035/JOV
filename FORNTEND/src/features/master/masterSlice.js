import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { masterApi } from '../../api';

export const fetchMasterData = createAsyncThunk(
  'master/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [departments, states] = await Promise.all([
        masterApi.getDepartments(),
        masterApi.getStates(),
      ]);
      return { departments, states };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch master data');
    }
  }
);

const initialState = {
  departments: [],
  states: [],
  isLoading: false,
};

export const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments = action.payload.departments || [];
        state.states = action.payload.states || [];
      })
      .addCase(fetchMasterData.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const selectDepartments = (state) => state.master.departments;
export const selectStates = (state) => state.master.states;

export default masterSlice.reducer;

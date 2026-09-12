import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskApi from '../../api/taskApi';
import { TASK_STATUS, TASK_PRIORITY } from '../../utils/constants';

const initialState = {
  tasks: [],
  selectedProjectId: 'ALL',
  statusFilter: 'ALL',
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await taskApi.getAll(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch tasks');
    }
  }
);

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addLocalTask: (state, action) => {
      const newTask = {
        ...action.payload,
        id: 'tsk-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      state.tasks.unshift(newTask);
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
      }
    },
    deleteLocalTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
    setSelectedProjectFilter: (state, action) => {
      state.selectedProjectId = action.payload;
    },
    setTaskStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.tasks = action.payload;
        }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addLocalTask,
  updateTaskStatus,
  deleteLocalTask,
  setSelectedProjectFilter,
  setTaskStatusFilter,
} = taskSlice.actions;

export const selectAllTasks = (state) => state.tasks.tasks;
export const selectTasksByStatus = (status) => (state) =>
  state.tasks.tasks.filter((t) => t.status === status);
export const selectFilteredTasks = (state) => {
  const { tasks, selectedProjectId, statusFilter } = state.tasks;
  return tasks.filter((t) => {
    const matchesProject =
      selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    const matchesStatus =
      statusFilter === 'ALL' || t.status === statusFilter;
    return matchesProject && matchesStatus;
  });
};

export default taskSlice.reducer;

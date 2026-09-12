import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../../api';

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await projectApi.getAll(filters);
      // Handle both wrapped { total, data } and raw array
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch projects');
    }
  }
);

export const createProjectThunk = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue, dispatch }) => {
    try {
      const data = await projectApi.create(projectData);
      dispatch(fetchProjects());
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create project');
    }
  }
);

export const updateProjectStatusThunk = createAsyncThunk(
  'projects/updateStatus',
  async ({ id, status, remarks }, { rejectWithValue, dispatch }) => {
    try {
      const data = await projectApi.updateStatus(id, status, remarks);
      dispatch(fetchProjects());
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update project status');
    }
  }
);

export const deleteProjectThunk = createAsyncThunk(
  'projects/deleteProject',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const data = await projectApi.delete(id);
      dispatch(fetchProjects());
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete project');
    }
  }
);

const initialState = {
  projects: [],
  activeProject: null,
  filters: {
    status: 'ALL',
    search: '',
  },
  isLoading: false,
  error: null,
};

export const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        status: 'ALL',
        search: '',
      };
    },
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setStatusFilter,
  setSearchQuery,
  resetFilters,
  setActiveProject,
} = projectSlice.actions;

export const selectAllProjects = (state) => state.projects.projects;
export const selectActiveProject = (state) => state.projects.activeProject;
export const selectProjectsLoading = (state) => state.projects.isLoading;
export const selectProjectsFilters = (state) => state.projects.filters;

// Client-side instant filter selector
export const selectFilteredProjects = (state) => {
  const { projects, filters } = state.projects;
  const { status, search } = filters;

  return projects.filter((p) => {
    const matchesStatus =
      status === 'ALL' || (p.status && p.status.toLowerCase() === status.toLowerCase());

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.clientId?.name && p.clientId.name.toLowerCase().includes(q)) ||
      (p.teamId?.name && p.teamId.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });
};

export default projectSlice.reducer;

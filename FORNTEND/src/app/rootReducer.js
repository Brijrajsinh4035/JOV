import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectReducer from '../features/projects/projectSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import masterReducer from '../features/master/masterSlice';
import uiReducer from '../features/ui/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectReducer,
  dashboard: dashboardReducer,
  master: masterReducer,
  ui: uiReducer,
});

export default rootReducer;

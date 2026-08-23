import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import compilerReducer from './features/compiler/compilerSlice';
import notebookReducer from './features/notebook/notebookSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    compiler: compilerReducer,
    notebook: notebookReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

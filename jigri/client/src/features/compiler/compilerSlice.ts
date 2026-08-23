import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { getLanguage, languages } from '../../lib/languageRegistry';

interface Output {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
  type: string;
}

interface CompilerState {
  language: string;
  code: string;
  stdin: string;
  output: Output | null;
  isRunning: boolean;
  executionId: string | null;
}

const initialState: CompilerState = {
  language: 'javascript',
  code: 'console.log("Hello, JIGRI!");',
  stdin: '',
  output: null,
  isRunning: false,
  executionId: null,
};

export const executeCode = createAsyncThunk('compiler/execute', async (_, { getState, rejectWithValue }) => {
  const state = getState() as any;
  const { language, code, stdin } = state.compiler;
  try {
    const response = await api.post('/execute', { language, code, stdin });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Execution failed');
  }
});

const compilerSlice = createSlice({
  name: 'compiler',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
      // Reset code to language default when switching languages
      const lang = getLanguage(action.payload);
      if (lang) {
        state.code = lang.defaultCode;
      }
    },
    setCode(state, action: PayloadAction<string>) {
      state.code = action.payload;
    },
    setStdin(state, action: PayloadAction<string>) {
      state.stdin = action.payload;
    },
    setOutput(state, action: PayloadAction<Output | null>) {
      state.output = action.payload;
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(executeCode.pending, (state) => {
      state.isRunning = true;
      state.output = null;
    });
    builder.addCase(executeCode.fulfilled, (state, action) => {
      state.isRunning = false;
      state.output = action.payload;
    });
    builder.addCase(executeCode.rejected, (state, action) => {
      state.isRunning = false;
      state.output = {
        stdout: '',
        stderr: action.payload as string,
        exitCode: 1,
        executionTimeMs: 0,
        timedOut: false,
        type: 'error'
      };
    });
  },
});

export const { setLanguage, setCode, setStdin, setOutput, setRunning } = compilerSlice.actions;
export default compilerSlice.reducer;

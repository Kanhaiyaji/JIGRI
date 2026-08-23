import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface CellOutput {
  type: 'text' | 'html' | 'image' | 'error';
  data: string;
}

export interface ICell {
  id: string;
  type: 'code' | 'markdown';
  source: string;
  outputs: CellOutput[];
  executionCount: number | null;
  isRunning: boolean;
}

export interface INotebook {
  id: string;
  title: string;
  cells: ICell[];
}

interface NotebookState {
  notebook: INotebook | null;
  runtimeStatus: 'disconnected' | 'starting' | 'ready' | 'running';
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;
}

const initialState: NotebookState = {
  notebook: null,
  runtimeStatus: 'disconnected',
  isLoading: false,
  isSaving: false,
  lastSaved: null,
};

const notebookSlice = createSlice({
  name: 'notebook',
  initialState,
  reducers: {
    setNotebook(state, action: PayloadAction<INotebook>) {
      state.notebook = action.payload;
    },
    updateCell(state, action: PayloadAction<{ id: string; source: string }>) {
      if (state.notebook) {
        const cell = state.notebook.cells.find((c) => c.id === action.payload.id);
        if (cell) cell.source = action.payload.source;
      }
    },
    addCell(state, action: PayloadAction<{ index: number; cell: ICell }>) {
      if (state.notebook) {
        state.notebook.cells.splice(action.payload.index, 0, action.payload.cell);
      }
    },
    removeCell(state, action: PayloadAction<string>) {
      if (state.notebook) {
        state.notebook.cells = state.notebook.cells.filter((c) => c.id !== action.payload);
      }
    },
    updateCellOutput(
      state,
      action: PayloadAction<{ cellId: string; outputs: CellOutput[]; executionCount?: number }>
    ) {
      if (state.notebook) {
        const cell = state.notebook.cells.find((c) => c.id === action.payload.cellId);
        if (cell) {
          cell.outputs = action.payload.outputs;
          if (action.payload.executionCount !== undefined) {
            cell.executionCount = action.payload.executionCount;
          }
          cell.isRunning = false;
        }
      }
    },
    clearCellOutput(state, action: PayloadAction<string>) {
      if (state.notebook) {
        const cell = state.notebook.cells.find((c) => c.id === action.payload);
        if (cell) {
          cell.outputs = [];
          cell.executionCount = null;
        }
      }
    },
    setCellRunning(state, action: PayloadAction<{ cellId: string; isRunning: boolean }>) {
      if (state.notebook) {
        const cell = state.notebook.cells.find((c) => c.id === action.payload.cellId);
        if (cell) {
          cell.isRunning = action.payload.isRunning;
          if (action.payload.isRunning) cell.outputs = [];
        }
      }
    },
    setRuntimeStatus(state, action: PayloadAction<NotebookState['runtimeStatus']>) {
      state.runtimeStatus = action.payload;
    },
    setIsSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },
    setLastSaved(state, action: PayloadAction<string>) {
      state.lastSaved = action.payload;
      state.isSaving = false;
    },
  },
});

export const {
  setNotebook,
  updateCell,
  addCell,
  removeCell,
  updateCellOutput,
  clearCellOutput,
  setCellRunning,
  setRuntimeStatus,
  setIsSaving,
  setLastSaved,
} = notebookSlice.actions;

export default notebookSlice.reducer;

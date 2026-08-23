import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  addCell,
  removeCell,
  updateCell,
  updateCellOutput,
  setCellRunning,
  setRuntimeStatus,
  setNotebook,
} from '../features/notebook/notebookSlice';
import type { ICell } from '../features/notebook/notebookSlice';
import { notebookApi } from '../services/notebookApi';
import { v4 as uuidv4 } from 'uuid';

export function useNotebook(notebookId: string | undefined) {
  const dispatch = useDispatch();
  const { notebook, runtimeStatus } = useSelector((state: RootState) => state.notebook);
  const token = useSelector((state: RootState) => state.auth.token);

  const addCodeCell = useCallback((index?: number) => {
    const cell: ICell = {
      id: uuidv4(),
      type: 'code',
      source: '',
      outputs: [],
      executionCount: null,
      isRunning: false,
    };
    dispatch(addCell({ index: index ?? (notebook?.cells.length ?? 0), cell }));
  }, [dispatch, notebook]);

  const addMarkdownCell = useCallback((index?: number) => {
    const cell: ICell = {
      id: uuidv4(),
      type: 'markdown',
      source: '## New section\n\nWrite your notes here.',
      outputs: [],
      executionCount: null,
      isRunning: false,
    };
    dispatch(addCell({ index: index ?? (notebook?.cells.length ?? 0), cell }));
  }, [dispatch, notebook]);

  const deleteCell = useCallback((cellId: string) => {
    dispatch(removeCell(cellId));
  }, [dispatch]);

  const updateCellSource = useCallback((cellId: string, source: string) => {
    dispatch(updateCell({ id: cellId, source }));
  }, [dispatch]);

  const runCell = useCallback(async (cell: ICell) => {
    if (!notebookId || !token) {
      dispatch(updateCellOutput({
        cellId: cell.id,
        outputs: [{ type: 'error', data: 'Please sign in to run notebook cells.' }],
      }));
      return;
    }
    if (runtimeStatus !== 'ready') {
      dispatch(updateCellOutput({
        cellId: cell.id,
        outputs: [{ type: 'error', data: 'Runtime not connected. Click "Start Runtime" to begin.' }],
      }));
      return;
    }

    dispatch(setCellRunning({ cellId: cell.id, isRunning: true }));
    try {
      const res = await notebookApi.runCell(notebookId, cell.id, cell.source);
      dispatch(updateCellOutput({
        cellId: cell.id,
        outputs: res.data.outputs,
        executionCount: res.data.executionCount,
      }));
    } catch (err: any) {
      dispatch(updateCellOutput({
        cellId: cell.id,
        outputs: [{ type: 'error', data: err.response?.data?.details || err.message || 'Execution failed' }],
      }));
    } finally {
      dispatch(setCellRunning({ cellId: cell.id, isRunning: false }));
    }
  }, [dispatch, notebookId, token, runtimeStatus]);

  const startRuntime = useCallback(async () => {
    if (!notebookId || !token) return;
    dispatch(setRuntimeStatus('starting'));
    try {
      await notebookApi.startRuntime(notebookId);
      dispatch(setRuntimeStatus('ready'));
    } catch (e) {
      dispatch(setRuntimeStatus('disconnected'));
    }
  }, [dispatch, notebookId, token]);

  const stopRuntime = useCallback(async () => {
    if (!notebookId) return;
    try {
      await notebookApi.stopRuntime(notebookId);
    } catch (e) {}
    dispatch(setRuntimeStatus('disconnected'));
  }, [dispatch, notebookId]);

  const restartRuntime = useCallback(async () => {
    if (!notebookId || !token) return;
    dispatch(setRuntimeStatus('starting'));
    try {
      await notebookApi.restartRuntime(notebookId);
      dispatch(setRuntimeStatus('ready'));
    } catch (e) {
      dispatch(setRuntimeStatus('disconnected'));
    }
  }, [dispatch, notebookId, token]);

  const saveNotebook = useCallback(async () => {
    if (!notebookId || !notebook || !token) return;
    try {
      await notebookApi.update(notebookId, { title: notebook.title, cells: notebook.cells });
    } catch (e) {}
  }, [notebookId, notebook, token]);

  return {
    notebook,
    runtimeStatus,
    addCodeCell,
    addMarkdownCell,
    deleteCell,
    updateCellSource,
    runCell,
    startRuntime,
    stopRuntime,
    restartRuntime,
    saveNotebook,
  };
}

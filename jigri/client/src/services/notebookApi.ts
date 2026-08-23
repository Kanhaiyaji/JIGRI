import api from './api';

// Notebook CRUD
export const notebookApi = {
  list: () => api.get('/notebooks'),
  get: (id: string) => api.get(`/notebooks/${id}`),
  create: (data: { title: string; cells: any[] }) => api.post('/notebooks', data),
  update: (id: string, data: { title?: string; cells?: any[] }) => api.put(`/notebooks/${id}`, data),
  delete: (id: string) => api.delete(`/notebooks/${id}`),

  // Runtime
  startRuntime: (id: string) => api.post(`/notebooks/${id}/runtime/start`),
  stopRuntime: (id: string) => api.post(`/notebooks/${id}/runtime/stop`),
  restartRuntime: (id: string) => api.post(`/notebooks/${id}/runtime/restart`),
  getRuntimeStatus: (id: string) => api.get(`/notebooks/${id}/runtime/status`),

  // Cell execution
  runCell: (notebookId: string, cellId: string, code: string) =>
    api.post(`/notebooks/${notebookId}/cells/${cellId}/run`, { code }),
  runAll: (notebookId: string) => api.post(`/notebooks/${notebookId}/run-all`),
};

export default notebookApi;

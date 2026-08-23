import { io } from 'socket.io-client';

const socketUrl = (import.meta as any).env?.VITE_API_URL || '/';

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
});

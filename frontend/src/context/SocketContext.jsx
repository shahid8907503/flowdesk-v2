import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    // Only connect if user is logged in
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = window.location.origin; // In production, Nginx proxies sockets. In dev, Vite proxies it.
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinWorkspace = (workspaceId) => {
    if (socket) socket.emit('join_workspace', workspaceId);
  };

  const leaveWorkspace = (workspaceId) => {
    if (socket) socket.emit('leave_workspace', workspaceId);
  };

  const joinBoard = (boardId) => {
    if (socket) socket.emit('join_board', boardId);
  };

  const leaveBoard = (boardId) => {
    if (socket) socket.emit('leave_board', boardId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinWorkspace, leaveWorkspace, joinBoard, leaveBoard }}>
      {children}
    </SocketContext.Provider>
  );
};

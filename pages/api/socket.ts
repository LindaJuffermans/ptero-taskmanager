import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Socket as NetSocket } from 'net';
import { Server as IOServer } from 'socket.io';

import { PteroConnectionWrapper, pteroWebsocket, PteroWrapperEvents } from '@/lib/pterodactyl';
import { LogMessageType } from '@/lib/tasks';

/**
 * Extends next.NextApiResponse and adds socket-io support
 */
interface ISocketServer extends HTTPServer {
  io?: IOServer | undefined
};
interface ISocketWithIO extends NetSocket {
  server: ISocketServer
};
export interface INextApiResponseWithSocket extends NextApiResponse {
  socket: ISocketWithIO
};

/**
 * Defines the socket events
 */
export interface IServerToClientEvents {
  serverStatus: (serverId: string, state: string, upTime: number, cpu: number, memory: number) => void
  taskStatus: (serverId: string, type: LogMessageType, message: string) => void
};
export interface IClientToServerEvents {
};

export default function SocketHandler(_: NextApiRequest, response: INextApiResponseWithSocket) {
  if (response.socket.server.io && global.ioSocket) {
    console.log(`Socket connection was already established`);
    // Socket is already available
  } else {
    /* Client-To-Server first, Server-To-Client second */
    /* This is reversed in the client socket definition */
    const io = new IOServer<IClientToServerEvents, IServerToClientEvents>(response.socket.server);
    /* (Multiple interfaces can be used, e.g. IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData) */
    response.socket.server.io = io;
    global.ioSocket = io;

    io.on('connection', () => {
      console.log(`Socket connection established`);
    });
  }
  response.end();
}

const openPteroConnection = (serverId: string) => {
  const pteroSocket: PteroConnectionWrapper | undefined = pteroWebsocket(serverId);
  if (pteroSocket === undefined) {
    console.error(`Unable to get socket for ${serverId}`);
    return;
  }

  pteroSocket.addEventListener('onStatsMessage', (event: PteroWrapperEvents['onStatsMessage']) => {
    if (global.ioSocket !== undefined) {
      global.ioSocket.sockets.emit('serverStatus', serverId, event.state, event.uptime, event.cpu_absolute, event.memory_bytes);
    }
  });
};

export const openAllPteroConnections = (serverIdList: string[]) => {
  serverIdList.forEach(serverId => openPteroConnection(serverId));
};

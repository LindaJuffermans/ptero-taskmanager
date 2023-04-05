import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Socket as NetSocket } from 'net';
import { Server as IOServer, Socket } from 'socket.io';

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
  hello: () => void
};

export default function SocketHandler(request: NextApiRequest, response: INextApiResponseWithSocket) {
  if (response.socket.server.io && global.ioSocket) {
    // Socket is already available
  } else {
    /* Client-To-Server first, Server-To-Client second */
    /* This is reversed in the client socket definition */
    const io = new IOServer<IClientToServerEvents, IServerToClientEvents>(response.socket.server);
    /* (Multiple interfaces can be used, e.g. IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData) */
    response.socket.server.io = io;
    global.ioSocket = io;

      /*
    io.on('connection', (socket: Socket<IClientToServerEvents, IServerToClientEvents>) => {
      socket.on('hello', () => {
        const randomServerNumber:number = Math.floor(Math.random() * serverList.length)
        const randomServerId:string = serverList[randomServerNumber]!
        const randomStatusNumber:number = Math.floor(Math.random() * 4)
        const randomState:string = ['starting', 'running', 'stopping', 'stopped'][randomStatusNumber]!
        const randomUptime:number = Math.random() * 1000 * 60 * 60
        const randomCpu:number = Math.random() * 200
        const randomMemory:number = Math.random() * 64 * 1000 * 1000 * 1000

        console.log('emitting: serverStatus', randomServerId, randomState, randomUptime, randomCpu, randomMemory)
        socket.emit('serverStatus', randomServerId, randomState, randomUptime, randomCpu, randomMemory)
      })
    });
      */
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

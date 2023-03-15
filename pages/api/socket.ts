import { pteroSocketWrapper, pteroWebsocket, PteroWrapperEvents } from '@/lib/pterodactyl'
import { LogMessageType } from '@/lib/tasks'

import { NextApiRequest, NextApiResponse } from 'next'
import { Server as HTTPServer } from 'http'
import { Socket as NetSocket } from 'net'
import { Server as IOServer, Socket } from 'socket.io'

/**
 * Extends next.NextApiResponse and adds socket-io support
 */
interface ISocketServer extends HTTPServer {
  io?: IOServer | undefined
}
interface ISocketWithIO extends NetSocket {
  server: ISocketServer
}
export interface INextApiResponseWithSocket extends NextApiResponse {
  socket: ISocketWithIO
}


/**
 * Defines the socket events
 */
export interface IServerToClientEvents {
  serverStatus: (serverId: string, state: string, upTime: number, cpu: number, memory: number) => void
  taskStatus: (serverId: string, type: LogMessageType, message: string) => void
}
export interface IClientToServerEvents {
  hello: () => void
}

export default function SocketHandler(request: NextApiRequest, response: INextApiResponseWithSocket) {
  console.log('Got websocket request')
  if (response.socket.server.io && global.ioSocket) {
    console.log('Socket is already available')
  } else {
    console.log('Initialising websocket')

    /* Client-To-Server first, Server-To-Client second */
    /* This is reversed in the client socket definition */
    const io = new IOServer<IClientToServerEvents, IServerToClientEvents>(response.socket.server)
    /* (Multiple interfaces can be used, e.g. IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData) */
    response.socket.server.io = io
    // socketIo = io
    // console.log(`setting socketIo:`, socketIo)
    global.ioSocket = io

    io.on('connection', (socket: Socket<IClientToServerEvents, IServerToClientEvents>) => {
      /*
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
      */
    })
  }
  response.end()
}

const openPteroConnection = (serverId: string) => {
  const pteroSocket: pteroSocketWrapper | undefined = pteroWebsocket(serverId)
  if (pteroSocket === undefined) {
    console.error(`Unable to get socket for ${serverId}`)
    return;
  }
  

  pteroSocket.addEventListener('onStatsMessage', (...args: PteroWrapperEvents['onStatsMessage']) => {
    if (global.ioSocket !== undefined) {
      global.ioSocket.sockets.emit('serverStatus', serverId, args[0].state, args[0].uptime, args[0].cpu_absolute, args[0].memory_bytes)
    }
  })
}

export const openAllPteroConnections = (serverIdList: string[]) => {
  serverIdList.forEach(serverId => openPteroConnection(serverId))
}

/*
const openAllPteroConnections = () => {
  const contents:Buffer = fs.readFileSync(process.cwd() + `/${process.env['SERVER_CONFIG_FILE']}`)
  const config:Configuration = YAML.parse(`${contents}`)

  const serverList: string[] = config.categories.map(category => category.servers.map(server => server.id)).flat()
  serverList.forEach(serverId => openPteroConnection(serverId))
}
*/


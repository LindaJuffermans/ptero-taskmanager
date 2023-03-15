import { runListHandler, ServerRunHandler } from '@/lib/servers'
import { IClientToServerEvents, IServerToClientEvents, openAllPteroConnections } from '@/pages/api/socket'

import { useEffect, useState, createContext, useReducer, Dispatch } from 'react'
import { io, Socket } from 'socket.io-client'

import fs from 'fs'
import YAML from 'yaml'
import Head from 'next/head'

import { Body } from '@/components/App/Body'

import 'split-pane-react/esm/themes/default.css'

export type Configuration = {
  panelDomain: string,
  clientKey: string,
  categories: ConfigurationCategoryList
}
export type ConfigurationCategoryList = ConfigurationCategory[]
export type ConfigurationCategory = {
  name: string,
  servers: ConfigurationServerList,
}
type ConfigurationServerList = ConfigurationServer[]
export type ConfigurationServer = {
  name: string,
  id: string,
  node: string,
}

type LocalClientSocket = Socket<IServerToClientEvents, IClientToServerEvents>

export const LocalSocketContext = createContext<LocalClientSocket | null>(null)
export const RunListContext = createContext<[Set<string> | null, Dispatch<ServerRunHandler> | null]>([null, null])

type AppProps = {
  categories: ConfigurationCategoryList,
}
export default function App(props: AppProps) {
  const [socket, setSocket] = useState<LocalClientSocket | null>(null)
  const [runList, runListDispatcher] = useReducer(runListHandler, new Set<string>())

  useEffect(() => {
    if (!socket || !socket.connected) {
      openSocket()
    }
    return () => {
      closeSocket()
    }
  }, [])

  const openSocket = async () => {
    doOpenSocket()
  }

  const closeSocket = () => {
    if (socket?.connected) {
      socket.disconnect()
    } else {
      console.error(`App: Socket wasn't opened`)
    }
  }

  const doOpenSocket = async () => {
    console.log(`doOpenSocket`, socket)
    if (socket) {
      return
    }

    await fetch('/api/socket')
    const _socket = io()
    console.log(`fetched`, _socket)
    setSocket(_socket)

    _socket.on('connect', () => {
      console.log(`App: Client connected`)
    })

    // _socket.onAny((eventName: string, ...args) => {  })
  }

  return (
    <>
      <Head>
        <title>Pterodactyl Task Manager</title>
        <meta name="description" content="Task automation for Pterodactyl panel maintained servers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16" />
        <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
      </Head>
      <LocalSocketContext.Provider value={socket}>
        <RunListContext.Provider value={[runList, runListDispatcher]}>
          <Body categories={props.categories} />
        </RunListContext.Provider>
      </LocalSocketContext.Provider>
    </>
  )
}

export async function getStaticProps() {
  const contents: Buffer = fs.readFileSync(`${process.env['SERVER_CONFIG_FILE']}`)
  const config: Configuration = YAML.parse(`${contents}`)
  const serverIdList: string[] = config.categories.map(category => category.servers.map(server => server.id)).flat()
  openAllPteroConnections(serverIdList)

  return {
    props: {
      categories: config['categories']
    }
  }
}

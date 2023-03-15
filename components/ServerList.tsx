import { ServerStatus, ServerStatusMap, statusHandler } from '@/lib/servers'

import { createContext, useContext, useEffect, useReducer } from 'react'

import { ConfigurationCategoryList, LocalSocketContext } from '@/pages/index'
import { Category } from '@/components/ServerList/Category'

import styles from '@/styles/ServerList.module.css'

export const StatusMapContext = createContext<ServerStatusMap | null>(null)

type ServerListProps = {
  categories: ConfigurationCategoryList,
}
export const ServerList = (props: ServerListProps) => {
  const [statusMap, statusMapDispatcher] = useReducer(statusHandler, new Map<string, ServerStatus>())
  const socket = useContext(LocalSocketContext)

  useEffect(() => {
    console.info('ServerList', props.categories)
  }, [])

  useEffect(() => {
    socket?.on('serverStatus', (serverId: string, state: string, upTime: number, cpu: number, memory: number) => {
      statusMapDispatcher({
        action: 'update',
        serverId,
        status: {
          state,
          upTime,
          cpu,
          memory,
        }
      })
    })
  }, [socket])

  return (
    <StatusMapContext.Provider value={statusMap}>
      <div className={styles['serverList']}>
        {
          props.categories.map((category, index) => <Category key={index} category={category} />)
        }
      </div>
    </StatusMapContext.Provider>
  )
}

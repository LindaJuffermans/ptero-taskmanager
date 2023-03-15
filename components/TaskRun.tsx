import { LogMessageType, taskLogHandler } from '@/lib/tasks'

import { useContext, useEffect, useReducer, useState } from 'react'

import { LocalSocketContext } from '@/pages/index'

import styles from '@/styles/TaskRun.module.css'

export const TaskRun = () => {
  const [doRender, setDoRender] = useState(false)
  const socket = useContext(LocalSocketContext)
  const [logList, logListHandler] = useReducer(taskLogHandler, [])


  useEffect(() => {
    setDoRender(true)
    logListHandler({action: 'clear'})

    if (socket) {
      socket.on('taskStatus', (serverId: string, type: LogMessageType, message: string) => {
        logListHandler({
          action: 'add',
          serverId,
          type,
          message,
        })
      })
    }
  }, [])
  
  if (!doRender) {
    return (
      <>
        <div className={styles['taskRun']}>
          <h2>Loading...</h2>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles['taskRun']}>
        <h2>Test</h2>
        <div className={styles['console']}>
          <>
            <p>Lorem ipsum</p><p>dolor sit amet</p><p>consectetur adipisicing</p><p>Fugiat sapiente</p><p>doloribus dolorem</p><p>ratione similique</p>
            {
              logList.map(log => {
                <>
                  <p>${log.serverId}</p>
                  <p>${log.logs.map(message => message.message).join(', ')}</p>
                  <hr />
                </>
              })
            }
          </>
        </div>
      </div>
    </>
  )
}

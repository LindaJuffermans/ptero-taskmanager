import { ServerStatus } from '@/lib/servers'

import { ChangeEvent, useContext, useEffect, useState } from 'react'

import { ConfigurationServer, RunListContext } from '@/pages'
import { StatusMapContext } from '@/components/ServerList'

import styles from '@/styles/ServerList.module.css'

const defaultStatus: ServerStatus = {
  state: 'unknown',
  upTime: 0,
  cpu: 0,
  memory: 0,
}

/**
 * Renders a single server line on the page
 * @param index The line of the server
 * @param server The server object
 */
type ServerProps = {
  index: number,
  server: ConfigurationServer,
}
export const Server = (props: ServerProps) => {
  const [status, setStatus] = useState<ServerStatus>(defaultStatus)
  const statusMap = useContext(StatusMapContext)
  const [runList, runListDispatcher] = useContext(RunListContext)

  useEffect(() => {
    const _status = statusMap?.get(props.server.id)
    if (_status) {
      setStatus(_status)
    }
  }, [statusMap])

  const updateRunList = (event: ChangeEvent<HTMLInputElement>) => {
    if (!runListDispatcher) {
      return;
    }
    if (event?.target?.checked) {
      runListDispatcher({
        action: 'add',
        serverId: props.server.id
      })
    } else {
      runListDispatcher({
        action: 'remove',
        serverId: props.server.id
      })
    }
  }

  return (
    <li className={`${styles[status.state]}`}>
      <p className={`${styles['name']} name`}>{(props.index + 1).toString().padStart(2, '0')} - {props.server.name}</p>
      <p className={`${styles['state']} state`}>{status.state} ({Math.floor(status.upTime / 1000 / 60 / 60)}'{(Math.floor(status.upTime / 1000 / 60) % 60).toString().padStart(2, '0')})</p>
      <p className={`${styles['cpu']} cpu`}>{status.cpu?.toFixed(2)}%</p>
      <p className={`${styles['mem']} mem`}>{(status.memory / 1000 / 1000 / 1000).toFixed(2)} GB</p>
      <p className={`${styles['tasks']} task`}>
        <label htmlFor={props.server.id}>
          <input type='checkbox' id={props.server.id} value='true' checked={runList?.has(props.server.id)} onChange={updateRunList}/>
          <label htmlFor={props.server.id} className={`${styles['toggle']} ${runList?.has(props.server.id) ? styles['toggle-on'] : styles['toggle-off']}`}/>
        </label>
      </p>
    </li>
  )
}

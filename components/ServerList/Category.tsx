import { MouseEvent, useContext, useState } from 'react'

import { ConfigurationCategory, RunListContext } from '@/pages'
import { Server } from '@/components/ServerList/Server'

import styles from '@/styles/ServerList.module.css'

type CategoryProps = {
  category: ConfigurationCategory,
}
export const Category = (props: CategoryProps) => {
  const [runState, setRunState] = useState(false)
  const [runList, runListDispatcher] = useContext(RunListContext)

  const updateRunList = (event: MouseEvent<HTMLParagraphElement>) => {
    if (!runListDispatcher) {
      return;
    }

    const _runState = !runState
    setRunState(_runState)

    props.category.servers.forEach((server) => {
      if (_runState) {
        runListDispatcher({
          action: 'add',
          serverId: server.id
        })
      } else {
        runListDispatcher({
          action: 'remove',
          serverId: server.id
        })
      }
    })
  }

  return (
    <section key={props.category.name} className={styles['section']}>
    <h2>{props.category.name}</h2>
    <ol className={styles['list']}>
      <li key='header' className={styles['header']}>
        <p className={styles['name']}>Server</p>
        <p className={styles['state']}>State (Uptime)</p>
        <p className={styles['cpu']}>CPU</p>
        <p className={styles['mem']}>Memory</p>
        <p className={styles['tasks']} onClick={updateRunList}>Tasks</p>
      </li>
      {
        props.category.servers.map((server, index) => {
          return <Server key={server.id} index={index} server={server} />
        })
      }
    </ol>
  </section>
  )
}

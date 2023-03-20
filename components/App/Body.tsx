
import { useState } from 'react'
import SplitPane, { SashContent } from 'split-pane-react'

import { ConfigurationCategoryList } from '@/pages'
import { ServerList } from '@/components/ServerList'
import { TaskManager } from '@/components/TaskManager'
import { TaskRun } from '@/components/TaskRun'

import 'split-pane-react/esm/themes/default.css'
import styles from '@/styles/App.module.css'

const sashRenderHorizontal = (_: number, active: boolean) => {
  return (
    <SashContent className={`${styles['sashWrapHorizontal']} ${active ? styles['active'] : styles['inactive']}`}>
      <span className={styles['line']}></span>
      <span></span>
    </SashContent>
  )
}
const sashRenderVertical = (_: number, active: boolean) => {
  return (
    <SashContent className={`${styles['sashWrapVertical']} ${active ? styles['active'] : styles['inactive']}`}>
      <span className={styles['line']}></span>
      <span></span>
    </SashContent>
  )
}

export type BodyProps = {
  categories: ConfigurationCategoryList,
  onExecute: () => void,
}

export const Body = (props: BodyProps) => {
  const [horizontalSplit, setHorizontalSplit] = useState<(string | number)[]>(['70%', '30%'])
  const [verticalSplit, setVerticalSplit] = useState<(string | number)[]>(['60%', '40%'])

  return (
    <>
      <header className={styles['header']}>
        <h1>Pterodactyl Task Manager</h1>
      </header>
      <main className={styles['main']}>
        <SplitPane split='horizontal' sizes={horizontalSplit} onChange={setHorizontalSplit} sashRender={sashRenderHorizontal}>
          <div key='top' className={styles['top']}>
            <SplitPane split='vertical' sizes={verticalSplit} onChange={setVerticalSplit} sashRender={sashRenderVertical}>
              <div key='topLeft' className={styles['topLeft']}>
                <ServerList categories={props.categories} />
              </div>
              <div key='topRight' className={styles['topRight']}>
                <TaskManager onExecute={props.onExecute} />
              </div>
            </SplitPane>
          </div>
          <div key='bottom' className={styles['bottom']}>
            <TaskRun />
          </div>
        </SplitPane>
      </main>
    </>
  )
}

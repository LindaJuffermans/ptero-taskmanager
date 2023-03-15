import { getTaskInformation, taskListHandler, taskHandlerType } from '@/lib/tasks'

import { useEffect, useState, useReducer, createContext, Dispatch } from 'react'

import { NewTask } from '@/components/TaskManager/NewTask'

import styles from '@/styles/TaskManager.module.css'

export const TaskListContext = createContext<Dispatch<taskHandlerType> | null>(null)

export const TaskManager = () => {
  const [doRender, setDoRender] = useState(false)
  const [taskList, taskDispatcher] = useReducer(taskListHandler, [])

  useEffect(() => {
    taskDispatcher({
      action: 'set',
      taskList: [
        {
          taskName: 'PowerStop',
          properties: {},
        },
        {
          taskName: 'ScheduleActivate',
          properties: {},
        },
        {
          taskName: 'FilePull',
          properties: {},
        },
        {
          taskName: 'PowerStart',
          properties: {},
        },
      ]
    })

    setDoRender(true)
  }, [])

  if (!doRender) {
    return (
      <>
        <div className={styles['taskManager']}>
          <h2>
            <p>Loading...</p>
            <button key='run' className={`fas fa-forward`} title='Run'></button>
            <button key='open' className={`fas fa-folder-open`} title='Open'></button>
            <button key='save' className={`fas fa-save`} title='Save'></button>
            <button key='clear' className={`${styles['warning']} fas fa-trash-alt`} title='Delete'></button>
          </h2>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles['taskManager']}>
        <h2>
          <p>Tasks</p>
          <button key='run' className={`fas fa-forward`} title='Run'></button>
          <button key='open' className={`fas fa-folder-open`} title='Open'></button>
          <button key='save' className={`fas fa-save`} title='Save'></button>
          <button key='clear' className={`${styles['warning']} fas fa-trash-alt`} title='Delete'></button>
        </h2>
        <TaskListContext.Provider value={taskDispatcher}>
          <ol className={styles['list']}>
            {
              taskList.map((_task, _index) => {
                const UiComponent = getTaskInformation(_task.taskName).component
                return (
                  <li key={_index} className={styles['taskUi']}>
                    <h3>
                      <p>{getTaskInformation(_task.taskName).label}</p>
                      <button key='up' className={`${styles['up']} fas fa-angle-up`} title='Move up' onClick={() => taskDispatcher({ action: 'up', index: _index })} />
                      <button key='down' className={`${styles['down']} fas fa-angle-down`} title='Move down' onClick={() => taskDispatcher({ action: 'down', index: _index })} />
                      <button key='clear' className={`${styles['warning']} fas fa-trash-alt`} title='Delete' onClick={() => taskDispatcher({ action: 'delete', index: _index })} />
                    </h3>
                    <UiComponent index={_index} properties={_task.properties} />
                  </li>
                )
              })
            }
          </ol>
          <NewTask />
        </TaskListContext.Provider>
      </div>
    </>
  )
}

import * as TaskUI from '@/components/TaskManager/TaskUI'

/**
 * All the different tasks that can be executed.
 * taskname: {
 *   label: string,
 *   component: JSX.Element,
 * }
 */
export const taskInformation = {
  'PowerStart': {
    label: 'Start the server',
    component: TaskUI.PowerStart,
  },
  'PowerStop': {
    label: 'Stop the server',
    component: TaskUI.PowerStop,
  },
  'ScheduleActivate': {
    label: 'Activate a schedule',
    component: TaskUI.ScheduleActivate,
  },
  'ScheduleDeactivate': {
    label: 'Deactivate a schedule',
    component: TaskUI.ScheduleDeactivate,
  },
  'FilePull': {
    label: 'Pull a remote file',
    component: TaskUI.FilePull,
  },
  'FileDelete': {
    label: 'Delete a file',
    component: TaskUI.FileDelete,
  },
  'FileDecompress': {
    label: 'Extract a file',
    component: TaskUI.FileDecompress,
  },
  'FileCompress': {
    label: 'Archive a folder',
    component: TaskUI.FileCompress,
  },
  'StartupUpdate': {
    label: 'Update a startup variable',
    component: TaskUI.StartupUpdate,
  },
  'StartupReinstall': {
    label: 'Reinstall the server',
    component: TaskUI.StartupReinstall,
  },
  'ServerSuspend': {
    label: 'Suspend the server',
    component: TaskUI.ServerSuspend,
  },
  'ServerUnsuspend': {
    label: 'Unsuspend the server',
    component: TaskUI.ServerUnsuspend,
  },
}

/* Type based on the keys of taskInformation */
type TaskInformationKey = keyof typeof taskInformation

/* Predicate to verify if the provided string is a valid key for taskInformation */
const isTaskInformationKey = (key: string): key is TaskInformationKey => {
  return key in taskInformation
}

/**
 * Returns the task information matching the provided taskName
 * @param {string} taskName The name of the task
 * @returns {object} The task information
 */
export const getTaskInformation = (taskName: string) => {
  if (isTaskInformationKey(taskName)) {
    return taskInformation[taskName]
  } else {
    return {
      label: 'Unknown',
      component: TaskUI.Noop
    }
  }
}

type Task = {
  taskName: string,
  properties: {},
}
export type taskList = Task[]

type TaskHandlerSet = {
  action: 'set',
  taskList: Task[],
}
type TaskHandlerAdd = {
  action: 'add',
  taskName: string,
}
type TaskHandlerDelete = {
  action: 'delete',
  index: number,
}
type TaskHandlerUpdate = {
  action: 'update',
  index: number,
  properties: {},
}
type TaskHandlerUp = {
  action: 'up',
  index: number,
}
type TaskHandlerDown = {
  action: 'down',
  index: number,
}
export type taskHandlerType = TaskHandlerSet | TaskHandlerAdd | TaskHandlerDelete | TaskHandlerUpdate | TaskHandlerUp | TaskHandlerDown

export const taskListHandler = (taskList: taskList, data: taskHandlerType): taskList => {
  if (data.action === 'set') {
    return data.taskList
  }
  if (data.action === 'add') {
    return [...taskList, { taskName: data.taskName, properties: {} }]
  }
  if (data.action === 'delete') {
    const _taskList = taskList.slice(0)
    _taskList.splice(data.index, 1)
    return _taskList
  }
  if (data.action === 'update') {
    return taskList.map((_task: Task, _index: number) => {
      if (_index === data.index) {
        _task.properties = data.properties
      }
      return _task
    })
  }
  if (data.action === 'up') {
    const _taskList = taskList.slice(0)
    const _task = _taskList.splice(data.index, 1)[0]
    if (_task === undefined) {
      return taskList
    }
    _taskList.splice(data.index - 1, 0, _task)
    return _taskList
  }
  if (data.action === 'down') {
    const _taskList = taskList.slice(0)
    const _task = _taskList.splice(data.index, 1)[0]
    if (_task === undefined) {
      return taskList
    }
    _taskList.splice(data.index + 1, 0, _task)
    return _taskList
  }
  return taskList
}

export type LogMessageType = 'info' | 'error' | 'completed'
type LogMessage = {
  type: LogMessageType,
  message: string,
}
type ServerLog = {
  serverId: string,
  logs: LogMessage[],
}
export type LogList = ServerLog[]

type LogHandlerClear = {
  action: 'clear',
}
type LogHandlerInit = {
  action: 'init',
  serverIdList: string[],
}
type LogHandlerAdd = {
  action: 'add',
  serverId: string,
  type: LogMessageType,
  message: string,
}
type LogHandlerType = LogHandlerClear | LogHandlerInit | LogHandlerAdd

const logListEntry = (serverId: string) => {
  return {
    serverId: serverId,
    logs: [],
  }
}

export const taskLogHandler = (logList: LogList, data: LogHandlerType) => {
  if (data.action === 'clear') {
    return [] as LogList
  }
  if (data.action === 'init') {
    const _logList: LogList = []
    data.serverIdList.forEach(_serverId => {
      _logList.push({
        serverId: _serverId,
        logs: [],
      })
    })
    return _logList
  }
  if (data.action === 'add') {
    let targetIndex = logList.findIndex(log => log.serverId === data.serverId)
    const targetLog = targetIndex === -1 ? logListEntry(data.serverId) : logList[targetIndex]
    if (!targetLog) {
      return logList
    }
    targetLog.logs.push({
      type: data.type,
      message: data.message,
    })
    return logList.map((log: ServerLog, index: number) => index === targetIndex ? targetLog : log)
  }
  return logList
}

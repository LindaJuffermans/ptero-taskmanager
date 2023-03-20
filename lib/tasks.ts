import * as taskUI from '@/components/TaskManager/TaskUI'
import * as taskRun from '@/lib/taskRun'

/**
 * All the different tasks that can be executed.
 * taskname: {
 *   label: string,
 *   component: JSX.Element,
 *   method: () => {}
 * }
 */
export const taskLabel = {
  'PowerStart': 'Start the server',
  'PowerStop': 'Stop the server',
  'ScheduleActivate': 'Activate a schedule',
  'ScheduleDeactivate': 'Deactivate a schedule',
  'FilePull': 'Pull a remote file',
  'FileDelete': 'Delete a file',
  'FileDecompress': 'Extract a file',
  'FileCompress': 'Archive a folder',
  'StartupUpdate': 'Update a startup variable',
  'StartupReinstall': 'Reinstall the server',
  'ServerSuspend': 'Suspend the server',
  'ServerUnsuspend': 'Unsuspend the server',
}

type TaskKey = keyof typeof taskLabel

/**
 * The types of tasks and their properties used in UI and task running
 */
export type PowerStartTask = {
  taskName: 'PowerStart',
  properties: {
    wait?: boolean,
  }
}
export type PowerStopTask = {
  taskName: 'PowerStop',
  properties: {
    wait?: boolean,
    killTimeout?: string,
  }
}
export type ScheduleActivateTask = {
  taskName: 'ScheduleActivate',
  properties: {
    scheduleName?: string,
  }
}
export type ScheduleDeactivateTask = {
  taskName: 'ScheduleDeactivate',
  properties: {
    scheduleName?: string,
  }
}
export type FilePullTask = {
  taskName: 'FilePull',
  properties: {
    sourceUrl?: string,
    targetFile?: string,
  }
}
export type FileDeleteTask = {
  taskName: 'FileDelete',
  properties: {
    targetFile?: string,
  }
}
export type FileDecompressTask = {
  taskName: 'FileDecompress',
  properties: {
    sourceFile?: string,
    targetFolder?: string,
  }
}
export type FileCompressTask = {
  taskName: 'FileCompress',
  properties: {
    targetFolder?: string,
  }
}
export type StartupUpdateTask = {
  taskName: 'StartupUpdate',
  properties: {
    variableName?: string,
    value?: string,
  }
}
export type StartupReinstallTask = {
  taskName: 'StartupReinstall',
  properties: {}
}
export type ServerSuspendTask = {
  taskName: 'ServerSuspend',
  properties: {}
}
export type ServerUnsuspendTask = {
  taskName: 'ServerUnsuspend',
  properties: {}
}

export type Task = PowerStartTask | PowerStopTask | ScheduleActivateTask | ScheduleDeactivateTask | FilePullTask | FileDeleteTask | FileDecompressTask | FileCompressTask | StartupUpdateTask | StartupReinstallTask | ServerSuspendTask | ServerUnsuspendTask
export type TaskList = Task[]

type TaskHandlerSet = {
  action: 'set',
  taskList: TaskList,
}
type TaskHandlerAdd = {
  action: 'add',
  taskName: TaskKey,
}
type TaskHandlerDelete = {
  action: 'delete',
  index: number,
}
type TaskHandlerUpdate = {
  action: 'update',
  index: number,
  task: Task,
}
type TaskHandlerUp = {
  action: 'up',
  index: number,
}
type TaskHandlerDown = {
  action: 'down',
  index: number,
}
export type TaskHandler = TaskHandlerSet | TaskHandlerAdd | TaskHandlerDelete | TaskHandlerUpdate | TaskHandlerUp | TaskHandlerDown

export function taskListHandler(taskList: TaskList, data: TaskHandler): TaskList {
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
    return taskList.map((_task: Task, _index: number) => (_index === data.index) ? data.task : _task)
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

export const taskLogHandler = (logList: LogList, data: LogHandlerType): LogList => {
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

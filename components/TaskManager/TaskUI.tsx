import { useState, FC, useEffect, useContext, ChangeEvent } from 'react'

import { TaskListContext } from '@/components/TaskManager'

import styles from '@/styles/TaskManager.module.css'

/**
 * Fallback task that does nothing, in case the actual task didn't exist
 */
type PropertiesNoop = {}
export const Noop: FC<PropertiesNoop> = (props: PropertiesNoop) => {
  return (
    <>
      <p>No settings</p>
    </>
  )
}

/**
 * Change power state to start
 * @param index The index of the task in the task list
 * @param wait Whether or not the task should wait until startup has completed
 */
type PropertiesPowerStart = {
  index: number,
  properties: {
    wait?: boolean,
  }
}
export const PowerStart: FC<PropertiesPowerStart> = (props: PropertiesPowerStart) => {
  const [isWait, setIsWait] = useState(false)
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setIsWait(!!props.properties.wait)
  }, [])

  const changeWait = (event: ChangeEvent<HTMLInputElement>) => {
    setIsWait(event.target.checked)
    props.properties.wait = event.target.checked
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`wait${props.index}`} htmlFor={`wait${props.index}`}>
        <input type='checkbox' id={`wait${props.index}`} value='true' checked={isWait} onChange={changeWait} />
        <label htmlFor={`wait${props.index}`} className={`${styles['toggle']} ${isWait ? styles['toggle-on'] : styles['toggle-off']}`} />
        <p>Wait for completion</p>
      </label>
    </>
  )
}

/**
 * Change power state to stop
 * @param index The index of the task in the task list
 * @param wait Whether or not the task should wait until shutdown has completed
 * @param killTimeout Specifies a delay in seconds before the server is killed if shutdown hasn't completed
 */
type PropertiesPowerStop = {
  index: number,
  properties: {
    wait?: boolean,
    killTimeout?: string,
  }
}
export const PowerStop: FC<PropertiesPowerStop> = (props: PropertiesPowerStop) => {
  const [isWait, setIsWait] = useState(false)
  const [killTimeout, setKillTimeout] = useState('0')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setIsWait(!!props.properties.wait)
    setKillTimeout(props.properties.killTimeout || '0')
  }, [])

  const changeWait = (event: ChangeEvent<HTMLInputElement>) => {
    setIsWait(event.target.checked)
    props.properties.wait = event.target.checked
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  const changeKillTimeout = (event: ChangeEvent<HTMLInputElement>) => {
    setKillTimeout(event.target.value)
    props.properties.killTimeout = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`wait${props.index}`} htmlFor={`wait${props.index}`}>
        <input type='checkbox' id={`wait${props.index}`} value='true' checked={isWait} onChange={changeWait} />
        <label htmlFor={`wait${props.index}`} className={`${styles['toggle']} ${isWait ? styles['toggle-on'] : styles['toggle-off']}`} />
        <p>Wait for completion</p>
      </label>
      <label key={`kill${props.index}`} htmlFor={`kill${props.index}`}>
        <p>Kill after (seconds):</p>
        <input type='number' id={`kill${props.index}`} value={killTimeout} disabled={!isWait} onChange={changeKillTimeout} />
      </label>
    </>
  )
}

/**
 * Update schedule to active
 * @param index The index of the task in the task list
 * @param scheduleName The name of the schedule to be made active
 */
type PropertiesScheduleActivate = {
  index: number,
    properties: {
    scheduleName?: string,
  }
}
export const ScheduleActivate: FC<PropertiesScheduleActivate> = (props: PropertiesScheduleActivate) => {
  const [scheduleName, setScheduleName] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setScheduleName(props.properties.scheduleName || '')
  }, [])

  const changeScheduleName = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduleName(event.target.value)
    props.properties.scheduleName = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`schedule${props.index}`} htmlFor={`schedule${props.index}`}>
        <p>Schedule name:</p>
        <input type='text' id={`schedule${props.index}`} value={scheduleName} onChange={changeScheduleName} />
      </label>
    </>
  )
}

/**
 * Update schedule to inactive
 * @param index The index of the task in the task list
 * @param scheduleName The name of the schedule to be made inactive
 */
type PropertiesScheduleDeactivate = PropertiesScheduleActivate
export const ScheduleDeactivate: FC<PropertiesScheduleDeactivate> = (props: PropertiesScheduleActivate) => {
  const [scheduleName, setScheduleName] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setScheduleName(props.properties.scheduleName || '')
  }, [])

  const changeScheduleName = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduleName(event.target.value)
    props.properties.scheduleName = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`schedule${props.index}`} htmlFor={`schedule${props.index}`}>
        <p>Schedule name:</p>
        <input type='text' id={`schedule${props.index}`} value={scheduleName} onChange={changeScheduleName} />
      </label>
    </>
  )
}

/**
 * Download a file from an external URL
 * @param index The index of the task in the task list
 * @param sourceUrl The URL of the file to be downloaded
 * @param targetFile The path and name of the file after download
 */
type PropertiesFilePull = {
  index: number,
  properties: {
    sourceUrl?: string,
    targetFile?: string,
  }
}
export const FilePull: FC<PropertiesFilePull> = (props: PropertiesFilePull) => {
  const [sourceUrl, setSourceUrl] = useState('')
  const [targetFile, setTargetFile] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setSourceUrl(props.properties.sourceUrl || '')
    setTargetFile(props.properties.targetFile || '')
  }, [])

  const changeSourceUrl = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceUrl(event.target.value)
    props.properties.sourceUrl = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  const changeTargetFile = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFile(event.target.value)
    props.properties.targetFile = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`source${props.index}`} htmlFor={`source${props.index}`}>
        <p>Source url:</p>
        <input type='text' id={`source${props.index}`} value={sourceUrl} onChange={changeSourceUrl} />
      </label>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target file:</p>
        <input type='text' id={`target${props.index}`} value={targetFile} onChange={changeTargetFile} />
      </label>
    </>
  )
}

/**
 * Deletes a file
 * @param index The index of the task in the task list
 * @param targetFile The path and name of the file to be deleted
 */
type PropertiesFileDelete = {
  index: number,
    properties: {
    targetFile?: string,
  }
}
export const FileDelete: FC<PropertiesFileDelete> = (props: PropertiesFileDelete) => {
  const [targetFile, setTargetFile] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setTargetFile(props.properties.targetFile || '')
  }, [])

  const changeTargetFile = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFile(event.target.value)
    props.properties.targetFile = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target file:</p>
        <input type='text' id={`target${props.index}`} value={targetFile} onChange={changeTargetFile} />
      </label>
    </>
  )
}

/**
 * Decompress a file
 * @param index The index of the task in the task list
 * @param sourceFile The path and name of the archive file
 * @param targetFolder The folder where the archive is extracted to
 */
type PropertiesFileDecompress = {
  index: number,
  properties: {
    sourceFile?: string,
    targetFolder?: string,
  }
}
export const FileDecompress: FC<PropertiesFileDecompress> = (props: PropertiesFileDecompress) => {
  const [sourceFile, setSourceFile] = useState('')
  const [targetFolder, setTargetFolder] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setSourceFile(props.properties.sourceFile || '')
    setTargetFolder(props.properties.targetFolder || '')
  }, [])

  const changeSourceFile = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceFile(event.target.value)
    props.properties.sourceFile = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  const changeTargetFolder = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFolder(event.target.value)
    props.properties.targetFolder = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`source${props.index}`} htmlFor={`source${props.index}`}>
        <p>Source file:</p>
        <input type='text' id={`source${props.index}`} value={sourceFile} onChange={changeSourceFile} />
      </label>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target folder:</p>
        <input type='text' id={`target${props.index}`} value={targetFolder} onChange={changeTargetFolder} />
      </label>
    </>
  )
}

/**
 * Compress a folder
 * @param index The index of the task in the task list
 * @param targetFolder The folder that will be archived
 */
type PropertiesFileCompress = {
  index: number,
    properties: {
    targetFolder?: string,
  }
}
export const FileCompress: FC<PropertiesFileCompress> = (props: PropertiesFileCompress) => {
  const [targetFolder, setTargetFolder] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setTargetFolder(props.properties.targetFolder || '')
  }, [])

  const changeTargetFolder = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFolder(event.target.value)
    props.properties.targetFolder = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target folder:</p>
        <input type='text' id={`target${props.index}`} value={targetFolder} onChange={changeTargetFolder} />
      </label>
    </>
  )
}

/**
 * Update a startup variable
 * @param index The index of the task in the task list
 * @param variableName The name of the variable
 * @param value The new value
 */
type PropertiesStartupUpdate = {
  index: number,
  properties: {
    variableName?: string,
    value?: string,
  }
}
export const StartupUpdate: FC<PropertiesStartupUpdate> = (props: PropertiesStartupUpdate) => {
  const [variableName, setVariableName] = useState('')
  const [value, setValue] = useState('')
  const taskDispatcher = useContext(TaskListContext)
  if (taskDispatcher === null) {
    return null
  }

  useEffect(() => {
    setVariableName(props.properties.variableName || '')
    setValue(props.properties.value || '')
  }, [])

  const changeVariableName = (event: ChangeEvent<HTMLInputElement>) => {
    setVariableName(event.target.value)
    props.properties.variableName = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  const changeValue = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
    props.properties.value = event.target.value
    taskDispatcher({
      action: 'update',
      index: props.index,
      properties: props.properties
    })
  }

  return (
    <>
      <label key={`variable${props.index}`} htmlFor={`variable${props.index}`}>
        <p>Variable name:</p>
        <input type='text' id={`variable${props.index}`} value={variableName} onChange={changeVariableName} />
      </label>
      <label key={`value${props.index}`} htmlFor={`value${props.index}`}>
        <p>value:</p>
        <input type='text' id={`value${props.index}`} value={value} onChange={changeValue} />
      </label>
    </>
  )
}

/**
 * Reinstall the server
 */
type PropertiesStartupReinstall = PropertiesNoop
export const StartupReinstall: FC<PropertiesStartupReinstall> = (props: PropertiesNoop) => {
  return (
    <>
      <p>No settings</p>
    </>
  )
}

/**
 * Suspend the server
 */
type PropertiesServerSuspend = PropertiesNoop
export const ServerSuspend: FC<PropertiesServerSuspend> = (props: PropertiesNoop) => {
  return (
    <>
      <p>No settings</p>
    </>
  )
}

/**
 * Unsuspend the server
 */
type PropertiesServerUnsuspend = PropertiesNoop
export const ServerUnsuspend: FC<PropertiesServerUnsuspend> = (props: PropertiesNoop) => {
  return (
    <>
      <p>No settings</p>
    </>
  )
}

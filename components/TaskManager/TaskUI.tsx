import { useState, FC, useEffect, useContext, ChangeEvent } from 'react';

import { TaskListContext } from '@/pages';
import { FileCompressTask, FileDecompressTask, FileDeleteTask, FilePullTask, PowerStartTask, PowerStopTask, ScheduleActivateTask, ScheduleDeactivateTask, ServerSuspendTask, ServerUnsuspendTask, StartupReinstallTask, StartupUpdateTask } from '@/lib/tasks';
import styles from '@/styles/TaskManager.module.css';

/**
 * Change power state to start
 * @param index The index of the task in the task list
 * @param wait Whether or not the task should wait until startup has completed
 */
type PropertiesPowerStart = {
  index: number,
  task: PowerStartTask,
};
export const PowerStart: FC<PropertiesPowerStart> = (props: PropertiesPowerStart) => {
  const [isWait, setIsWait] = useState(false);
  const [taskList, taskDispatcher] = useContext(TaskListContext);
  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setIsWait(!!props.task.properties.wait);
  }, []);

  const changeWait = (event: ChangeEvent<HTMLInputElement>) => {
    setIsWait(event.target.checked);
    props.task.properties.wait = event.target.checked;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  return (
    <>
      <label key={`wait${props.index}`} htmlFor={`wait${props.index}`}>
        <input type='checkbox' id={`wait${props.index}`} value='true' checked={isWait} onChange={changeWait} />
        <label htmlFor={`wait${props.index}`} className={`${styles['toggle']} ${isWait ? styles['toggle-on'] : styles['toggle-off']}`} />
        <p>Wait for completion</p>
      </label>
    </>
  );
};

/**
 * Change power state to stop
 * @param index The index of the task in the task list
 * @param wait Whether or not the task should wait until shutdown has completed
 * @param killTimeout Specifies a delay in seconds before the server is killed if shutdown hasn't completed
 */
type PropertiesPowerStop = {
  index: number,
  task: PowerStopTask,
};
export const PowerStop: FC<PropertiesPowerStop> = (props: PropertiesPowerStop) => {
  const [isWait, setIsWait] = useState(false);
  const [killTimeout, setKillTimeout] = useState('0');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setIsWait(!!props.task.properties.wait);
    setKillTimeout(props.task.properties.killTimeout || '0');
  }, []);

  const changeWait = (event: ChangeEvent<HTMLInputElement>) => {
    setIsWait(event.target.checked);
    props.task.properties.wait = event.target.checked;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  const changeKillTimeout = (event: ChangeEvent<HTMLInputElement>) => {
    setKillTimeout(event.target.value);
    props.task.properties.killTimeout = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

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
  );
};

/**
 * Update schedule to active
 * @param index The index of the task in the task list
 * @param scheduleName The name of the schedule to be made active
 */
type PropertiesScheduleActivate = {
  index: number,
  task: ScheduleActivateTask,
};
export const ScheduleActivate: FC<PropertiesScheduleActivate> = (props: PropertiesScheduleActivate) => {
  const [scheduleName, setScheduleName] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setScheduleName(props.task.properties.scheduleName || '');
  }, []);

  const changeScheduleName = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduleName(event.target.value);
    props.task.properties.scheduleName = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  return (
    <>
      <label key={`schedule${props.index}`} htmlFor={`schedule${props.index}`}>
        <p>Schedule name:</p>
        <input type='text' id={`schedule${props.index}`} value={scheduleName} onChange={changeScheduleName} />
      </label>
    </>
  );
};

/**
 * Update schedule to inactive
 * @param index The index of the task in the task list
 * @param scheduleName The name of the schedule to be made inactive
 */
type PropertiesScheduleDeactivate = {
  index: number,
  task: ScheduleDeactivateTask,
};
export const ScheduleDeactivate: FC<PropertiesScheduleDeactivate> = (props: PropertiesScheduleDeactivate) => {
  const [scheduleName, setScheduleName] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setScheduleName(props.task.properties.scheduleName || '');
  }, []);

  const changeScheduleName = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduleName(event.target.value);
    props.task.properties.scheduleName = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  return (
    <>
      <label key={`schedule${props.index}`} htmlFor={`schedule${props.index}`}>
        <p>Schedule name:</p>
        <input type='text' id={`schedule${props.index}`} value={scheduleName} onChange={changeScheduleName} />
      </label>
    </>
  );
};

/**
 * Download a file from an external URL
 * @param index The index of the task in the task list
 * @param sourceUrl The URL of the file to be downloaded
 * @param targetFile The path and name of the file after download
 */
type PropertiesFilePull = {
  index: number,
  task: FilePullTask,
};
export const FilePull: FC<PropertiesFilePull> = (props: PropertiesFilePull) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetFile, setTargetFile] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setSourceUrl(props.task.properties.sourceUrl || '');
    setTargetFile(props.task.properties.targetFile || '');
  }, []);

  const changeSourceUrl = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceUrl(event.target.value);
    props.task.properties.sourceUrl = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  const changeTargetFile = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFile(event.target.value);
    props.task.properties.targetFile = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

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
  );
};

/**
 * Deletes a file
 * @param index The index of the task in the task list
 * @param targetFile The path and name of the file to be deleted
 */
type PropertiesFileDelete = {
  index: number,
  task: FileDeleteTask,
};
export const FileDelete: FC<PropertiesFileDelete> = (props: PropertiesFileDelete) => {
  const [targetFile, setTargetFile] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setTargetFile(props.task.properties.targetFile || '');
  }, []);

  const changeTargetFile = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFile(event.target.value);
    props.task.properties.targetFile = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  return (
    <>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target file:</p>
        <input type='text' id={`target${props.index}`} value={targetFile} onChange={changeTargetFile} />
      </label>
    </>
  );
};

/**
 * Decompress a file
 * @param index The index of the task in the task list
 * @param sourceFile The path and name of the archive file
 * @param targetFolder The folder where the archive is extracted to
 */
type PropertiesFileDecompress = {
  index: number,
  task: FileDecompressTask,
};
export const FileDecompress: FC<PropertiesFileDecompress> = (props: PropertiesFileDecompress) => {
  const [sourceFile, setSourceFile] = useState('');
  const [targetFolder, setTargetFolder] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setSourceFile(props.task.properties.sourceFile || '');
    setTargetFolder(props.task.properties.targetFolder || '');
  }, [])

  const changeSourceFile = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceFile(event.target.value);
    props.task.properties.sourceFile = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  const changeTargetFolder = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFolder(event.target.value);
    props.task.properties.targetFolder = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

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
  );
};

/**
 * Compress a folder
 * @param index The index of the task in the task list
 * @param targetFolder The folder that will be archived
 */
type PropertiesFileCompress = {
  index: number,
  task: FileCompressTask,
};
export const FileCompress: FC<PropertiesFileCompress> = (props: PropertiesFileCompress) => {
  const [targetFolder, setTargetFolder] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setTargetFolder(props.task.properties.targetFolder || '');
  }, []);

  const changeTargetFolder = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetFolder(event.target.value);
    props.task.properties.targetFolder = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  return (
    <>
      <label key={`target${props.index}`} htmlFor={`target${props.index}`}>
        <p>Target folder:</p>
        <input type='text' id={`target${props.index}`} value={targetFolder} onChange={changeTargetFolder} />
      </label>
    </>
  );
};

/**
 * Update a startup variable
 * @param index The index of the task in the task list
 * @param variableName The name of the variable
 * @param value The new value
 */
type PropertiesStartupUpdate = {
  index: number,
  task: StartupUpdateTask,
};
export const StartupUpdate: FC<PropertiesStartupUpdate> = (props: PropertiesStartupUpdate) => {
  const [variableName, setVariableName] = useState('');
  const [value, setValue] = useState('');
  const [taskList, taskDispatcher] = useContext(TaskListContext);
  
  if (taskDispatcher === null) {
    return null;
  }

  useEffect(() => {
    setVariableName(props.task.properties.variableName || '');
    setValue(props.task.properties.value || '');
  }, [])

  const changeVariableName = (event: ChangeEvent<HTMLInputElement>) => {
    setVariableName(event.target.value);
    props.task.properties.variableName = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

  const changeValue = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    props.task.properties.value = event.target.value;
    taskDispatcher({
      action: 'update',
      index: props.index,
      task: props.task
    });
  };

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
  );
};

/**
 * Reinstall the server
 */
type PropertiesStartupReinstall = {
  index: number,
  task: StartupReinstallTask,
};
export const StartupReinstall: FC<PropertiesStartupReinstall> = (props: PropertiesStartupReinstall) => {
  return (
    <>
      <p>No settings</p>
    </>
  );
};

/**
 * Suspend the server
 */
type PropertiesServerSuspend = {
  index: number,
  task: ServerSuspendTask,
};
export const ServerSuspend: FC<PropertiesServerSuspend> = (props: PropertiesServerSuspend) => {
  return (
    <>
      <p>No settings</p>
    </>
  );
};

/**
 * Unsuspend the server
 */
type PropertiesServerUnsuspend = {
  index: number,
  task: ServerUnsuspendTask,
};
export const ServerUnsuspend: FC<PropertiesServerUnsuspend> = (props: PropertiesServerUnsuspend) => {
  return (
    <>
      <p>No settings</p>
    </>
  );
};

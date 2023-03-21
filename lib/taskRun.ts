import { FileCompressTask, FileDecompressTask, FileDeleteTask, FilePullTask, PowerStartTask, PowerStopTask, ScheduleActivateTask, ScheduleDeactivateTask, ServerSuspendTask, ServerUnsuspendTask, StartupReinstallTask, StartupUpdateTask } from '@/lib/tasks';
import { PteroConnectionWrapper, pteroWebsocket } from '@/lib/pterodactyl';

type BackendPowerStartTask = {
  taskName: 'PowerStart',
} & PowerStartTask;
type BackendPowerStopTask = {
  taskName: 'PowerStop',
} & PowerStopTask;
type BackendScheduleActivateTask = {
  taskName: 'ScheduleActivate',
} & ScheduleActivateTask;
type BackendScheduleDeactivateTask = {
  taskName: 'ScheduleDeactivate',
} & ScheduleDeactivateTask;
type BackendFilePullTask = {
  taskName: 'FilePull',
} & FilePullTask;
type BackendFileDeleteTask = {
  taskName: 'FileDelete',
} & FileDeleteTask;
type BackendFileDecompressTask = {
  taskName: 'FileDecompress',
} & FileDecompressTask;
type BackendFileCompressTask = {
  taskName: 'FileCompress'
} & FileCompressTask;
type BackendStartupUpdateTask = {
  taskName: 'StartupUpdate',
} & StartupUpdateTask;
type BackendStartupReinstallTask = {
  taskName: 'StartupReinstall'
} & StartupReinstallTask;
type BackendServerSuspendTask = {
  taskName: 'ServerSuspend'
} & ServerSuspendTask;
type BackendServerUnsuspendTask = {
  taskName: 'ServerUnsuspend'
} & ServerUnsuspendTask;

export type BackendTask =
  | BackendPowerStartTask
  | BackendPowerStopTask
  | BackendScheduleActivateTask
  | BackendScheduleDeactivateTask
  | BackendFilePullTask
  | BackendFileDeleteTask
  | BackendFileDecompressTask
  | BackendFileCompressTask
  | BackendStartupUpdateTask
  | BackendStartupReinstallTask
  | BackendServerSuspendTask
  | BackendServerUnsuspendTask;

type BackendTaskList = BackendTask[];

export const PowerStart = (pteroConnection: PteroConnectionWrapper, task: BackendPowerStartTask) => {
  return new Promise(async (resolve, reject) => {
    pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'start' });
    if (task.properties.wait) {
      pteroConnection.addEventListener('onStateRunning', () => {
        resolve('running');
      })
    } else {
      resolve('starting');
    }
  });
};

export const PowerStop = (pteroConnection: PteroConnectionWrapper, task: BackendPowerStopTask) => {
  return new Promise(async (resolve, reject) => {
    pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'stop' });
    if (task.properties.wait) {
      pteroConnection.addEventListener('onStateStopped', () => {
        resolve('stopped');
      })
      if (task.properties.killTimeout && parseInt(task.properties.killTimeout) > 0) {
        setTimeout(() => {
          pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'kill' });
        }, parseInt(task.properties.killTimeout) * 1000);
      }
    } else {
      resolve('stopping');
    }
  });
};

export const ScheduleActivate = (pteroConnection: PteroConnectionWrapper, task: BackendScheduleActivateTask) => {
  return new Promise((resolve, reject) => { });
};

export const ScheduleDeactivate = (pteroConnection: PteroConnectionWrapper, task: BackendScheduleDeactivateTask) => {
  return new Promise((resolve, reject) => { });
};

export const FilePull = (pteroConnection: PteroConnectionWrapper, task: BackendFilePullTask) => {
  return new Promise((resolve, reject) => { });
};

export const FileDelete = (pteroConnection: PteroConnectionWrapper, task: BackendFileDeleteTask) => {
  return new Promise((resolve, reject) => { });
};

export const FileDecompress = (pteroConnection: PteroConnectionWrapper, task: BackendFileDecompressTask) => {
  return new Promise((resolve, reject) => { });
};

export const FileCompress = (pteroConnection: PteroConnectionWrapper, task: BackendFileCompressTask) => {
  return new Promise((resolve, reject) => { });
};

export const StartupUpdate = (pteroConnection: PteroConnectionWrapper, task: BackendStartupUpdateTask) => {
  return new Promise((resolve, reject) => { });
};

export const StartupReinstall = (pteroConnection: PteroConnectionWrapper, task: BackendStartupReinstallTask) => {
  return new Promise((resolve, reject) => { });
};

export const ServerSuspend = (pteroConnection: PteroConnectionWrapper, task: BackendServerSuspendTask) => {
  return new Promise((resolve, reject) => { });
};

export const ServerUnsuspend = (pteroConnection: PteroConnectionWrapper, task: BackendServerUnsuspendTask) => {
  return new Promise((resolve, reject) => { });
};

function runTaskOnServer(pteroConnection: PteroConnectionWrapper, task: BackendTask) {
  return new Promise((resolve, reject) => {
    if (task.taskName === 'PowerStart') {
      PowerStart(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'PowerStop') {
      PowerStop(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'ScheduleActivate') {
      ScheduleActivate(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'ScheduleDeactivate') {
      ScheduleDeactivate(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'FilePull') {
      FilePull(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'FileDecompress') {
      FileDecompress(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'FileCompress') {
      FileCompress(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'StartupUpdate') {
      StartupUpdate(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'StartupReinstall') {
      StartupReinstall(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'ServerSuspend') {
      ServerSuspend(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else if (task.taskName === 'ServerUnsuspend') {
      ServerUnsuspend(pteroConnection, task)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    } else {
      reject(`Unknown task: ${task.taskName}`);
    }
  })
}

const runTaskListOnServer = (serverId: string, taskList: BackendTaskList) => {
  const pteroConnection = pteroWebsocket(serverId);
  return new Promise((resolve, reject) => {
    if (!pteroConnection) {
      reject(`No connection for ${serverId}.`);
      return;
    }
    const doNextTask = (index: number) => {
      if (index >= taskList.length) {
        resolve('done');
        return;
      }
      const task = taskList[index];
      if (task) {
        runTaskOnServer(pteroConnection, task)
          .then(response => {
            doNextTask(index + 1);
          })
          .catch(error => {
            reject(error);
          });
      }
    };
    doNextTask(0);
  });
};

const runTaskListOnServerList = (serverList: string[], taskList: BackendTaskList) => {
  let serversCompleted = 0;
  serverList.forEach(serverId => {
    runTaskListOnServer(serverId, taskList)
      .finally(() => {
        serversCompleted++;
        if (serversCompleted === serverList.length) {
          // all done
        }
      });
  });
};

import { NextApiRequest, NextApiResponse } from 'next';

import { FileCompressTask, FileDecompressTask, FileDeleteTask, FilePullTask, PowerStartTask, PowerStopTask, ScheduleActivateTask, ScheduleDeactivateTask, ServerSuspendTask, ServerUnsuspendTask, StartupReinstallTask, StartupUpdateTask, LogMessageType, TaskList, Task, taskLabel } from '@/lib/tasks';
import { PteroConnectionWrapper, PteroScheduleAttributes, pteroWebsocket } from '@/lib/pterodactyl';

const pathWithFileRegex = /^(\/.+\/)([^/]+)$/;

export default function runHandler(request: NextApiRequest, response: NextApiResponse) {
  const body = JSON.parse(request.body);
  if (!body.servers || !body.tasks) {
    console.error(`Invalid JSON:\n${request.body}`);
    response
      .status(400)
      .send(`Missing required paramters`);
    response
      .end();
  }

  response
    .status(200)
    .end();

  console.log(`tasks:`, body.tasks);
  console.log(`servers:`, body.servers);

  const serverList: string[] = body.servers;
  const taskList: TaskList = body.tasks;
 

  let serversCompleted = 0;
  for (const serverId of body.servers) {
    runTaskListOnServer(serverId, taskList)
      .finally(() => {
        serversCompleted++;
        if (serversCompleted === serverList.length) {
          logTask('--ALL--', 'completed');
        }
      });
  }
}

/**
 * Sends the status update of a task run to the frontend via the socket event
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param type The log message type (info, error, completed)
 * @param message The details of the message (ignored for 'completed')
 */
const logTask = (serverId: string, type: LogMessageType, message: string = '') => {
  if (global.ioSocket !== undefined) {
    console.log('LOG', type, message);
    global.ioSocket.sockets.emit('taskStatus', serverId, type, message);
  }
  return message;
}

/**
 * Runs a set of tasks on a single server
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param taskList The list of tasks
 * @returns A promise to be resolved after all tasks are completed or one task failed
 */
const runTaskListOnServer = (serverId: string, taskList: TaskList) => {
  const pteroConnection = pteroWebsocket(serverId);
  return new Promise((resolve, reject) => {
    if (!pteroConnection) {
      reject(logTask(serverId, 'error', 'Not connected'));
      return;
    }
    /* The best way to execute tasks in order is to use recursion. */
    const runNextTask = (index: number) => {
      /* Exit the loop if we've run all tasks */
      if (index >= taskList.length) {
        resolve(logTask(serverId, 'completed'));
        return;
      }
      const task = taskList[index];
      if (task) {
        runTaskOnServer(pteroConnection, task)
          .then(response => {
            runNextTask(index + 1);
          })
          .catch(error => {
            reject(error);
          });
      }
    };
    runNextTask(0);
  });
};

function runTaskOnServer(pteroConnection: PteroConnectionWrapper, task: Task) {
  return new Promise((resolve, reject) => {
    const taskName = task.taskName;
    if (taskName === 'PowerStart') {
      return PowerStart(pteroConnection, task);
    } else if (taskName === 'PowerStop') {
      return PowerStop(pteroConnection, task);
    } else if (taskName === 'ScheduleActivate') {
      return ScheduleActivate(pteroConnection, task);
    } else if (taskName === 'ScheduleDeactivate') {
      return ScheduleDeactivate(pteroConnection, task);
    } else if (taskName === 'FilePull') {
      return FilePull(pteroConnection, task);
    } else if (taskName === 'FileDelete') {
      return FileDelete(pteroConnection, task);
    } else if (taskName === 'FileDecompress') {
      return FileDecompress(pteroConnection, task);
    } else if (taskName === 'FileCompress') {
      return FileCompress(pteroConnection, task);
    } else if (taskName === 'StartupUpdate') {
      return StartupUpdate(pteroConnection, task);
    } else if (taskName === 'StartupReinstall') {
      return StartupReinstall(pteroConnection, task);
    } else if (taskName === 'ServerSuspend') {
      return ServerSuspend(pteroConnection, task);
    } else if (taskName === 'ServerUnsuspend') {
      return ServerUnsuspend(pteroConnection, task);
    } else {
      logTask(pteroConnection.serverId, 'error', `Unknown task ${taskName}`)
      reject(`Unknown task ${taskName}`);
    }
  });
}

const PowerStart = (pteroConnection: PteroConnectionWrapper, task: PowerStartTask) => {
  const label = taskLabel['PowerStart'];
  return new Promise(async (resolve, reject) => {
    const onRunning = () => {
      logTask(pteroConnection.serverId, 'info', `[${label}] Running`);
      if (task.properties.wait) {
        resolve(`[${label}] Running`);
      }
      pteroConnection.removeEventListener('onStateRunning', onRunning);
    };
    pteroConnection.addEventListener('onStateRunning', onRunning);

    pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'start' });
    logTask(pteroConnection.serverId, 'info', `[${label}] Starting`);
    if (!task.properties.wait) {
      resolve(`[${label}] Starting`);
    }
  });
};

const PowerStop = (pteroConnection: PteroConnectionWrapper, task: PowerStopTask) => {
  const label = taskLabel['PowerStop'];
  return new Promise(async (resolve, reject) => {
    const onStopped = () => {
      logTask(pteroConnection.serverId, 'info', `[${label}] Stopped`);
      if (task.properties.wait) {
        resolve(`[${label}] Stopped`);
      }
      pteroConnection.removeEventListener('onStateStopped', onStopped);
    };
    pteroConnection.addEventListener('onStateStopped', onStopped);

    pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'stop' });
    logTask(pteroConnection.serverId, 'info', `[${label}] Stopping`);
    if (task.properties.wait) {
      if (task.properties.killTimeout && parseInt(task.properties.killTimeout) > 0) {
        setTimeout(() => {
          pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'kill' });
          logTask(pteroConnection.serverId, 'info', `[${label}] Killing`);
        }, parseInt(task.properties.killTimeout) * 1000);
      }
    } else {
      resolve(`[${label}] Stopping`);
    }
  });
};

const ScheduleActivate = (pteroConnection: PteroConnectionWrapper, task: ScheduleActivateTask) => {
  const label = taskLabel['ScheduleActivate'];
  return new Promise((resolve, reject) => {
    if (!task.properties.scheduleName) {
      logTask(pteroConnection.serverId, 'error', `[${label}] No schedule name provided`);
      reject(`No schedule name provided`);
      return;
    }
    scheduleByName(pteroConnection, task.properties.scheduleName)
      .then(schedule => {
        logTask(pteroConnection.serverId, 'info', `[${label}] Found schedule ${schedule.id}: ${schedule.name}`)
        if (schedule.is_active) {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Schedule ${schedule.name} was already active`));
          return;
        }
        const requestBody = {
          'name': schedule.name,
          'minute': schedule.cron['minute'],
          'hour': schedule.cron['hour'],
          'month': schedule.cron['month'],
          'day_of_month': schedule.cron['day_of_month'],
          'day_of_week': schedule.cron['day_of_week'],
          'is_active': true,
        };
        pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/schedules/${schedule.id}`, {}, requestBody)
          .then(response => {
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Activated schedule "${schedule.name}"`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to activate schedule: "${error.message}"`));
            return;
          });
      })
      .catch(reason => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] ${reason}`));
        return;
      });
  });
};

const ScheduleDeactivate = (pteroConnection: PteroConnectionWrapper, task: ScheduleDeactivateTask) => {
  const label = taskLabel['ScheduleDeactivate'];
  return new Promise((resolve, reject) => {
    if (!task.properties.scheduleName) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No schedule name provided`));
      return;
    }
    scheduleByName(pteroConnection, task.properties.scheduleName)
      .then(schedule => {
        logTask(pteroConnection.serverId, 'info', `[${label}] Found schedule ${schedule.id}: ${schedule.name}`)
        if (!schedule.is_active) {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Schedule ${schedule.name} was not active`));
          return;
        }
        const requestBody = {
          'name': schedule.name,
          'minute': schedule.cron['minute'],
          'hour': schedule.cron['hour'],
          'month': schedule.cron['month'],
          'day_of_month': schedule.cron['day_of_month'],
          'day_of_week': schedule.cron['day_of_week'],
          'is_active': false,
        };
        pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/schedules/${schedule.id}`, {}, requestBody)
          .then(response => {
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Deactivated schedule "${schedule.name}"`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to deactivate schedule: "${error.message}"`));
            return;
          });
      })
      .catch(reason => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] ${reason}`));
        return;
      });
  });
};

const FilePull = (pteroConnection: PteroConnectionWrapper, task: FilePullTask) => {
  const label = taskLabel['FilePull'];
  return new Promise((resolve, reject) => {
    if (!task.properties.sourceUrl || !task.properties.targetFile) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No source url or target file provided`));
      return;
    }
    if (!pathWithFileRegex.test(task.properties.targetFile)) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] Invalid target file provided`));
      return;
    }
    const [all, directory, filename] = task.properties.targetFile.match(pathWithFileRegex)!;
    const requestBody = {
      url: task.properties.sourceUrl,
      directory: directory,
      filename: filename,
      use_header: false,
      foreground: false,
    };
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/files/pull`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Downloading ${task.properties.targetFile}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to download ${task.properties.targetFile}: "${error.message}"`));
        return;
      });
  });
};

const FileDelete = (pteroConnection: PteroConnectionWrapper, task: FileDeleteTask) => {
  const label = taskLabel['FileDelete'];
  return new Promise((resolve, reject) => {
    if (!task.properties.targetFile) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No target file provided`));
      return;
    }
    if (!pathWithFileRegex.test(task.properties.targetFile)) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] Invalid target file provided`));
      return;
    }
    const [all, directory, filename] = task.properties.targetFile.match(pathWithFileRegex)!;
    const requestBody = {
      root: directory,
      files: [ filename ],
    };
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/files/delete`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Deleted ${task.properties.targetFile}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to delete ${task.properties.targetFile}: "${error.message}"`));
        return;
      });
  });
};

const FileDecompress = (pteroConnection: PteroConnectionWrapper, task: FileDecompressTask) => {
  const label = taskLabel['FileDecompress'];
  return new Promise((resolve, reject) => {
    if (!task.properties.sourceFile || !task.properties.targetFolder) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No source file or target folder provided`));
      return;
    }
    const requestBody = {
      root: task.properties.targetFolder,
      files: task.properties.sourceFile,
    };
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/files/decompress`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Decompressed ${task.properties.sourceFile}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to decompress ${task.properties.sourceFile}: "${error.message}"`));
        return;
      });
  });
};

const FileCompress = (pteroConnection: PteroConnectionWrapper, task: FileCompressTask) => {
  const label = taskLabel['FileCompress'];
  return new Promise((resolve, reject) => {
    if (!task.properties.targetFolder) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No target folder provided`));
      return;
    }
    const requestBody = {
      root: task.properties.targetFolder,
      files: [ '*' ],
    };
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/files/compress`, {}, requestBody)
      .then(response => {
/*
{
    "object": "file_object",
    "attributes": {
        "name": "archive-2023-03-23T104516Z.tar.gz",
        "mode": "-rw-------",
        "mode_bits": "600",
        "size": 1402,
        "is_file": true,
        "is_symlink": false,
        "mimetype": "application/tar+gzip",
        "created_at": "2023-03-23T10:45:16+00:00",
        "modified_at": "2023-03-23T10:45:16+00:00"
    }
}*/
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Compressed ${task.properties.targetFolder} to ${response.attributes?.name}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to compress ${task.properties.targetFolder}: "${error.message}"`));
        return;
      });
  });
};

const StartupUpdate = (pteroConnection: PteroConnectionWrapper, task: StartupUpdateTask) => {
  const label = taskLabel['StartupUpdate'];
  return new Promise((resolve, reject) => {
    if (!task.properties.variableName || !task.properties.value) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No variable name or value provided`));
      return;
    }
    const requestBody = {
      key: task.properties.variableName,
      value: task.properties.value,
    };
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/startup/variable`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Set ${task.properties.variableName} to ${task.properties.value}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to set ${task.properties.variableName}: "${error.message}"`));
        return;
      });
  });
};

const StartupReinstall = (pteroConnection: PteroConnectionWrapper, task: StartupReinstallTask) => {
  const label = taskLabel['StartupReinstall'];
  return new Promise((resolve, reject) => {
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/startup/reinstall`, {}, {})
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Reinstalled the server`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to reinstall the server: "${error.message}"`));
        return;
      });
  });
};

const ServerSuspend = (pteroConnection: PteroConnectionWrapper, task: ServerSuspendTask) => {
  const label = taskLabel['ServerSuspend'];
  return new Promise((resolve, reject) => {
    logTask(pteroConnection.serverId, 'info', `ServerSuspend not yet implemented`);
    resolve(`ServerSuspend not yet implemented`);
  });
};

const ServerUnsuspend = (pteroConnection: PteroConnectionWrapper, task: ServerUnsuspendTask) => {
  const label = taskLabel['ServerUnsuspend'];
  return new Promise((resolve, reject) => {
    logTask(pteroConnection.serverId, 'info', `ServerUnsuspend not yet implemented`);
    resolve(`ServerUnsuspend not yet implemented`);
  });
};

const scheduleByName = async(pteroConnection: PteroConnectionWrapper, scheduleName: string) => {
  const response = await pteroConnection.apiGet(`/api/client/servers/${pteroConnection.serverId}/schedules`);
  return new Promise<PteroScheduleAttributes>((resolve, reject) => {
    if (!('data' in response) || !Array.isArray(response['data']) || response['data'].length === 0) {
      reject(`No schedules defined`);
      return;
    }

    const scheduleNameMatch = new RegExp(scheduleName, 'i');
    const matchingSchedules = response['data'].filter(element => scheduleNameMatch.test(element?.attributes?.name));
    if (matchingSchedules.length === 1) {
      resolve(matchingSchedules[0].attributes);
    } else if (matchingSchedules.length === 0) {
      reject(`No schedule matched ${scheduleName}`);
    } else {
      reject(`Multiple schedules matching ${scheduleName} exist`);
    }
  });
};


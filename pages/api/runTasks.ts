import { NextApiRequest, NextApiResponse } from 'next';

import { FileCompressTask, FileDecompressTask, FileDeleteTask, FilePullTask, PowerStartTask, PowerStopTask, ScheduleActivateTask, ScheduleDeactivateTask, ServerSuspendTask, ServerUnsuspendTask, StartupReinstallTask, StartupUpdateTask, LogMessageType, TaskList, Task, taskLabel } from '@/lib/tasks';
import { PteroConnectionWrapper, PteroScheduleAttributes, pteroWebsocket } from '@/lib/pterodactyl';

const pathWithFileRegex = /^(\/.+\/)([^/]+)$/;
const optionalPathWithFileRegex = /^(\/.+\/)?([^/]+)$/;

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
    // console.log('LOG', type, message);
    global.ioSocket.sockets.emit('taskStatus', serverId, type, message);
  }
  return message;
}

const internalServerIdList = new Map<string, string>();
const getInternalServerId = (pteroConnection: PteroConnectionWrapper) => {
  return new Promise<number>((resolve, reject) => {
    getServerDetailsIfEmpty(pteroConnection)
      .then(response => {
        if (internalServerIdList.has(pteroConnection.serverId)) {
          resolve(parseInt(`${internalServerIdList.get(pteroConnection.serverId)}`));
        } else {
          reject(null);
        }
      })
      .catch(error => {
        console.error(`Unable to get /api/client`);
        reject(`Unable to get /api/client`);
      });
  });
}

const getServerDetailsIfEmpty = (pteroConnection: PteroConnectionWrapper) => {
  return new Promise<number>((resolve, reject) => {
    if (internalServerIdList.size) {
      resolve(internalServerIdList.size);
      return;
    }
    getServerDetails(pteroConnection, 1)
      .then(response => {
        resolve(internalServerIdList.size);
        return;
      })
      .catch(error => {
        reject(error);
      });
  });
}

const getServerDetails = async (pteroConnection: PteroConnectionWrapper, page: number = 1) => {
  const response = await pteroConnection.apiGet(`/api/client?type=admin-all&page=${page}`, {});
  for (const server of response['data']) {
    internalServerIdList.set(`${server.attributes.identifier}`, `${server.attributes.internal_id}`);
  }
  if (page < parseInt(response['meta']['pagination']['total_pages'])) {
    await getServerDetails(pteroConnection, page + 1);
  }
  return true;
}

/**
 * Runs a set of tasks on a single server
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param taskList The list of tasks
 * @returns A promise to be resolved after all tasks are completed or one task failed
 */
const runTaskListOnServer = (serverId: string, taskList: TaskList) => {
  const pteroConnection = pteroWebsocket(serverId);
  return new Promise<string>((resolve, reject) => {
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

/**
 * Run a single task on a server
 * @param pteroConnection The established Ptero connection object for this server
 * @param task The task
 * @returns A promise that resolves if the task execution is successful or rejects if the task failed
 */
function runTaskOnServer(pteroConnection: PteroConnectionWrapper, task: Task) {
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
    return new Promise<string>((resolve, reject) => {
      logTask(pteroConnection.serverId, 'error', `Unknown task ${taskName}`)
      reject(`Unknown task ${taskName}`);
    });
  }
}

const PowerStart = (pteroConnection: PteroConnectionWrapper, task: PowerStartTask) => {
  const label = taskLabel['PowerStart'];
  return new Promise<string>(async (resolve, reject) => {
    currentState(pteroConnection)
      .then(state => {
        if (state === 'running') {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Already running`));
        } else {
          const onRunning = () => {
            logTask(pteroConnection.serverId, 'info', `[${label}] Running`);
            if (task.properties.wait) {
              resolve(`[${label}] Running`);
            }
            pteroConnection.removeEventListener('onStateRunning', onRunning);
          };
          pteroConnection.addEventListener('onStateRunning', onRunning);

          pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'start' });
          logTask(pteroConnection.serverId, 'info', `[${label}] Starting...`);
          if (!task.properties.wait) {
            resolve(`[${label}] Starting...`);
          }
        }
      });
  });
};

const PowerStop = (pteroConnection: PteroConnectionWrapper, task: PowerStopTask) => {
  const label = taskLabel['PowerStop'];
  return new Promise<string>(async (resolve, reject) => {
    currentState(pteroConnection)
      .then(state => {
        if (state === 'stopped') {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Already stopped`));
        } else {
          let timeoutId: NodeJS.Timeout | null = null;
          const onStopped = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            logTask(pteroConnection.serverId, 'info', `[${label}] Stopped`);
            if (task.properties.wait) {
              resolve(`[${label}] Stopped`);
            }
            pteroConnection.removeEventListener('onStateStopped', onStopped);
          };
          pteroConnection.addEventListener('onStateStopped', onStopped);

          pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'stop' });
          logTask(pteroConnection.serverId, 'info', `[${label}] Stopping...`);
          if (task.properties.wait) {
            if (task.properties.killTimeout && parseInt(task.properties.killTimeout) > 0) {
              timeoutId = setTimeout(() => {
                pteroConnection.apiPost(`/api/client/servers/%s/power`, {}, { signal: 'kill' });
                logTask(pteroConnection.serverId, 'info', `[${label}] Killing...`);
              }, parseInt(task.properties.killTimeout) * 1000);
            }
          } else {
            resolve(`[${label}] Stopping`);
          }
        }
      });
  });
};

const ScheduleActivate = (pteroConnection: PteroConnectionWrapper, task: ScheduleActivateTask) => {
  const label = taskLabel['ScheduleActivate'];
  return new Promise<string>((resolve, reject) => {
    if (!task.properties.scheduleName) {
      logTask(pteroConnection.serverId, 'error', `[${label}] No schedule name provided`);
      reject(`No schedule name provided`);
      return;
    }
    scheduleByName(pteroConnection, task.properties.scheduleName)
      .then(schedule => {
        //logTask(pteroConnection.serverId, 'info', `[${label}] Found schedule ${schedule.id}: ${schedule.name}`)
        if (schedule.is_active) {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${schedule.name}" (${schedule.id}) was already active`));
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
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${schedule.name}" (${schedule.id}) activated`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to activate "${schedule.name}" (${schedule.id}): "${error.message}"`));
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
  return new Promise<string>((resolve, reject) => {
    if (!task.properties.scheduleName) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No schedule name provided`));
      return;
    }
    scheduleByName(pteroConnection, task.properties.scheduleName)
      .then(schedule => {
        // logTask(pteroConnection.serverId, 'info', `[${label}] Found schedule ${schedule.id}: ${schedule.name}`)
        if (!schedule.is_active) {
          resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${schedule.name}" (${schedule.id}) was not active`));
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
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${schedule.name}" (${schedule.id}) deactivated`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to deactivate "${schedule.name}" (${schedule.id}): "${error.message}"`));
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
  return new Promise<string>((resolve, reject) => {
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
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${task.properties.targetFile}" is downloading`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to download "${task.properties.targetFile}": "${error.message}"`));
        return;
      });
  });
};

const FileDelete = (pteroConnection: PteroConnectionWrapper, task: FileDeleteTask) => {
  const label = taskLabel['FileDelete'];
  return new Promise<string>((resolve, reject) => {
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
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${task.properties.targetFile}" deleted`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to delete "${task.properties.targetFile}": "${error.message}"`));
        return;
      });
  });
};

const FileDecompress = (pteroConnection: PteroConnectionWrapper, task: FileDecompressTask) => {
  const label = taskLabel['FileDecompress'];
  return new Promise<string>((resolve, reject) => {
    if (!task.properties.sourceFile) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No source file provided`));
      return;
    }
    if (!optionalPathWithFileRegex.test(task.properties.sourceFile)) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] Invalid source file provided`));
      return;
    }
    const [all, directory, filename] = task.properties.sourceFile.match(optionalPathWithFileRegex)!;
    const requestBody = {
      root: directory || '/',
      file: filename,
    };
    logTask(pteroConnection.serverId, 'info', `[${label}] Decompressing ${task.properties.sourceFile}...`)
    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/files/decompress`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${task.properties.sourceFile}" extracted`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to extract "${task.properties.sourceFile}": "${error.message}"`));
        return;
      });
  });
};

const FileCompress = (pteroConnection: PteroConnectionWrapper, task: FileCompressTask) => {
  const label = taskLabel['FileCompress'];
  return new Promise<string>((resolve, reject) => {
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
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${task.properties.targetFolder}" archived to ${response['attributes'].name}`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to archived" ${task.properties.targetFolder}": "${error.message}"`));
        return;
      });
  });
};

const StartupUpdate = (pteroConnection: PteroConnectionWrapper, task: StartupUpdateTask) => {
  const label = taskLabel['StartupUpdate'];
  return new Promise<string>((resolve, reject) => {
    if (!task.properties.variableName || !task.properties.value) {
      reject(logTask(pteroConnection.serverId, 'error', `[${label}] No variable name or value provided`));
      return;
    }
    const variableName = task.properties.variableName.replaceAll(/\s/g, '_');
    const requestBody = {
      key: variableName,
      value: task.properties.value,
    };
    pteroConnection.apiPut(`/api/client/servers/${pteroConnection.serverId}/startup/variable`, {}, requestBody)
      .then(response => {
        resolve(logTask(pteroConnection.serverId, 'info', `[${label}] "${variableName}" set to "${task.properties.value}"`));
        return;
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to set "${variableName}": "${error.message}"`));
        return;
      });
  });
};

const StartupReinstall = (pteroConnection: PteroConnectionWrapper, task: StartupReinstallTask) => {
  const label = taskLabel['StartupReinstall'];
  return new Promise<string>((resolve, reject) => {
    const onInstallStarted = () => {
      logTask(pteroConnection.serverId, 'info', `[${label}] Reinstall started`);
      pteroConnection.removeEventListener('onInstallStarted', onInstallStarted);
    }
    pteroConnection.addEventListener('onInstallStarted', onInstallStarted);

    const onInstallCompleted = () => {
      resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Reinstall completed`));
      pteroConnection.removeEventListener('onInstallStarted', onInstallStarted);
      pteroConnection.removeEventListener('onInstallCompleted', onInstallCompleted);
    }
    pteroConnection.addEventListener('onInstallCompleted', onInstallCompleted);

    pteroConnection.apiPost(`/api/client/servers/${pteroConnection.serverId}/settings/reinstall`, {}, {})
      .then(response => {
        // logTask(pteroConnection.serverId, 'info', `[${label}] Reinstalling...`);
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
  return new Promise<string>((resolve, reject) => {
    getInternalServerId(pteroConnection)
      .then(internalId => {
        pteroConnection.apiPost(`/api/application/servers/${internalId}/suspend`, {}, {})
          .then(response => {
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Suspended the server`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to suspend the server: "${error.message}"`));
            return;
          });
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] No internal server ID found`));
        return;
      });
  });
};

const ServerUnsuspend = (pteroConnection: PteroConnectionWrapper, task: ServerUnsuspendTask) => {
  const label = taskLabel['ServerUnsuspend'];
  return new Promise<string>((resolve, reject) => {
    getInternalServerId(pteroConnection)
      .then(internalId => {
        pteroConnection.apiPost(`/api/application/servers/${internalId}/unsuspend`, {}, {})
          .then(response => {
            resolve(logTask(pteroConnection.serverId, 'info', `[${label}] Unsuspended the server`));
            return;
          })
          .catch(error => {
            reject(logTask(pteroConnection.serverId, 'error', `[${label}] Unable to unsuspend the server: "${error.message}"`));
            return;
          });
      })
      .catch(error => {
        reject(logTask(pteroConnection.serverId, 'error', `[${label}] No internal server ID found`));
        return;
      });
  });
};

/**
 * Returns the current state of a server
 * @param pteroConnection The PteroConnectionWrapper object for this server
 * @returns A promise that resolves with the state of the server
 */
const currentState = async(pteroConnection: PteroConnectionWrapper) => {
  const response = await pteroConnection.apiGet(`/api/client/servers/${pteroConnection.serverId}/resources`);
  return new Promise<string>((resolve, reject) => {
    if ('attributes' in response && 'current_state' in response['attributes']) {
      resolve(response['attributes']['current_state']);
    } else {
      resolve('unknown');
    }
  });
};

/**
 * Returns the details of the schedule matching the scheduleName
 * @param pteroConnection The PteroConnectionWrapper object for this server
 * @param scheduleName The name to match
 * @returns A promise that resolves with the details of the schedule or rejects if no or more than one schedule matched
 */
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


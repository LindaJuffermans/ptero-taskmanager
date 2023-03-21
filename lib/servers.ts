/**
 * Defines and handles the server status that comes from the websocket
 */
export type ServerStatus = {
  state: string,
  upTime: number,
  cpu: number,
  memory: number,
};
export type ServerStatusMap = Map<string, ServerStatus>
type ServerStatuHandlerInit = {
  action: 'init',
};
type ServerStatusHandlerAdd = {
  action: 'add',
  serverId: string,
};
type ServerStatusHandlerUpdate = {
  action: 'update',
  serverId: string,
  status: ServerStatus,
};
type ServerStatusHandler = ServerStatuHandlerInit | ServerStatusHandlerAdd | ServerStatusHandlerUpdate;
export const statusHandler = (statusMap: ServerStatusMap, data: ServerStatusHandler): ServerStatusMap => {
  if (data.action === 'init') {
    return new Map<string, ServerStatus>();
  }
  if (data.action === 'add') {
    const _statusMap = new Map<string, ServerStatus>(statusMap);
    _statusMap.set(data.serverId, {} as ServerStatus);
    return _statusMap;
  }
  if (data.action === 'update') {
    const _statusMap = new Map<string, ServerStatus>(statusMap);
    _statusMap.set(data.serverId, data.status);
    return _statusMap;
  }
  return statusMap;
}

/**
 * Defines and handles the server run toggles coming from the Category and Server components
 */
type ServerRunClear = {
  action: 'clear',
};
type ServerRunSet = {
  action: 'set',
  list: Set<string>,
};
type ServerRunAdd = {
  action: 'add',
  serverId: string,
};
type ServerRunRemove = {
  action: 'remove',
  serverId: string,
};
export type ServerRunHandler = ServerRunClear | ServerRunSet | ServerRunAdd | ServerRunRemove;

export const runListHandler = (runList: Set<string>, data: ServerRunHandler): Set<string> => {
  if (data.action === 'clear') {
    return new Set<string>();
  }
  if (data.action === 'set') {
    return data.list;
  }
  if (data.action == 'add') {
    const _runList = new Set<string>(runList);
    _runList.add(data.serverId);
    return _runList;
  }
  if (data.action == 'remove') {
    const _runList = new Set<string>(runList);
    _runList.delete(data.serverId);
    return _runList;
  }
  return runList;
};

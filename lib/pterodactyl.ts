import * as fs from 'fs'
import YAML from 'yaml'
import { WebSocket } from 'ws'

import { Configuration, LocalClientSocket } from '@/pages/index'

/**
 * Ptero websocket responses
 */
// type PteroSocketEventAuthSuccess = {
//   event: 'auth success',
// }
// type PteroSocketEventStatus = {
//   event: 'status',
//   args: string,
// }
type PteroSocketEventStatusArguments = {
  memory_bytes: number,
  memory_limit_bytes: number,
  cpu_absolute: number,
  network: {
    rx_bytes: number,
    tx_bytes: number,
  },
  state: PteroServerStateType,
  uptime: number,
  disk_bytes: number,
}

// type PteroSocketEventConsoleOutput = {
//   event: 'console output',
//   args: string,
// }
// type PteroSocketEventStats = {
//   event: 'stats',
//   args: string,
// }
// type PteroSocketEventTokenExpiring = {
//   event: 'token expiring',
// }
// type PteroSocketEventTokenExpired = {
//   event: 'token expired',
// }
// type PteroSocketEvent = PteroSocketEventAuthSuccess | PteroSocketEventStatus | PteroSocketEventConsoleOutput | PteroSocketEventStats | PteroSocketEventTokenExpiring | PteroSocketEventTokenExpired


/**
 * Pterowrapper socket
 */
type PteroWebSocketDetailsType = {
  token: string,
  socket: string,
}
export type PteroWebSocket = (serverId: string) => Promise<void>


/**
 * Pterodactyl API properties
 */

type PteroPowerSignal = 'start' | 'stop' | 'restart' | 'kill'
type PteroServerStateType = 'unknown' | 'starting' | 'running' | 'stopping' | 'offline'


/**
 * Pterowrapper events
 */
type PteroWrapperEventStats = PteroSocketEventStatusArguments & {
  oldState?: string,
}
type PteroWrapperEventConsole = string
export type PteroWrapperEvent = PteroWrapperEventStats | PteroWrapperEventConsole
// type PteroWrapperEventStatsHandler = (event : PteroWrapperEventStats) => (void | string)
// type PteroWrapperEventConsoleHandler = (event : PteroWrapperEventConsole) => (void | string)
// type PteroWrapperEventHandler = (event: PteroWrapperEvent) => (void | string)
export interface PteroWrapperEvents {
  onConsoleMessage: PteroWrapperEventConsole
  onStatsMessage: PteroWrapperEventStats
  onStateChanged: PteroWrapperEventStats
  onStateStarting: PteroWrapperEventStats
  onStateRunning: PteroWrapperEventStats
  onStateStopping: PteroWrapperEventStats
  onStateStopped: PteroWrapperEventStats
}
// type PteroEventNames = keyof PteroWrapperEvents
type PteroWrapperEventsCallbacks = {
  [K in keyof PteroWrapperEvents]: (event: PteroWrapperEvents[K]) => string | void
}
type PteroWrapperEventsSets = {
  [K in keyof PteroWrapperEventsCallbacks]: Set<PteroWrapperEventsCallbacks[K]>
}


const contents: Buffer = fs.readFileSync(process.cwd() + `/${process.env['SERVER_CONFIG_FILE']}`)
const config: Configuration = YAML.parse(`${contents}`)

const pteroApiRequestHeaders = (additionalHeaders = {}) => {
  const defaultHeaders = {
    'Authorization': `Bearer ${config.clientKey}`,
    'Content-Type': `application/json`,
    'Accept': `application/json`,
    'Origin' : `${config.panelDomain}`,
  }
  return { ...defaultHeaders, ...additionalHeaders };
}

export class PteroConnectionWrapper {
  #serverId: string

  #eventListeners: PteroWrapperEventsSets = {
    onConsoleMessage: new Set<PteroWrapperEventsCallbacks['onConsoleMessage']>(),
    onStatsMessage: new Set<PteroWrapperEventsCallbacks['onStatsMessage']>(),
    onStateChanged: new Set<PteroWrapperEventsCallbacks['onStateChanged']>(),
    onStateStarting: new Set<PteroWrapperEventsCallbacks['onStateStarting']>(),
    onStateRunning: new Set<PteroWrapperEventsCallbacks['onStateRunning']>(),
    onStateStopping: new Set<PteroWrapperEventsCallbacks['onStateStopping']>(),
    onStateStopped: new Set<PteroWrapperEventsCallbacks['onStateStopped']>(),
  }
    
  #pteroWebSocketDetails: PteroWebSocketDetailsType | undefined = undefined
  #pteroWebSocket: WebSocket | undefined = undefined
  #lastServerState: PteroServerStateType = 'unknown'

  /**
   * Creates a new instance of the class
   * 
   * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
   */
  constructor(serverId: string) {
    this.#serverId = serverId;
    (async() => {
      await this.requestWebsocketDetails()
      this.initSocket()
    })()
  }

  /**
   * Register a new event listener
   * @param {string} eventName The event, one of: onStatsMessage, onConsoleMessage, onStateChanged, onStateRunning and onStateStopped
   * @param {function} callback The function to call when the event triggers
   */

  addEventListener<T extends keyof PteroWrapperEventsCallbacks>(eventName: T, callback: PteroWrapperEventsCallbacks[T]) {
    this.#eventListeners[eventName].add(callback);
  }


  /**
   * Unregister a new event listener
   * @param {string} eventName The event, one of: onStatsMessage, onConsoleMessage, onStateChanged, onStateRunning and onStateStopped
   * @param {function} callback The optional function that should be unregistered; when undefined will clear all listeners
   */
  removeEventListener<T extends keyof PteroWrapperEventsCallbacks>(eventName: T, callback?: PteroWrapperEventsCallbacks[T]) {
    if (callback) {
      this.#eventListeners[eventName].delete(callback);
    } else {
      this.#eventListeners[eventName].clear();
    }
  }

  // GET, POST, PUT

  apiGet(url: string, headers: {} = {}) {
    return this.apiCall('GET', url, headers, {})
  }

  apiPost(url: string, headers: {} = {}, body: {} = {}) {
    return this.apiCall('POST', url, headers, body)
  }

  apiPut(url: string, headers: {} = {}, body: {} = {}) {
    return this.apiCall('PUT', url, headers, body)
  }

  private apiCall(_method: 'GET' | 'POST' | 'PUT', _url: string, _headers: {} = {}, _body: {} = {}) {
    const requestUrl: string = 'https://' + config.panelDomain + _url.replaceAll('%s', this.#serverId)
    const requestOptions: {method: string, headers: {}, body? : string} = {
      method: _method,
      headers: pteroApiRequestHeaders(_headers),
    }
    if (_method !== 'GET' && _body) {
      requestOptions.body = JSON.stringify(_body)
    }
    return new Promise<any>((resolve: (value: unknown) => void, reject: (reason?: any) => void) => {
      fetch(requestUrl, requestOptions)
        .then(response => response.json())
        .then(json => resolve(json))
        .catch(error => reject(error))
    })
  }

  /**
   * Fetches and returns the websocket details from the Pterodactyl
   * websocket API for the server
   */
  private async requestWebsocketDetails() {
    this.#pteroWebSocketDetails = {} as PteroWebSocketDetailsType
    const jsonResponse = await this.apiGet(`/api/client/servers/${this.#serverId}/websocket`)
    this.#pteroWebSocketDetails = jsonResponse.data || {} as PteroWebSocketDetailsType;
  }

  private async initSocket() {
    if (!this.#pteroWebSocketDetails?.socket) {
      await this.requestWebsocketDetails()
    }
    if (!this.#pteroWebSocketDetails?.socket) {
      throw Error(`Unable to get websocket details for ${this.#serverId}`)
    }

    try {
      this.#pteroWebSocket = new WebSocket(this.#pteroWebSocketDetails.socket, {origin: `https://${config.panelDomain}`})
      this.#pteroWebSocket.on('open', this.sendSocketToken.bind(this))
      this.#pteroWebSocket.on('message', this.onSocketMessage.bind(this))
    } catch (error: any) {
      console.error('Error', error.message)
    }
  }

  /**
   * Enables using the private #eventListeners property in "keyof typeof"
   */
  private get _eventListeners() {
    return this.#eventListeners
  }

  /**
   * @internal Triggers an event by calling all the callbacks of the eventListeners set.
   * @param {string} eventName The event, one of: onStatsMessage, onConsoleMessage, onStateChanged, onStateRunning and onStateStopped
   * @param {object} eventData The arguments to pass to the callback
   */
  private triggerEvent<T extends keyof PteroWrapperEventsCallbacks>(eventName: T, event: PteroWrapperEvents[T]) {
    this.#eventListeners[eventName].forEach((callback) => {
      callback.call(null, event)
    })
  }

  async sendSocketToken() {
    if (this.#pteroWebSocket && this.#pteroWebSocketDetails && this.#pteroWebSocketDetails.token) {
      console.info('sendSocketToken')
      this.#pteroWebSocket.send(
        JSON.stringify({
          event: 'auth',
          args: [this.#pteroWebSocketDetails.token],
        })
      )
    } else {
      console.error(`Missing one of these:`, this.#pteroWebSocket, this.#pteroWebSocketDetails)
    }
  }

  private async onTokenExpire() {
    await this.requestWebsocketDetails()
    if (!this.#pteroWebSocketDetails?.socket) {
      throw Error(`Unable to get websocket details for ${this.#serverId}`)
    }
    this.sendSocketToken()
  }

  private async onSocketMessage(data: Buffer | string, isBinary: boolean) {
    const message: string = data.toString()
    const socketMessage = JSON.parse(message)
    if (socketMessage.event === 'token expiring') {
      this.onTokenExpire()
    } else if (socketMessage.event === 'stats') {
      const statsData: PteroWrapperEventStats = JSON.parse(socketMessage.args);
      this.triggerEvent('onStatsMessage', statsData)
      const augmentedStatsData: PteroWrapperEventStats = {...statsData, ...{oldState: this.#lastServerState}}
      if (statsData.state !== this.#lastServerState) {
        this.triggerEvent('onStateChanged', augmentedStatsData)
        if (statsData.state === 'starting') {
          this.triggerEvent('onStateStarting', augmentedStatsData)
        } else if (statsData.state === 'running') {
          this.triggerEvent('onStateRunning', augmentedStatsData)
        } else if (statsData.state === 'stopping') {
          this.triggerEvent('onStateStopping', augmentedStatsData)
        } else if (statsData.state === 'offline') {
          this.triggerEvent('onStateStopped', augmentedStatsData)
        }
      }
    } else if (socketMessage.event === 'onConsoleMessage') {
      this.triggerEvent('onConsoleMessage', socketMessage.args)
    }
  }
}


/* keep track of all websockets here */
const _pteroWebSocketCollection: Map<string, PteroConnectionWrapper> = new Map<string, PteroConnectionWrapper>();

/**
 * Get or open a websocket to the specified server
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @returns 
 */
export const pteroWebsocket = (serverId: string, localClientSocket?: LocalClientSocket): PteroConnectionWrapper | undefined => {
  if (_pteroWebSocketCollection.has(serverId)) {
    const _socket = _pteroWebSocketCollection.get(serverId)
    if (_socket) {
      return _socket
    }
  }

  const _socket = new PteroConnectionWrapper(serverId)
  if (!_socket) {
    throw Error(`Unable to open socket for ${serverId}`)
  }
  _pteroWebSocketCollection.set(serverId, _socket)
  return _socket
}

/**
 * Start a server
 * 
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param wait Optionally wait for the action to complete
 * @returns 
 */
export const pteroStartServer = async (serverId: string, wait: boolean = false) => {
  await _changePowerState(serverId, 'start');
  if (wait) {
    pteroWebsocket(serverId)?.addEventListener('onStateRunning', () => 'running');
  } else {
    return 'starting';
  }
}

/**
 * Shutdown a server
 * 
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param wait Optionally wait for the action to complete
 * @param killTimer Optionally kill the server after this many seconds
 * @returns 
 */
export const pteroStopServer = async (serverId: string, wait: boolean = false, killTimer: string = '') => {
  await _changePowerState(serverId, 'stop');
  if (wait) {
    pteroWebsocket(serverId)?.addEventListener('onStateStopped', () => 'stopped');

    if (parseInt(killTimer) > 0) {
      const onTimeout = async () => {
        await _changePowerState(serverId, 'kill');
      }
      setTimeout(onTimeout, parseInt(killTimer) * 1000);
    }
  } else {
    return 'stopping';
  }
}

/**
 * @internal Posts a power command to the specified server
 * 
 * @param serverId The Pterodactyl ID (e.g. 1a7ce997) of the server
 * @param powerSignal The power signal to send (start, stop, restart, kill)
 * @returns 
 */
const _changePowerState = async (serverId: string, powerSignal: PteroPowerSignal) => {
  await fetch(`https://${config.panelDomain}/api/client/servers/${serverId}/power`, {
    method: 'POST',
    headers: pteroApiRequestHeaders(),
    body: JSON.stringify({
      signal: powerSignal
    })
  });
  return true;
}

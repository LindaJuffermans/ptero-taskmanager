import { useEffect, useState, createContext, useReducer, Dispatch, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import fs from 'fs';
import YAML from 'yaml';
import Head from 'next/head';

import { runListHandler, ServerRunHandler } from '@/lib/servers';
import { LogList, LogMessageType, TaskHandler, TaskList, taskListHandler, taskLogHandler } from '@/lib/tasks';
import { IClientToServerEvents, IServerToClientEvents, openAllPteroConnections } from '@/pages/api/socket';
import { Body } from '@/components/App/Body';
import { Dialog, DialogReference } from '@/components/Dialog';

import 'split-pane-react/esm/themes/default.css';

export type Configuration = {
  panelDomain: string,
  clientKey: string,
  categories: ConfigurationCategoryList
};
export type ConfigurationCategoryList = ConfigurationCategory[];
export type ConfigurationCategory = {
  name: string,
  servers: ConfigurationServerList,
};
type ConfigurationServerList = ConfigurationServer[];
export type ConfigurationServer = {
  name: string,
  id: string,
  node: string,
};

export type LocalClientSocket = Socket<IServerToClientEvents, IClientToServerEvents>;

export const LocalSocketContext = createContext<LocalClientSocket | null>(null);
export const TaskListContext = createContext<[TaskList, Dispatch<TaskHandler> | null]>([[], null]);
export const LogListContext = createContext<LogList>([]);
export const RunListContext = createContext<[Set<string> | null, Dispatch<ServerRunHandler> | null]>([null, null]);

type AppProps = {
  categories: ConfigurationCategoryList,
};
export default function App(props: AppProps) {
  const cannotExecuteReference = useRef<DialogReference>(null);
  const confirmExecuteReference = useRef<DialogReference>(null);
  const [socket, setSocket] = useState<LocalClientSocket | null>(null);
  const [taskList, taskDispatcher] = useReducer(taskListHandler, []);
  const [runList, runListDispatcher] = useReducer(runListHandler, new Set<string>());
  const [logList, logListHandler] = useReducer(taskLogHandler, []);

  useEffect(() => {
    if (!socket || !socket.connected) {
      openSocket();
    }
    return () => {
      closeSocket();
    }
  }, []);

  const openSocket = async () => {
    if (socket) {
      return;
    }

    await fetch('/api/socket');
    const _socket = io();
    setSocket(_socket);

    _socket.on('taskStatus', (serverId: string, type: LogMessageType, message: string) => {
      logListHandler({
        action: 'add',
        serverId,
        type,
        message,
      });
    });

    // _socket.on('connect', () => { });
    // _socket.on('serverStatus', (serverId: string, type: LogMessageType, message: string = '') => {
      // logTask(serverId, type, message);
    // });
    /*
    _socket.onAny((eventName: string, ...args) => {
      console.log(`${eventName}`, ...args);
    });
    */
  };

  const closeSocket = () => {
    if (socket?.connected) {
      socket.disconnect();
    } else {
      console.error(`App: Socket wasn't opened`);
    }
  };

  const runTasks = () => {
    if (!runList.size || !taskList.length) {
      if (cannotExecuteReference.current) {
        cannotExecuteReference.current.openDialog();
      }
      return;
    }
    if (confirmExecuteReference.current) {
      confirmExecuteReference.current.openDialog();
    }
  };

  const runTasksConfirmed = () => {
    logListHandler({
      action: 'init',
      serverIdList: Array.from(runList),
    });
    const apiBody = {
      servers: Array.from(runList),
      tasks: taskList,
    };
    console.info(`fetch /api/run`, JSON.stringify(apiBody));
    fetch(`/api/run`, {
      method: 'POST',
      body: JSON.stringify(apiBody),
    });
    confirmExecuteReference.current?.closeDialog();
  };

  return (
    <>
      <Head>
        <title>Pterodactyl Task Manager</title>
        <meta name="description" content="Task automation for Pterodactyl panel maintained servers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16" />
        <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
      </Head>
      <LocalSocketContext.Provider value={socket}>
        <TaskListContext.Provider value={[taskList, taskDispatcher]}>
          <RunListContext.Provider value={[runList, runListDispatcher]}>
            <LogListContext.Provider value={logList}>
              <Body categories={props.categories} onExecute={runTasks} />
            </LogListContext.Provider>
          </RunListContext.Provider>
        </TaskListContext.Provider>
      </LocalSocketContext.Provider>
      <Dialog id='cannotExecute' ref={cannotExecuteReference}>
        <h2>
          <p>Error</p>
          <button className='fas fa-window-close' title='Close' onClick={cannotExecuteReference.current?.closeDialog}/>
        </h2>
        <p style={{width:'80px'}}>
          You have selected to run {taskList.length} task(s) on {runList.size} server(s).<br />
          <br />
          You cannot run this.
        </p>
        <nav>
          <button title='OK' onClick={cannotExecuteReference.current?.closeDialog}>OK</button>
        </nav>
      </Dialog>
      <Dialog id='confirmExecute' ref={confirmExecuteReference}>
        <h2>
          <p>Are you sure?</p>
          <button className='fas fa-window-close' title='Close' onClick={confirmExecuteReference.current?.closeDialog}/>
        </h2>
        <p style={{width:'80px'}}>
          Do you really want to execute {taskList.length} task(s) on {runList.size} server(s)?<br />
          <br />
          Once it has started running you cannot abort.
        </p>
        <nav>
          <button title='cancel' onClick={confirmExecuteReference.current?.closeDialog}>Cancel</button>
          <button title='OK' onClick={runTasksConfirmed} className='warning'>OK</button>
        </nav>
      </Dialog>
    </>
  );
};

export async function getStaticProps() {
  const contents: Buffer = fs.readFileSync(`${process.env['SERVER_CONFIG_FILE']}`);
  const config: Configuration = YAML.parse(`${contents}`);
  const serverIdList: string[] = config.categories.map(category => category.servers.map(server => server.id)).flat();
  openAllPteroConnections(serverIdList);

  return {
    props: {
      categories: config['categories'],
    }
  };
};

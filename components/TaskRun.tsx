import { useContext, useEffect, useState } from 'react';

import { LogListContext, RunListContext } from '@/pages/index';
import { ServerListProps } from '@/components/ServerList';

import styles from '@/styles/TaskRun.module.css';

export const TaskRun = (props: ServerListProps) => {
  const [doRender, setDoRender] = useState(false);
  const [runList, runListDispatcher] = useContext(RunListContext);
  const [loggingCategories, setLoggingCategories] = useState(props.categories);
  const logList = useContext(LogListContext);

  useEffect(() => {
    if (runList?.size) {
      const filteredCategories = props.categories
        .map(category => {
          return {
            name: category.name,
            servers: category.servers.filter(server => Array.from(runList).includes(server.id))
          }
        })
        .filter(category => category.servers.length);
      setLoggingCategories(filteredCategories);
    }
  }, [runList, props.categories]);

  useEffect(() => {
    setDoRender(true);
  }, []);

  if (!doRender) {
    return (
      <>
        <div className={styles['taskRun']}>
          <h2>Execution status</h2>
          <div className={styles['console']}>
            <p>No information</p>
          </div>
        </div>
      </>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const msec = timestamp % 1000;
    const sec = Math.floor(timestamp / 1000) % 60;
    const min = Math.floor(timestamp / 60000) % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(3, '0')}`;
  }

  const printLogList = (serverId: string) => {
    const filteredLogList = logList.filter(serverLog => serverLog.serverId === serverId)[0];
    if (!filteredLogList) {
      return <p key={`nodata${serverId}`} className={styles['info']}>No data</p>;
    }
    const serverLogList = filteredLogList.logs;
    const logStartTime = filteredLogList.startTime;
    return serverLogList.map((logEntry, index) =>
      <p key={`${serverId}${index}`} className={styles[logEntry.type]}>[{formatTimestamp(logEntry.entryTime - logStartTime)}] {logEntry.type === 'completed' ? `Finished` : logEntry.message}</p>
    );
  };

  return (
    <>
      <div className={styles['taskRun']}>
        <h2>Execution status</h2>
        <div className={styles['console']}>
          {
            (!logList.length || !runList?.size)
              ? <p>No information</p>
              : loggingCategories.map((category, index) => {
                return (
                  <>
                    <h3 key={`header${index}`}>{category.name}</h3>
                    <div key={`category${index}`} className={styles['category']}>
                      {
                        category.servers.map(server => {
                          return (
                            <div key={`server${server.id}`} className={styles['server']}>
                              <h4 key={`header${server.id}`}>{server.name}</h4>
                              <div className={styles['list']}>{printLogList(server.id)}</div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </>
                );
              })
          }
        </div>
      </div>
    </>
  );
};

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

  return (
    <>
      <div className={styles['taskRun']}>
        <h2>Execution status</h2>
        <div className={styles['console']}>
          {
            (!logList.length || !runList?.size)
              ? <p>No information</p>
              : loggingCategories.map(category => {
                return (
                  <>
                  <h3>{category.name}</h3>
                    <div key={category.name} className={styles['category']}>
                      {
                        category.servers.map(server => {
                          return (
                            <div key={server.id} className={styles['server']}>
                              <h4>{server.name}</h4>
                              {
                                logList.filter(serverLog => serverLog.serverId === server.id).length === 0
                                  ? <p className={styles['info']}>No data</p>
                                  : logList.filter(serverLog => serverLog.serverId === server.id)[0]?.logs.map(
                                    (logEntry, index) => <p key={index} className={styles[logEntry.type]}>{('message' in logEntry) ? logEntry.message : `Finished`}</p>
                                  )
                              }
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

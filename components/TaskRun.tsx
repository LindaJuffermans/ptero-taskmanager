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
                              {
                                logList.filter(serverLog => serverLog.serverId === server.id).length === 0
                                  ? <p key={`nodata${server.id}`} className={styles['info']}>No data</p>
                                  : logList.filter(serverLog => serverLog.serverId === server.id)[0]?.logs.map(
                                    (logEntry, index) => <p key={`${server.id}${index}`} className={styles[logEntry.type]}>{logEntry.type === 'completed' ? `Finished` : logEntry.message}</p>
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

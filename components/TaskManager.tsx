import { useEffect, useState, useContext, useRef, DragEventHandler } from 'react';

import { taskLabel } from '@/lib/tasks';
import { TaskListContext } from '@/pages';
import { FileCompress, FileDecompress, FileDelete, FilePull, PowerStart, PowerStop, ScheduleActivate, ScheduleDeactivate, ServerSuspend, ServerUnsuspend, StartupReinstall, StartupUpdate } from '@/components/TaskManager/TaskUI';
import { NewTask } from '@/components/TaskManager/NewTask';
import { Dialog, DialogReference } from '@/components/Dialog';

import styles from '@/styles/TaskManager.module.css';

type TaskManagerProps = {
  onExecute: () => void,
};
export const TaskManager = (props: TaskManagerProps) => {
  const clearTasksReference = useRef<DialogReference>(null);
  const [doRender, setDoRender] = useState(false);
  const {taskList, taskDispatcher} = useContext(TaskListContext);

  useEffect(() => {
    setDoRender(true);

    if (!taskDispatcher) {
      return;
    }
    const savedList = window.localStorage.getItem('taskList');
    if (savedList && (typeof savedList) === 'string') {
      taskDispatcher({
        action: 'set',
        taskList: JSON.parse(savedList),
      });
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('taskList', JSON.stringify(taskList));
  }, [taskList]);

  if (!doRender || !taskDispatcher) {
    return (
      <>
        <div className={styles['taskManager']}>
          <h2>
            <p>Loading...</p>
            <button key='run' className={`fas fa-forward`} title='Run'></button>
            <button key='open' className={`fas fa-folder-open`} title='Open'></button>
            <button key='save' className={`fas fa-save`} title='Save'></button>
            <button key='clear' className={`${styles['warning']} fas fa-trash-alt`} title='Delete'></button>
          </h2>
        </div>
      </>
    );
  }

  const deleteClick = () => {
    if (clearTasksReference.current && taskList.length) {
      clearTasksReference.current.openDialog();
    }
  };

  const doDeleteTasks = () => {
    taskDispatcher({
      action: 'set',
      taskList: [],
    });
    clearTasksReference.current?.closeDialog();
  };
  
  const saveTaskList = () => {
    const linkElement = document.createElement('a');
    const fileContents = new Blob([JSON.stringify(taskList, null, 2)], {type: 'application/json'});
    linkElement.href = URL.createObjectURL(fileContents);
    linkElement.download = 'tasklist.json';
    linkElement.click();
    linkElement.remove();
  };

  const loadClick = () => {
    document.getElementById('file')?.click();
  }

  const loadSubmit = async() => {
    const fileElement: HTMLInputElement = document.getElementById('file') as HTMLInputElement;
    if (fileElement.files) {
      loadTaskList(fileElement.files);
    }
    (document.getElementById('upload') as HTMLFormElement).reset();
  };

  const dragHandler: DragEventHandler<HTMLDivElement> = (event) => {
    if (event.type === 'dragover') {
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as HTMLDivElement)?.classList.add(`${styles['dragTarget']}`);
    } else if (event.type === 'dragenter') {
      (event.currentTarget as HTMLDivElement)?.classList.add(`${styles['dragTarget']}`);
    } else if (event.type === 'dragleave') {
      (event.currentTarget as HTMLDivElement)?.classList.remove(`${styles['dragTarget']}`);
    }
  };

  const dropHandler: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLDivElement)?.classList.remove(`${styles['dragTarget']}`);

    if (event.dataTransfer && event.dataTransfer.files) {
      loadTaskList(event.dataTransfer.files);
    }
  };
  
  const loadTaskList = (files: FileList) => {
    if (files && files.item(0)) {
      if (files.item(0)?.type !== 'application/json') {
        alert('Invalid file');
        return;
      }
      files.item(0)!.text()
        .then(text => {
          try {
            const json = JSON.parse(text);
            if (Array.isArray(json)) {
              taskDispatcher({
                action: 'set',
                taskList: json,
              });
            } else {
              alert('Invalid file');
            }
          } catch (error) {
            alert('Invalid file');
          }
        });
    }
  };

  return (
    <>
      <div className={styles['taskManager']} onDragOver={dragHandler} onDragEnter={dragHandler} onDragLeave={dragHandler} onDrop={dropHandler}>
        <form id='upload'>
          <input type='file' id='file' accept='.json' onChange={loadSubmit} />
        </form>
        <h2>
          <p>Tasks</p>
          <button key='run' className={`fas fa-forward`} title='Run' onClick={props.onExecute}></button>
          <button key='open' className={`fas fa-folder-open`} title='Open' onClick={loadClick}></button>
          <button key='save' className={`fas fa-save`} title='Save' onClick={saveTaskList}></button>
          <button key='clear' className={`warning fas fa-trash-alt`} title='Delete' onClick={deleteClick}></button>
        </h2>
        <ol className={styles['list']}>
          {
            taskList.map((_task, _index) => {
              return (
                <li key={_index} className={styles['taskUi']}>
                  <h3>
                    <p>{taskLabel[_task.taskName]}</p>
                    <button key='up' className={`${styles['up']} fas fa-angle-up`} title='Move up' onClick={() => taskDispatcher({ action: 'up', index: _index })} />
                    <button key='down' className={`${styles['down']} fas fa-angle-down`} title='Move down' onClick={() => taskDispatcher({ action: 'down', index: _index })} />
                    <button key='clear' className={`${styles['warning']} fas fa-trash-alt`} title='Delete' onClick={() => taskDispatcher({ action: 'delete', index: _index })} />
                  </h3>
                  {_task.taskName === 'PowerStart' && <PowerStart index={_index} task={_task} />}
                  {_task.taskName === 'PowerStop' && <PowerStop index={_index} task={_task} />}
                  {_task.taskName === 'ScheduleActivate' && <ScheduleActivate index={_index} task={_task} />}
                  {_task.taskName === 'ScheduleDeactivate' && <ScheduleDeactivate index={_index} task={_task} />}
                  {_task.taskName === 'FilePull' && <FilePull index={_index} task={_task} />}
                  {_task.taskName === 'FileDelete' && <FileDelete index={_index} task={_task} />}
                  {_task.taskName === 'FileDecompress' && <FileDecompress index={_index} task={_task} />}
                  {_task.taskName === 'FileCompress' && <FileCompress index={_index} task={_task} />}
                  {_task.taskName === 'StartupUpdate' && <StartupUpdate index={_index} task={_task} />}
                  {_task.taskName === 'StartupReinstall' && <StartupReinstall index={_index} task={_task} />}
                  {_task.taskName === 'ServerSuspend' && <ServerSuspend index={_index} task={_task} />}
                  {_task.taskName === 'ServerUnsuspend' && <ServerUnsuspend index={_index} task={_task} />}
                </li>
              );
            })
          }
        </ol>
        <NewTask />
      </div>
      <Dialog id='alert' ref={clearTasksReference}>
      <h2>
          <p>Are you sure?</p>
          <button className='fas fa-window-close' title='Close' onClick={clearTasksReference.current?.closeDialog}/>
        </h2>
        <p style={{width:'80px'}}>
          Do you really want to delete all tasks?<br />
          <br />
          This cannot be undone.
        </p>
        <nav>
          <button title='cancel' onClick={clearTasksReference.current?.closeDialog}>Cancel</button>
          <button title='OK' onClick={doDeleteTasks} className='warning'>OK</button>
        </nav>
      </Dialog>
    </>
  );
};

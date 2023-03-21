import { useContext, useRef } from 'react';

import { TaskKey, taskLabel } from '@/lib/tasks';
import { TaskListContext } from '@/pages';
import { Dialog, DialogReference } from '@/components/Dialog';

import styles from '@/styles/TaskManager.module.css';

export const NewTask = () => {
  const taskDialogReference = useRef<DialogReference>(null);
  const [taskList, taskDispatcher] = useContext(TaskListContext);

  if (taskDispatcher === null) {
    return <p>Loading...</p>;
  }

  const openDialog = () => {
    if (taskDialogReference.current) {
      taskDialogReference.current.openDialog();
    }
  };
  
  const doAdd = (taskName: TaskKey) => {
    if (!taskDispatcher) {
      return;
    }
    taskDispatcher({
      'action': 'add',
      'taskName': taskName
    });
    taskDialogReference.current?.closeDialog();
  };

  return (
    <>
      <button key='add' className={`${styles['add']} fas fa-plus-square`} title='Add a task' onClick={openDialog}></button>
      <Dialog id="addTaskDialog" ref={taskDialogReference}>
        <h2>
          <p>Select task</p>
          <button className='fas fa-window-close' title='Close' onClick={taskDialogReference.current?.closeDialog}/>
        </h2>
        <ul>
          {
            Object.entries(taskLabel).map(([taskName, label]) => <li key={taskName} onClick={() => doAdd(taskName as TaskKey)}>{label}</li>)
          }
        </ul>
      </Dialog>
    </>
  );
};

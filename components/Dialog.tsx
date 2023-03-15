import { forwardRef, Ref, useImperativeHandle, useRef } from 'react';

import styles from '@/styles/Dialog.module.css'

export type DialogReference = {
  openDialog: () => void,
  closeDialog: () => void,
}

type DialogProps = {
  id: string,
  children: React.ReactNode,
}
export const Dialog = forwardRef((props: DialogProps, parentReference: Ref<DialogReference>) => {
  const dialogReference = useRef<HTMLDivElement>(null);

  const getDialogElement = (): HTMLDialogElement | null => {
    if (document) {
      return document.getElementById(props.id) as HTMLDialogElement
    }
    return null;
  }

  const clickOutside = (event: MouseEvent) => {
    const dialogElement = getDialogElement()
    if (dialogElement && dialogReference.current && !dialogReference.current.contains(event.target as Element)) {
      dialogElement.close()
    }
  }
  useImperativeHandle(parentReference, () => {
    return {
      openDialog() {
        const dialogElement = getDialogElement()
        if (dialogElement) {
          dialogElement.showModal();
          dialogElement.addEventListener('click', clickOutside);
        }
      },

      closeDialog() {
        const dialogElement = getDialogElement()
        if (dialogElement) {
          dialogElement.removeEventListener('click', clickOutside);
          dialogElement.close();
        }
      }
    };
  }, []);

  return (
    <dialog id={props.id} className={styles['dialog']}>
      <div ref={dialogReference}>
        {props.children}
      </div>
    </dialog>    
  )
})


// export const Alert = () => {
   
// }

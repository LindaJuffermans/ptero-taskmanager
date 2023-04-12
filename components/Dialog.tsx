import { forwardRef, Ref, useImperativeHandle, useRef } from 'react';

export type DialogReference = {
  openDialog: () => void,
  closeDialog: () => void,
};

type DialogProps = {
  id: string,
  children: React.ReactNode,
};

const _Dialog = (props: DialogProps, parentReference: Ref<DialogReference>) => {
  const dialogContainerReference = useRef<HTMLDivElement>(null);

  const getDialogElement = (): HTMLDialogElement | null => {
    if (document) {
      return document.getElementById(props.id) as HTMLDialogElement;
    }
    return null;
  }

  const clickOutside = (event: MouseEvent) => {
    const dialogElement = getDialogElement();
    if (dialogElement && dialogContainerReference.current && !dialogContainerReference.current.contains(event.target as Element)) {
      dialogElement.close();
    }
  }

  useImperativeHandle(parentReference, () => {
    return {
      openDialog() {
        const dialogElement = getDialogElement();
        if (dialogElement) {
          dialogElement.showModal();
          dialogElement.addEventListener('click', clickOutside);
        }
      },

      closeDialog() {
        const dialogElement = getDialogElement();
        if (dialogElement) {
          dialogElement.removeEventListener('click', clickOutside);
          dialogElement.close();
        }
      }
    };
  }, []);

  return (
    <dialog id={props.id}>
      <div ref={dialogContainerReference}>
        {props.children}
      </div>
    </dialog>    
  );
};
export const Dialog = forwardRef(_Dialog);

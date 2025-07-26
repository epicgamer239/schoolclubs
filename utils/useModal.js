import { useState, useCallback } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null
  });

  const showConfirm = useCallback((title, message, onConfirm) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  }, []);

  const showAlert = useCallback((title, message) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: null
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  }, [modalState.onConfirm, closeModal]);

  return {
    modalState,
    showConfirm,
    showAlert,
    closeModal,
    handleConfirm
  };
}; 
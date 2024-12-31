import React from "react";
import { Modal } from "antd";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  content,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={visible} // or `visible={visible}` depending on the antd version
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      okText='Conferma'
      cancelText='Annulla'
    >
      {content}
    </Modal>
  );
};

export default ConfirmationModal;

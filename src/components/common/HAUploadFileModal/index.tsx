'use client';

import './style.scss';
import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Modal, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

interface HAUploadFileModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm?: (files: UploadFile[]) => void;
}

const HAUploadFileModal = ({ open, onCancel, onConfirm }: HAUploadFileModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    setFileList((prev) => [...prev, file as UploadFile]);
    return false;
  };

  const handleRemove: UploadProps['onRemove'] = (file) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const handleClose = () => {
    setFileList([]);
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm?.(fileList);
    handleClose();
  };

  return (
    <Modal
      title="上传文件"
      open={open}
      onCancel={handleClose}
      footer={null}
      className="ha-upload-file-modal"
    >
      <Upload.Dragger
        multiple
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onRemove={handleRemove}
        className="ha-upload-file-dragger"
      >
        <p className="ha-upload-file-icon">
          <InboxOutlined />
        </p>
        <p className="ha-upload-file-title">点击或拖拽文件到这里上传</p>
        <p className="ha-upload-file-desc">
          支持批量选择，当前为前端占位封装，后续可直接接真实上传接口。
        </p>
      </Upload.Dragger>

      <div className="ha-upload-file-footer">
        <Button onClick={handleClose}>取消</Button>
        <Button type="primary" onClick={handleConfirm} disabled={fileList.length === 0}>
          确认上传
        </Button>
      </div>
    </Modal>
  );
};

export default HAUploadFileModal;

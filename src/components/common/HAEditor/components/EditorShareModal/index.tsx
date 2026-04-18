'use client';

import './style.scss';
import Portal from '@/components/common/Portal';
import { CopyOutlined, LinkOutlined, QrcodeOutlined } from '@ant-design/icons';
import { Button, Modal, QRCode, message } from 'antd';

interface EditorShareModalProps {
  open: boolean;
  onCancel: () => void;
  shareUrl: string;
}

const EditorShareModal = ({ open, onCancel, shareUrl }: EditorShareModalProps) => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success('分享链接已复制');
    } catch {
      messageApi.error('复制失败，请手动复制链接');
    }
  };

  return (
    <>
      {contextHolder}
      <Portal>
        <Modal
          open={open}
          onCancel={onCancel}
          footer={null}
          title="分享文档"
          className="ha-editor-share-modal"
        >
          <div className="ha-editor-share-grid">
            <section className="ha-editor-share-card">
              <div className="ha-editor-share-card-icon">
                <QrcodeOutlined />
              </div>
              <div className="ha-editor-share-card-main">
                <div className="ha-editor-share-card-title">二维码分享</div>
                <div className="ha-editor-share-card-desc">
                  手机扫一扫即可打开当前文档页面，适合面对面或群聊快速转发。
                </div>
              </div>
              <div className="ha-editor-share-qrcode">
                <QRCode value={shareUrl || ' '} size={168} bordered={false} />
              </div>
            </section>

            <section className="ha-editor-share-card">
              <div className="ha-editor-share-card-icon">
                <LinkOutlined />
              </div>
              <div className="ha-editor-share-card-main">
                <div className="ha-editor-share-card-title">链接分享</div>
                <div className="ha-editor-share-card-desc">
                  复制文档链接，发给协作者即可打开当前页面。
                </div>
              </div>
              <div className="ha-editor-share-link-box">{shareUrl}</div>
              <Button type="primary" icon={<CopyOutlined />} onClick={() => void handleCopy()}>
                复制链接
              </Button>
            </section>
          </div>
        </Modal>
      </Portal>
    </>
  );
};

export default EditorShareModal;

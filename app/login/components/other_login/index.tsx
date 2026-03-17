import { AlipayOutlined, AppleOutlined, WechatOutlined } from '@ant-design/icons';
import './style.scss';

function OtherLogin() {
  return (
    <div className="other-login">
      <div className="title">其他登录方式</div>
      <div className="methods">
        <div className="method-btn">
          <WechatOutlined />
        </div>
        <div className="method-btn">
          <AlipayOutlined />
        </div>
        <div className="method-btn">
          <AppleOutlined />
        </div>
      </div>
    </div>
  );
}

export default OtherLogin;

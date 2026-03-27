import LeftStroll from './components/LeftStroll';
import './style.scss';

const StrollContainer = () => {
  return (
    <div className="stroll-container f-jc-c">
      <div className="left">
        <LeftStroll></LeftStroll>
      </div>
      <div className="right">右边</div>
    </div>
  );
};

export default StrollContainer;

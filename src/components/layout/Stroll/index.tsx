import LeftStroll from './components/LeftStroll';
import RightStroll from './components/RightStroll';
import './style.scss';

const StrollContainer = () => {
  return (
    <div className="stroll-container f-jc-c">
      <div className="left">
        <LeftStroll />
      </div>
      <div className="right">
        <RightStroll />
      </div>
    </div>
  );
};

export default StrollContainer;

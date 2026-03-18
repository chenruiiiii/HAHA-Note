import DropDown from '../DropDown';
import './style.scss';

interface FolderItem {
  title: string;
  icon: string;
  type: string;
  color: string;
  description: string;
  drop: boolean;
}
function NewFolderItem({ title, icon, color, description, drop }: FolderItem) {
  return (
    <>
      <div className="f-jc-s new-folder-item cursor-pointer">
        <div className="f-left">
          <i className={`iconfont ${icon}`} style={{ color: color || '#aaa' }}></i>
        </div>
        <div className="f-right">
          <div className="desc">
            <div className="top">{title}</div>
            <div className="down">{description}</div>
          </div>
          {drop && <i className="iconfont icon-e_xiangxiajiantou"></i>}
        </div>
      </div>
      {drop && <DropDown></DropDown>}
    </>
  );
}

export default NewFolderItem;

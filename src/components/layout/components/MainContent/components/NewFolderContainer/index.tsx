import { NEW_INFO } from '@/constants/config.ts/start';
import NewFolderItem from './components/NewFolderItem';
import './style.scss';

function NewFolderContainer() {
  return (
    <div className="new-folder-container">
      {NEW_INFO.map((item) => (
        <NewFolderItem key={item.title} {...item}></NewFolderItem>
      ))}
    </div>
  );
}

export default NewFolderContainer;

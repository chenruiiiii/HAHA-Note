import React from 'react';
import './style.scss';
import code from '@/assets/images/file-icon/code.svg';
import file from '@/assets/images/file-icon/file.svg';
import project from '@/assets/images/file-icon/project.svg';
import repository from '@/assets/images/file-icon/repository.svg';

interface FileICONProps {
  file_name: string;
}

const FILE_ICON_LIST = [
  {
    file_name: '常用1',
    icon: <img src={code.src} alt="code" />,
  },
  {
    file_name: 'jpg',
    icon: <img src={file.src} alt="file" />,
  },
  {
    file_name: 'jpeg',
    icon: <img src={project.src} alt="project" />,
  },
  {
    file_name: 'gif',
    icon: <img src={repository.src} alt="repository" />,
  },
];

const FileICON = ({ file_name }: FileICONProps) => {
  return (
    <div className="file-icon">
      {FILE_ICON_LIST.find((item) => item.file_name === file_name)?.icon || (
        <img src={code.src} alt="code" />
      )}
    </div>
  );
};

export default FileICON;

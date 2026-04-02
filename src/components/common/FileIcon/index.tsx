import React from 'react';
import Image from 'next/image';
import './style.scss';
import code from '@/assets/images/file-icon/code.svg';
import file from '@/assets/images/file-icon/file.svg';
import project from '@/assets/images/file-icon/project.svg';
import repository from '@/assets/images/file-icon/repository.svg';

interface FileICONProps {
  file_name?: string;
  type?: 'note' | 'project' | 'code' | 'growth';
}

const FILE_ICON_LIST = [
  {
    file_name: '常用1',
    icon: <Image src={code} alt="code" />,
  },
  {
    file_name: 'jpg',
    icon: <Image src={file} alt="file" />,
  },
  {
    file_name: 'jpeg',
    icon: <Image src={project} alt="project" />,
  },
  {
    file_name: 'gif',
    icon: <Image src={repository} alt="repository" />,
  },
];

const TYPE_ICON_MAP: Record<NonNullable<FileICONProps['type']>, string> = {
  note: 'jpg',
  project: 'jpeg',
  code: '常用1',
  growth: 'gif',
};

const FileICON = ({ file_name, type }: FileICONProps) => {
  const iconKey = type ? TYPE_ICON_MAP[type] : file_name;

  return (
    <div className="file-icon">
      {FILE_ICON_LIST.find((item) => item.file_name === iconKey)?.icon || <Image src={code} alt="code" />}
    </div>
  );
};

export default FileICON;

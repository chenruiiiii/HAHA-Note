import React from 'react';

interface FileDetailProps {
  id: string;
}

const FileDetail = ({ id }: FileDetailProps) => {
  return <div className="file-detail">File Detail: {id}</div>;
};

export default FileDetail;

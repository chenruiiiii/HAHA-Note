import React from 'react';
import './style.scss';
import HALoading from '@/components/common/HALoading';

const RepoLoading = () => {
  return (
    <div className="repo-detail-loading">
      <HALoading type="simple" />
    </div>
  );
};

export default RepoLoading;

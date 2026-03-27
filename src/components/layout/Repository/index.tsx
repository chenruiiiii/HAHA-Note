import React from 'react';
import './style.scss';
import CommonUse from './components/CommonUse';
import RepositoryFiltering from './components/RepositoryFiltering';

const Repository = () => {
  return (
    <div className="repository">
      <CommonUse></CommonUse>
      <RepositoryFiltering></RepositoryFiltering>
    </div>
  );
};

export default Repository;

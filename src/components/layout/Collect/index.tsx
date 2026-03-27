'use client';
import './style.scss';
import SearchTitle from '@/components/common/SearchTitle';
import DocList from '../Start/components/DocList';

const Collect = () => {
  return (
    <div className="collect-container">
      <SearchTitle></SearchTitle>
      <DocList></DocList>
    </div>
  );
};

export default Collect;

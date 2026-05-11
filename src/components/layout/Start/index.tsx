'use client';
import DocFiltering from './components/DocFiltering';
import DocList from './components/DocList';
import HATitle from './components/HATitle';
import NewFolderContainer from './components/NewFolderContainer';
import MainContent from '../MainContent';
import { useState } from 'react';
import { Align } from './types/list';
import { useGetEditedListQuery } from '@/store/modules/user_history';

function Start() {
  const [filterType, setFilterType] = useState<Align>('编辑过');
  const { data: list, isLoading, error } = useGetEditedListQuery({ type: filterType });

  return (
    <MainContent isLoading={isLoading}>
      <HATitle title="开始"></HATitle>
      <NewFolderContainer></NewFolderContainer>
      <HATitle title="文档"></HATitle>
      <DocFiltering value={filterType} onChange={setFilterType}></DocFiltering>
      <DocList filterType={filterType} list={list} isLoading={isLoading} error={error}></DocList>
    </MainContent>
  );
}

export default Start;

import DocFiltering from './components/DocFiltering';
import DocList from './components/DocList';
import HATitle from './components/HATitle';
import NewFolderContainer from './components/NewFolderContainer';
import MainContent from '../MainContent';

function Start() {
  return (
    <MainContent>
      <HATitle title="开始"></HATitle>
      <NewFolderContainer></NewFolderContainer>
      <HATitle title="文档"></HATitle>
      <DocFiltering></DocFiltering>
      <DocList></DocList>
    </MainContent>
  );
}

export default Start;

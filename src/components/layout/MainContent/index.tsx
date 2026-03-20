import DocFiltering from './components/DocFiltering'
import DocList from './components/DocList'
import HATitle from './components/HATitle'
import NewFolderContainer from './components/NewFolderContainer'
import './style.scss'

function MainContent() {
  return (
    <div className='main-content'>
      <HATitle title="开始"></HATitle>
      <NewFolderContainer></NewFolderContainer>
      <HATitle title="文档"></HATitle>
      <DocFiltering></DocFiltering>
      <DocList></DocList>
    </div>
  )
}

export default MainContent
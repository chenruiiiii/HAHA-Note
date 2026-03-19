import './style.scss'
interface HATitle {
  title: string
}
function HATitle({ title}:HATitle) {
  return (
    <div className='ha-title'>{ title}</div>
  )
}

export default HATitle
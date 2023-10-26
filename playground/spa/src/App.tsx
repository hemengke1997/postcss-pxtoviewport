import A from './components/A'
import B from './components/B'
import C from './components/C'
import './App.css'

function App() {
  return (
    <div className='App flex flex-col gap-y-[12px]'>
      <div className={'text-2xl font-bold text-orange-400 mt-[32px]'}>请缩放浏览器窗口大小，感受字体大小变化</div>

      <A />
      <B />
      <C />
    </div>
  )
}

export default App

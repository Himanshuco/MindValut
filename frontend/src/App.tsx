import { BrowserRouter, Route ,Routes } from 'react-router-dom'
import './App.css'
import { DashBoard } from './Pages/DashBoard'
import { SignUp } from './components/SignUp'
import { SignIn } from './components/SignIn'
import { SharedBrainPage } from './Pages/SharedBrainPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/signin' element={<SignIn/>}/>
        <Route path='/' element={<DashBoard/>}/>
        <Route path="/brain/:sharelink" element={<SharedBrainPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

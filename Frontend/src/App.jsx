import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Pages/Landing.jsx';
import Login from './Pages/Login.jsx';
import Register from './Pages/Register.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import ChatPage from './Pages/Chatpage.jsx';
import QuizPage from './Pages/QuizPage.jsx';
import FlashcardsPage from './Pages/Flashcardpage.jsx';

function App() {
  

  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path='/quiz/:id' element={<QuizPage />} />
      <Route path='/flashcard/:id' element={<FlashcardsPage />} />
    </Routes>

  )
}

export default App

import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Landing from './Pages/Landing.jsx';
import Login from './Pages/Login.jsx';
import Register from './Pages/Register.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import ChatPage from './Pages/Chatpage.jsx';
import QuizPage from './Pages/QuizPage.jsx';
import FlashcardsPage from './Pages/Flashcardpage.jsx';
import SummaryPage from './Pages/Summarypage.jsx';
import NotesPage from './Pages/Notespage.jsx';

function App() {


  return (
    <ErrorBoundary>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path='/quiz/:id' element={<QuizPage />} />
        <Route path='/flashcards/:id' element={<FlashcardsPage />} />
        <Route path='/summary/:id' element={<SummaryPage />} />
        <Route path='/notes/:id' element={<NotesPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
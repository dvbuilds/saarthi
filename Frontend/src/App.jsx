import './App.css'
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './Components/ErrorBoundary.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
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
        <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path='/quiz/:id' element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path='/flashcards/:id' element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
        <Route path='/summary/:id' element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
        <Route path='/notes/:id' element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
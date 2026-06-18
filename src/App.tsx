import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Clues from '@/pages/Clues'
import Verify from '@/pages/Verify'
import Feedback from '@/pages/Feedback'
import BottomNav from '@/components/BottomNav'

function AppContent() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-slate-50 relative">
      <Routes>
        <Route path="/" element={<Clues />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:id" element={<Verify />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

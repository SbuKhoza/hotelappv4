import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './pages/LoginSignup'
import Home from './pages/Home'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loginsignup" element={<LoginSignup />} />
      </Routes>
    </Router>
  )
}

export default App
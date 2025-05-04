import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserSurveyScreen from './components/UserSurveyScreen';
import AdminSurveyScreen from './components/AdminSurveyScreen';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/user">User Survey</Link></li>
            <li><Link to="/admin">Admin Panel</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/user" element={<UserSurveyScreen />} />
          <Route path="/admin" element={<AdminSurveyScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

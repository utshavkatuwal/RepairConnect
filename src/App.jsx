import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import AdminPanel from './components/AdminPanel';
import TechnicianPanel from './components/TechnicianPanel';
import TechnicianOrdersPage from './components/TechnicianOrdersPage';
import CustomerPanel from './components/CustomerPanel';
import BookingPage from './components/BookingPage';
import SettingsPage from './components/SettingsPage';
import OrdersPage from './components/OrdersPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/technician" element={<TechnicianPanel />} />
        <Route path="/tech-orders" element={<TechnicianOrdersPage />} />
        <Route path="/customer" element={<Navigate to="/book" replace />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar.jsx';
import './App.css';
import Home from './Components/Pages/Home.jsx';
import Eulogies from './Components/Pages/Eulogies.jsx';
import EulogyDetail from './Components/Pages/EulogyDetail.jsx';
import CreateEulogy from './Components/Pages/CreateEulogy.jsx';
import Contact from './Components/Pages/Contact.jsx';
import Resources from './Components/Pages/Resources.jsx';
import Account from './Components/Pages/Account.jsx';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Eulogies" element={<Eulogies />} />
        <Route path="/Eulogies/:slug" element={<EulogyDetail />} />
        <Route path="/CreateEulogy" element={<CreateEulogy />} />
        <Route path="/Account" element={<Account />} />
        <Route path="/Resources" element={<Resources />} />
        <Route path="/Contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;

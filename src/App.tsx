import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './shared/contexts/ThemeContext';
import { Header } from './widgets/Header';
import { Profile } from './pages/Profile';
import { Exchange } from './pages/Exchange';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Profile />} />
          <Route path="/exchange" element={<Exchange />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import Login from "./pages/LoginPage.jsx";
import './index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;

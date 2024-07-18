import { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import History from "./pages/History";
import Validate from "./pages/Validate";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setLoggedIn(true);
    }
  }, []);

  function Layout() {
    const location = useLocation();
    const hideNavbarRoutes = ["/", "/login", "/register"];
    const showNavbar = !hideNavbarRoutes.includes(location.pathname);

    const userId = localStorage.getItem("userId");

    if (!userId && !hideNavbarRoutes.includes(location.pathname)) {
      return <Navigate to="/login" />;
    }

    return (
      <>
        {showNavbar && <Navbar userId={userId} />}
        <Routes>
          <Route path="/" element={<Login setLoggedIn={setLoggedIn} />} />
          <Route path="/dashboard/:userId" element={<Dashboard userId={userId} />} />
          <Route path="/validate/:userId" element={<Validate userId={userId} />} />
          <Route path="/history/:userId" element={<History userId={userId} />} />
          <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </>
    );
  }

  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;

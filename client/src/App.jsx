import { BrowserRouter, Routes, Route } from "react-router";
import ChatBox from "./pages/ChatBox";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemoryOnboarding from "./pages/MemoryOnboarding";
import Hero from "./components/landing/Hero";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/chat" element={<ChatBox />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<MemoryOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark" // or "dark" / "colored"
        />
      </>
    </BrowserRouter>
  );
}

export default App;

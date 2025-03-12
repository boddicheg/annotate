import "./index.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import Login from "./components/Login";
import Register from "./components/Register";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

// Wrapper component to apply different padding based on route
const MainContent = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Apply different padding for create project page
  const getPadding = () => {
    if (location.pathname === "/projects/create") {
      return "p-4 md:p-6";
    }
    return "p-6";
  };
  
  return (
    <main className={getPadding()}>
      {children}
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1">
                  <Header />
                  <MainContent><Dashboard /></MainContent>
                </div>
              </div>
            } />
            <Route path="/projects" element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1">
                  <Header />
                  <MainContent><Projects /></MainContent>
                </div>
              </div>
            } />
            <Route path="/projects/create" element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1">
                  <Header />
                  <MainContent><CreateProject /></MainContent>
                </div>
              </div>
            } />
            <Route path="/settings" element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1">
                  <Header />
                  <MainContent><Settings /></MainContent>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

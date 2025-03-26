import "./index.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import ProjectDetail from "./components/ProjectDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

// Wrapper component to apply different padding based on route
const MainContent = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Apply different padding for create project page
  const getPadding = () => {
    console.log(location.pathname);
    if (location.pathname === "/projects/create") {
      return "p-4 md:p-6";
    }
    if (location.pathname === "/projects") {
      return "p-6";
    }
    return "";
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
      <ToastProvider>
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
              <Route path="/projects/:projectUuid" element={
                <div className="flex min-h-screen bg-gray-50">
                  <Sidebar />
                  <div className="flex-1">
                    <MainContent><ProjectDetail /></MainContent>
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
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

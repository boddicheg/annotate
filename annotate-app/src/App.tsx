import "./index.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
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
    <>
      <HashRouter>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <Routes>
              <Route path="/" element={<MainContent><Dashboard /></MainContent>} />
              <Route path="/projects" element={<MainContent><Projects /></MainContent>} />
              <Route path="/projects/create" element={<MainContent><CreateProject /></MainContent>} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </>
  );
}

export default App;


import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import CauseList from './pages/CauseList';
import NewCase from './pages/NewCase';
import FairnessDashboard from './pages/FairnessDashboard';
import AdminConsole from './pages/AdminConsole';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cause-list" element={<CauseList />} />
              <Route path="/cases/new" element={<NewCase />} />
              <Route path="/fairness" element={<FairnessDashboard />} />
              <Route path="/admin" element={<AdminConsole />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

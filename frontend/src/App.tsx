import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
// substitui <div>Dashboard</div> por:



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { signed, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!signed) return <Navigate to="/login" />;

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
           <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
         
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';
import { Chat } from '@/pages/Chat';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-slate-600">Cargando...</span>
        </div>
      </div>
    );
  }

  return user ? <Chat /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}

export default App;

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { ZyrexProvider } from "./store/ZyrexProvider";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/Login";

function Gate() {
  const { status } = useAuth();
  if (status !== "authenticated") return <LoginPage />;
  return (
    <ZyrexProvider>
      <AppShell />
    </ZyrexProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

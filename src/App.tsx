import { ZyrexProvider } from "./store/ZyrexProvider";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <ZyrexProvider>
      <AppShell />
    </ZyrexProvider>
  );
}

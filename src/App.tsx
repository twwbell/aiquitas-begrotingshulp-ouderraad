import { AppShell } from '@/components/layout/AppShell'
import { ScenarioProvider } from '@/hooks/useScenario'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <ScenarioProvider>
      <AppShell />
      <Toaster />
    </ScenarioProvider>
  )
}

export default App

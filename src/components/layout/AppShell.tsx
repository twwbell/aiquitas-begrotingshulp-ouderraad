import { useState } from 'react';
import { Header } from './Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScenario } from '@/hooks/useScenario';
import { InvoerTab } from '@/components/invoer/InvoerTab';
import { ActiviteitenTab } from '@/components/activiteiten/ActiviteitenTab';
import { ScenariosTab } from '@/components/scenarios/ScenariosTab';
import { ForecastTab } from '@/components/forecast/ForecastTab';
import { RapportTab } from '@/components/rapport/RapportTab';
import { FileText, Settings, BarChart3, TrendingUp, Printer } from 'lucide-react';

export function AppShell() {
  const { isLoading, error, scenario } = useScenario();
  const [activeTab, setActiveTab] = useState('invoer');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-semibold">Fout bij laden</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Geen scenario gevonden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="no-print grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="invoer" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:block" />
              Invoer
            </TabsTrigger>
            <TabsTrigger value="activiteiten" className="gap-2">
              <Settings className="h-4 w-4 hidden sm:block" />
              Activiteiten
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Scenario's
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4 hidden sm:block" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="rapport" className="gap-2">
              <Printer className="h-4 w-4 hidden sm:block" />
              Rapport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoer">
            <InvoerTab />
          </TabsContent>

          <TabsContent value="activiteiten">
            <ActiviteitenTab />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenariosTab />
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastTab />
          </TabsContent>

          <TabsContent value="rapport">
            <RapportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

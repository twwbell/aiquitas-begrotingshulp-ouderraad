import { useState, useRef } from 'react';
import { useScenario } from '@/hooks/useScenario';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Upload, FileDown, FolderUp } from 'lucide-react';

export function Header() {
  const {
    scenario,
    scenarios,
    selectScenario,
    createScenario,
    exportScenario,
    importScenario,
    exportAllScenarios,
    importAllScenarios,
  } = useScenario();
  const { toast } = useToast();

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newScenarioNaam, setNewScenarioNaam] = useState('');
  const [kopieVan, setKopieVan] = useState<string | undefined>(undefined);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);

  const handleCreateScenario = async () => {
    if (!newScenarioNaam.trim()) return;

    try {
      const copyFrom = kopieVan === 'none' ? undefined : kopieVan;
      await createScenario(newScenarioNaam.trim(), copyFrom);
      toast({
        title: 'Scenario aangemaakt',
        description: `"${newScenarioNaam}" is succesvol aangemaakt.`,
      });
      setIsNewDialogOpen(false);
      setNewScenarioNaam('');
      setKopieVan(undefined);
    } catch {
      toast({
        title: 'Fout',
        description: 'Kon scenario niet aanmaken.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    if (!scenario) return;
    try {
      await exportScenario(scenario.id);
      toast({
        title: 'Geëxporteerd',
        description: 'Scenario is gedownload.',
      });
    } catch {
      toast({
        title: 'Fout',
        description: 'Kon scenario niet exporteren.',
        variant: 'destructive',
      });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importScenario(file);
      toast({
        title: 'Geïmporteerd',
        description: `"${imported.naam}" is succesvol geïmporteerd.`,
      });
    } catch (err) {
      toast({
        title: 'Fout bij importeren',
        description: err instanceof Error ? err.message : 'Ongeldig bestand.',
        variant: 'destructive',
      });
    }

    e.target.value = '';
  };

  const handleExportAll = async () => {
    try {
      await exportAllScenarios();
      toast({
        title: 'Backup gemaakt',
        description: 'Alle scenario\'s zijn gedownload.',
      });
    } catch {
      toast({
        title: 'Fout',
        description: 'Kon backup niet maken.',
        variant: 'destructive',
      });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importAllScenarios(file);
      toast({
        title: 'Backup hersteld',
        description: 'Alle scenario\'s zijn hersteld.',
      });
    } catch (err) {
      toast({
        title: 'Fout bij herstellen',
        description: err instanceof Error ? err.message : 'Ongeldig bestand.',
        variant: 'destructive',
      });
    }

    e.target.value = '';
  };

  return (
    <header className="border-b bg-white no-print">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
              🧮
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Begrotingshulp Ouderraad
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={scenario?.id}
              onValueChange={selectScenario}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecteer scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.naam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nieuw
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => importFileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <Button variant="ghost" size="sm" onClick={handleExportAll}>
              <FileDown className="h-4 w-4 mr-1" />
              Backup
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => importBackupRef.current?.click()}
            >
              <FolderUp className="h-4 w-4 mr-1" />
              Herstel
            </Button>
            <input
              ref={importBackupRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* New Scenario Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Scenario</DialogTitle>
            <DialogDescription>
              Maak een nieuw scenario aan. Je kunt optioneel een bestaand
              scenario als basis gebruiken.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="naam">Naam</Label>
              <Input
                id="naam"
                value={newScenarioNaam}
                onChange={(e) => setNewScenarioNaam(e.target.value)}
                placeholder="Bijv. Scenario 2026"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kopie">Kopieer van (optioneel)</Label>
              <Select value={kopieVan} onValueChange={setKopieVan}>
                <SelectTrigger>
                  <SelectValue placeholder="Start met lege standaardwaarden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start met standaardwaarden</SelectItem>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreateScenario} disabled={!newScenarioNaam.trim()}>
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

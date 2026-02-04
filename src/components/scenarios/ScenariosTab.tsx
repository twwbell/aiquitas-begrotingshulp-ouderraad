import { useState, useMemo } from 'react';
import { useScenario } from '@/hooks/useScenario';
import { useForecast } from '@/hooks/useForecast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PRESET_SCENARIOS } from '@/data/defaults';
import { calculateSpecifiekeBijdragePerStudent } from '@/services/calculations';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScenariosTab() {
  const { scenario, scenarios, updateSettings, renameScenario, deleteScenario } = useScenario();
  const forecast = useForecast(scenario);
  const { toast } = useToast();

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActivitySelectOpen, setIsActivitySelectOpen] = useState(false);
  const [newName, setNewName] = useState('');

  if (!scenario) return null;

  const { instellingen } = scenario;
  const selectedActivityCodes = instellingen.specifiekeBijdrageActiviteiten || [];
  const specifiekPercentage = instellingen.specifiekeBijdragePercentage ?? 100;

  // Calculate per-student cost for selected activities (at 100%)
  const bijdragePerStudentBasis = useMemo(() => {
    return calculateSpecifiekeBijdragePerStudent(
      scenario.activiteiten,
      scenario.leerlingaantallen,
      selectedActivityCodes
    );
  }, [scenario.activiteiten, scenario.leerlingaantallen, selectedActivityCodes]);

  // Per-student amount based on percentage
  const bijdragePerStudent = bijdragePerStudentBasis * (specifiekPercentage / 100);

  const handleSliderChange = (field: keyof typeof instellingen, values: number[]) => {
    updateSettings({ [field]: values[0] });
  };

  const handleActivityToggle = (code: number, checked: boolean) => {
    const newCodes = checked
      ? [...selectedActivityCodes, code]
      : selectedActivityCodes.filter((c) => c !== code);
    updateSettings({ specifiekeBijdrageActiviteiten: newCodes });
  };

  const handleClearActivities = () => {
    updateSettings({ specifiekeBijdrageActiviteiten: [] });
  };

  const applyPreset = (presetKey: keyof typeof PRESET_SCENARIOS) => {
    const preset = PRESET_SCENARIOS[presetKey];
    updateSettings(preset.instellingen);
    toast({
      title: `Preset toegepast: ${preset.naam}`,
      description: 'De scenario-instellingen zijn aangepast.',
    });
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renameScenario(scenario.id, newName.trim());
    setIsRenameOpen(false);
    setNewName('');
    toast({
      title: 'Scenario hernoemd',
      description: `Scenario is hernoemd naar "${newName.trim()}".`,
    });
  };

  const handleDelete = async () => {
    if (scenarios.length <= 1) {
      toast({
        title: 'Kan niet verwijderen',
        description: 'Er moet minimaal één scenario bestaan.',
        variant: 'destructive',
      });
      return;
    }
    await deleteScenario(scenario.id);
    setIsDeleteOpen(false);
    toast({
      title: 'Scenario verwijderd',
      description: 'Het scenario is verwijderd.',
    });
  };

  const estimatedIncome = forecast?.jaren[0]?.inkomstenOuderbijdrage || 0;

  // Get selected activity names for display
  const selectedActivities = scenario.activiteiten.filter((a) =>
    selectedActivityCodes.includes(a.code)
  );

  return (
    <div className="space-y-6">
      {/* Scenario Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{scenario.naam}</CardTitle>
              <CardDescription>
                Schooljaar {scenario.schooljaar} • Aangemaakt op{' '}
                {new Date(scenario.datumAangemaakt).toLocaleDateString('nl-NL')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewName(scenario.naam);
                  setIsRenameOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Hernoem
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Verwijder
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preset Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Voorgedefinieerde Scenario's</CardTitle>
          <CardDescription>
            Pas snel een standaard configuratie toe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => applyPreset('conservatief')}
            >
              Conservatief
              <span className="ml-2 text-xs text-muted-foreground">
                (€70, 75%, 3%)
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => applyPreset('realistisch')}
            >
              Realistisch
              <span className="ml-2 text-xs text-muted-foreground">
                (€75, 80%, 2%)
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => applyPreset('optimistisch')}
            >
              Optimistisch
              <span className="ml-2 text-xs text-muted-foreground">
                (€80, 85%, 1.5%)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sliders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ouderbijdrage</CardTitle>
            <CardDescription>Jaarlijkse bijdrage per kind</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold font-mono">
                {formatCurrency(instellingen.ouderbijdrage)}
              </span>
              <span className="text-sm text-muted-foreground">
                per kind per jaar
              </span>
            </div>
            <Slider
              value={[instellingen.ouderbijdrage]}
              onValueChange={(values) => handleSliderChange('ouderbijdrage', values)}
              min={50}
              max={120}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>€50</span>
              <span>€120</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bij {formatCurrency(instellingen.ouderbijdrage)} ={' '}
              <span className="font-mono font-medium">
                {formatCurrency(estimatedIncome)}
              </span>{' '}
              geschatte inkomsten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Betalingspercentage</CardTitle>
            <CardDescription>Percentage ouders dat betaalt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold font-mono">
                {formatPercentage(instellingen.betalingspercentage)}
              </span>
              <span className="text-sm text-muted-foreground">
                van de ouders betaalt
              </span>
            </div>
            <Slider
              value={[instellingen.betalingspercentage]}
              onValueChange={(values) => handleSliderChange('betalingspercentage', values)}
              min={50}
              max={100}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jaarlijkse Kostenstijging</CardTitle>
            <CardDescription>Inflatie correctie voor uitgaven</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold font-mono">
                {formatPercentage(instellingen.kostenstijging, 1)}
              </span>
              <span className="text-sm text-muted-foreground">
                per jaar
              </span>
            </div>
            <Slider
              value={[instellingen.kostenstijging]}
              onValueChange={(values) => handleSliderChange('kostenstijging', values)}
              min={0}
              max={10}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jaren Vooruit</CardTitle>
            <CardDescription>Forecast periode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold font-mono">
                {instellingen.jarenVooruit}
              </span>
              <span className="text-sm text-muted-foreground">
                jaar
              </span>
            </div>
            <Slider
              value={[instellingen.jarenVooruit]}
              onValueChange={(values) => handleSliderChange('jarenVooruit', values)}
              min={3}
              max={15}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 jaar</span>
              <span>15 jaar</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity-Specific Contribution */}
      <Card>
        <CardHeader>
          <CardTitle>Activiteit Specifieke Bijdrage</CardTitle>
          <CardDescription>
            Extra bijdrage per deelnemende leerling, bovenop de reguliere ouderbijdrage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount display - same style as other tiles */}
          {selectedActivities.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold font-mono">
                  {formatCurrency(bijdragePerStudent)}
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    ({formatPercentage(specifiekPercentage)})
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  per leerling
                </span>
              </div>
              <Slider
                value={[specifiekPercentage]}
                onValueChange={(values) => handleSliderChange('specifiekeBijdragePercentage', values)}
                min={0}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(0)}</span>
                <span>{formatCurrency(bijdragePerStudentBasis)} (100%)</span>
              </div>
            </>
          )}

          {/* Activity Selection */}
          <div className="space-y-2 pt-2">
            <Label>Activiteiten</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setIsActivitySelectOpen(!isActivitySelectOpen)}
              >
                <span className="truncate text-left">
                  {selectedActivities.length === 0
                    ? 'Selecteer activiteiten...'
                    : `${selectedActivities.length} activiteit${selectedActivities.length > 1 ? 'en' : ''} geselecteerd`}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isActivitySelectOpen && "rotate-180"
                )} />
              </Button>

              {isActivitySelectOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {scenario.activiteiten.map((activity) => (
                      <label
                        key={activity.code}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedActivityCodes.includes(activity.code)}
                          onCheckedChange={(checked) =>
                            handleActivityToggle(activity.code, checked === true)
                          }
                        />
                        <span className="text-sm">
                          {activity.code} - {activity.naam}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground font-mono">
                          {formatCurrency(activity.bedrag)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsActivitySelectOpen(false)}
                    >
                      Sluiten
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected activities tags */}
            {selectedActivities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedActivities.map((activity) => (
                  <span
                    key={activity.code}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
                  >
                    {activity.code} - {activity.naam}
                    <button
                      onClick={() => handleActivityToggle(activity.code, false)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleClearActivities}
                >
                  Alles wissen
                </Button>
              </div>
            )}

            {selectedActivities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Zonder selectie worden alle kosten gedekt door de reguliere ouderbijdrage.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scenario Hernoemen</DialogTitle>
            <DialogDescription>
              Geef een nieuwe naam voor dit scenario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newName">Nieuwe naam</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Scenario naam"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scenario Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je "{scenario.naam}" wilt verwijderen? Dit kan
              niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

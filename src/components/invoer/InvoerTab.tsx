import { useScenario } from '@/hooks/useScenario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DEFAULT_STUDENT_COUNTS, DEFAULT_SETTINGS } from '@/data/defaults';
import { STUDENT_GROEPEN } from '@/models';
import { formatCurrency, formatNumber } from '@/utils/currency';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';

export function InvoerTab() {
  const { scenario, updateStudentCounts, updateSettings } = useScenario();
  const { toast } = useToast();

  if (!scenario) return null;

  const totalStudents = scenario.leerlingaantallen.reduce(
    (sum, sc) => sum + sc.aantal,
    0
  );

  const handleStudentCountChange = (groep: string, value: string) => {
    const aantal = parseInt(value, 10) || 0;
    const updatedCounts = scenario.leerlingaantallen.map((sc) =>
      sc.groep === groep ? { ...sc, aantal: Math.max(0, aantal) } : sc
    );
    updateStudentCounts(updatedCounts);
  };

  const handleResetStudentCounts = () => {
    updateStudentCounts(DEFAULT_STUDENT_COUNTS.map((s) => ({ ...s })));
    toast({
      title: 'Leerlingaantallen gereset',
      description: 'De standaardwaarden zijn hersteld.',
    });
  };

  const handleSettingChange = (field: keyof typeof scenario.instellingen, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateSettings({ [field]: Math.max(0, numValue) });
  };

  const handleResetSettings = () => {
    updateSettings(DEFAULT_SETTINGS);
    toast({
      title: 'Instellingen gereset',
      description: 'De standaardwaarden zijn hersteld.',
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Student Counts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leerlingaantallen</CardTitle>
              <CardDescription>
                Huidige verdeling per groep voor {scenario.schooljaar}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStudentCounts}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Groep</TableHead>
                <TableHead className="text-right">Aantal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENT_GROEPEN.map((groep) => {
                const count = scenario.leerlingaantallen.find(
                  (sc) => sc.groep === groep
                );
                return (
                  <TableRow key={groep}>
                    <TableCell className="font-medium">{groep}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        value={count?.aantal || 0}
                        onChange={(e) =>
                          handleStudentCountChange(groep, e.target.value)
                        }
                        className="w-20 text-right ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Totaal</TableCell>
                <TableCell className="text-right font-bold font-mono">
                  {formatNumber(totalStudents)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Basisinstellingen</CardTitle>
              <CardDescription>
                Financiële parameters voor de prognose
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSettings}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="startReserve">Start Reserve</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">€</span>
              <Input
                id="startReserve"
                type="number"
                min="0"
                step="100"
                value={scenario.instellingen.startReserve}
                onChange={(e) => handleSettingChange('startReserve', e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Huidig saldo van de reserve
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instroomKleuters">Instroom Kleuters per Jaar</Label>
            <Input
              id="instroomKleuters"
              type="number"
              min="0"
              value={scenario.instellingen.instroomKleuters}
              onChange={(e) => handleSettingChange('instroomKleuters', e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Verwacht aantal nieuwe leerlingen in Groep 0-2 per schooljaar
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Samenvatting</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Totaal leerlingen:</dt>
              <dd className="font-mono text-right">{formatNumber(totalStudents)}</dd>
              <dt className="text-muted-foreground">Start reserve:</dt>
              <dd className="font-mono text-right">{formatCurrency(scenario.instellingen.startReserve)}</dd>
              <dt className="text-muted-foreground">Instroom per jaar:</dt>
              <dd className="font-mono text-right">{formatNumber(scenario.instellingen.instroomKleuters)}</dd>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

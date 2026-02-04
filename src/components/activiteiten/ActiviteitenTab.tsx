import { useState, useMemo } from 'react';
import { useScenario } from '@/hooks/useScenario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_ACTIVITIES, getStudentsForGroepen } from '@/data/defaults';
import { STUDENT_GROEPEN, type Activity, type ActivityType, type StudentGroep } from '@/models';
import { formatCurrency } from '@/utils/currency';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActiviteitenTab() {
  const { scenario, updateActivity, updateActivities } = useScenario();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    if (!scenario) return [];
    if (!searchQuery.trim()) return scenario.activiteiten;

    const query = searchQuery.toLowerCase();
    return scenario.activiteiten.filter(
      (a) =>
        a.naam.toLowerCase().includes(query) ||
        a.code.toString().includes(query)
    );
  }, [scenario, searchQuery]);

  if (!scenario) return null;

  // Helper to get student count for an activity
  const getActivityStudentCount = (activity: Activity): number => {
    return getStudentsForGroepen(scenario.leerlingaantallen, activity.groepen);
  };

  // Calculate lumpsum from per-leerling amount
  const calculateLumpsum = (activity: Activity): number => {
    if (activity.type === 'Lumpsum') return activity.bedrag;
    const students = getActivityStudentCount(activity);
    return activity.bedrag * students;
  };

  // Calculate per-leerling from lumpsum
  const calculatePerLeerling = (activity: Activity): number => {
    if (activity.type === 'PerLeerling') return activity.bedrag;
    const students = getActivityStudentCount(activity);
    if (students === 0) return 0;
    return activity.bedrag / students;
  };

  const handleTypeChange = (code: number, type: ActivityType) => {
    const activity = scenario.activiteiten.find((a) => a.code === code);
    if (!activity) return;

    // When switching types, convert the amount
    const students = getActivityStudentCount(activity);
    let newBedrag = activity.bedrag;

    if (type === 'PerLeerling' && activity.type === 'Lumpsum') {
      // Converting from lumpsum to per-leerling
      newBedrag = students > 0 ? Math.round((activity.bedrag / students) * 100) / 100 : 0;
    } else if (type === 'Lumpsum' && activity.type === 'PerLeerling') {
      // Converting from per-leerling to lumpsum
      newBedrag = Math.round(activity.bedrag * students);
    }

    const updated = { ...activity, type, bedrag: newBedrag };
    updateActivity(updated);
  };

  const handleBedragChange = (code: number, value: string) => {
    const activity = scenario.activiteiten.find((a) => a.code === code);
    if (!activity) return;

    const bedrag = parseFloat(value) || 0;
    const updated = { ...activity, bedrag: Math.max(0, bedrag) };
    updateActivity(updated);
  };

  const handleGroepenChange = (code: number, groep: StudentGroep, checked: boolean) => {
    const activity = scenario.activiteiten.find((a) => a.code === code);
    if (!activity) return;

    const newGroepen = checked
      ? [...activity.groepen, groep]
      : activity.groepen.filter((g) => g !== groep);

    const updated = { ...activity, groepen: newGroepen };
    updateActivity(updated);
  };

  const handleResetActivities = () => {
    updateActivities(DEFAULT_ACTIVITIES.map((a) => ({ ...a, groepen: [...a.groepen] })));
    toast({
      title: 'Activiteiten gereset',
      description: 'De standaardwaarden zijn hersteld.',
    });
  };

  const totalLumpsum = scenario.activiteiten.reduce(
    (sum, a) => sum + calculateLumpsum(a),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Activiteiten & Kosten</CardTitle>
            <CardDescription>
              Beheer de uitgaven per activiteit
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleResetActivities}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Code</TableHead>
                <TableHead className="min-w-[150px]">Activiteit</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-28 text-right">Lumpsum</TableHead>
                <TableHead className="w-28 text-right">Per Leerling</TableHead>
                <TableHead className="w-20 text-right">Aantal</TableHead>
                <TableHead className="min-w-[280px]">Groepen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => {
                const isLumpsum = activity.type === 'Lumpsum';
                const lumpsumValue = calculateLumpsum(activity);
                const perLeerlingValue = calculatePerLeerling(activity);

                return (
                  <TableRow key={activity.code}>
                    <TableCell className="font-mono text-muted-foreground">
                      {activity.code}
                    </TableCell>
                    <TableCell className="font-medium">{activity.naam}</TableCell>
                    <TableCell>
                      <Select
                        value={activity.type}
                        onValueChange={(value) =>
                          handleTypeChange(activity.code, value as ActivityType)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lumpsum">Lumpsum</SelectItem>
                          <SelectItem value="PerLeerling">Per Leerling</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {/* Lumpsum column */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-muted-foreground",
                          !isLumpsum && "opacity-50"
                        )}>€</span>
                        {isLumpsum ? (
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={activity.bedrag}
                            onChange={(e) =>
                              handleBedragChange(activity.code, e.target.value)
                            }
                            className="w-24 text-right font-mono"
                          />
                        ) : (
                          <div className="w-24 h-9 px-3 py-1 text-right font-mono text-muted-foreground bg-muted rounded-md flex items-center justify-end">
                            {lumpsumValue.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* Per Leerling column */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-muted-foreground",
                          isLumpsum && "opacity-50"
                        )}>€</span>
                        {!isLumpsum ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={activity.bedrag}
                            onChange={(e) =>
                              handleBedragChange(activity.code, e.target.value)
                            }
                            className="w-24 text-right font-mono"
                          />
                        ) : (
                          <div className="w-24 h-9 px-3 py-1 text-right font-mono text-muted-foreground bg-muted rounded-md flex items-center justify-end">
                            {perLeerlingValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* Aantal column - student count based on selected Groepen */}
                    <TableCell>
                      <div className="w-20 h-9 px-3 py-1 text-right font-mono text-muted-foreground bg-muted rounded-md flex items-center justify-end">
                        {getActivityStudentCount(activity)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {STUDENT_GROEPEN.map((groep) => (
                          <label
                            key={groep}
                            className="flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Checkbox
                              checked={activity.groepen.includes(groep)}
                              onCheckedChange={(checked) =>
                                handleGroepenChange(
                                  activity.code,
                                  groep,
                                  checked === true
                                )
                              }
                            />
                            <span className="whitespace-nowrap">
                              {groep.replace('Groep ', 'G')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Totale Kosten</p>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(totalLumpsum)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Aantal Activiteiten</p>
            <p className="text-2xl font-bold font-mono">
              {scenario.activiteiten.length}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Per Leerling Items</p>
            <p className="text-2xl font-bold font-mono">
              {scenario.activiteiten.filter((a) => a.type === 'PerLeerling').length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

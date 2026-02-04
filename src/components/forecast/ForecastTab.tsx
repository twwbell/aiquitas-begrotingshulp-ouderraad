import { useScenario } from '@/hooks/useScenario';
import { useForecast } from '@/hooks/useForecast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/currency';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { AlertTriangle, TrendingDown, Target, Calculator } from 'lucide-react';

export function ForecastTab() {
  const { scenario } = useScenario();
  const forecast = useForecast(scenario);

  if (!scenario || !forecast) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Geen data beschikbaar</p>
      </div>
    );
  }

  const { jaren, reserveOpraakJaar, minimaalBenodrigdeBijdrage, kostenPerLeerlingPerGroep } = forecast;

  const chartData = jaren.map((jaar) => ({
    name: jaar.schooljaar.split('/')[0],
    reserve: Math.round(jaar.reserve),
    inkomsten: Math.round(jaar.inkomsten),
    uitgaven: Math.round(jaar.uitgaven),
  }));

  const gradeChartData = kostenPerLeerlingPerGroep.map((item) => ({
    name: item.groep.replace('Groep ', 'G'),
    kosten: Math.round(item.kosten),
  }));

  const currentYearDeficit = jaren[0] ? jaren[0].inkomsten - jaren[0].uitgaven : 0;
  const hasNegativeReserve = jaren.some((j) => j.reserve < 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cn(reserveOpraakJaar ? 'border-destructive' : 'border-success')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserve raakt op</CardTitle>
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                reserveOpraakJaar ? 'text-destructive' : 'text-success'
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reserveOpraakJaar ? `Jaar ${reserveOpraakJaar}` : 'Niet binnen forecast'}
            </div>
            <p className="text-xs text-muted-foreground">
              {reserveOpraakJaar
                ? 'Actie vereist om tekort te voorkomen'
                : `Reserve blijft positief tot ${jaren[jaren.length - 1]?.schooljaar}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minimale Bijdrage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(minimaalBenodrigdeBijdrage)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per kind om reserve positief te houden
            </p>
          </CardContent>
        </Card>

        <Card className={cn(currentYearDeficit < 0 ? 'border-warning' : 'border-success')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Huidig Saldo</CardTitle>
            {currentYearDeficit < 0 ? (
              <TrendingDown className="h-4 w-4 text-warning" />
            ) : (
              <Calculator className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold font-mono',
                currentYearDeficit < 0 ? 'text-warning' : 'text-success'
              )}
            >
              {formatCurrency(currentYearDeficit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentYearDeficit < 0 ? 'Tekort' : 'Overschot'} per jaar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Verloop</CardTitle>
          <CardDescription>
            Prognose van de reserve over de komende jaren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Schooljaar ${label}`}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                <ReferenceLine y={10000} stroke="#f97316" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="reserve"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Reserve"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#2563eb]"></div>
              <span>Reserve</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-[#ef4444]" style={{ borderStyle: 'dashed' }}></div>
              <span>Nulpunt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-[#f97316]" style={{ borderStyle: 'dashed' }}></div>
              <span>€10.000 grens</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Jaarlijks Overzicht</CardTitle>
          <CardDescription>
            Gedetailleerde inkomsten en uitgaven per schooljaar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schooljaar</TableHead>
                  <TableHead className="text-right">Leerlingen</TableHead>
                  <TableHead className="text-right">Inkomsten</TableHead>
                  <TableHead className="text-right">Uitgaven</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Reserve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jaren.map((jaar, index) => (
                  <TableRow key={jaar.jaar}>
                    <TableCell className="font-medium">
                      {jaar.schooljaar}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (huidig)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(jaar.totaalLeerlingen)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-success">
                      {formatCurrency(jaar.inkomsten)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(jaar.uitgaven)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono',
                        jaar.saldo < 0 ? 'text-destructive' : 'text-success'
                      )}
                    >
                      {formatCurrency(jaar.saldo)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-bold',
                        jaar.reserve < 0
                          ? 'text-destructive'
                          : jaar.reserve < 10000
                          ? 'text-warning'
                          : 'text-success'
                      )}
                    >
                      {formatCurrency(jaar.reserve)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cost per Grade */}
      <Card>
        <CardHeader>
          <CardTitle>Kosten per Leerling per Groep</CardTitle>
          <CardDescription>
            Visualisatie van de kostenverhouding tussen groepen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `€${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Kosten per leerling']}
                />
                <Bar dataKey="kosten" radius={[4, 4, 0, 0]}>
                  {gradeChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.kosten > 100 ? '#ef4444' : entry.kosten > 60 ? '#f97316' : '#22c55e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Hogere kosten per leerling in groep 8 door kamp en afscheidsactiviteiten
          </p>
        </CardContent>
      </Card>

      {hasNegativeReserve && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-destructive">
                  Waarschuwing: Negatieve Reserve
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Met de huidige instellingen zal de reserve negatief worden in{' '}
                  {reserveOpraakJaar}. Overweeg om de ouderbijdrage te verhogen
                  naar minimaal {formatCurrency(minimaalBenodrigdeBijdrage)} of
                  de uitgaven te verlagen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useScenario } from '@/hooks/useScenario';
import { useForecast } from '@/hooks/useForecast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/currency';
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
} from 'recharts';
import { Printer } from 'lucide-react';

export function RapportTab() {
  const { scenario } = useScenario();
  const forecast = useForecast(scenario);

  if (!scenario || !forecast) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Geen data beschikbaar</p>
      </div>
    );
  }

  const { jaren, reserveOpraakJaar, minimaalBenodrigdeBijdrage } = forecast;
  const { instellingen, activiteiten, leerlingaantallen } = scenario;

  const chartData = jaren.map((jaar) => ({
    name: jaar.schooljaar.split('/')[0],
    reserve: Math.round(jaar.reserve),
  }));

  const totalStudents = leerlingaantallen.reduce((sum, sc) => sum + sc.aantal, 0);
  const currentYearForecast = jaren[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end no-print">
        <Button onClick={handlePrint} size="lg">
          <Printer className="h-4 w-4 mr-2" />
          Print / Download PDF
        </Button>
      </div>

      {/* Printable Report */}
      <div className="print:block">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print-avoid-break">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
              AI
            </div>
            <div>
              <h1 className="text-2xl font-bold">AIquitas Begrotingshulp</h1>
              <p className="text-muted-foreground">Financiële Prognose Ouderraad</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{scenario.naam}</p>
            <p className="text-sm text-muted-foreground">
              Schooljaar {scenario.schooljaar}
            </p>
          </div>
        </div>

        {/* Settings Summary */}
        <Card className="print-avoid-break">
          <CardHeader>
            <CardTitle>Scenario Instellingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ouderbijdrage</p>
                <p className="text-lg font-semibold font-mono">
                  {formatCurrency(instellingen.ouderbijdrage)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Betalingspercentage</p>
                <p className="text-lg font-semibold font-mono">
                  {formatPercentage(instellingen.betalingspercentage)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kostenstijging</p>
                <p className="text-lg font-semibold font-mono">
                  {formatPercentage(instellingen.kostenstijging, 1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Reserve</p>
                <p className="text-lg font-semibold font-mono">
                  {formatCurrency(instellingen.startReserve)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totaal Leerlingen</p>
                <p className="text-lg font-semibold font-mono">
                  {formatNumber(totalStudents)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forecast Periode</p>
                <p className="text-lg font-semibold font-mono">
                  {instellingen.jarenVooruit} jaar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 my-6 print-avoid-break">
          <Card className={cn(reserveOpraakJaar ? 'border-destructive' : 'border-success')}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Reserve raakt op</p>
              <p className="text-2xl font-bold">
                {reserveOpraakJaar ? `${reserveOpraakJaar}` : 'N.v.t.'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Minimale Bijdrage</p>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(minimaalBenodrigdeBijdrage)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Huidig Jaarsaldo</p>
              <p
                className={cn(
                  'text-2xl font-bold font-mono',
                  currentYearForecast && currentYearForecast.saldo < 0
                    ? 'text-destructive'
                    : 'text-success'
                )}
              >
                {currentYearForecast
                  ? formatCurrency(currentYearForecast.saldo)
                  : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reserve Chart */}
        <Card className="print-avoid-break">
          <CardHeader>
            <CardTitle>Reserve Verloop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Reserve']}
                  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                  <Line
                    type="monotone"
                    dataKey="reserve"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Breakdown */}
        <Card className="my-6 print-break-before print-avoid-break">
          <CardHeader>
            <CardTitle>Jaarlijks Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
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
                {jaren.map((jaar) => (
                  <TableRow key={jaar.jaar}>
                    <TableCell className="font-medium">{jaar.schooljaar}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(jaar.totaalLeerlingen)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(jaar.inkomsten)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(jaar.uitgaven)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono',
                        jaar.saldo < 0 ? 'text-destructive' : ''
                      )}
                    >
                      {formatCurrency(jaar.saldo)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-semibold',
                        jaar.reserve < 0 ? 'text-destructive' : ''
                      )}
                    >
                      {formatCurrency(jaar.reserve)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity Costs */}
        <Card className="print-avoid-break">
          <CardHeader>
            <CardTitle>Kosten per Activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Activiteit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activiteiten.map((activity) => (
                  <TableRow key={activity.code}>
                    <TableCell className="font-mono text-muted-foreground">
                      {activity.code}
                    </TableCell>
                    <TableCell>{activity.naam}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.type === 'Lumpsum' ? 'Vast' : 'Per leerling'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(activity.bedrag)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground print-avoid-break">
          <p>
            Gegenereerd op {new Date().toLocaleDateString('nl-NL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="mt-1">AIquitas Begrotingshulp Ouderraad</p>
        </div>
      </div>
    </div>
  );
}

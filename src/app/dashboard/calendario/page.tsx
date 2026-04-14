import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function CalendarioPage() {
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Calendario</h1><p className="text-muted-foreground mt-1">Próximamente — FullCalendar con drag & drop</p></div><Card><CardContent className="pt-6"><div className="rounded-lg bg-muted/50 p-12 text-center text-muted-foreground">📅 Calendario en desarrollo</div></CardContent></Card></div>;
}

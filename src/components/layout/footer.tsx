import { Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card py-3 px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tablero de Control. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Hecho con</span>
          <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          <span>por</span>
          <a
            href="https://tecnofusion-it.web.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
          >
            TecnoFusión.it
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}

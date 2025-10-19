import { Layers } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Layers className="w-8 h-8 text-primary absolute opacity-60" style={{ transform: "translate(-2px, -2px)" }} />
        <Layers className="w-8 h-8 text-accent absolute opacity-40" style={{ transform: "translate(0px, 0px)" }} />
        <Layers className="w-8 h-8 text-foreground opacity-90" style={{ transform: "translate(2px, 2px)" }} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Katmannames
        </span>
      </h1>
    </div>
  );
}

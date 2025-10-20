export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Katmannames Logo" 
        className="w-10 h-10 md:w-12 md:h-12 object-contain"
      />
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Katmannames
        </span>
      </h1>
    </div>
  );
}

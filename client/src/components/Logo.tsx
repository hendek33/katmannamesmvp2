export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Katmannames Logo" 
        className="w-24 h-24 md:w-32 md:h-32 object-contain"
      />
    </div>
  );
}

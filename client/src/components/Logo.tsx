export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Katmannames Logo" 
        className="w-10 h-10 md:w-12 md:h-12 object-contain"
      />
    </div>
  );
}

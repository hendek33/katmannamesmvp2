export function Logo({ className = "", size = "normal" }: { className?: string; size?: "normal" | "large" }) {
  const sizeClasses = size === "large" 
    ? "w-40 h-40 md:w-56 md:h-56" 
    : "w-32 h-32 md:w-40 md:h-40";
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Katmannames Logo" 
        className={`${sizeClasses} object-contain`}
      />
    </div>
  );
}

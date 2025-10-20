export function Logo({ className = "", size = "normal" }: { className?: string; size?: "normal" | "large" }) {
  const sizeClasses = size === "large" 
    ? "w-32 h-32 md:w-48 md:h-48" 
    : "w-24 h-24 md:w-32 md:h-32";
  
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

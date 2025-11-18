import { useState, useEffect } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { simpleSoundService as audioService } from "@/services/SimpleSoundService";
import { cn } from "@/lib/utils";

export function SoundControls({ className }: { className?: string }) {
  const [isEnabled, setIsEnabled] = useState(audioService.isEnabledState());
  const [volume, setVolume] = useState(audioService.getVolume());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize audio service when component mounts
    audioService.initialize().catch(console.error);
  }, []);

  const handleToggle = async () => {
    audioService.toggle();
    setIsEnabled(audioService.isEnabledState());
    // Play a click sound when enabling
    if (!isEnabled) {
      await audioService.playClick();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    audioService.setVolume(newVolume);
    setVolume(newVolume);
  };

  const getVolumeIcon = () => {
    if (!isEnabled || volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 0.5) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            !isEnabled && "text-muted-foreground",
            className
          )}
          data-testid="button-sound-control"
        >
          {getVolumeIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ses Efektleri</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              className={cn(
                "w-16",
                isEnabled ? "bg-green-500/10 hover:bg-green-500/20" : ""
              )}
              data-testid="button-toggle-sound"
            >
              {isEnabled ? "Açık" : "Kapalı"}
            </Button>
          </div>
          
          {isEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ses Seviyesi</span>
                <span className="text-sm font-medium">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
                data-testid="slider-volume"
              />
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Sentetik ses efektleri kullanılmaktadır
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
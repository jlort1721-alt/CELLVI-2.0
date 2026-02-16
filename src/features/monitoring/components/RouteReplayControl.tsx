import { memo, useEffect, useRef } from 'react';
import { Play, Pause, Square, FastForward, SkipBack, Clock } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

const speedOptions = [1, 2, 4, 8];

const RouteReplayControl = memo(() => {
  const { routeReplay, advanceReplay, toggleReplayPlay, stopRouteReplay, setReplaySpeed, setReplayIndex } = useMapStore();
  const frameRef = useRef<number>();
  const lastTimeRef = useRef(0);

  // Animation loop
  useEffect(() => {
    if (!routeReplay?.isPlaying) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const interval = 1000 / routeReplay.speed;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimeRef.current >= interval) {
        advanceReplay();
        lastTimeRef.current = timestamp;
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [routeReplay?.isPlaying, routeReplay?.speed, advanceReplay]);

  if (!routeReplay) return null;

  const { currentIndex, routePoints, isPlaying, speed, vehiclePlate } = routeReplay;
  const total = routePoints.length;
  const progress = total > 0 ? (currentIndex / (total - 1)) * 100 : 0;
  const currentPoint = routePoints[currentIndex];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-sidebar/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl text-white px-5 py-3 min-w-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Replay</span>
          <span className="text-[10px] text-slate-400 font-mono">{vehiclePlate}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
          <Clock className="w-3 h-3" />
          {currentPoint?.timestamp ? new Date(currentPoint.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1.5 bg-slate-800 rounded-full mb-3 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          setReplayIndex(Math.floor(pct * (total - 1)));
        }}
      >
        <div
          className="absolute h-full bg-gold rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full shadow-lg border-2 border-white/20 transition-all duration-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => setReplayIndex(0)} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Al inicio">
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleReplayPlay}
            className="p-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={stopRouteReplay} className="p-1.5 rounded-lg hover:bg-slate-800 text-red-400 transition-colors" title="Detener">
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          <FastForward className="w-3 h-3 text-slate-500" />
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => setReplaySpeed(s)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                speed === s ? 'bg-gold/20 text-gold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono">
          <span>{currentPoint?.speed ? `${Math.round(currentPoint.speed)} km/h` : '0 km/h'}</span>
          <span>{currentIndex + 1}/{total}</span>
        </div>
      </div>
    </div>
  );
});
RouteReplayControl.displayName = 'RouteReplayControl';

export default RouteReplayControl;

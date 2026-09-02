import React, { useRef, useState, useEffect, useCallback } from 'react';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  className?: string;
  size?: number;
}

export const Joystick: React.FC<JoystickProps> = ({
  onMove,
  className = '',
  size = 130,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxDistance = size / 2 - 18;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) {
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        return;
      }

      const clampedDist = Math.min(dist, maxDistance);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      onMove({
        x: kx / maxDistance,
        y: ky / maxDistance,
      });
    },
    [maxDistance, onMove]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setActive(true);
      handlePointer(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        handlePointer(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setActive(true);
    handlePointer(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handlePointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Keyboard D-pad backup when clicking buttons
  const applyDirection = (dirX: number, dirY: number) => {
    onMove({ x: dirX, y: dirY });
    setKnobPos({ x: dirX * maxDistance * 0.7, y: dirY * maxDistance * 0.7 });
  };

  const releaseDirection = () => {
    onMove({ x: 0, y: 0 });
    setKnobPos({ x: 0, y: 0 });
  };

  return (
    <div
      id="movement-joystick-wrapper"
      className={`flex flex-col items-center select-none touch-none ${className}`}
    >
      {/* Dark blue container per instruction */}
      <div
        ref={containerRef}
        id="movement-joystick-base"
        className="relative rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-transform active:scale-95"
        style={{
          width: size,
          height: size,
          background: 'radial-gradient(circle, #1e3a8a 0%, #0f172a 80%, #020617 100%)',
          border: '3px solid #3b82f6',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(30, 58, 138, 0.8)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Subtle crosshair guides inside joystick */}
        <div className="absolute w-[80%] h-[2px] bg-blue-500/20 pointer-events-none" />
        <div className="absolute h-[80%] w-[2px] bg-blue-500/20 pointer-events-none" />

        {/* Joystick Stick / Knob */}
        <div
          id="movement-joystick-knob"
          className="rounded-full shadow-lg pointer-events-none transition-transform duration-75 flex items-center justify-center"
          style={{
            width: size * 0.42,
            height: size * 0.42,
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            background: active
              ? 'radial-gradient(circle, #60a5fa 0%, #2563eb 80%)'
              : 'radial-gradient(circle, #3b82f6 0%, #1d4ed8 80%)',
            border: '3px solid #93c5fd',
            boxShadow: active
              ? '0 0 15px #60a5fa, inset 0 2px 4px rgba(255,255,255,0.4)'
              : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          }}
        >
          <div className="w-3 h-3 rounded-full bg-blue-100/60" />
        </div>
      </div>

      <div className="text-[11px] game-font text-blue-300 mt-1 uppercase tracking-wider text-center drop-shadow">
        תנועה ג'ויסטיק • MOVE
      </div>
    </div>
  );
};

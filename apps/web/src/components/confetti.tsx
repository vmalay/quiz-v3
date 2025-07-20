'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  intensity?: number;
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export function Confetti({ active, duration = 3000, intensity = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsVisible(false);
      setPieces([]);
      return;
    }

    setIsVisible(true);

    // Create initial confetti pieces
    const initialPieces: ConfettiPiece[] = Array.from({ length: intensity }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 4,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2,
        rotation: (Math.random() - 0.5) * 8,
      },
    }));

    setPieces(initialPieces);

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      setPieces(currentPieces => 
        currentPieces
          .map(piece => ({
            ...piece,
            x: piece.x + piece.velocity.x,
            y: piece.y + piece.velocity.y,
            rotation: piece.rotation + piece.velocity.rotation,
            velocity: {
              ...piece.velocity,
              y: piece.velocity.y + 0.1, // gravity
            },
          }))
          .filter(piece => piece.y < window.innerHeight + 10)
      );
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    // Clean up after duration
    const cleanup = setTimeout(() => {
      setIsVisible(false);
      setPieces([]);
    }, duration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(cleanup);
    };
  }, [active, duration, intensity]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}
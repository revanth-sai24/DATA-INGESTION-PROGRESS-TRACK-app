"use client";
import React, { useEffect, useState, useCallback } from "react";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

const createConfettiPiece = (id) => ({
  id,
  x: Math.random() * 100,
  y: -10,
  rotation: Math.random() * 360,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  size: Math.random() * 10 + 5,
  speedX: (Math.random() - 0.5) * 3,
  speedY: Math.random() * 3 + 2,
  rotationSpeed: (Math.random() - 0.5) * 10,
  shape: Math.random() > 0.5 ? "square" : "circle",
});

export default function Confetti({ trigger, duration = 3000 }) {
  const [pieces, setPieces] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const startConfetti = useCallback(() => {
    setIsActive(true);
    const newPieces = Array.from({ length: 100 }, (_, i) =>
      createConfettiPiece(i),
    );
    setPieces(newPieces);

    // Animate pieces
    const animate = () => {
      setPieces((prev) =>
        prev
          .map((piece) => ({
            ...piece,
            x: piece.x + piece.speedX,
            y: piece.y + piece.speedY,
            rotation: piece.rotation + piece.rotationSpeed,
            speedY: piece.speedY + 0.1, // Gravity
          }))
          .filter((piece) => piece.y < 110),
      ); // Remove pieces that fall off screen
    };

    const interval = setInterval(animate, 16);

    setTimeout(() => {
      clearInterval(interval);
      setIsActive(false);
      setPieces([]);
    }, duration);

    return () => clearInterval(interval);
  }, [duration]);

  useEffect(() => {
    if (trigger) {
      startConfetti();
    }
  }, [trigger, startConfetti]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : "2px",
            transform: `rotate(${piece.rotation}deg)`,
            transition: "none",
          }}
        />
      ))}
    </div>
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [trigger, setTrigger] = useState(0);

  const fireConfetti = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  return { trigger, fireConfetti };
}

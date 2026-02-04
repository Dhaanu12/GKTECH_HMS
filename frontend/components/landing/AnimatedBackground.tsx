'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Orb objects
        const orbs: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];
        const colors = [
            'rgba(59, 130, 246, 0.4)', // Blue-500
            'rgba(99, 102, 241, 0.4)', // Indigo-500
            'rgba(139, 92, 246, 0.4)', // Violet-500
            'rgba(14, 165, 233, 0.3)', // Sky-500
        ];

        // Initialize orbs
        const initOrbs = () => {
            orbs.length = 0;
            const numOrbs = 6;
            for (let i = 0; i < numOrbs; i++) {
                orbs.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * 200 + 300, // Large radius
                    dx: (Math.random() - 0.5) * 0.5,
                    dy: (Math.random() - 0.5) * 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };

        initOrbs();

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw orbs
            orbs.forEach(orb => {
                orb.x += orb.dx;
                orb.y += orb.dy;

                // Bounce off edges with buffer
                if (orb.x < -orb.r || orb.x > width + orb.r) orb.dx *= -1;
                if (orb.y < -orb.r || orb.y > height + orb.r) orb.dy *= -1;

                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Glass overlay effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(0, 0, width, height);

            requestAnimationFrame(animate);
        };

        const animId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initOrbs();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ filter: 'blur(80px)' }} // Heavy CSS blur for that mesh gradient look
        />
    );
}

import { useEffect, useRef } from 'react';
import { useStellarStore } from '../hooks/useStellar';

export default function CanvasFluidBackground() {
  const canvasRef = useRef(null);
  const theme = useStellarStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha channel on canvas itself
    let animationFrameId;
    
    let particles = [];
    const numParticles = window.innerWidth > 768 ? 1200 : 400; // Scale for mobile
    
    let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let lastMouse = { x: -1000, y: -1000 };
    let zoff = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 2 + 1;
        this.maxSpeed = Math.random() * 1.5 + 0.5;
        this.friction = 0.95;
      }

      update(_isDark) {
        // Pseudo-noise flow field calculation based on position and time
        const scale = 0.003;
        const angle = Math.sin(this.x * scale + zoff) * Math.cos(this.y * scale + zoff) * Math.PI * 2;
        
        // Add flow field force
        this.vx += Math.cos(angle) * 0.1;
        this.vy += Math.sin(angle) * 0.1;

        // Mouse interaction (Fluid displacement)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 250) {
          let force = (250 - distance) / 250;
          this.vx += (mouse.vx * force * 0.1) - (dx / distance) * force * 0.5;
          this.vy += (mouse.vy * force * 0.1) - (dy / distance) * force * 0.5;
        }

        // Apply friction & speed limit
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
          this.vx = (this.vx / speed) * this.maxSpeed;
          this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw(ctx, isDark) {
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      const isDark = theme === 'dark';
      
      // Liquid smoke trailing effect
      ctx.fillStyle = isDark ? 'rgba(10, 10, 10, 0.1)' : 'rgba(247, 247, 247, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      zoff += 0.001; // Evolve the flow field over time

      // Calculate mouse velocity for swipe interactions
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(isDark);
        particles[i].draw(ctx, isDark);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    // Fill background solid first to prevent black flash
    ctx.fillStyle = theme === 'dark' ? '#0a0a0a' : '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80 mix-blend-screen dark:mix-blend-lighten"
        style={{ filter: 'blur(1px)' }}
      />
      {/* Subtle vignette / depth overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.2)_100%)] dark:bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}

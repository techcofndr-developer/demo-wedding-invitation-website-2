import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const initWeddingApp = () => {
    
    // ==========================================================================
    // 1. REGISTRATION & INITIAL SYSTEM SETUP
    // ==========================================================================
    gsap.registerPlugin(ScrollTrigger);

    // Disable ScrollTrigger on mobile if too heavy, but here we optimize code to run 60FPS
    const isMobile = window.innerWidth < 768;

    // Custom Cursor Lerp variables
    const cursor = {
        dot: document.getElementById('cursor-dot'),
        circle: document.getElementById('cursor-circle'),
        container: document.getElementById('custom-cursor'),
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        hovered: false
    };

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
        cursor.targetX = e.clientX;
        cursor.targetY = e.clientY;
    });

    // Custom cursor smooth interpolation (Lerp)
    function updateCursor() {
        const lerpDot = 0.3;
        const lerpCircle = 0.08;

        // Current positions
        let curDotX = parseFloat(cursor.dot.style.left) || cursor.x;
        let curDotY = parseFloat(cursor.dot.style.top) || cursor.y;
        let curCircleX = parseFloat(cursor.circle.style.left) || cursor.x;
        let curCircleY = parseFloat(cursor.circle.style.top) || cursor.y;

        // Interpolate
        let nextDotX = curDotX + (cursor.targetX - curDotX) * lerpDot;
        let nextDotY = curDotY + (cursor.targetY - curDotY) * lerpDot;
        let nextCircleX = curCircleX + (cursor.targetX - curCircleX) * lerpCircle;
        let nextCircleY = curCircleY + (cursor.targetY - curCircleY) * lerpCircle;

        cursor.dot.style.left = `${nextDotX}px`;
        cursor.dot.style.top = `${nextDotY}px`;
        cursor.circle.style.left = `${nextCircleX}px`;
        cursor.circle.style.top = `${nextCircleY}px`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Attach hover effects to interactive elements
    function setupCursorHovers() {
        const hoverables = document.querySelectorAll('a, button, select, input, textarea, .radio-label, #scratch-canvas');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.container.classList.add('hovering');
                soundEngine.playTone(440, 'sine', 0.05, 0.02); // Soft hover click sound
            });
            el.addEventListener('mouseleave', () => {
                cursor.container.classList.remove('hovering');
            });
        });
        
        // Add dark content detectors
        const darkSections = document.querySelectorAll('.dark-section');
        darkSections.forEach(sec => {
            sec.addEventListener('mouseenter', () => {
                cursor.dot.style.backgroundColor = '#C8A97E';
                cursor.circle.style.borderColor = 'rgba(248, 244, 239, 0.5)';
            });
            sec.addEventListener('mouseleave', () => {
                cursor.dot.style.backgroundColor = '';
                cursor.circle.style.borderColor = '';
            });
        });
    }
    setupCursorHovers();

    // ==========================================================================
    // 2. PROCEDURAL SOUND SYNTHESIS ENGINE (WEB AUDIO API)
    // ==========================================================================
    class WeddingSoundEngine {
        constructor() {
            this.ctx = null;
            this.ambientOsc1 = null;
            this.ambientOsc2 = null;
            this.ambientFilter = null;
            this.ambientGain = null;
            this.isPlaying = false;
        }

        init() {
            if (this.ctx) return;
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }

        // Play brief synthesized bell tone for clicks/reveals
        playTone(freq = 440, type = 'sine', duration = 0.5, volume = 0.1, delay = 0) {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            setTimeout(() => {
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    
                    // Simple envelope
                    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch (e) {
                    console.log('Audio error:', e);
                }
            }, delay * 1000);
        }

        // Play a majestic ascending chime sequence on success
        playSuccessChime() {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
            notes.forEach((freq, index) => {
                this.playTone(freq, 'triangle', 0.8, 0.08, index * 0.12);
            });
        }

        // Start ambient background drones (Cinematic golden warm pads)
        startAmbientMusic() {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            if (this.isPlaying) return;

            try {
                this.ambientGain = this.ctx.createGain();
                this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
                // Soft fade-in of background music
                this.ambientGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 3);

                this.ambientFilter = this.ctx.createBiquadFilter();
                this.ambientFilter.type = 'lowpass';
                this.ambientFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

                // Oscillator 1: Fundamental chord (C3)
                this.ambientOsc1 = this.ctx.createOscillator();
                this.ambientOsc1.type = 'sawtooth';
                this.ambientOsc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3

                // Oscillator 2: Slightly detuned fifth (G3)
                this.ambientOsc2 = this.ctx.createOscillator();
                this.ambientOsc2.type = 'sawtooth';
                this.ambientOsc2.frequency.setValueAtTime(196.20 + 0.5, this.ctx.currentTime); // detuned G3

                // Connect nodes
                this.ambientOsc1.connect(this.ambientFilter);
                this.ambientOsc2.connect(this.ambientFilter);
                this.ambientFilter.connect(this.ambientGain);
                this.ambientGain.connect(this.ctx.destination);

                // Start oscillators
                this.ambientOsc1.start();
                this.ambientOsc2.start();
                this.isPlaying = true;
                
                // Slow LFO swelling filter frequency to simulate breathing/orchestral swell
                this.swellInterval = setInterval(() => {
                    if (this.ctx && this.ambientFilter) {
                        const targetFreq = 400 + Math.sin(Date.now() / 3000) * 150;
                        this.ambientFilter.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 1.5);
                    }
                }, 1500);

            } catch (e) {
                console.log('Failed to start ambient music:', e);
            }
        }

        // Stop background ambient music
        stopAmbientMusic() {
            if (!this.isPlaying) return;
            try {
                if (this.ambientGain) {
                    this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
                    setTimeout(() => {
                        if (this.ambientOsc1) this.ambientOsc1.stop();
                        if (this.ambientOsc2) this.ambientOsc2.stop();
                        clearInterval(this.swellInterval);
                        this.isPlaying = false;
                    }, 1000);
                }
            } catch (e) {
                console.log('Error stopping audio:', e);
            }
        }
    }

    const soundEngine = new WeddingSoundEngine();

    // Music Toggle Button
    const musicBtn = document.getElementById('music-toggle');
    const muteIcon = document.getElementById('mute-icon');
    const soundIcon = document.getElementById('sound-icon');
    const musicText = musicBtn.querySelector('.music-text');

    musicBtn.addEventListener('click', () => {
        if (soundEngine.isPlaying) {
            soundEngine.stopAmbientMusic();
            muteIcon.style.display = 'inline-block';
            soundIcon.style.display = 'none';
            musicText.textContent = 'SOUND OFF';
        } else {
            soundEngine.startAmbientMusic();
            muteIcon.style.display = 'none';
            soundIcon.style.display = 'inline-block';
            musicText.textContent = 'SOUND ON';
        }
        soundEngine.playTone(523.25, 'sine', 0.2, 0.05); // feedback beep
    });

    // ==========================================================================
    // 3. LENIS SMOOTH SCROLLING INTEGRATION WITH GSAP
    // ==========================================================================
    const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // premium ease
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
    });

    // Bind lenis scroll event to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Sync GSAP ticker with Lenis raf
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Lock scroll initially (for preloader)
    lenis.stop();

    // ==========================================================================
    // 4. GLOBAL CANVAS: AMBIENT VOLUMETRIC FOG & FLOATING PETALS
    // ==========================================================================
    const ambientCanvas = document.getElementById('ambient-canvas');
    const ambientCtx = ambientCanvas.getContext('2d');
    
    let canvasW = ambientCanvas.width = window.innerWidth;
    let canvasH = ambientCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvasW = ambientCanvas.width = window.innerWidth;
        canvasH = ambientCanvas.height = window.innerHeight;
    });

    // Petal Class
    class Petal {
        constructor() {
            this.reset();
            this.y = Math.random() * canvasH; // randomize starting height on load
        }

        reset() {
            this.x = Math.random() * canvasW;
            this.y = -20;
            this.size = Math.random() * 8 + 6;
            this.speedY = Math.random() * 0.8 + 0.4;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
            this.opacity = Math.random() * 0.4 + 0.3;
            // Shading color (luxury burgundy/rose shades)
            const colors = ['#5E1725', '#7D2235', '#A63A50', '#C8A97E'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            // Accelerate petals slightly during scroll
            const scrollBonus = Math.abs(lenis.velocity) * 0.15;
            this.y += this.speedY + scrollBonus;
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;
            this.rotation += this.rotationSpeed;

            if (this.y > canvasH + 20 || this.x < -20 || this.x > canvasW + 20) {
                this.reset();
            }
        }

        draw() {
            ambientCtx.save();
            ambientCtx.translate(this.x, this.y);
            ambientCtx.rotate(this.rotation);
            ambientCtx.globalAlpha = this.opacity;
            ambientCtx.fillStyle = this.color;
            
            // Draw stylized almond-shaped organic petal
            ambientCtx.beginPath();
            ambientCtx.moveTo(0, -this.size);
            ambientCtx.quadraticCurveTo(this.size * 0.6, -this.size * 0.3, 0, this.size);
            ambientCtx.quadraticCurveTo(-this.size * 0.6, -this.size * 0.3, 0, -this.size);
            ambientCtx.closePath();
            ambientCtx.fill();
            
            // Highlight shimmer
            ambientCtx.fillStyle = 'rgba(255,255,255,0.2)';
            ambientCtx.beginPath();
            ambientCtx.moveTo(0, -this.size);
            ambientCtx.quadraticCurveTo(this.size * 0.3, -this.size * 0.3, 0, this.size);
            ambientCtx.closePath();
            ambientCtx.fill();
            
            ambientCtx.restore();
        }
    }

    // Gold Dust Trails following Cursor
    class GoldDust {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5 - 0.5; // drift upward
            this.size = Math.random() * 2 + 1;
            this.life = 1.0;
            this.decay = Math.random() * 0.015 + 0.01;
            this.color = '#C8A97E';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }

        draw() {
            ambientCtx.save();
            ambientCtx.globalAlpha = this.life * 0.6;
            ambientCtx.fillStyle = this.color;
            ambientCtx.shadowBlur = 6;
            ambientCtx.shadowColor = this.color;
            ambientCtx.beginPath();
            ambientCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ambientCtx.fill();
            ambientCtx.restore();
        }
    }

    // Fog Layer class
    class FogCluster {
        constructor() {
            this.x = Math.random() * canvasW;
            this.y = canvasH + Math.random() * 100;
            this.size = Math.random() * 150 + 200;
            this.speed = Math.random() * 0.15 + 0.05;
            this.opacity = Math.random() * 0.05 + 0.02;
            this.color = '#EFE6DB'; // Champagne beige
        }

        update() {
            this.x += this.speed;
            if (this.x > canvasW + this.size) {
                this.x = -this.size;
            }
        }

        draw() {
            ambientCtx.save();
            ambientCtx.globalAlpha = this.opacity;
            const grad = ambientCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            grad.addColorStop(0, this.color);
            grad.addColorStop(1, 'transparent');
            ambientCtx.fillStyle = grad;
            ambientCtx.beginPath();
            ambientCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ambientCtx.fill();
            ambientCtx.restore();
        }
    }

    const petals = Array.from({ length: isMobile ? 12 : 30 }, () => new Petal());
    const fogClusters = Array.from({ length: 4 }, () => new FogCluster());
    const goldParticles = [];

    // Track mouse speed for gold particle counts
    let lastX = 0, lastY = 0;
    
    function animateAmbientCanvas() {
        ambientCtx.clearRect(0, 0, canvasW, canvasH);

        // Draw fog (background-most layer)
        fogClusters.forEach(f => {
            f.update();
            f.draw();
        });

        // Generate gold dust behind cursor when moving
        const dx = cursor.targetX - lastX;
        const dy = cursor.targetY - lastY;
        const speed = Math.sqrt(dx*dx + dy*dy);
        if (speed > 1.5 && goldParticles.length < 150) {
            // Add a gold dust particle
            goldParticles.push(new GoldDust(cursor.targetX, cursor.targetY));
            if (speed > 10) {
                goldParticles.push(new GoldDust(cursor.targetX + (Math.random()-0.5)*15, cursor.targetY + (Math.random()-0.5)*15));
            }
        }
        lastX = cursor.targetX;
        lastY = cursor.targetY;

        // Draw gold dust
        for (let i = goldParticles.length - 1; i >= 0; i--) {
            goldParticles[i].update();
            if (goldParticles[i].life <= 0) {
                goldParticles.splice(i, 1);
            } else {
                goldParticles[i].draw();
            }
        }

        // Draw petals (foreground-most layer)
        petals.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateAmbientCanvas);
    }
    animateAmbientCanvas();


    // ==========================================================================
    // 5. CINEMATIC PRELOADER
    // ==========================================================================
    const preloader = document.getElementById('preloader');
    const progressBar = preloader.querySelector('.preloader-progress-bar');
    const progressPercent = preloader.querySelector('.preloader-percent');
    const enterBtn = document.getElementById('enter-experience-btn');
    const preloaderProgressWrapper = preloader.querySelector('.preloader-progress-wrapper');

    let loadedCount = 0;
    const assetsToLoad = document.querySelectorAll('img');
    const totalAssets = assetsToLoad.length;

    function updateLoadingProgress() {
        loadedCount++;
        let progress = totalAssets > 0 ? Math.floor((loadedCount / totalAssets) * 100) : 100;
        
        // Force clamp
        progress = Math.min(progress, 100);
        
        gsap.to(progressBar, { width: `${progress}%`, duration: 0.3 });
        progressPercent.textContent = `${progress.toString().padStart(2, '0')}%`;

        if (progress >= 100) {
            triggerPreloaderComplete();
        }
    }

    // Fallback timer for preloader
    let fallbackTimeout = setTimeout(() => {
        if (loadedCount < totalAssets) {
            loadedCount = totalAssets;
            triggerPreloaderComplete();
        }
    }, 4000);

    // Monitor actual image loads
    if (totalAssets === 0) {
        triggerPreloaderComplete();
    } else {
        assetsToLoad.forEach(img => {
            if (img.complete) {
                updateLoadingProgress();
            } else {
                img.addEventListener('load', updateLoadingProgress);
                img.addEventListener('error', updateLoadingProgress); // proceed anyway
            }
        });
    }

    function triggerPreloaderComplete() {
        clearTimeout(fallbackTimeout);
        
        // Hide loading progress bar and reveal Enter button
        gsap.to(preloaderProgressWrapper, { opacity: 0, y: -10, duration: 0.5, onComplete: () => {
            preloaderProgressWrapper.style.display = 'none';
            enterBtn.style.display = 'inline-block';
            enterBtn.classList.add('visible');
        }});
    }

    // Handle Preloader Exit
    enterBtn.addEventListener('click', () => {
        // Unlock scroll
        lenis.start();
        
        // Start Sound Engine
        soundEngine.startAmbientMusic();
        muteIcon.style.display = 'none';
        soundIcon.style.display = 'inline-block';
        musicText.textContent = 'SOUND ON';
        soundEngine.playSuccessChime();

        // GSAP Preloader Out timeline
        const exitTl = gsap.timeline({
            onComplete: () => {
                preloader.style.display = 'none';
                // Trigger Hero animations
                playHeroEntrance();
            }
        });

        exitTl.to(enterBtn, { scale: 0.9, opacity: 0, duration: 0.4 })
              .to(preloader.querySelector('.preloader-content'), { y: -50, opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.2')
              .to(preloader, { y: '-100%', duration: 1.2, ease: 'power4.inOut' }, '-=0.4');
    });


    // ==========================================================================
    // 6. HERO ENTRANCE & PARALLAX SCROLL SYSTEM
    // ==========================================================================
    function playHeroEntrance() {
        const heroTl = gsap.timeline({
            onComplete: () => {
                initHeroScroll();
            }
        });
        
        // Gentle scale down zoom of background
        gsap.to('.hero-bg-image', { scale: 1, duration: 6, ease: 'power2.out' });

        heroTl.to('.hero-pretitle', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
              .to('.first-name', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, '-=0.8')
              .to('.second-name', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, '-=1')
              .to('.name-ampersand', { opacity: 1, scale: 1, duration: 1.5, ease: 'elastic.out(1, 0.5)' }, '-=0.9')
              .to('.hero-details', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=1')
              .to('.hero-tagline', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8')
              .to('.hero-ctas', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8');
    }

    function initHeroScroll() {
        // Scroll parallax/zooms for Hero Elements
        const heroScrollTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });

        heroScrollTl.to('.hero-bg-image', { y: '25%', scale: 1.08, ease: 'none' })
                    .to('.first-name', { x: '-60px', y: '-40px', opacity: 0, ease: 'none' }, 0)
                    .to('.second-name', { x: '60px', y: '40px', opacity: 0, ease: 'none' }, 0)
                    .to('.name-ampersand', { scale: 0.4, opacity: 0, ease: 'none' }, 0)
                    .to('.hero-details', { y: '-10px', opacity: 0, ease: 'none' }, 0)
                    .to('.hero-tagline', { y: '30px', opacity: 0, ease: 'none' }, 0)
                    .to('.hero-ctas', { y: '50px', opacity: 0, ease: 'none' }, 0);
    }


    // ==========================================================================
    // 7. OPENING QUOTE SCROLL TRIGGER
    // ==========================================================================
    const quoteWords = document.querySelectorAll('.quote-word');
    const quoteAuthor = document.querySelector('.quote-author');

    // Create sequence character highlight
    ScrollTrigger.create({
        trigger: '#quote',
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
            quoteWords.forEach((word, idx) => {
                setTimeout(() => word.classList.add('active'), idx * 80);
            });
            setTimeout(() => quoteAuthor.classList.add('active'), quoteWords.length * 80 + 200);
        },
        onLeaveBack: () => {
            quoteWords.forEach(word => word.classList.remove('active'));
            quoteAuthor.classList.remove('active');
        }
    });


    // ==========================================================================
    // 8. OUR STORY IMAGE REVEALS & TEXT SCROLLING
    // ==========================================================================
    const chapters = document.querySelectorAll('.story-chapter');
    
    chapters.forEach(chap => {
        const mask = chap.querySelector('.image-reveal-mask');
        const img = chap.querySelector('.story-image');
        const textCol = chap.querySelector('.story-text-col');

        // Reveal timeline
        const revealTl = gsap.timeline({
            scrollTrigger: {
                trigger: chap,
                start: 'top 75%',
                once: true // trigger only once as visitor scrolls down
            }
        });

        revealTl.to(mask, { scaleX: 0, duration: 1.2, ease: 'power4.inOut' })
                .from(img, { scale: 1.2, duration: 1.5, ease: 'power3.out' }, '-=1.2')
                .from(textCol.children, { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=1');
        
        // Add subtle parallax during active scrolling
        gsap.to(img, {
            y: '-10%',
            scrollTrigger: {
                trigger: chap,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });


    // ==========================================================================
    // 9. INTERACTIVE GOLD SCRATCH CARD EXPERIENCE
    // ==========================================================================
    const scratchCanvas = document.getElementById('scratch-canvas');
    const scratchCtx = scratchCanvas.getContext('2d');
    const scratchWrapper = document.querySelector('.scratch-card-wrapper');
    const revealInner = document.querySelector('.reveal-inner-content');

    let scratchW = scratchCanvas.width;
    let scratchH = scratchCanvas.height;

    // Resize canvas bounding rect properly
    function resizeScratchCanvas() {
        const rect = scratchWrapper.getBoundingClientRect();
        scratchCanvas.width = rect.width;
        scratchCanvas.height = rect.height;
        scratchW = scratchCanvas.width;
        scratchH = scratchCanvas.height;
        drawGoldCover();
    }

    // Draw luxury gold cover with Monogram & pattern
    function drawGoldCover() {
        // Clear canvas
        scratchCtx.clearRect(0, 0, scratchW, scratchH);

        // 1. Solid Gold Foil base
        const grad = scratchCtx.createLinearGradient(0, 0, scratchW, scratchH);
        grad.addColorStop(0, '#B8860B'); // dark golden rod
        grad.addColorStop(0.3, '#E5A93B'); // champagne gold
        grad.addColorStop(0.5, '#F9E7B9'); // soft white gold
        grad.addColorStop(0.7, '#D49F39');
        grad.addColorStop(1, '#996515'); // deeper gold
        scratchCtx.fillStyle = grad;
        scratchCtx.fillRect(0, 0, scratchW, scratchH);

        // 2. Add fine paper texture grain
        scratchCtx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 0; i < scratchW; i += 4) {
            for (let j = 0; j < scratchH; j += 4) {
                if (Math.random() > 0.5) {
                    scratchCtx.fillRect(i, j, 1, 1);
                }
            }
        }

        // 3. Ornate Double Gold Border
        scratchCtx.strokeStyle = 'rgba(248, 244, 239, 0.4)';
        scratchCtx.lineWidth = 1;
        scratchCtx.strokeRect(15, 15, scratchW - 30, scratchH - 30);
        scratchCtx.strokeRect(20, 20, scratchW - 40, scratchH - 40);

        // Draw elegant floral corner lines
        drawCornerDecos();

        // 4. Center Monogram
        scratchCtx.save();
        scratchCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        scratchCtx.shadowBlur = 8;
        scratchCtx.fillStyle = '#FFFFFF';
        scratchCtx.textAlign = 'center';
        scratchCtx.textBaseline = 'middle';
        
        scratchCtx.font = '300 24px var(--font-sans)';
        scratchCtx.fillText('THE ROYAL INVITATION', scratchW / 2, scratchH / 2 - 40);
        
        scratchCtx.font = '300 68px var(--font-serif)';
        scratchCtx.fillText('AA', scratchW / 2, scratchH / 2 + 15);
        
        scratchCtx.font = 'italic 16px var(--font-serif)';
        scratchCtx.fillText('Scratch to Reveal', scratchW / 2, scratchH / 2 + 80);
        scratchCtx.restore();
    }

    function drawCornerDecos() {
        scratchCtx.strokeStyle = 'rgba(248, 244, 239, 0.3)';
        scratchCtx.lineWidth = 1.5;
        
        const size = 30;
        // Top-left
        scratchCtx.beginPath();
        scratchCtx.moveTo(20, 20 + size);
        scratchCtx.lineTo(20, 20);
        scratchCtx.lineTo(20 + size, 20);
        scratchCtx.stroke();
        
        // Top-right
        scratchCtx.beginPath();
        scratchCtx.moveTo(scratchW - 20, 20 + size);
        scratchCtx.lineTo(scratchW - 20, 20);
        scratchCtx.lineTo(scratchW - 20 - size, 20);
        scratchCtx.stroke();

        // Bottom-left
        scratchCtx.beginPath();
        scratchCtx.moveTo(20, scratchH - 20 - size);
        scratchCtx.lineTo(20, scratchH - 20);
        scratchCtx.lineTo(20 + size, scratchH - 20);
        scratchCtx.stroke();

        // Bottom-right
        scratchCtx.beginPath();
        scratchCtx.moveTo(scratchW - 20, scratchH - 20 - size);
        scratchCtx.lineTo(scratchW - 20, scratchH - 20);
        scratchCtx.lineTo(scratchW - 20 - size, scratchH - 20);
        scratchCtx.stroke();
    }

    // Trigger initial draw
    resizeScratchCanvas();
    window.addEventListener('resize', resizeScratchCanvas);

    // Scratching logic variables
    let isDrawing = false;
    let lastPoint = null;
    let scratchPercentage = 0;
    let cardUnlocked = false;

    // Get touch/mouse coordinate relative to canvas
    function getMousePos(e) {
        const rect = scratchCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // Scratch Action
    function scratch(e) {
        if (!isDrawing || cardUnlocked) return;
        
        const currentPoint = getMousePos(e);
        scratchCtx.save();
        scratchCtx.globalCompositeOperation = 'destination-out';
        
        // Circular scratch line brush
        scratchCtx.lineWidth = 45;
        scratchCtx.lineCap = 'round';
        scratchCtx.lineJoin = 'round';
        scratchCtx.strokeStyle = 'rgba(0,0,0,1)';
        
        scratchCtx.beginPath();
        if (lastPoint) {
            scratchCtx.moveTo(lastPoint.x, lastPoint.y);
            scratchCtx.lineTo(currentPoint.x, currentPoint.y);
            scratchCtx.stroke();
        } else {
            scratchCtx.arc(currentPoint.x, currentPoint.y, 22.5, 0, Math.PI * 2);
            scratchCtx.fill();
        }
        
        scratchCtx.restore();
        lastPoint = currentPoint;

        // Generate tiny gold dust sparks on scratching coordinates
        const rect = scratchCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        for (let i = 0; i < 3; i++) {
            goldParticles.push(new GoldDust(clientX, clientY));
        }

        // Play scratch sound (short noise burst)
        soundEngine.playTone(Math.random() * 200 + 100, 'triangle', 0.03, 0.01);
    }

    // Calculate percent scratched (sample 100 points)
    function calculateScratchPercent() {
        if (cardUnlocked) return;
        
        const imgData = scratchCtx.getImageData(0, 0, scratchW, scratchH);
        const pixels = imgData.data;
        const totalPixels = pixels.length / 4;
        let transparentPixels = 0;

        // Loop through pixel alpha channel (every 4th byte) with a step to preserve loop efficiency
        const step = 80; 
        let sampledTotal = 0;
        for (let i = 3; i < pixels.length; i += step * 4) {
            sampledTotal++;
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        scratchPercentage = (transparentPixels / sampledTotal) * 100;
        
        // Unlock card when > 50% scratched
        if (scratchPercentage > 50) {
            unlockScratchCard();
        }
    }

    // Completely clear canvas and reveal content underneath
    function unlockScratchCard() {
        cardUnlocked = true;
        soundEngine.playSuccessChime();

        // GSAP transition to dissolve canvas gold foil completely
        gsap.to(scratchCanvas, {
            opacity: 0,
            scale: 1.05,
            duration: 0.8,
            onComplete: () => {
                scratchCanvas.style.display = 'none';
            }
        });

        // Staggered reveal of text inside
        revealInner.classList.add('revealed');
        
        // Massive burst of gold dust from center
        const rect = scratchCanvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 80; i++) {
            setTimeout(() => {
                const particle = new GoldDust(centerX, centerY);
                particle.vx = (Math.random() - 0.5) * 12;
                particle.vy = (Math.random() - 0.5) * 12 - 2;
                particle.size = Math.random() * 4 + 2;
                particle.decay = 0.008;
                goldParticles.push(particle);
            }, Math.random() * 200);
        }
    }

    // Attach interaction events to Canvas
    scratchCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        lastPoint = getMousePos(e);
        scratch(e);
    });

    window.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            lastPoint = null;
            calculateScratchPercent();
        }
    });

    scratchCanvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        lastPoint = getMousePos(e);
        scratch(e);
    });

    window.addEventListener('touchmove', scratch, { passive: true });
    window.addEventListener('touchend', () => {
        if (isDrawing) {
            isDrawing = false;
            lastPoint = null;
            calculateScratchPercent();
        }
    });

    // Scratch Card Reveal buttons interaction feedback
    document.getElementById('send-wishes-btn').addEventListener('click', () => {
        soundEngine.playTone(523.25, 'sine', 0.4, 0.08); // Chord note
        soundEngine.playTone(659.25, 'sine', 0.4, 0.08, 0.1);
        alert('Thank you! You can share your blessing message in the RSVP form below.');
        lenis.scrollTo('#rsvp', { duration: 1.5 });
    });

    document.getElementById('calendar-btn').addEventListener('click', () => {
        soundEngine.playTone(523.25, 'sine', 0.4, 0.08);
        alert('Date saved: Aarav & Anaya Wedding, December 11-12, 2026, Leela Palace Udaipur.');
    });


    // ==========================================================================
    // 10. HORIZONTAL LOVE TIMELINE PINNED SECTION
    // ==========================================================================
    const timelineTrack = document.getElementById('timeline-track');
    const timelineSlides = document.querySelectorAll('.timeline-slide');

    if (timelineTrack) {
        // Calculate total scrolling width dynamically
        const getScrollAmount = () => {
            const trackWidth = timelineTrack.scrollWidth;
            return -(trackWidth - window.innerWidth);
        };

        const horizontalScroll = gsap.to(timelineTrack, {
            x: getScrollAmount,
            ease: 'none',
            scrollTrigger: {
                trigger: '#timeline',
                start: 'top top',
                end: () => `+=${timelineTrack.scrollWidth - window.innerWidth}`,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true, // handles screen resizing safely
                onUpdate: (self) => {
                    // Update active focus cards dynamically based on scroll progress
                    const progress = self.progress;
                    const index = Math.min(
                        Math.floor(progress * timelineSlides.length),
                        timelineSlides.length - 1
                    );
                    
                    timelineSlides.forEach((slide, i) => {
                        if (i === index) {
                            slide.classList.add('active-card');
                        } else {
                            slide.classList.remove('active-card');
                        }
                    });
                }
            }
        });
    }


    // ==========================================================================
    // 11. GALLERY FLOATING PARALLAX
    // ==========================================================================
    const galleryItems = document.querySelectorAll('.parallax-gallery-item');
    galleryItems.forEach(item => {
        const speed = parseFloat(item.getAttribute('data-speed')) || 1;
        
        gsap.to(item, {
            yPercent: speed * 15,
            ease: 'none',
            scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });


    // ==========================================================================
    // 12. WEDDING CELEBRATIONS SCHEDULE SCROLL TRIGGER (SVG DRAW)
    // ==========================================================================
    const celebrationCards = document.querySelectorAll('.event-card');
    
    celebrationCards.forEach((card, index) => {
        ScrollTrigger.create({
            trigger: card,
            start: 'top 85%',
            onEnter: () => {
                card.classList.add('visible');
                // Play soft pop sound as card slides in
                soundEngine.playTone(329.63 + index * 50, 'sine', 0.4, 0.03);
            }
        });
    });

    // Fill vertical line on scroll
    gsap.to('.timeline-draw-fill', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: '.events-timeline',
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: true
        }
    });


    // ==========================================================================
    // 13. VENUE EXPERIENCE ANIMATION
    // ==========================================================================
    const venueImg = document.querySelector('.venue-img');
    if (venueImg) {
        gsap.to(venueImg, {
            scale: 1,
            y: '-5%',
            scrollTrigger: {
                trigger: '#venue',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });

        // Reveal layout card
        const venueRevealTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.venue-container',
                start: 'top 75%',
                once: true
            }
        });
        
        venueRevealTl.to('.venue-main-image-frame .image-reveal-mask', { scaleX: 0, duration: 1.2, ease: 'power4.inOut' })
                     .from('.venue-info-col > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.8');
    }


    // ==========================================================================
    // 14. LIVE COUNTDOWN & CELESTIAL CANVAS RENDERER
    // ==========================================================================
    const countdownCanvas = document.getElementById('countdown-canvas');
    const countdownCtx = countdownCanvas.getContext('2d');

    let countW = countdownCanvas.width = countdownCanvas.parentElement.clientWidth;
    let countH = countdownCanvas.height = countdownCanvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
        if (countdownCanvas.parentElement) {
            countW = countdownCanvas.width = countdownCanvas.parentElement.clientWidth;
            countH = countdownCanvas.height = countdownCanvas.parentElement.clientHeight;
        }
    });

    // Rings representing orbital paths
    class OrbitRing {
        constructor(radius, speed, particleCount, color) {
            this.radius = radius;
            this.speed = speed;
            this.angle = Math.random() * Math.PI * 2;
            this.color = color;
            this.particles = Array.from({ length: particleCount }, () => ({
                angleOffset: Math.random() * Math.PI * 2,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                speedMultiplier: Math.random() * 0.5 + 0.8
            }));
        }

        draw() {
            this.angle += this.speed;
            
            // Draw subtle path
            countdownCtx.strokeStyle = 'rgba(200,169,126,0.06)';
            countdownCtx.lineWidth = 1;
            countdownCtx.beginPath();
            countdownCtx.arc(countW/2, countH/2, this.radius, 0, Math.PI*2);
            countdownCtx.stroke();

            // Draw orbiting particles
            this.particles.forEach(p => {
                const currentAngle = this.angle * p.speedMultiplier + p.angleOffset;
                const x = countW / 2 + Math.cos(currentAngle) * this.radius;
                const y = countH / 2 + Math.sin(currentAngle) * this.radius;
                
                countdownCtx.fillStyle = this.color;
                countdownCtx.globalAlpha = p.opacity;
                countdownCtx.beginPath();
                countdownCtx.arc(x, y, p.size, 0, Math.PI*2);
                countdownCtx.fill();
            });
        }
    }

    const orbitRings = [
        new OrbitRing(150, 0.001, 15, 'rgba(200,169,126,0.6)'),
        new OrbitRing(230, -0.0006, 25, 'rgba(255,255,255,0.4)'),
        new OrbitRing(310, 0.0004, 35, 'rgba(200,169,126,0.5)')
    ];

    function drawCelestialTimerBg() {
        countdownCtx.clearRect(0, 0, countW, countH);

        // Slow glow in center
        const grad = countdownCtx.createRadialGradient(countW/2, countH/2, 0, countW/2, countH/2, 200);
        grad.addColorStop(0, 'rgba(94, 23, 37, 0.15)'); // burgundy soft wash
        grad.addColorStop(1, 'transparent');
        countdownCtx.fillStyle = grad;
        countdownCtx.fillRect(0, 0, countW, countH);

        // Draw Rings
        orbitRings.forEach(ring => ring.draw());
        requestAnimationFrame(drawCelestialTimerBg);
    }
    drawCelestialTimerBg();

    // Actual countdown clock logic
    const weddingDate = new Date('December 12, 2026 16:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const gap = weddingDate - now;

        if (gap <= 0) {
            document.querySelector('.countdown-timer').innerHTML = "<h4 class='font-serif' style='font-size:3rem; color:#C8A97E;'>TODAY IS THE DAY!</h4>";
            return;
        }

        // Math
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        const d = Math.floor(gap / day);
        const h = Math.floor((gap % day) / hour);
        const m = Math.floor((gap % hour) / minute);
        const s = Math.floor((gap % minute) / second);

        // DOM elements
        document.getElementById('days').textContent = d.toString().padStart(3, '0');
        document.getElementById('hours').textContent = h.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = m.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = s.toString().padStart(2, '0');
    }
    
    // Tick
    updateCountdown();
    setInterval(updateCountdown, 1000);


    // ==========================================================================
    // 15. PREMIUM RSVP FORM SUBMIT & CONFETTI EXPLOSION
    // ==========================================================================
    const rsvpForm = document.getElementById('rsvp-form');
    const successMsg = document.getElementById('rsvp-success-message');
    const rsvpCanvas = document.getElementById('rsvp-canvas');
    const rsvpCtx = rsvpCanvas.getContext('2d');
    
    let rsvpW = rsvpCanvas.width = rsvpCanvas.parentElement.clientWidth;
    let rsvpH = rsvpCanvas.height = rsvpCanvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
        rsvpW = rsvpCanvas.width = rsvpCanvas.parentElement.clientWidth;
        rsvpH = rsvpCanvas.height = rsvpCanvas.parentElement.clientHeight;
    });

    class ConfettiPiece {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 4;
            this.speedX = (Math.random() - 0.5) * 16;
            this.speedY = -Math.random() * 12 - 5;
            this.gravity = 0.25;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.15 - 0.075;
            this.opacity = 1.0;
            const colors = ['#C8A97E', '#5E1725', '#FFFFFF', '#EFE6DB'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.type = Math.random() > 0.5 ? 'circle' : 'rect';
        }

        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            
            // Fade out near bottom
            if (this.y > rsvpH - 100) {
                this.opacity -= 0.02;
            }
        }

        draw() {
            rsvpCtx.save();
            rsvpCtx.translate(this.x, this.y);
            rsvpCtx.rotate(this.rotation);
            rsvpCtx.globalAlpha = this.opacity;
            rsvpCtx.fillStyle = this.color;
            
            if (this.type === 'circle') {
                rsvpCtx.beginPath();
                rsvpCtx.arc(0, 0, this.size/2, 0, Math.PI*2);
                rsvpCtx.fill();
            } else {
                rsvpCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            }
            rsvpCtx.restore();
        }
    }

    let confettiActive = [];
    
    function animateRSVPConfetti() {
        if (confettiActive.length === 0) {
            rsvpCtx.clearRect(0, 0, rsvpW, rsvpH);
            return;
        }
        
        rsvpCtx.clearRect(0, 0, rsvpW, rsvpH);

        for (let i = confettiActive.length - 1; i >= 0; i--) {
            confettiActive[i].update();
            confettiActive[i].draw();

            if (confettiActive[i].opacity <= 0 || confettiActive[i].y > rsvpH) {
                confettiActive.splice(i, 1);
            }
        }
        requestAnimationFrame(animateRSVPConfetti);
    }

    // Google Sheets Webhook URL (paste your deployed web app URL here)
    const GOOGLE_SHEET_WEBHOOK_URL = '';

    // Hook submit button
    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        soundEngine.playSuccessChime();

        // Extract Form Data
        const guestName = document.getElementById('guest-name').value;
        const guestPhone = document.getElementById('guest-phone').value;
        const guestCount = document.getElementById('guest-count').value;
        const dietary = document.getElementById('dietary').value;
        const attendance = document.querySelector('input[name="attendance"]:checked').value;
        const message = document.getElementById('message').value;

        const rsvpData = {
            guest_name: guestName,
            guest_phone: guestPhone,
            guest_count: guestCount,
            dietary: dietary,
            attendance: attendance,
            message: message
        };

        // 1. Save to LocalStorage Database for instant Admin Dashboard sync
        let existingRsvps = [];
        try {
            const stored = localStorage.getItem('wedding_rsvps');
            if (stored) {
                existingRsvps = JSON.parse(stored);
            }
        } catch (err) {
            console.log('Error reading localStorage:', err);
        }
        existingRsvps.push(rsvpData);
        try {
            localStorage.setItem('wedding_rsvps', JSON.stringify(existingRsvps));
        } catch (err) {
            console.log('Error writing localStorage:', err);
        }

        // 2. Submit to Google Sheet Webhook if URL is configured
        if (GOOGLE_SHEET_WEBHOOK_URL && GOOGLE_SHEET_WEBHOOK_URL !== '') {
            fetch(GOOGLE_SHEET_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rsvpData)
            })
            .then(() => console.log('RSVP Webhook sent successfully'))
            .catch(err => console.error('RSVP Webhook post error:', err));
        }

        // 3. Trigger Confetti Explosion
        const rect = rsvpForm.querySelector('button[type="submit"]').getBoundingClientRect();
        const relativeX = rect.left + rect.width / 2 - rsvpCanvas.getBoundingClientRect().left;
        const relativeY = rect.top - rsvpCanvas.getBoundingClientRect().top;
        
        confettiActive = Array.from({ length: 120 }, () => new ConfettiPiece(relativeX, relativeY));
        animateRSVPConfetti();

        // 2. Animate out Form and Reveal Success Message
        gsap.to(rsvpForm, {
            opacity: 0,
            y: -20,
            duration: 0.6,
            onComplete: () => {
                rsvpForm.style.display = 'none';
                successMsg.style.display = 'block';
                
                // Animate checkmark and success messages
                gsap.from(successMsg.querySelectorAll('h4, p, .success-icon-wrapper'), {
                    y: 20,
                    opacity: 0,
                    stagger: 0.15,
                    duration: 0.8,
                    ease: 'power3.out'
                });
            }
        });
    });


    // ==========================================================================
    // 16. CLOSING SECTION ANIMATION & UTILS
    // ==========================================================================
    const closingImg = document.querySelector('.closing-bg-image');
    if (closingImg) {
        gsap.to(closingImg, {
            scale: 1,
            scrollTrigger: {
                trigger: '#closing',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });

        gsap.from('.closing-content > *', {
            y: 40,
            opacity: 0,
            stagger: 0.2,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '#closing',
                start: 'top 65%',
                once: true
            }
        });
    }

    // Save date button chime
    document.getElementById('save-date-btn').addEventListener('click', () => {
        soundEngine.playTone(659.25, 'sine', 0.6, 0.1);
        soundEngine.playTone(783.99, 'sine', 0.6, 0.1, 0.15);
        soundEngine.playTone(1046.50, 'sine', 0.8, 0.12, 0.3);
        alert('Vows Scheduled: December 11-12, 2026. See you in Udaipur, India!');
    });

    // ==========================================================================
    // 17. SCROLL PROGRESS INDICATOR & OTHER MICROINTERACTIONS
    // ==========================================================================
    // Bind scroll progress bar
    window.addEventListener('scroll', () => {
        const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (window.scrollY / totalScrollHeight) * 100;
        document.getElementById('scroll-progress-bar').style.width = `${scrollPercent}%`;
    });

    // Anchor links smooth scrolling override for rock-solid mobile jumps
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                soundEngine.playTone(440, 'sine', 0.1, 0.03); // Soft tactile feedback
                lenis.scrollTo(targetId, { duration: 1.2 });
            }
        });
    });

    // Custom Magnetic Button effect (Desktop Only - disabled on touch devices to ensure clicking stability)
    if (!window.matchMedia('(hover: none)').matches) {
        const magneticElements = document.querySelectorAll('.magnetic');
        magneticElements.forEach(item => {
            item.addEventListener('mousemove', function(e) {
                const position = this.getBoundingClientRect();
                const x = e.clientX - position.left - position.width / 2;
                const y = e.clientY - position.top - position.height / 2;
                
                // Translate the button slightly towards cursor
                gsap.to(this, {
                    x: x * 0.35,
                    y: y * 0.35,
                    scale: 1.02,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            item.addEventListener('mouseleave', function() {
                // Restore button position
                gsap.to(this, {
                    x: 0,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeddingApp);
} else {
    initWeddingApp();
}

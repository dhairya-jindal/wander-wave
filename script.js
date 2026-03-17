document.addEventListener('DOMContentLoaded', () => {

    /* --- CLOUD GENERATION --- */
    function generateClouds(layerId, count, minVW, maxVW, minVH, maxVH, opacityRange) {
        const layer = document.getElementById(layerId);
        
        for (let i = 0; i < count; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            // Random styling
            const size = Math.random() * 150 + 100; // 100px to 250px base
            const left = Math.random() * 100; // 0 to 100vw
            // Spread clouds across a very tall vertical space (e.g. up to section 7 = ~1000vh + offset)
            const top = Math.random() * maxVH + minVH; 
            const opacity = Math.random() * (opacityRange[1] - opacityRange[0]) + opacityRange[0];
            
            cloud.style.width = `${size}px`;
            cloud.style.height = `${size * 0.4}px`;
            cloud.style.left = `${left}vw`;
            cloud.style.top = `${top}vh`;
            cloud.style.opacity = opacity;
            
            // Add slight drift
            if (Math.random() > 0.5) {
                cloud.classList.add('drift-l');
                cloud.style.animationDelay = `${Math.random() * 10}s`;
            } else {
                cloud.classList.add('drift-r');
                cloud.style.animationDelay = `${Math.random() * 10}s`;
            }

            layer.appendChild(cloud);
        }
    }

    // Multiply vertical height based on multiplier because layer moves up.
    // E.g., fast foreground moves up 1.5x pixel scroll. 
    // Total document height is about 850vh. Max scroll is ~750vh.
    // Foreground translate: 1.5 * 750 = 1125vh moving up.
    // So we need clouds placed from 0 down to 750 + 1125 = 1875vh
    generateClouds('layer-distant', 40, -10, 110, 0, 1200, [0.3, 0.6]); 
    generateClouds('layer-mid', 50, -20, 120, 0, 1600, [0.4, 0.8]);
    generateClouds('layer-foreground', 60, -30, 130, 0, 2200, [0.6, 1.0]);


    /* --- SCROLL LISTENER (PARALLAX & PROGRESS) --- */
    let ticking = false;
    let scrollY = window.scrollY;

    const airplane = document.getElementById('airplane');
    
    function onScroll() {
        scrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Update CSS variable for Parallax
                document.documentElement.style.setProperty('--scroll-y', `${scrollY}`);

                // Update Airplane Progress
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = Math.min(Math.max(scrollY / docHeight, 0), 1);
                
                if (airplane) {
                    // map 0 -> 100% top
                    airplane.style.top = `${scrollPercent * 100}%`;
                }

                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    // Init variables
    onScroll();


    /* --- INTERSECTION OBSERVER FOR SECTIONS (BACKGROUND COLORS & REVEALS) --- */
    const sections = document.querySelectorAll('.story-section');
    const bgs = document.querySelectorAll('.sky-bg');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Active when 50% in view
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-id');
                
                // Hide all BGs
                bgs.forEach(bg => bg.classList.remove('active'));
                
                // Show matching BG
                const activeBg = document.getElementById(`sky-${id}`);
                if (activeBg) activeBg.classList.add('active');

                // Update active nav dot
                const navDots = document.querySelectorAll('.nav-dot');
                navDots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.getAttribute('data-target') === id) {
                        dot.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // Another observer for revealing content cards gracefully
    const contentObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const contentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target.querySelector('.content-card');
                if (card) {
                    card.classList.add('in-view');
                }
            }
        });
    }, contentObserverOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
        contentObserver.observe(section);
    });

    /* --- SIDE NAV CLICK HANDLER --- */
    const navDots = document.querySelectorAll('.nav-dot');
    navDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = dot.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* --- REWIND TO TOP --- */
    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

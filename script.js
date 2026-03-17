import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. THREE.JS GLOBE ENGINE SETUP --- */
    const canvasContainer = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if(canvasContainer) canvasContainer.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 5;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x011b33, transparent: true, opacity: 0.8 });
    const baseSphere = new THREE.Mesh(geometry, baseMaterial);
    globeGroup.add(baseSphere);

    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.15 });
    const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireframeMaterial);
    globeGroup.add(wireframe);

    const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.1, side: THREE.BackSide, blending: THREE.AdditiveBlending });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 32, 32), haloMaterial);
    globeGroup.add(halo);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animateGlobe() {
        requestAnimationFrame(animateGlobe);
        globeGroup.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
    animateGlobe();

    /* --- 2. 3D CARD PARALLAX & GYROSCOPE (MOBILE FIRST) --- */
    const cards = document.querySelectorAll('.card-3d-container');
    const glares = document.querySelectorAll('.card-glare');
    
    // State management for Spring Physics
    const cardStates = Array.from(cards).map(() => ({
        currentX: 0, currentY: 0, 
        targetX: 0, targetY: 0
    }));

    // Gyroscope tracking state
    let deviceTiltX = 0;
    let deviceTiltY = 0;

    // Detect Device Orientation (Gyroscope for Mobile)
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            // Beta: front-to-back tilt [-180, 180] -> Map to [-20, 20] degrees
            // Gamma: left-to-right tilt [-90, 90] -> Map to [-20, 20] degrees
            let mappedX = e.beta ? (e.beta - 45) * 0.5 : 0; // offset assuming 45deg holding angle
            let mappedY = e.gamma ? e.gamma * 0.5 : 0;
            
            // Clamp values
            deviceTiltX = Math.max(-20, Math.min(20, mappedX));
            deviceTiltY = Math.max(-20, Math.min(20, mappedY));
        });
    }

    // Mouse Tracking (for Desktop fallback)
    cards.forEach((card, index) => {
        const state = cardStates[index];
        const glare = glares[index];

        const updateTarget = (clientX, clientY) => {
            const rect = card.getBoundingClientRect();
            // Calculate mouse position relative to card center (-1 to 1)
            const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2);
            
            // Convert to rotation degrees (inverted for natural feel)
            state.targetX = -y * 15; // Max 15deg
            state.targetY = x * 15;
            
            // Add slight Haptic vibration to indicate interaction
            if(Math.abs(x) > 0.8 || Math.abs(y) > 0.8) {
                if(navigator.vibrate) navigator.vibrate(5);
            }
        };

        card.addEventListener('mousemove', (e) => updateTarget(e.clientX, e.clientY));
        card.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            updateTarget(touch.clientX, touch.clientY);
        }, {passive: true});
        
        const resetTarget = () => {
            state.targetX = 0;
            state.targetY = 0;
            if(navigator.vibrate) navigator.vibrate([10, 30, 10]); // Spring back haptic
        };

        card.addEventListener('mouseleave', resetTarget);
        card.addEventListener('touchend', resetTarget);
    });

    // Spring Physics Loop
    function renderPhysics() {
        cards.forEach((card, index) => {
            const state = cardStates[index];
            const glare = glares[index];
            
            // Combine Touch Target + Gyroscope Target
            let finalTargetX = state.targetX - deviceTiltX;
            let finalTargetY = state.targetY + deviceTiltY;

            // Clamp combined
            finalTargetX = Math.max(-25, Math.min(25, finalTargetX));
            finalTargetY = Math.max(-25, Math.min(25, finalTargetY));

            // Lerp (Spring interpolation)
            state.currentX += (finalTargetX - state.currentX) * 0.1;
            state.currentY += (finalTargetY - state.currentY) * 0.1;

            // Apply Transform
            card.style.transform = `rotateX(${state.currentX}deg) rotateY(${state.currentY}deg)`;
            
            // Apply Glare position
            if (glare) {
                glare.style.transform = `translateX(${state.currentY * -2}%) translateY(${state.currentX * 2}%)`;
            }
        });
        requestAnimationFrame(renderPhysics);
    }
    renderPhysics();

    /* --- 3. SCROLL SYSTEMS & THEMES --- */
    let ticking = false;
    let scrollY = window.scrollY;

    const airplane = document.getElementById('airplane');
    const altFill = document.getElementById('alt-fill');
    const altText = document.getElementById('alt-text');
    const compass = document.getElementById('compass');
    
    function onScroll() {
        scrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--scroll-y', `${scrollY}`);
                const docHeight = Math.max(1, document.body.scrollHeight - window.innerHeight);
                const scrollPercent = Math.min(Math.max(scrollY / docHeight, 0), 1);
                
                if (airplane) airplane.style.top = `${scrollPercent * 100}%`;
                if (altFill && altText) {
                    const currentAlt = Math.floor(40000 * (1 - scrollPercent));
                    altText.innerText = `${currentAlt.toLocaleString()} FT`;
                    altFill.style.transform = `scaleY(${1 - scrollPercent})`;
                }
                if (compass) compass.style.transform = `rotate(${scrollY * 0.05}deg)`;

                // 3D GLOBE CINEMATIC DIVE EFFECT
                const diveHeight = window.innerHeight;
                if (scrollY < diveHeight * 1.5) {
                    if(canvasContainer) canvasContainer.style.opacity = 1;
                    const diveProgress = Math.min(scrollY / diveHeight, 1);
                    camera.position.z = 15 - (diveProgress * 25);
                    
                    if (diveProgress > 0.8 && canvasContainer) {
                        canvasContainer.style.filter = `blur(${(diveProgress - 0.8) * 100}px)`;
                        canvasContainer.style.opacity = 1 - ((diveProgress - 0.8) * 5);
                    } else if (canvasContainer) {
                        canvasContainer.style.filter = `blur(0px)`;
                    }
                } else if(canvasContainer) {
                    canvasContainer.style.opacity = 0;
                }

                if (scrollPercent > 0.9 && canvasContainer) {
                    canvasContainer.style.opacity = (scrollPercent - 0.9) * 10;
                    camera.position.z = -10 + ((scrollPercent - 0.9) * 200);
                }
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* --- 4. INTERSECTION OBSERVERS (Waypoints) --- */
    const sections = document.querySelectorAll('.perspective-wrapper');
    const bgs = document.querySelectorAll('.sky-bg');
    
    // Desktop & Mobile nav syncing
    const navDots = document.querySelectorAll('.nav-dot');
    const mobileBottomLinks = document.querySelectorAll('.bottom-nav-item');
    const coordinatesDisplay = document.getElementById('coordinates');

    const coordsMap = {
        'space': 'ORBITAL ELEV: LOW EARTH',
        'intro': 'SYS: INITIALIZING...',
        'about': 'CURATION PROTOCOLS ACTIVE',
        'bali': '8.4095° S, 115.1889° E',
        'croatia': '42.6507° N, 18.0944° E',
        'maldives': '3.2028° N, 73.2207° E',
        'underwater': 'PTH: -40M DIVE RATE 2.0',
        'whyus': 'GLOBAL NETWORK SECURED',
        'outro': 'DESTINATION: ANYWHERE'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-id');
                
                // Triger Card Enter Animation
                entry.target.classList.add('in-view');

                // Trigger Haptic for new section enter
                if (navigator.vibrate) navigator.vibrate(15); 
                
                // Sky Swap
                bgs.forEach(bg => bg.classList.remove('active'));
                const activeBg = document.getElementById(`sky-${id}`);
                if (activeBg) activeBg.classList.add('active');

                // Update HUD Text
                if (coordinatesDisplay && coordsMap[id]) {
                    coordinatesDisplay.innerText = coordsMap[id];
                }

                // Update Side Nav (Desktop)
                navDots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.getAttribute('data-target') === id) dot.classList.add('active');
                });
                
                // Update Bottom Nav (Mobile)
                mobileBottomLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-target') === id) link.classList.add('active');
                });
            } else {
                // Remove to allow re-triggering animation if desired
                // entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(section => sectionObserver.observe(section));

    /* --- 5. HAPTICS AND TOUCH RIPPLES --- */
    document.addEventListener('click', (e) => {
        // Create Ripple Element
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        document.body.appendChild(ripple);
        
        const size = 100; // Base size
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - size/2}px`;
        ripple.style.top = `${e.clientY - size/2}px`;

        // Action haptics
        if(e.target.closest('button, a')) {
            if (navigator.vibrate) navigator.vibrate(20);
        }

        setTimeout(() => ripple.remove(), 600);
    });

    /* --- 6. NAVIGATION CLICK HANDLERS (Smooth Scroll) --- */
    const bindScrollLinks = (selector) => {
        document.querySelectorAll(selector).forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if (!targetId) return; 
                
                e.preventDefault();
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    };

    bindScrollLinks('.nav-dot');
    bindScrollLinks('.bottom-nav-item');
    bindScrollLinks('.top-nav-link:not(.cta)'); 
    bindScrollLinks('.cta');

    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if(navigator.vibrate) navigator.vibrate([10, 50, 10]);
        });
    }

});

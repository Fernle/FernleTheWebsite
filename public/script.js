// Smooth scrolling and enhanced interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation button interactions
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        // Add click event for future navigation
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.getAttribute('data-page');
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Navigation handling
            if (page === 'gamer') {
                window.location.href = 'gamer.html';
            } else if (page === 'developer') {
                showComingSoon('The Developer');
            }
        });
        
        // Enhanced hover effects
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Logo interaction enhancement
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.08) rotate(2deg)';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }
    
    // Parallax effect for background (subtle)
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('body');
        const speed = scrolled * 0.5;
        
        parallax.style.backgroundPosition = `center ${speed}px`;
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.intro-section');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // Performance optimization: Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(function() {
            // Scroll-based animations here
        }, 10);
    });
    
    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        
        // Trigger entrance animations
        setTimeout(() => {
            const container = document.querySelector('.container');
            if (container) {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }
        }, 100);
    });
    
    // Utility function for coming soon pages
    function showComingSoon(pageName) {
        // Create a temporary overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const message = document.createElement('div');
        message.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;
        
        message.innerHTML = `
            <h2 style="color: var(--dark-brown); margin-bottom: 1rem; font-size: 1.5rem;">
                ${pageName} Page
            </h2>
            <p style="color: var(--dark-brown); margin-bottom: 1.5rem;">
                Coming Soon! This page is under development.
            </p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: var(--primary-orange); color: white; border: none; 
                           padding: 0.75rem 1.5rem; border-radius: 25px; cursor: pointer; 
                           font-weight: 500; transition: all 0.3s ease;"
                    onmouseover="this.style.background='var(--earth-brown)'"
                    onmouseout="this.style.background='var(--primary-orange)'">
                Got it!
            </button>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            overlay.style.opacity = '1';
            message.style.transform = 'scale(1)';
        }, 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.style.opacity = '0';
                message.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        }, 3000);
    }
    
    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modals/overlays
            const overlays = document.querySelectorAll('[style*="position: fixed"]');
            overlays.forEach(overlay => {
                if (overlay.style.zIndex === '10000') {
                    overlay.remove();
                }
            });
        }
    });
    
    // Preload critical images
    const criticalImages = ['Images/pp.jpeg'];
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData && perfData.loadEventEnd - perfData.loadEventStart > 3000) {
                    console.warn('Page load time is slow:', perfData.loadEventEnd - perfData.loadEventStart + 'ms');
                }
            }, 0);
        });
    }
});

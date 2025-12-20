// =====================================================
// CONFIG
// =====================================================
const NAV_OFFSET = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--nav-height')) || 80;

// =====================================================
// HAMBURGER MENU TOGGLE
// =====================================================
const hamburger = document.querySelector('.hamburger-menu');
const mobileOverlay = document.querySelector('.mobile-menu-overlay');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a');
const body = document.body;

function toggleMobileMenu() {
  const isActive = hamburger.classList.toggle('active');
  mobileOverlay.classList.toggle('active');
  body.style.overflow = isActive ? 'hidden' : '';
  hamburger.setAttribute('aria-expanded', isActive);
}

function closeMobileMenu() {
  hamburger.classList.remove('active');
  mobileOverlay.classList.remove('active');
  body.style.overflow = '';
  hamburger.setAttribute('aria-expanded', 'false');
}

if (hamburger) {
  hamburger.addEventListener('click', toggleMobileMenu);
}

// Close menu when clicking a link
mobileMenuLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeMobileMenu();
  });
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileOverlay.classList.contains('active')) {
    closeMobileMenu();
  }
});

// Close menu when clicking overlay background
mobileOverlay.addEventListener('click', (e) => {
  if (e.target === mobileOverlay) {
    closeMobileMenu();
  }
});

// Sync active state between desktop and mobile menus
function syncMobileMenuActive() {
  const desktopActive = document.querySelector('.top-nav a.active');
  if (desktopActive) {
    const href = desktopActive.getAttribute('href');
    mobileMenuLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === href);
    });
  }
}

// =====================================================
// UTILITY: DEBOUNCE & THROTTLE
// =====================================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// =====================================================
// SMOOTH SCROLL WITH MOBILE OPTIMIZATION
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const href = link.getAttribute("href");
    if (href === "#") return;
    
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    // Calculate offset dynamically
    const headerHeight = document.querySelector('.site-header-inner')?.offsetHeight || NAV_OFFSET;
    const offset = headerHeight + 20;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth"
    });

    // Update URL without jumping
    if (history.pushState) {
      history.pushState(null, null, href);
    }
  });
});

// =====================================================
// SCROLL SPY + SLIDING PILL
// =====================================================
const nav = document.querySelector(".top-nav");
const navLinks = nav?.querySelectorAll("a") || [];
const pill = nav?.querySelector(".nav-pill");

const sections = [
  document.querySelector("#home"),
  document.querySelector("#projects"),
  document.querySelector("#contact")
].filter(Boolean);

let currentActive = null;
let isInitialized = false;
let isHovering = false; // Track hover state

function movePillToActive() {
  if (!pill || !nav || isHovering) return; // Don't move if hovering
  
  const activeLink = nav.querySelector("a.active");
  if (!activeLink) return;

  const linkRect = activeLink.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();

  pill.style.width = `${linkRect.width}px`;
  pill.style.height = `${linkRect.height}px`;
  pill.style.transform = `translate(
    ${linkRect.left - navRect.left}px,
    ${linkRect.top - navRect.top}px
  )`;
  pill.style.opacity = '1';
}

function updateActiveNav() {
  if (sections.length === 0) return;
  
  const scrollPos = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  
  let newActive = currentActive || sections[0]?.id || "home";

  // Check if we're at the very bottom of the page
  const atBottom = (windowHeight + scrollPos) >= (docHeight - 10);
  
  if (atBottom) {
    // Force last section when at bottom
    newActive = sections[sections.length - 1].id;
  } else {
    // Find active section based on scroll position
    // Use center of viewport for better accuracy
    const viewportCenter = scrollPos + (windowHeight / 2);
    
    sections.forEach((section) => {
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      // Check if viewport center is within this section
      if (viewportCenter >= sectionTop && viewportCenter < sectionBottom) {
        newActive = section.id;
      }
    });
  }

  // Update active state
  if (newActive !== currentActive) {
    currentActive = newActive;

    navLinks.forEach(link => {
      const isActive = link.getAttribute("href") === `#${newActive}`;
      link.classList.toggle("active", isActive);
    });

    movePillToActive();
    syncMobileMenuActive(); // Sync with mobile menu
  }
}

// =====================================================
// RAF-THROTTLED SCROLL LISTENER
// =====================================================
let ticking = false;
function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveNav();
      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", handleScroll, { passive: true });

// =====================================================
// INITIALIZATION
// =====================================================
function initialize() {
  if (isInitialized) return;
  
  updateActiveNav();
  movePillToActive();
  isInitialized = true;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

// Re-initialize on load for images/fonts
window.addEventListener("load", () => {
  setTimeout(() => {
    movePillToActive();
  }, 100);
});

// =====================================================
// RESIZE HANDLER WITH DEBOUNCE
// =====================================================
const handleResize = debounce(() => {
  movePillToActive();
}, 150);

window.addEventListener("resize", handleResize);

// =====================================================
// HOVER PREVIEW FOR NAV PILL
// =====================================================
if (nav && pill) {
  navLinks.forEach(link => {
    // Mouse enter - show hover state
    link.addEventListener("mouseenter", () => {
      isHovering = true;
      
      const linkRect = link.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      // Change pill appearance for hover
      pill.style.opacity = '0.5'; // More transparent
      pill.style.background = 'linear-gradient(135deg, rgba(59, 130, 255, 0.2), rgba(0, 255, 153, 0.15))'; // Lighter
      pill.style.border = '1px solid rgba(255, 255, 255, 0.3)'; // Add border
      pill.style.width = `${linkRect.width}px`;
      pill.style.height = `${linkRect.height}px`;
      pill.style.transform = `translate(
        ${linkRect.left - navRect.left}px,
        ${linkRect.top - navRect.top}px
      )`;
    });

    // Mouse leave - return to active state
    link.addEventListener("mouseleave", () => {
      isHovering = false;
      pill.style.opacity = '1';
      pill.style.background = 'linear-gradient(135deg, rgba(59, 130, 255, 0.35), rgba(0, 255, 153, 0.25))'; // Original
      pill.style.border = 'none'; // Remove border
      movePillToActive();
    });

    // Touch support - prevent sticky hover on mobile
    link.addEventListener("touchstart", () => {
      isHovering = false;
      pill.style.background = 'linear-gradient(135deg, rgba(59, 130, 255, 0.35), rgba(0, 255, 153, 0.25))';
      pill.style.border = 'none';
      movePillToActive();
    }, { passive: true });
  });
}

// =====================================================
// PROJECT CARDS INTERACTION
// =====================================================
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
  // Add click handler for mobile
  card.addEventListener('click', (e) => {
    // Only handle if clicking the card itself or the link
    if (e.target.closest('.project-link')) {
      // Let the link handle navigation
      return;
    }
    
    // Optional: Add ripple effect or other mobile feedback
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      width: 20px;
      height: 20px;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    card.style.position = 'relative';
    card.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: translate(-50%, -50%) scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// =====================================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// =====================================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe project cards for entrance animation
projectCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
  observer.observe(card);
});

// =====================================================
// PERFORMANCE OPTIMIZATION: LAZY LOAD IMAGES
// =====================================================
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.src = img.dataset.src || img.src;
  });
} else {
  // Fallback for browsers that don't support lazy loading
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img').forEach(img => imageObserver.observe(img));
}

// =====================================================
// TOUCH GESTURE IMPROVEMENTS
// =====================================================
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartY - touchEndY;
  
  // Optionally handle swipe gestures
  if (Math.abs(diff) > swipeThreshold) {
    // Swipe detected - can add custom logic here
  }
}

// =====================================================
// VIEWPORT HEIGHT FIX FOR MOBILE
// =====================================================
function setVhProperty() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVhProperty();
window.addEventListener('resize', debounce(setVhProperty, 150));

// =====================================================
// PREVENT SCROLL DURING ANIMATIONS
// =====================================================
let isScrolling = false;
let scrollTimer;

window.addEventListener('scroll', () => {
  isScrolling = true;
  document.body.classList.add('is-scrolling');
  
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling = false;
    document.body.classList.remove('is-scrolling');
  }, 150);
}, { passive: true });

// =====================================================
// ACCESSIBILITY IMPROVEMENTS
// =====================================================
// Add focus visible polyfill behavior
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-nav');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-nav');
});

// =====================================================
// PERFORMANCE MONITORING (DEV ONLY)
// =====================================================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.addEventListener('load', () => {
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page load time: ${pageLoadTime}ms`);
    }
  });
}

// =====================================================
// ERROR HANDLING
// =====================================================
window.addEventListener('error', (e) => {
  console.error('Script error:', e.error);
});

// Graceful degradation for missing elements
console.log('Portfolio script loaded successfully');

// =====================================================
// PARALLAX SCROLL EFFECT (SUBTLE)
// =====================================================
const contactSection = document.querySelector('#contact');
const footerName = document.querySelector('.footer-name');
const parallaxGrid = document.querySelector('.parallax-grid');

function handleSubtleParallax() {
  if (!contactSection) return;
  
  const sectionTop = contactSection.offsetTop;
  const sectionHeight = contactSection.offsetHeight;
  const scrollPos = window.scrollY;
  
  // Only apply parallax when section is in view
  if (scrollPos + window.innerHeight > sectionTop && scrollPos < sectionTop + sectionHeight) {
    const sectionScroll = scrollPos - sectionTop;
    
    // Subtle parallax on background name (moves slower)
    if (footerName) {
      const yPos = sectionScroll * 0.15; // Very subtle
      footerName.style.transform = `translateX(-50%) translateY(${yPos}px)`;
    }
    
    // Subtle grid movement
    if (parallaxGrid) {
      const gridPos = sectionScroll * 0.1;
      parallaxGrid.style.transform = `translateY(${gridPos}px)`;
    }
  }
}

// Throttled parallax scroll
let parallaxTicking = false;
window.addEventListener('scroll', () => {
  if (!parallaxTicking) {
    requestAnimationFrame(() => {
      handleSubtleParallax();
      parallaxTicking = false;
    });
    parallaxTicking = true;
  }
}, { passive: true });

// Initial parallax setup
handleSubtleParallax();

// =====================================================
// INTERSECTION OBSERVER FOR CONTACT ITEMS
// =====================================================
const contactItems = document.querySelectorAll('.contact-item, .social-link');

const contactObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
      }, index * 100);
    }
  });
}, {
  threshold: 0.2
});

contactItems.forEach((item, index) => {
  item.style.opacity = '0';
  item.style.transform = 'translateX(-30px)';
  item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  contactObserver.observe(item);
});
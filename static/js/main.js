// Theme Toggle
const root = document.documentElement;
const toggleBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

// Initialize theme on page load
if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
    if (toggleBtn) {
        toggleBtn.textContent = savedTheme === "dark" ? "Light Mode" : "Dark Mode";
    }
}

// Theme toggle click handler
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        root.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        toggleBtn.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
    });
}

// Mobile Navigation Enhancement
document.addEventListener("DOMContentLoaded", () => {
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.getElementById("navMain");
    
    // Close mobile menu when clicking outside
    if (navbarToggler && navbarCollapse) {
        document.addEventListener("click", (e) => {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                if (navbarCollapse.classList.contains("show")) {
                    navbarToggler.click();
                }
            }
        });
    }
    
    // Add loading state to forms
    const forms = document.querySelectorAll("form");
    forms.forEach(form => {
        form.addEventListener("submit", (e) => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
                
                // Re-enable after 10 seconds as fallback
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText;
                }, 10000);
            }
        });
    });
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add("fade-in");
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            if (targetId === "#") return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
    
    // Table row hover enhancement
    const tableRows = document.querySelectorAll("tbody tr");
    tableRows.forEach(row => {
        row.addEventListener("mouseenter", () => {
            row.style.transform = "scale(1.01)";
            row.style.transition = "transform 0.2s ease";
        });
        row.addEventListener("mouseleave", () => {
            row.style.transform = "scale(1)";
        });
    });
});

// Add confirmation for delete actions
const deleteForms = document.querySelectorAll('form[onssubmit*="confirm"]');
deleteForms.forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.addEventListener("mouseenter", () => {
            submitBtn.style.transform = "scale(1.05)";
        });
        submitBtn.addEventListener("mouseleave", () => {
            submitBtn.style.transform = "scale(1)";
        });
    }
});

// Close navbar on mobile when link is clicked
const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        const navbarCollapse = document.getElementById("navMain");
        const navbarToggler = document.querySelector(".navbar-toggler");
        if (navbarCollapse && navbarCollapse.classList.contains("show")) {
            navbarToggler.click();
        }
    });
});

// Add keyboard navigation support
document.addEventListener("keydown", (e) => {
    // ESC to close navbar
    if (e.key === "Escape") {
        const navbarCollapse = document.getElementById("navMain");
        const navbarToggler = document.querySelector(".navbar-toggler");
        if (navbarCollapse && navbarCollapse.classList.contains("show")) {
            navbarToggler.click();
        }
    }
});

// Initialize tooltips (if Bootstrap tooltip is available)
if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Performance: Lazy load images (if any)
if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute("data-src");
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll("img[data-src]").forEach(img => {
        imageObserver.observe(img);
    });
}

// Add ripple effect to buttons (optional enhancement)
const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
});

// Export functions for potential external use
window.ScannerApp = {
    toggleTheme: () => {
        if (toggleBtn) toggleBtn.click();
    },
    getTheme: () => {
        return root.getAttribute("data-theme") || "light";
    },
    setTheme: (theme) => {
        root.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        if (toggleBtn) {
            toggleBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
        }
    }
};

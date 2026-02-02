// Smooth page transitions
function navigateToPage(url) {
    // Create transition overlay
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    document.body.appendChild(transition);
    
    // Fade in
    setTimeout(() => {
        transition.classList.add('active');
    }, 10);
    
    // Navigate after fade completes
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

// Make function available globally
window.navigateToPage = navigateToPage;

// Add smooth transition to all project links
document.addEventListener('DOMContentLoaded', function() {
    const projectLinks = document.querySelectorAll('[data-project-link]');
    projectLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            navigateToPage(url);
        });
    });
});

// Fade in when page loads
window.addEventListener('load', function() {
    // Only add project-page class if there is no active intro
    const intro = document.querySelector('.intro');
    if (!intro || intro.classList.contains('hidden')) {
        document.body.classList.add('project-page');
    }
    
    // Fade out transition overlay if it exists
    const existingTransition = document.querySelector('.page-transition');
    if (existingTransition) {
        existingTransition.classList.remove('active');
        setTimeout(() => {
            existingTransition.remove();
        }, 500);
    }
});


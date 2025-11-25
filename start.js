document.addEventListener('DOMContentLoaded', () => {
    let intro = document.querySelector('.intro');
    let startSpans = document.querySelectorAll('.start');
    
    // Check if animation has been shown before
    const hasSeenAnimation = localStorage.getItem('hasSeenIntroAnimation');
    
    if (hasSeenAnimation === 'true') {
      // Animation already shown, hide immediately
      if (intro) {
        intro.classList.add('hidden');
      }
      return;
    }
  
    // First time visitor - show animation
    setTimeout(() => {
      startSpans.forEach((span, idx) => {
        setTimeout(() => {
          span.classList.add('active');
        }, (idx + 1) * 400);
      });
  
      setTimeout(() => {
        startSpans.forEach((span, idx) => {
          setTimeout(() => {
            span.classList.remove('active');
            span.classList.add('fade');
          }, (idx + 1) * 50);
        });
      }, 2000);
  
      setTimeout(() => {
        if (intro) {
          intro.style.top = '-100vh';
          // Set flag in localStorage after animation completes
          localStorage.setItem('hasSeenIntroAnimation', 'true');
        }
      }, 4500);
    });
  });

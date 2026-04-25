// Page Access Blocker - Checks if UniData has been unlocked
(function() {
    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Don't block the countdown/index page - it's the gate
    if (currentPage === 'index.html' || currentPage === '') {
        return;
    }

    // Check unlock time: April 28, 2026, 20:00
    const targetDate = new Date(2026, 3, 28, 20, 0, 0).getTime();
    const currentTime = new Date().getTime();
    const hasReachedUnlockTime = currentTime >= targetDate;

    // If time has NOT reached unlock time, block access and redirect to countdown
    if (!hasReachedUnlockTime) {
        window.location.href = 'index.html';
        return;
    }

    // If we get here, the site is unlocked - allow page to load
    localStorage.setItem('unidata-unlocked', 'true');
    localStorage.setItem('unidata-unlock-time', new Date().getTime());
})();
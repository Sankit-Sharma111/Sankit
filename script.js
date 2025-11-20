document.addEventListener('DOMContentLoaded', () => {
        const pageContainer = document.querySelector('.page-container');
        const headerTemplate = document.getElementById('header-template').innerHTML;
        let pageHistory = ['page-home'];
        let iconMoonCache = new Map();
        let iconSunCache = new Map();
        
        // Map of all detail pages including new Cardio and Calf
        const dayExerciseMap = {
            'page-monday': ['page-monday-ex1', 'page-monday-ex2', 'page-monday-ex3', 'page-monday-ex4', 'page-monday-ex5', 'page-monday-ex6', 'page-monday-ex7', 'page-monday-ex8', 'page-monday-ex9', 'page-monday-ex10'],
            'page-tuesday': ['page-tuesday-ex1', 'page-tuesday-ex2'],
            'page-wednesday': ['page-wednesday-ex1', 'page-wednesday-ex2'],
            'page-thursday': ['page-thursday-ex1', 'page-thursday-ex2'],
            'page-friday': ['page-friday-ex1', 'page-friday-ex2'],
            'page-saturday': ['page-saturday-ex1', 'page-saturday-ex2'],
            'page-sunday': ['page-sunday-ex1', 'page-sunday-ex2'],
            'page-cardio': ['page-cardio-ex1', 'page-cardio-ex2'],
            'page-calf': ['page-calf-ex1', 'page-calf-ex2'],
            'page-forearm': ['page-forearm-ex1'],
            'page-protips': ['page-protips-ex1']
        };

        // --- Utilities ---
        const getParentDayId = (detailPageId) => {
            const parts = detailPageId.split('-');
            if (parts[1] === 'protips') return 'page-protips';
            if (parts.length >= 2) return `page-${parts[1]}`;
            return null;
        };

        const getNavExercise = (currentId, direction) => {
            const parentId = getParentDayId(currentId);
            const list = dayExerciseMap[parentId];
            if (!list) return { id: null, title: null };
            const currentIndex = list.indexOf(currentId);
            
            if (direction === 'next') {
                const nextId = list[currentIndex + 1] || null;
                return { id: nextId, title: document.querySelector(`[data-target="${nextId}"]`)?.dataset.title };
            }
            if (direction === 'prev') {
                const prevId = list[currentIndex - 1] || null;
                return { id: prevId, title: document.querySelector(`[data-target="${prevId}"]`)?.dataset.title };
            }
            return { next: list[currentIndex + 1] || null, prev: list[currentIndex - 1] || null };
        };

        // --- Dark Mode ---
        const docElement = document.documentElement;
        const setDarkMode = (isDark) => {
            if (isDark) {
                docElement.classList.add('dark');
                iconMoonCache.forEach(icon => icon.classList.add('hidden'));
                iconSunCache.forEach(icon => icon.classList.remove('hidden'));
            } else {
                docElement.classList.remove('dark');
                iconMoonCache.forEach(icon => icon.classList.remove('hidden'));
                iconSunCache.forEach(icon => icon.classList.add('hidden'));
            }
        };
        const toggleDarkMode = () => {
            const isDark = docElement.classList.contains('dark');
            localStorage.setItem('darkMode', !isDark);
            setDarkMode(!isDark);
        };
        document.querySelectorAll('.btn-dark-mode').forEach((btn, index) => {
            const moon = btn.querySelector('.icon-moon');
            const sun = btn.querySelector('.icon-sun');
            iconMoonCache.set(`btn-${index}`, moon);
            iconSunCache.set(`btn-${index}`, sun);
            btn.addEventListener('click', toggleDarkMode);
        });
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true' || (savedMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }

        // --- Bottom Navigation Logic ---
        const navItems = document.querySelectorAll('.nav-item');
        const mainTabs = ['page-home', 'page-tools', 'page-more'];

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Update Icon Colors
                navItems.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const targetId = e.currentTarget.dataset.nav;

                // Reset visibility classes on all main tabs
                mainTabs.forEach(tabId => {
                    const el = document.getElementById(tabId);
                    if (el) {
                        el.classList.remove('tab-active');
                        el.style.visibility = 'hidden';
                        el.style.transform = 'translateX(0)'; // Ensure they stay in place
                    }
                });

                // Show Target
                const targetEl = document.getElementById(targetId);
                targetEl.classList.add('tab-active');
                targetEl.style.visibility = 'visible';
                
                // Reset Navigation Stack if switching main tabs
                pageHistory = [targetId];
                
                // Hide any active sub-pages from "Exercise" flow if we switch to Tools/More
                if (targetId !== 'page-home') {
                    document.querySelectorAll('.page').forEach(p => {
                         if(!mainTabs.includes(p.id)) {
                             p.classList.remove('page-active', 'page-previous');
                             p.style.transform = '';
                         }
                    });
                }
            });
        });


        // --- Page Navigation ---
        
        const navigateTo = (pageId, pageTitle, isForward = true, isReplacement = false) => {
            const newPage = document.getElementById(pageId);
            if (!newPage) return;
            
            const currentPageId = pageHistory[pageHistory.length - 1];
            const currentPage = document.getElementById(currentPageId);
            
            // 1. Add Header
            if (!newPage.querySelector('.header')) {
                newPage.insertAdjacentHTML('afterbegin', headerTemplate);
                const newHeader = newPage.querySelector('.header');
                const newBackBtn = newHeader.querySelector('.btn-back');
                const newDarkModeBtn = newHeader.querySelector('.btn-dark-mode');
                const newMoon = newDarkModeBtn.querySelector('.icon-moon');
                const newSun = newDarkModeBtn.querySelector('.icon-sun');

                newBackBtn.addEventListener('click', navigateBack);
                newDarkModeBtn.addEventListener('click', toggleDarkMode);

                const cacheKey = `btn-${pageId}`;
                iconMoonCache.set(cacheKey, newMoon);
                iconSunCache.set(cacheKey, newSun);

                if (docElement.classList.contains('dark')) {
                    newMoon.classList.add('hidden');
                    newSun.classList.remove('hidden');
                }
            }
            
            // Set title
            const titleElement = newPage.querySelector('.page-title');
            if(titleElement) titleElement.textContent = pageTitle;
            
            // 2. History Logic
            if (isReplacement) {
                pageHistory.pop();
                pageHistory.push(pageId);
            } else if (currentPageId !== pageId) {
                pageHistory.push(pageId);
            }

            // 3. Animate Leaving Page
            if (currentPage && currentPage.id !== newPage.id) {
                currentPage.classList.remove('page-active', 'tab-active'); // Also remove tab-active if leaving home
                if (isForward) {
                    currentPage.classList.add('page-previous'); 
                    currentPage.classList.remove('page-exit-right');
                } else {
                    currentPage.classList.add('page-exit-right'); 
                    currentPage.classList.remove('page-previous');
                }
            }

            // 4. Animate Entering Page
            if (isForward) {
                newPage.style.transform = ''; 
                newPage.classList.remove('page-previous', 'page-exit-right', 'page-no-transition');
                newPage.classList.add('page-active'); 
            } else {
                newPage.classList.add('page-no-transition');
                newPage.classList.add('page-previous'); 
                newPage.classList.add('page-active');
                newPage.classList.remove('page-exit-right');
                void newPage.offsetWidth; 
                newPage.classList.remove('page-no-transition');
                newPage.style.transform = 'translateX(0)'; 
            }
            
            // 5. Cleanup
            const historyIds = new Set(pageHistory);
            document.querySelectorAll('.page').forEach(p => {
                if (p.id === newPage.id) return;
                if (currentPage && p.id === currentPage.id) return;
                if (mainTabs.includes(p.id) && p.id !== 'page-home') return; // Don't mess with Tools/More if not active

                if (historyIds.has(p.id)) {
                    p.classList.add('page-previous');
                    p.classList.remove('page-active', 'page-exit-right');
                    p.style.transform = ''; 
                } else {
                    p.classList.remove('page-active', 'page-previous', 'page-exit-right', 'tab-active');
                    p.style.transform = ''; 
                }
            });
            
            newPage.scrollTop = 0;
        };

        const navigateBack = () => {
            if (pageHistory.length <= 1) return;
            
            const currentPageId = pageHistory.pop();
            const currentPage = document.getElementById(currentPageId);

            const previousPageId = pageHistory[pageHistory.length - 1];
            const previousPage = document.getElementById(previousPageId);

            if (currentPage) {
                currentPage.classList.remove('page-active');
                currentPage.classList.add('page-exit-right');
                currentPage.classList.remove('page-previous');
            }
            if (previousPage) {
                previousPage.classList.add('page-no-transition');
                previousPage.classList.add('page-previous'); 
                previousPage.classList.add('page-active');
                // If going back to Home, ensure it's visible as a tab
                if (previousPageId === 'page-home') previousPage.classList.add('tab-active'); 
                
                previousPage.classList.remove('page-exit-right');
                void previousPage.offsetWidth; 
                previousPage.classList.remove('page-no-transition');
                previousPage.style.transform = 'translateX(0)'; 
            }
            
             const historyIds = new Set(pageHistory);
            document.querySelectorAll('.page').forEach(p => {
                if (p.id === previousPageId) return; 
                if (p.id === currentPageId) return; 
                if (mainTabs.includes(p.id) && p.id !== 'page-home') return;

                if (!historyIds.has(p.id)) {
                    p.classList.remove('page-active', 'page-previous', 'page-exit-right');
                    p.style.transform = '';
                } else {
                    p.classList.add('page-previous');
                    p.classList.remove('page-active', 'page-exit-right');
                    p.style.transform = '';
                }
            });
        };
        
        // --- Add Click Listeners ---
        document.querySelectorAll('[data-target]').forEach(block => {
            block.addEventListener('click', () => {
                const targetPageId = block.dataset.target;
                const pageTitle = block.dataset.title;
                navigateTo(targetPageId, pageTitle, true, false); 
            });
        });

        // --- Swipe Navigation ---
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        const swipeThreshold = 50; 
        const swipeVerticalThreshold = 75; 

        pageContainer.addEventListener('touchstart', (e) => {
            const currentPageId = pageHistory[pageHistory.length - 1];
            const parentDayId = getParentDayId(currentPageId);
            
            if (parentDayId && dayExerciseMap[parentDayId]?.includes(currentPageId)) {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            } else {
                touchStartX = 0; 
                touchStartY = 0;
            }
        }, { passive: true }); 

        pageContainer.addEventListener('touchend', (e) => {
            if (touchStartX === 0) return; 

            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                
                if (Math.abs(deltaY) > swipeVerticalThreshold) {
                    touchStartX = 0; 
                    return;
                }

                const currentId = pageHistory[pageHistory.length - 1];
                
                if (deltaX > 0) {
                    // --- Swipe Right (Previous) ---
                    const { id: prevId, title: prevTitle } = getNavExercise(currentId, 'prev');
                    if (prevId) {
                        navigateTo(prevId, prevTitle, false, true); // (Backward, Replacement)
                    }
                } else {
                    // --- Swipe Left (Next) ---
                    const { id: nextId, title: nextTitle } = getNavExercise(currentId, 'next');
                    if (nextId) {
                        navigateTo(nextId, nextTitle, true, true); // (Forward, Replacement)
                    }
                }
            }
            touchStartX = 0; 
            touchStartY = 0;
        });

    });
            
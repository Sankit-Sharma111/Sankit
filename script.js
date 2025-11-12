document.addEventListener('DOMContentLoaded', () => {
        const pageContainer = document.querySelector('.page-container');
        const headerTemplate = document.getElementById('header-template').innerHTML;
        const detailNavTemplate = document.getElementById('detail-nav-template').innerHTML;
        let pageHistory = ['page-home'];
        let iconMoonCache = new Map();
        let iconSunCache = new Map();
        
        // Map of all detail pages
        const dayExerciseMap = {
            'page-monday': [
                'page-monday-ex1', 'page-monday-ex2', 'page-monday-ex3', 'page-monday-ex4', 'page-monday-ex5',
                'page-monday-ex6', 'page-monday-ex7', 'page-monday-ex8', 'page-monday-ex9', 'page-monday-ex10',
                'page-monday-ex11', 'page-monday-ex12', 'page-monday-ex13', 'page-monday-ex14', 'page-monday-ex15',
                'page-monday-ex16', 'page-monday-ex17', 'page-monday-ex18', 'page-monday-ex19', 'page-monday-ex20'
            ],
            'page-tuesday': ['page-tuesday-ex1', 'page-tuesday-ex2', 'page-tuesday-ex3'],
            'page-wednesday': ['page-wednesday-ex1', 'page-wednesday-ex2', 'page-wednesday-ex3'],
            'page-thursday': ['page-thursday-ex1'],
            'page-friday': ['page-friday-ex1'],
            'page-saturday': ['page-saturday-ex1'],
            'page-protips': ['page-tip-1', 'page-tip-2', 'page-tip-3']
        };

        // --- Utilities ---
        const getParentDayId = (detailPageId) => {
            const parts = detailPageId.split('-');
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

        // --- Helper Function for Detail Nav ---
        const addDetailNav = (pageElement, pageId) => {
            const parentDayId = getParentDayId(pageId);
            const isDetailPage = !!parentDayId && dayExerciseMap[parentDayId]?.includes(pageId);

            let navBar = pageElement.querySelector('.detail-nav');

            if (isDetailPage) {
                if (!navBar) {
                    pageElement.insertAdjacentHTML('beforeend', detailNavTemplate);
                    navBar = pageElement.querySelector('.detail-nav');
                }
                
                const btnPrev = navBar.querySelector('.btn-prev');
                const btnNext = navBar.querySelector('.btn-next');
                
                const { next: nextId, prev: prevId } = getNavExercise(pageId);
                
                btnPrev.classList.toggle('hidden', !prevId);
                btnNext.classList.toggle('hidden', !nextId);
                
                // *** BUG FIX: Call navigateTo with 'isReplacement = true' ***
                btnPrev.onclick = () => {
                    if (prevId) {
                        const { title: prevTitle } = getNavExercise(pageId, 'prev');
                        navigateTo(prevId, prevTitle, false, true); // (false = anim-backward, true = replace history)
                    }
                };
                
                btnNext.onclick = () => {
                    if (nextId) {
                        const { title: nextTitle } = getNavExercise(pageId, 'next');
                        navigateTo(nextId, nextTitle, true, true); // (true = anim-forward, true = replace history)
                    }
                };
            } else if (navBar) {
                 navBar.remove();
            }
        };


        // --- Page Navigation ---
        // *** BUG FIX: Added 'isReplacement' parameter ***
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
            
            // 2. Add Detail Navigation
            document.querySelectorAll('.detail-nav').forEach(nav => {
                if (nav.closest('.page')?.id !== pageId) nav.remove();
            });
            addDetailNav(newPage, pageId);

            // *** BUG FIX: Modify history based on 'isReplacement' ***
            if (isReplacement) {
                pageHistory.pop(); // Remove old page (e.g., Ex1)
                pageHistory.push(pageId); // Add new page (e.g., Ex2)
            } else if (currentPageId !== pageId) {
                pageHistory.push(pageId); // Standard navigation
            }
            // (अब हिस्ट्री ['Home', 'Monday', 'Ex2'] होगी, 'Ex1' नहीं)

            // --- Animation ---
            document.querySelectorAll('.page-previous').forEach(p => p.classList.remove('page-previous'));

            if (currentPage && currentPage.id !== pageId) {
                if (isForward) {
                    currentPage.classList.add('page-previous');
                } else {
                    currentPage.classList.remove('page-previous');
                }
                currentPage.classList.remove('page-active');
            }

            // (यह बग फिक्स दोबारा क्लिक करने वाले बग को ठीक करता है)
            newPage.style.transform = ''; 
            
            newPage.classList.add('page-active');
            newPage.scrollTop = 0;
        };

        const navigateBack = () => {
            if (pageHistory.length <= 1) return;
            
            const currentPageId = pageHistory.pop();
            const currentPage = document.getElementById(currentPageId);

            const previousPageId = pageHistory[pageHistory.length - 1];
            const previousPage = document.getElementById(previousPageId);

            // Remove nav bar from page we are leaving
            const navBar = currentPage?.querySelector('.detail-nav');
            if(navBar) navBar.remove();

            // --- Animation ---
            if (currentPage) {
                currentPage.classList.remove('page-active');
                currentPage.classList.remove('page-previous');
                currentPage.style.transform = ''; // Reset inline style
            }
            if (previousPage) {
                previousPage.classList.remove('page-previous');
                previousPage.classList.add('page-active');
                
                // (यह बग फिक्स बैक जाने पर बटन गायब होने वाले बग को ठीक करता है)
                addDetailNav(previousPage, previousPageId);
            }
        };
        
        // --- Add Click Listeners ---
        document.querySelectorAll('[data-target]').forEach(block => {
            block.addEventListener('click', () => {
                const targetPageId = block.dataset.target;
                const pageTitle = block.dataset.title;
                // (यह स्टैंडर्ड नेविगेशन 'isReplacement = false' का उपयोग करता है)
                navigateTo(targetPageId, pageTitle, true, false); 
            });
        });
    });
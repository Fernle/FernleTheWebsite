// Admin Color Management System with Supabase Real-time Sync
class AdminColorManager {
    constructor() {
        this.settingsModal = null;
        this.isAdmin = false;
        this.currentPage = this.detectCurrentPage();
        this.defaultColors = this.getDefaultColorsForPage(this.currentPage);
        this.dynamicStyles = {}; // Track dynamic style elements
        
        this.init();
    }
    
    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('gamer.html') || path.includes('gamer')) {
            return 'gamer';
        } else if (path.includes('developer.html') || path.includes('developer')) {
            return 'developer';
        }
        return 'index';
    }
    
    getDefaultColorsForPage(page) {
        // Global defaults (shared across all pages)
        const globalDefaults = {
            gradient: ['#FF6B35', '#E63E3E', '#C93333', '#D4581A'],
            headerBg: { color: '#E63E3E', opacity: 10 },
            headerBorder: { color: '#E63E3E', opacity: 20 },
            siteTitleColor: '#5D4037'
        };
        
        if (page === 'index') {
            // Index page specific colors
            return {
                ...globalDefaults,
                // Main page text colors
                introNameColor: '#5D4037',
                introTextColor: '#5D4037',
                // Navigation button colors
                navButtonBg: '#FFFFFF',
                navButtonText: '#5D4037',
                navButtonHoverBg: '#5D4037',
                navButtonHoverText: '#FFFFFF'
            };
        } else if (page === 'gamer') {
            // Gamer page specific colors
            return {
                ...globalDefaults,
                // Page title colors
                pageTitleColor: '#5D4037',
                pageSubtitleColor: '#5D4037',
                // Admin button colors
                adminButtonBg: '#FF6B35',
                adminButtonText: '#FFFFFF',
                adminButtonHoverBg: '#5D4037',
                adminButtonSecondaryBg: 'transparent',
                adminButtonSecondaryText: '#5D4037',
                adminButtonSecondaryBorder: '#5D4037',
                // Game counter colors
                gameCounterBg: 'rgba(255, 165, 0, 0.1)',
                gameCounterBorder: '#5D4037',
                gameCounterText: '#5D4037',
                gameCounterHoverBg: 'rgba(255, 165, 0, 0.15)',
                // Search input colors
                searchInputText: '#5D4037',
                searchInputBorder: { color: '#8B4513', opacity: 30 },
                searchLabelColor: { color: '#8B4513', opacity: 70 },
                searchLabelFocusColor: '#5D4037',
                searchBarFocusColor: '#FF6B35',
                // Sorting dropdown colors
                sortingDropdownBg: '#FFFFFF',
                sortingDropdownBorder: '#E0E0E0',
                sortingDropdownText: '#333333',
                sortingDropdownHoverBg: '#FF8C42',
                sortingDropdownHoverText: '#FFFFFF',
                // Card colors
                cardFrontBg: 'linear-gradient(120deg, rgba(255, 255, 255, 0.95) 60%, rgba(255, 231, 222, 0.95) 88%, rgba(255, 211, 195, 0.95) 40%, rgba(255, 140, 66, 0.1) 48%)',
                cardBackBg: '#5D4037',
                cardBackText: '#FFFFFF',
                starColor: '#FFD700',
                // Edit/Delete button colors
                editButtonBg: 'rgba(33, 150, 243, 0.9)',
                editButtonHoverBg: '#1976D2',
                deleteButtonBg: 'rgba(244, 67, 54, 0.9)',
                deleteButtonHoverBg: '#D32F2F',
                // Modal colors
                modalOverlayBg: 'rgba(0, 0, 0, 0.8)',
                modalContentBg: '#FFFFFF',
                modalHeaderBg: '#F5F5F5',
                modalBorderColor: '#DDDDDD',
                modalInputBorder: '#DDDDDD',
                modalInputFocusBorder: '#FF6B35',
                modalBtnPrimaryBg: '#FF6B35',
                modalBtnPrimaryText: '#FFFFFF',
                modalBtnSecondaryBg: '#F5F5F5',
                modalBtnSecondaryText: '#333333'
            };
        }
        
        return globalDefaults;
    }
    
    async init() {
        // Wait for Supabase to be loaded
        if (typeof window.supabase === 'undefined') {
            console.log('Waiting for Supabase to load...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // First, load colors from localStorage for instant display
        this.loadColorsFromLocalStorage();
        
        // Then load from Supabase to sync with latest changes
        await this.loadColorsFromSupabase();
        
        this.checkAdminStatus();
        this.setupEventListeners();
    }
    
    loadColorsFromLocalStorage() {
        const allColors = localStorage.getItem('siteColors');
        if (allColors) {
            try {
                const parsed = JSON.parse(allColors);
                // Merge global and page-specific colors
                const mergedColors = this.mergeGlobalAndPageColors(parsed);
                this.applyColors(mergedColors);
            } catch (err) {
                console.error('Failed to parse colors from localStorage:', err);
            }
        }
    }
    
    mergeGlobalAndPageColors(allColors) {
        // Merge global colors with current page's colors
        let globalColors = {};
        let pageColors = {};
        
        // Check if it's the new format (with global key) or old format
        if (allColors.global) {
            // New format: has global key
            globalColors = allColors.global;
            pageColors = allColors[this.currentPage] || {};
        } else if (allColors.index || allColors.gamer || allColors.developer) {
            // Old format: page-based but no global key
            // Extract global colors from first available page
            const firstPage = allColors.index || allColors.gamer || allColors.developer;
            if (firstPage) {
                globalColors = {
                    gradient: firstPage.gradient,
                    headerBg: firstPage.headerBg,
                    headerBorder: firstPage.headerBorder,
                    siteTitleColor: firstPage.siteTitleColor
                };
                // Remove global colors from page colors
                pageColors = allColors[this.currentPage] || {};
                if (pageColors.gradient) delete pageColors.gradient;
                if (pageColors.headerBg) delete pageColors.headerBg;
                if (pageColors.headerBorder) delete pageColors.headerBorder;
                if (pageColors.siteTitleColor) delete pageColors.siteTitleColor;
            }
        } else if (allColors.gradient) {
            // Oldest format: flat structure
            globalColors = {
                gradient: allColors.gradient,
                headerBg: allColors.headerBg,
                headerBorder: allColors.headerBorder,
                siteTitleColor: allColors.siteTitleColor
            };
            pageColors = { ...allColors };
            delete pageColors.gradient;
            delete pageColors.headerBg;
            delete pageColors.headerBorder;
            delete pageColors.siteTitleColor;
        }
        
        // Merge global and page colors (page colors override global for shared keys)
        return { ...globalColors, ...pageColors };
    }
    
    async checkAdminStatus() {
        // Check if admin is logged in via Supabase Auth
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.isAdmin = true;
                this.showSettingsButton();
            } else {
                this.isAdmin = false;
                this.hideSettingsButton();
            }
        } catch (error) {
            console.log('Could not check admin status:', error);
            this.isAdmin = false;
            this.hideSettingsButton();
        }
    }
    
    showSettingsButton() {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = 'flex';
        }
    }
    
    hideSettingsButton() {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Listen for admin login/logout
        window.addEventListener('adminLogin', () => {
            this.isAdmin = true;
            this.showSettingsButton();
        });
        
        window.addEventListener('adminLogout', () => {
            this.isAdmin = false;
            this.hideSettingsButton();
            this.toggleSettings(false);
        });
        
        // Setup login modal (Ctrl + Shift + A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.showLoginModal();
            }
        });
        
        // Setup login form
        const loginForm = document.getElementById('login-form');
        const loginClose = document.getElementById('login-close');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
        
        if (loginClose) {
            loginClose.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }
        
        // Setup color picker and slider listeners
        const colorPickers = document.querySelectorAll('.color-picker');
        colorPickers.forEach(picker => {
            picker.addEventListener('input', (e) => {
                this.handleColorChange(e);
            });
        });
        
        const opacitySliders = document.querySelectorAll('.opacity-slider');
        opacitySliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.handleOpacityChange(e);
            });
        });
        
        // Setup color text input listeners (for manual hex code entry)
        const colorTextInputs = document.querySelectorAll('.color-text:not(.small)');
        colorTextInputs.forEach(textInput => {
            textInput.addEventListener('input', (e) => {
                this.handleTextColorChange(e);
            });
            textInput.addEventListener('blur', (e) => {
                this.handleTextColorBlur(e);
            });
        });
    }
    
    isValidHexColor(hex) {
        // Check if hex color is valid (#RRGGBB or #RGB format)
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexPattern.test(hex);
    }
    
    normalizeHexColor(hex) {
        // Remove # if present, normalize to uppercase
        hex = hex.trim().replace('#', '').toUpperCase();
        
        // Convert 3-digit to 6-digit format if needed
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        // Add # prefix
        return '#' + hex;
    }
    
    handleTextColorChange(e) {
        const textInput = e.target;
        const value = textInput.value.trim();
        
        // If empty or incomplete, don't validate yet (user might still be typing)
        if (value === '' || value.length < 3) {
            return;
        }
        
        // If it looks like a valid hex color, normalize and update
        if (this.isValidHexColor(value)) {
            const normalized = this.normalizeHexColor(value);
            textInput.value = normalized;
            
            // Find corresponding color picker
            const pickerId = textInput.id.replace('-text', '');
            const picker = document.getElementById(pickerId);
            
            if (picker) {
                picker.value = normalized;
                // Trigger the color change handler
                this.handleColorChange({ target: picker });
            }
        }
    }
    
    handleTextColorBlur(e) {
        const textInput = e.target;
        const value = textInput.value.trim();
        
        // If empty, restore to color picker value
        if (value === '') {
            const pickerId = textInput.id.replace('-text', '');
            const picker = document.getElementById(pickerId);
            if (picker) {
                textInput.value = picker.value;
            }
            return;
        }
        
        // Validate and normalize hex color
        if (this.isValidHexColor(value)) {
            const normalized = this.normalizeHexColor(value);
            textInput.value = normalized;
            
            const pickerId = textInput.id.replace('-text', '');
            const picker = document.getElementById(pickerId);
            if (picker) {
                picker.value = normalized;
                this.handleColorChange({ target: picker });
            }
        } else {
            // Invalid hex color, restore to picker value
            const pickerId = textInput.id.replace('-text', '');
            const picker = document.getElementById(pickerId);
            if (picker) {
                textInput.value = picker.value;
            }
        }
    }
    
    handleColorChange(e) {
        const picker = e.target;
        const textId = picker.id + '-text';
        const textInput = document.getElementById(textId);
        
        if (textInput) {
            textInput.value = picker.value;
        }
        
        // Live preview for gradient colors
        if (picker.id.startsWith('gradient-color-')) {
            this.updateGradientPreview();
        } else if (picker.id === 'header-bg') {
            this.updateHeaderPreview();
        } else if (picker.id === 'header-border') {
            this.updateHeaderPreview();
        } else if (picker.id === 'site-title-color') {
            // Global: site title color applies to all pages
            const siteTitle = document.querySelector('.site-title');
            if (siteTitle) siteTitle.style.color = picker.value;
        } else if (this.currentPage === 'index') {
            // Index page specific color previews
            if (picker.id === 'intro-name-color') {
                const introName = document.querySelector('.intro-name');
                if (introName) introName.style.color = picker.value;
            } else if (picker.id === 'intro-text-color') {
                const introText = document.querySelector('.intro-text');
                if (introText) introText.style.color = picker.value;
            } else if (picker.id === 'nav-button-bg') {
                const navBtns = document.querySelectorAll('.nav-btn:not(.gamer-btn):not(.developer-btn)');
                navBtns.forEach(btn => btn.style.background = picker.value);
            } else if (picker.id === 'nav-button-text') {
                const navBtns = document.querySelectorAll('.nav-btn');
                navBtns.forEach(btn => btn.style.color = picker.value);
            } else if (picker.id === 'nav-button-hover-bg') {
                this.setDynamicStyle('nav-button-hover-bg-style', `.nav-btn:not(.gamer-btn):not(.developer-btn):hover { background: ${picker.value} !important; border-color: ${picker.value} !important; }`);
            } else if (picker.id === 'nav-button-hover-text') {
                this.setDynamicStyle('nav-button-hover-text-style', `.nav-btn:hover { color: ${picker.value} !important; }`);
            }
        } else if (this.currentPage === 'gamer') {
            // Gamer-specific color previews
            if (picker.id === 'page-title-color') {
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) pageTitle.style.color = picker.value;
            } else if (picker.id === 'page-subtitle-color') {
                const pageSubtitle = document.querySelector('.page-subtitle');
                if (pageSubtitle) pageSubtitle.style.color = picker.value;
            } else if (picker.id === 'admin-button-bg') {
                const adminBtns = document.querySelectorAll('.admin-btn:not(.secondary)');
                adminBtns.forEach(btn => btn.style.background = picker.value);
            } else if (picker.id === 'admin-button-hover-bg') {
                this.setDynamicStyle('admin-button-hover-style', `.admin-btn:not(.secondary):hover { background: ${picker.value} !important; }`);
            } else if (picker.id === 'game-counter-border') {
                const gameCounter = document.querySelector('.game-counter');
                if (gameCounter) gameCounter.style.borderColor = picker.value;
            } else if (picker.id === 'game-counter-text') {
                const gameCounter = document.querySelector('.game-counter');
                if (gameCounter) gameCounter.style.color = picker.value;
            } else if (picker.id === 'search-input-text') {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.style.color = picker.value;
            } else if (picker.id === 'search-input-border-color') {
                const searchInput = document.querySelector('.search-input');
                const opacityInput = document.getElementById('search-input-border-opacity');
                if (searchInput && opacityInput) {
                    searchInput.style.borderBottomColor = this.hexToRgba(picker.value, opacityInput.value);
                }
            } else if (picker.id === 'search-label-focus-color') {
                this.setDynamicStyle('search-label-focus-style', `.search-input:focus ~ .search-label, .search-input:not(:placeholder-shown) ~ .search-label { color: ${picker.value} !important; }`);
            } else if (picker.id === 'search-bar-focus-color') {
                this.setDynamicStyle('search-bar-focus-style', `.search-bar:before, .search-bar:after { background: ${picker.value} !important; }`);
            } else if (picker.id === 'sorting-dropdown-bg') {
                this.setDynamicStyle('sorting-dropdown-bg-style', `.sorting-submenu { background: ${picker.value} !important; }`);
            } else if (picker.id === 'sorting-dropdown-text') {
                const sortingLinks = document.querySelectorAll('.sorting-link, .submenu-link');
                sortingLinks.forEach(link => link.style.color = picker.value);
            } else if (picker.id === 'sorting-dropdown-hover-bg') {
                this.setDynamicStyle('sorting-hover-bg-style', `.sorting-item:hover .sorting-link::after, .submenu-link:hover:before { background: ${picker.value} !important; }`);
            } else if (picker.id === 'sorting-dropdown-hover-text') {
                this.setDynamicStyle('sorting-hover-text-style', `.sorting-item:hover .sorting-link, .submenu-link:hover { color: ${picker.value} !important; }`);
            } else if (picker.id === 'card-back-bg') {
                const flipCards = document.querySelectorAll('.flip-card-back');
                flipCards.forEach(card => card.style.background = picker.value);
            } else if (picker.id === 'card-back-text') {
                const flipCards = document.querySelectorAll('.flip-card-back');
                flipCards.forEach(card => card.style.color = picker.value);
            } else if (picker.id === 'star-color') {
                this.setDynamicStyle('star-color-style', `.star.filled, .star.half { background: ${picker.value} !important; }`);
            } else if (picker.id === 'edit-button-hover-bg') {
                this.setDynamicStyle('edit-button-hover-style', `.edit-btn:hover { background: ${picker.value} !important; }`);
            } else if (picker.id === 'delete-button-hover-bg') {
                this.setDynamicStyle('delete-button-hover-style', `.delete-btn:hover { background: ${picker.value} !important; }`);
            } else if (picker.id === 'game-counter-bg-color') {
                const gameCounter = document.querySelector('.game-counter');
                const opacityInput = document.getElementById('game-counter-bg-opacity');
                if (gameCounter && opacityInput) {
                    gameCounter.style.background = this.hexToRgba(picker.value, opacityInput.value);
                }
            } else if (picker.id === 'search-label-color-color') {
                const searchLabel = document.querySelector('.search-label');
                const opacityInput = document.getElementById('search-label-color-opacity');
                if (searchLabel && opacityInput) {
                    searchLabel.style.color = this.hexToRgba(picker.value, opacityInput.value);
                }
            } else if (picker.id === 'edit-button-bg-color') {
                const editBtns = document.querySelectorAll('.edit-btn');
                const opacityInput = document.getElementById('edit-button-bg-opacity');
                if (opacityInput) {
                    editBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(picker.value, opacityInput.value);
                    });
                }
            } else if (picker.id === 'delete-button-bg-color') {
                const deleteBtns = document.querySelectorAll('.delete-btn');
                const opacityInput = document.getElementById('delete-button-bg-opacity');
                if (opacityInput) {
                    deleteBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(picker.value, opacityInput.value);
                    });
                }
            }
        }
    }
    
    handleOpacityChange(e) {
        const slider = e.target;
        const textId = slider.id + '-text';
        const textInput = document.getElementById(textId);
        
        if (textInput) {
            textInput.value = slider.value + '%';
        }
        
        if (slider.id === 'header-bg-opacity') {
            this.updateHeaderPreview();
        } else if (slider.id === 'header-border-opacity') {
            this.updateHeaderPreview();
        } else if (this.currentPage === 'gamer') {
            // Gamer-specific opacity previews
            if (slider.id === 'game-counter-bg-opacity') {
                const gameCounter = document.querySelector('.game-counter');
                const colorInput = document.getElementById('game-counter-bg-color');
                if (gameCounter && colorInput) {
                    gameCounter.style.background = this.hexToRgba(colorInput.value, slider.value);
                }
            } else if (slider.id === 'search-input-border-opacity') {
                const searchInput = document.querySelector('.search-input');
                const colorInput = document.getElementById('search-input-border-color');
                if (searchInput && colorInput) {
                    searchInput.style.borderBottomColor = this.hexToRgba(colorInput.value, slider.value);
                }
            } else if (slider.id === 'search-label-color-opacity') {
                const searchLabel = document.querySelector('.search-label');
                const colorInput = document.getElementById('search-label-color-color');
                if (searchLabel && colorInput) {
                    searchLabel.style.color = this.hexToRgba(colorInput.value, slider.value);
                }
            } else if (slider.id === 'edit-button-bg-opacity') {
                const editBtns = document.querySelectorAll('.edit-btn');
                const colorInput = document.getElementById('edit-button-bg-color');
                if (colorInput) {
                    editBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(colorInput.value, slider.value);
                    });
                }
            } else if (slider.id === 'delete-button-bg-opacity') {
                const deleteBtns = document.querySelectorAll('.delete-btn');
                const colorInput = document.getElementById('delete-button-bg-color');
                if (colorInput) {
                    deleteBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(colorInput.value, slider.value);
                    });
                }
            }
        }
    }
    
    updateGradientPreview() {
        const color1 = document.getElementById('gradient-color-1').value;
        const color2 = document.getElementById('gradient-color-2').value;
        const color3 = document.getElementById('gradient-color-3').value;
        const color4 = document.getElementById('gradient-color-4').value;
        
        document.body.style.background = `linear-gradient(-45deg, ${color1}, ${color2}, ${color3}, ${color4})`;
        document.body.style.backgroundSize = '400% 400%';
        document.body.style.backgroundAttachment = 'scroll';
        document.body.style.animation = 'gradient 15s ease infinite';
    }
    
    updateHeaderPreview() {
        const headerBg = document.getElementById('header-bg').value;
        const headerBgOpacity = document.getElementById('header-bg-opacity').value;
        const headerBorder = document.getElementById('header-border').value;
        const headerBorderOpacity = document.getElementById('header-border-opacity').value;
        
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.style.background = this.hexToRgba(headerBg, headerBgOpacity);
            nav.style.borderBottom = `1px solid ${this.hexToRgba(headerBorder, headerBorderOpacity)}`;
        }
    }
    
    updateAllPreviews() {
        this.updateGradientPreview();
        this.updateHeaderPreview();
        // Page-specific previews are handled in handleColorChange
    }
    
    hexToRgba(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }
    
    toggleSettings(show) {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        
        if (show === undefined) {
            modal.classList.toggle('active');
        } else if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
        
        if (modal.classList.contains('active')) {
            this.loadCurrentColors();
        }
    }
    
    loadCurrentColors() {
        // First, try to read colors from the DOM (what's actually applied on the page)
        // This ensures we show the current colors, not just what's in localStorage
        let colorsFromDOM = this.readColorsFromDOM();
        
        // Load from localStorage
        const allColorsStr = localStorage.getItem('siteColors');
        let mergedColors = {};
        
        if (allColorsStr) {
            try {
                const allColors = JSON.parse(allColorsStr);
                // Merge global and page-specific colors
                mergedColors = this.mergeGlobalAndPageColors(allColors);
            } catch (err) {
                console.error('Failed to parse colors from localStorage:', err);
            }
        }
        
        // Merge DOM colors with localStorage colors (DOM colors take precedence for visible elements)
        if (colorsFromDOM && Object.keys(colorsFromDOM).length > 0) {
            // Prioritize DOM colors for elements we can read
            mergedColors = { ...mergedColors, ...colorsFromDOM };
        }
        
        // If still no colors, use defaults
        if (!mergedColors || Object.keys(mergedColors).length === 0) {
            mergedColors = this.defaultColors;
        }
        
        // Apply colors to inputs
        this.applyColorsToInputs(mergedColors);
        this.updateAllPreviews();
    }
    
    readColorsFromDOM() {
        // Read currently applied colors from DOM elements
        const colors = {};
        
        // Read gradient from body background (check inline style first, then computed style)
        const bodyBgStyle = document.body.style.background || document.body.style.backgroundImage;
        const bodyBgComputed = window.getComputedStyle(document.body).backgroundImage;
        const bodyBg = bodyBgStyle || bodyBgComputed;
        
        if (bodyBg && bodyBg.includes('gradient')) {
            // Extract colors from gradient
            const colorMatches = bodyBg.match(/#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}/g);
            if (colorMatches && colorMatches.length >= 4) {
                colors.gradient = colorMatches.slice(0, 4);
            } else if (colorMatches && colorMatches.length > 0) {
                // If less than 4 colors, use what we have and pad with defaults
                colors.gradient = colorMatches;
                while (colors.gradient.length < 4) {
                    colors.gradient.push('#FF6B35');
                }
            }
        }
        
        // Also check localStorage for gradient if DOM reading failed
        if (!colors.gradient || colors.gradient.length === 0) {
            const allColorsStr = localStorage.getItem('siteColors');
            if (allColorsStr) {
                try {
                    const allColors = JSON.parse(allColorsStr);
                    let storedColors = allColors;
                    if (allColors.index || allColors.gamer || allColors.developer) {
                        storedColors = allColors[this.currentPage] || allColors.index || allColors.gamer || allColors.developer;
                    }
                    if (storedColors && storedColors.gradient) {
                        colors.gradient = storedColors.gradient;
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }
        
        // Read header colors
        const header = document.querySelector('header');
        if (header) {
            const headerBg = window.getComputedStyle(header).backgroundColor;
            const headerBorder = window.getComputedStyle(header).borderBottomColor;
            // Parse rgba to hex and opacity (simplified)
            // For now, we'll rely on localStorage for header colors
        }
        
        // Read Index page specific colors
        if (this.currentPage === 'index') {
            const siteTitle = document.querySelector('.site-title');
            if (siteTitle) {
                const color = window.getComputedStyle(siteTitle).color;
                colors.siteTitleColor = this.rgbToHex(color);
            }
            
            const introName = document.querySelector('.intro-name');
            if (introName) {
                const color = window.getComputedStyle(introName).color;
                colors.introNameColor = this.rgbToHex(color);
            }
            
            const introText = document.querySelector('.intro-text');
            if (introText) {
                const color = window.getComputedStyle(introText).color;
                colors.introTextColor = this.rgbToHex(color);
            }
            
            // Read navigation button colors
            const navBtn = document.querySelector('.nav-btn');
            if (navBtn) {
                const bg = window.getComputedStyle(navBtn).backgroundColor;
                const text = window.getComputedStyle(navBtn).color;
                colors.navButtonBg = this.rgbToHex(bg);
                colors.navButtonText = this.rgbToHex(text);
            }
        }
        
        // Read Gamer page specific colors
        if (this.currentPage === 'gamer') {
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                const color = window.getComputedStyle(pageTitle).color;
                colors.pageTitleColor = this.rgbToHex(color);
            }
            
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageSubtitle) {
                const color = window.getComputedStyle(pageSubtitle).color;
                colors.pageSubtitleColor = this.rgbToHex(color);
            }
            
            // Add more gamer page color readings as needed
        }
        
        return colors;
    }
    
    rgbToHex(rgb) {
        // Convert rgb/rgba string to hex
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
            return '#000000';
        }
        
        // Handle rgb() format
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`.toUpperCase();
        }
        
        // If already hex, return as is
        if (rgb.startsWith('#')) {
            return rgb.toUpperCase();
        }
        
        return '#000000';
    }
    
    setDynamicStyle(id, css) {
        // Remove old style if it exists
        const oldStyle = document.getElementById(id);
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // Create and append new style
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
        this.dynamicStyles[id] = style;
    }
    
    applyColorsToInputs(colors) {
        if (colors.gradient) {
            for (let i = 0; i < colors.gradient.length; i++) {
                const picker = document.getElementById(`gradient-color-${i + 1}`);
                const textInput = document.getElementById(`gradient-color-${i + 1}-text`);
                if (picker) picker.value = colors.gradient[i];
                if (textInput) textInput.value = colors.gradient[i];
            }
        }
        
        if (colors.headerBg) {
            const picker = document.getElementById('header-bg');
            const opacitySlider = document.getElementById('header-bg-opacity');
            const opacityText = document.getElementById('header-bg-opacity-text');
            if (picker) picker.value = colors.headerBg.color;
            if (opacitySlider) opacitySlider.value = colors.headerBg.opacity;
            if (opacityText) opacityText.value = colors.headerBg.opacity + '%';
        }
        
        if (colors.headerBorder) {
            const picker = document.getElementById('header-border');
            const opacitySlider = document.getElementById('header-border-opacity');
            const opacityText = document.getElementById('header-border-opacity-text');
            if (picker) picker.value = colors.headerBorder.color;
            if (opacitySlider) opacitySlider.value = colors.headerBorder.opacity;
            if (opacityText) opacityText.value = colors.headerBorder.opacity + '%';
        }
        
        // Apply global site title color (available on all pages)
        if (colors.siteTitleColor) {
            const picker = document.getElementById('site-title-color');
            const textInput = document.getElementById('site-title-color-text');
            if (picker) picker.value = colors.siteTitleColor;
            if (textInput) textInput.value = colors.siteTitleColor;
        }
        
        // Apply Index page specific colors if on index page
        if (this.currentPage === 'index') {
            if (colors.introNameColor) {
                const picker = document.getElementById('intro-name-color');
                const textInput = document.getElementById('intro-name-color-text');
                if (picker) picker.value = colors.introNameColor;
                if (textInput) textInput.value = colors.introNameColor;
            }
            if (colors.introTextColor) {
                const picker = document.getElementById('intro-text-color');
                const textInput = document.getElementById('intro-text-color-text');
                if (picker) picker.value = colors.introTextColor;
                if (textInput) textInput.value = colors.introTextColor;
            }
            if (colors.navButtonBg) {
                const picker = document.getElementById('nav-button-bg');
                const textInput = document.getElementById('nav-button-bg-text');
                if (picker) picker.value = colors.navButtonBg;
                if (textInput) textInput.value = colors.navButtonBg;
            }
            if (colors.navButtonText) {
                const picker = document.getElementById('nav-button-text');
                const textInput = document.getElementById('nav-button-text-text');
                if (picker) picker.value = colors.navButtonText;
                if (textInput) textInput.value = colors.navButtonText;
            }
            if (colors.navButtonHoverBg) {
                const picker = document.getElementById('nav-button-hover-bg');
                const textInput = document.getElementById('nav-button-hover-bg-text');
                if (picker) picker.value = colors.navButtonHoverBg;
                if (textInput) textInput.value = colors.navButtonHoverBg;
            }
            if (colors.navButtonHoverText) {
                const picker = document.getElementById('nav-button-hover-text');
                const textInput = document.getElementById('nav-button-hover-text-text');
                if (picker) picker.value = colors.navButtonHoverText;
                if (textInput) textInput.value = colors.navButtonHoverText;
            }
        }
        
        // Apply Gamer-specific colors if on gamer page
        if (this.currentPage === 'gamer') {
            // Page titles
            if (colors.pageTitleColor) {
                const picker = document.getElementById('page-title-color');
                const textInput = document.getElementById('page-title-color-text');
                if (picker) picker.value = colors.pageTitleColor;
                if (textInput) textInput.value = colors.pageTitleColor;
            }
            if (colors.pageSubtitleColor) {
                const picker = document.getElementById('page-subtitle-color');
                const textInput = document.getElementById('page-subtitle-color-text');
                if (picker) picker.value = colors.pageSubtitleColor;
                if (textInput) textInput.value = colors.pageSubtitleColor;
            }
            
            // Admin buttons
            if (colors.adminButtonBg) {
                const picker = document.getElementById('admin-button-bg');
                const textInput = document.getElementById('admin-button-bg-text');
                if (picker) picker.value = colors.adminButtonBg;
                if (textInput) textInput.value = colors.adminButtonBg;
            }
            if (colors.adminButtonHoverBg) {
                const picker = document.getElementById('admin-button-hover-bg');
                const textInput = document.getElementById('admin-button-hover-bg-text');
                if (picker) picker.value = colors.adminButtonHoverBg;
                if (textInput) textInput.value = colors.adminButtonHoverBg;
            }
            
            // Game counter
            if (colors.gameCounterBg && typeof colors.gameCounterBg === 'object') {
                const picker = document.getElementById('game-counter-bg-color');
                const opacitySlider = document.getElementById('game-counter-bg-opacity');
                const opacityText = document.getElementById('game-counter-bg-opacity-text');
                if (picker) picker.value = colors.gameCounterBg.color;
                if (opacitySlider) opacitySlider.value = colors.gameCounterBg.opacity;
                if (opacityText) opacityText.value = colors.gameCounterBg.opacity + '%';
            }
            if (colors.gameCounterBorder) {
                const picker = document.getElementById('game-counter-border');
                const textInput = document.getElementById('game-counter-border-text');
                if (picker) picker.value = colors.gameCounterBorder;
                if (textInput) textInput.value = colors.gameCounterBorder;
            }
            if (colors.gameCounterText) {
                const picker = document.getElementById('game-counter-text');
                const textInput = document.getElementById('game-counter-text-text');
                if (picker) picker.value = colors.gameCounterText;
                if (textInput) textInput.value = colors.gameCounterText;
            }
            
            // Search input
            if (colors.searchInputText) {
                const picker = document.getElementById('search-input-text');
                const textInput = document.getElementById('search-input-text-text');
                if (picker) picker.value = colors.searchInputText;
                if (textInput) textInput.value = colors.searchInputText;
            }
            if (colors.searchInputBorder && typeof colors.searchInputBorder === 'object') {
                const picker = document.getElementById('search-input-border-color');
                const opacitySlider = document.getElementById('search-input-border-opacity');
                const opacityText = document.getElementById('search-input-border-opacity-text');
                if (picker) picker.value = colors.searchInputBorder.color;
                if (opacitySlider) opacitySlider.value = colors.searchInputBorder.opacity;
                if (opacityText) opacityText.value = colors.searchInputBorder.opacity + '%';
            }
            if (colors.searchLabelColor && typeof colors.searchLabelColor === 'object') {
                const picker = document.getElementById('search-label-color-color');
                const opacitySlider = document.getElementById('search-label-color-opacity');
                const opacityText = document.getElementById('search-label-color-opacity-text');
                if (picker) picker.value = colors.searchLabelColor.color;
                if (opacitySlider) opacitySlider.value = colors.searchLabelColor.opacity;
                if (opacityText) opacityText.value = colors.searchLabelColor.opacity + '%';
            }
            if (colors.searchLabelFocusColor) {
                const picker = document.getElementById('search-label-focus-color');
                const textInput = document.getElementById('search-label-focus-color-text');
                if (picker) picker.value = colors.searchLabelFocusColor;
                if (textInput) textInput.value = colors.searchLabelFocusColor;
            }
            if (colors.searchBarFocusColor) {
                const picker = document.getElementById('search-bar-focus-color');
                const textInput = document.getElementById('search-bar-focus-color-text');
                if (picker) picker.value = colors.searchBarFocusColor;
                if (textInput) textInput.value = colors.searchBarFocusColor;
            }
            
            // Sorting dropdown
            if (colors.sortingDropdownBg) {
                const picker = document.getElementById('sorting-dropdown-bg');
                const textInput = document.getElementById('sorting-dropdown-bg-text');
                if (picker) picker.value = colors.sortingDropdownBg;
                if (textInput) textInput.value = colors.sortingDropdownBg;
            }
            if (colors.sortingDropdownText) {
                const picker = document.getElementById('sorting-dropdown-text');
                const textInput = document.getElementById('sorting-dropdown-text-text');
                if (picker) picker.value = colors.sortingDropdownText;
                if (textInput) textInput.value = colors.sortingDropdownText;
            }
            if (colors.sortingDropdownHoverBg) {
                const picker = document.getElementById('sorting-dropdown-hover-bg');
                const textInput = document.getElementById('sorting-dropdown-hover-bg-text');
                if (picker) picker.value = colors.sortingDropdownHoverBg;
                if (textInput) textInput.value = colors.sortingDropdownHoverBg;
            }
            if (colors.sortingDropdownHoverText) {
                const picker = document.getElementById('sorting-dropdown-hover-text');
                const textInput = document.getElementById('sorting-dropdown-hover-text-text');
                if (picker) picker.value = colors.sortingDropdownHoverText;
                if (textInput) textInput.value = colors.sortingDropdownHoverText;
            }
            
            // Cards
            if (colors.cardBackBg) {
                const picker = document.getElementById('card-back-bg');
                const textInput = document.getElementById('card-back-bg-text');
                if (picker) picker.value = colors.cardBackBg;
                if (textInput) textInput.value = colors.cardBackBg;
            }
            if (colors.cardBackText) {
                const picker = document.getElementById('card-back-text');
                const textInput = document.getElementById('card-back-text-text');
                if (picker) picker.value = colors.cardBackText;
                if (textInput) textInput.value = colors.cardBackText;
            }
            if (colors.starColor) {
                const picker = document.getElementById('star-color');
                const textInput = document.getElementById('star-color-text');
                if (picker) picker.value = colors.starColor;
                if (textInput) textInput.value = colors.starColor;
            }
            
            // Action buttons
            if (colors.editButtonBg && typeof colors.editButtonBg === 'object') {
                const picker = document.getElementById('edit-button-bg-color');
                const opacitySlider = document.getElementById('edit-button-bg-opacity');
                const opacityText = document.getElementById('edit-button-bg-opacity-text');
                if (picker) picker.value = colors.editButtonBg.color;
                if (opacitySlider) opacitySlider.value = colors.editButtonBg.opacity;
                if (opacityText) opacityText.value = colors.editButtonBg.opacity + '%';
            }
            if (colors.editButtonHoverBg) {
                const picker = document.getElementById('edit-button-hover-bg');
                const textInput = document.getElementById('edit-button-hover-bg-text');
                if (picker) picker.value = colors.editButtonHoverBg;
                if (textInput) textInput.value = colors.editButtonHoverBg;
            }
            if (colors.deleteButtonBg && typeof colors.deleteButtonBg === 'object') {
                const picker = document.getElementById('delete-button-bg-color');
                const opacitySlider = document.getElementById('delete-button-bg-opacity');
                const opacityText = document.getElementById('delete-button-bg-opacity-text');
                if (picker) picker.value = colors.deleteButtonBg.color;
                if (opacitySlider) opacitySlider.value = colors.deleteButtonBg.opacity;
                if (opacityText) opacityText.value = colors.deleteButtonBg.opacity + '%';
            }
            if (colors.deleteButtonHoverBg) {
                const picker = document.getElementById('delete-button-hover-bg');
                const textInput = document.getElementById('delete-button-hover-bg-text');
                if (picker) picker.value = colors.deleteButtonHoverBg;
                if (textInput) textInput.value = colors.deleteButtonHoverBg;
            }
        }
    }
    
    updateAllPreviews() {
        this.updateGradientPreview();
        this.updateHeaderPreview();
        this.updateTextPreview();
    }
    
    async loadColorsFromSupabase() {
        try {
            const { data, error } = await window.supabase
                .from('site_settings')
                .select('colors, updated_at')
                .eq('id', 1)
                .single();
            
            if (error) {
                // Table doesn't exist yet or no data
                console.log('No site settings found, using defaults. Error:', error);
                return;
            }
            
            if (data && data.colors) {
                // Check if it's the new format (page-based) or old format (flat)
                let allPageColors = data.colors;
                
                // If old format, migrate it
                if (data.colors.gradient && !data.colors.index && !data.colors.gamer) {
                    // Old format: flat structure, migrate to new format
                    allPageColors = {
                        index: data.colors,
                        gamer: data.colors,
                        developer: data.colors
                    };
                }
                
                // Only update if Supabase has newer data
                const localData = localStorage.getItem('siteColorsLastUpdated');
                
                if (!localData || new Date(data.updated_at) > new Date(localData)) {
                    // Merge with local storage to preserve other pages' colors
                    const localColorsStr = localStorage.getItem('siteColors');
                    let mergedColors = allPageColors;
                    
                    if (localColorsStr) {
                        try {
                            const localColors = JSON.parse(localColorsStr);
                            // If local is new format, merge pages
                            if (localColors.index || localColors.gamer || localColors.developer) {
                                mergedColors = {
                                    ...localColors,
                                    ...allPageColors // Supabase data takes precedence
                                };
                            } else {
                                // Local is old format, use Supabase data
                                mergedColors = allPageColors;
                            }
                        } catch (e) {
                            // If parsing fails, use Supabase data
                            mergedColors = allPageColors;
                        }
                    }
                    
                    localStorage.setItem('siteColors', JSON.stringify(mergedColors));
                    localStorage.setItem('siteColorsLastUpdated', data.updated_at);
                    
                    // Merge global and page-specific colors and apply
                    const mergedColorsToApply = this.mergeGlobalAndPageColors(mergedColors);
                    this.applyColors(mergedColorsToApply);
                }
            }
        } catch (err) {
            console.log('Could not load colors from Supabase:', err);
        }
    }
    
    async saveColorsToSupabase(globalColors, pageColors) {
        try {
            // First, get existing colors from Supabase to preserve other pages
            const { data: existingData } = await window.supabase
                .from('site_settings')
                .select('colors')
                .eq('id', 1)
                .single();
            
            let allPageColors = {};
            
            // If existing data exists, use it as base
            if (existingData && existingData.colors) {
                // Check if it's new format (with global key) or old format
                if (existingData.colors.global) {
                    // New format: has global key
                    allPageColors = existingData.colors;
                } else if (existingData.colors.index || existingData.colors.gamer || existingData.colors.developer) {
                    // Old format: page-based but no global key
                    allPageColors = existingData.colors;
                } else if (existingData.colors.gradient) {
                    // Oldest format: migrate to new format
                    allPageColors = {
                        index: existingData.colors,
                        gamer: existingData.colors,
                        developer: existingData.colors
                    };
                }
            }
            
            // Also check local storage for other pages' colors
            const localColorsStr = localStorage.getItem('siteColors');
            if (localColorsStr) {
                try {
                    const localColors = JSON.parse(localColorsStr);
                    // If local is new format, merge with Supabase data
                    if (localColors.global || localColors.index || localColors.gamer || localColors.developer) {
                        allPageColors = {
                            ...allPageColors,
                            ...localColors // Local storage takes precedence for non-current pages
                        };
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
            
            // Update global colors
            allPageColors.global = globalColors;
            
            // Update current page's colors
            allPageColors[this.currentPage] = pageColors;
            
            // Save to Supabase
            const { error } = await window.supabase
                .from('site_settings')
                .upsert({
                    id: 1,
                    colors: allPageColors,
                    updated_at: new Date().toISOString()
                });
            
            if (error) {
                console.error('Error saving colors to Supabase:', error);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('Could not save colors to Supabase:', err);
            return false;
        }
    }
    
    async saveSettings() {
        // Double-check admin status via Supabase Auth
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                alert('Admin access required');
                this.isAdmin = false;
                this.hideSettingsButton();
                return;
            }
        } catch (error) {
            console.error('Could not verify admin status:', error);
            alert('Admin access required');
            return;
        }
        
        if (!this.isAdmin) {
            alert('Admin access required');
            return;
        }
        
        const { global: globalColors, page: pageColors } = this.collectColorsFromInputs();
        const now = new Date().toISOString();
        
        // Update localStorage with global and page-specific colors
        const allColorsStr = localStorage.getItem('siteColors');
        let allPageColors = {};
        
        if (allColorsStr) {
            try {
                const parsed = JSON.parse(allColorsStr);
                // Check if it's new format (with global key) or old format
                if (parsed.global) {
                    // New format: has global key
                    allPageColors = parsed;
                } else if (parsed.index || parsed.gamer || parsed.developer) {
                    // Old format: page-based but no global key
                    allPageColors = parsed;
                } else if (parsed.gradient) {
                    // Oldest format: flat structure
                    allPageColors = {
                        index: parsed,
                        gamer: parsed,
                        developer: parsed
                    };
                }
            } catch (e) {
                // If parsing fails, start fresh
            }
        }
        
        // Update global colors
        allPageColors.global = globalColors;
        
        // Update current page's colors
        allPageColors[this.currentPage] = pageColors;
        
        localStorage.setItem('siteColors', JSON.stringify(allPageColors));
        localStorage.setItem('siteColorsLastUpdated', now);
        
        // Save to Supabase
        const saved = await this.saveColorsToSupabase(globalColors, pageColors);
        
        if (saved) {
            alert('Color settings saved successfully!');
            this.toggleSettings(false);
        } else {
            alert('Failed to save to Supabase. Check console for details. Your settings were saved locally.');
        }
    }
    
    collectColorsFromInputs() {
        // Global colors (shared across all pages)
        const globalColors = {
            gradient: [
                document.getElementById('gradient-color-1').value,
                document.getElementById('gradient-color-2').value,
                document.getElementById('gradient-color-3').value,
                document.getElementById('gradient-color-4').value
            ],
            headerBg: {
                color: document.getElementById('header-bg').value,
                opacity: parseInt(document.getElementById('header-bg-opacity').value)
            },
            headerBorder: {
                color: document.getElementById('header-border').value,
                opacity: parseInt(document.getElementById('header-border-opacity').value)
            },
            siteTitleColor: document.getElementById('site-title-color')?.value || '#5D4037'
        };
        
        // Page-specific colors
        const pageColors = {};
        
        // Add Index page specific colors if on index page
        if (this.currentPage === 'index') {
            pageColors.introNameColor = document.getElementById('intro-name-color')?.value || '#5D4037';
            pageColors.introTextColor = document.getElementById('intro-text-color')?.value || '#5D4037';
            pageColors.navButtonBg = document.getElementById('nav-button-bg')?.value || '#FFFFFF';
            pageColors.navButtonText = document.getElementById('nav-button-text')?.value || '#5D4037';
            pageColors.navButtonHoverBg = document.getElementById('nav-button-hover-bg')?.value || '#5D4037';
            pageColors.navButtonHoverText = document.getElementById('nav-button-hover-text')?.value || '#FFFFFF';
        }
        
        // Add Gamer-specific colors if on gamer page
        if (this.currentPage === 'gamer') {
            pageColors.pageTitleColor = document.getElementById('page-title-color')?.value || '#5D4037';
            pageColors.pageSubtitleColor = document.getElementById('page-subtitle-color')?.value || '#5D4037';
            pageColors.adminButtonBg = document.getElementById('admin-button-bg')?.value || '#FF6B35';
            pageColors.adminButtonHoverBg = document.getElementById('admin-button-hover-bg')?.value || '#5D4037';
            
            // Game counter colors
            const gameCounterBgEl = document.getElementById('game-counter-bg-color');
            const gameCounterBgOpacityEl = document.getElementById('game-counter-bg-opacity');
            if (gameCounterBgEl && gameCounterBgOpacityEl) {
                pageColors.gameCounterBg = {
                    color: gameCounterBgEl.value,
                    opacity: parseInt(gameCounterBgOpacityEl.value)
                };
            }
            pageColors.gameCounterBorder = document.getElementById('game-counter-border')?.value || '#5D4037';
            pageColors.gameCounterText = document.getElementById('game-counter-text')?.value || '#5D4037';
            
            // Search input colors
            pageColors.searchInputText = document.getElementById('search-input-text')?.value || '#5D4037';
            const searchInputBorderColorEl = document.getElementById('search-input-border-color');
            const searchInputBorderOpacityEl = document.getElementById('search-input-border-opacity');
            if (searchInputBorderColorEl && searchInputBorderOpacityEl) {
                pageColors.searchInputBorder = {
                    color: searchInputBorderColorEl.value,
                    opacity: parseInt(searchInputBorderOpacityEl.value)
                };
            }
            const searchLabelColorEl = document.getElementById('search-label-color-color');
            const searchLabelOpacityEl = document.getElementById('search-label-color-opacity');
            if (searchLabelColorEl && searchLabelOpacityEl) {
                pageColors.searchLabelColor = {
                    color: searchLabelColorEl.value,
                    opacity: parseInt(searchLabelOpacityEl.value)
                };
            }
            pageColors.searchLabelFocusColor = document.getElementById('search-label-focus-color')?.value || '#5D4037';
            pageColors.searchBarFocusColor = document.getElementById('search-bar-focus-color')?.value || '#FF6B35';
            
            // Sorting dropdown colors
            pageColors.sortingDropdownBg = document.getElementById('sorting-dropdown-bg')?.value || '#FFFFFF';
            pageColors.sortingDropdownText = document.getElementById('sorting-dropdown-text')?.value || '#333333';
            pageColors.sortingDropdownHoverBg = document.getElementById('sorting-dropdown-hover-bg')?.value || '#FF8C42';
            pageColors.sortingDropdownHoverText = document.getElementById('sorting-dropdown-hover-text')?.value || '#FFFFFF';
            
            // Card colors
            pageColors.cardBackBg = document.getElementById('card-back-bg')?.value || '#5D4037';
            pageColors.cardBackText = document.getElementById('card-back-text')?.value || '#FFFFFF';
            pageColors.starColor = document.getElementById('star-color')?.value || '#FFD700';
            
            // Action button colors
            const editButtonBgEl = document.getElementById('edit-button-bg-color');
            const editButtonBgOpacityEl = document.getElementById('edit-button-bg-opacity');
            if (editButtonBgEl && editButtonBgOpacityEl) {
                pageColors.editButtonBg = {
                    color: editButtonBgEl.value,
                    opacity: parseInt(editButtonBgOpacityEl.value)
                };
            }
            pageColors.editButtonHoverBg = document.getElementById('edit-button-hover-bg')?.value || '#1976D2';
            
            const deleteButtonBgEl = document.getElementById('delete-button-bg-color');
            const deleteButtonBgOpacityEl = document.getElementById('delete-button-bg-opacity');
            if (deleteButtonBgEl && deleteButtonBgOpacityEl) {
                pageColors.deleteButtonBg = {
                    color: deleteButtonBgEl.value,
                    opacity: parseInt(deleteButtonBgOpacityEl.value)
                };
            }
            pageColors.deleteButtonHoverBg = document.getElementById('delete-button-hover-bg')?.value || '#D32F2F';
        }
        
        // Return both global and page colors
        return { global: globalColors, page: pageColors };
    }
    
    applyColors(colors) {
        // Apply gradient
        if (colors.gradient) {
            document.body.style.background = `linear-gradient(-45deg, ${colors.gradient.join(', ')})`;
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.backgroundAttachment = 'scroll';
            document.body.style.animation = 'gradient 15s ease infinite';
        }
        
        // Apply header
        if (colors.headerBg && colors.headerBorder) {
            const nav = document.querySelector('.nav');
            if (nav) {
                nav.style.background = this.hexToRgba(colors.headerBg.color, colors.headerBg.opacity);
                nav.style.borderBottom = `1px solid ${this.hexToRgba(colors.headerBorder.color, colors.headerBorder.opacity)}`;
            }
        }
        
        // Apply global site title color (applies to all pages)
        if (colors.siteTitleColor) {
            const siteTitle = document.querySelector('.site-title');
            if (siteTitle) siteTitle.style.color = colors.siteTitleColor;
        }
        
        // Apply Index page specific colors
        if (this.currentPage === 'index') {
            if (colors.introNameColor) {
                const introName = document.querySelector('.intro-name');
                if (introName) introName.style.color = colors.introNameColor;
            }
            if (colors.introTextColor) {
                const introText = document.querySelector('.intro-text');
                if (introText) introText.style.color = colors.introTextColor;
            }
            
            // Navigation button colors
            if (colors.navButtonBg) {
                const navBtns = document.querySelectorAll('.nav-btn:not(.gamer-btn):not(.developer-btn)');
                navBtns.forEach(btn => btn.style.background = colors.navButtonBg);
            }
            if (colors.navButtonText) {
                const navBtns = document.querySelectorAll('.nav-btn');
                navBtns.forEach(btn => btn.style.color = colors.navButtonText);
            }
            if (colors.navButtonHoverBg) {
                this.setDynamicStyle('nav-button-hover-bg-style', `.nav-btn:not(.gamer-btn):not(.developer-btn):hover { background: ${colors.navButtonHoverBg} !important; border-color: ${colors.navButtonHoverBg} !important; }`);
            }
            if (colors.navButtonHoverText) {
                this.setDynamicStyle('nav-button-hover-text-style', `.nav-btn:hover { color: ${colors.navButtonHoverText} !important; }`);
            }
        }
        
        // Apply Gamer-specific colors if on gamer page
        if (this.currentPage === 'gamer') {
            // Page titles
            if (colors.pageTitleColor) {
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) pageTitle.style.color = colors.pageTitleColor;
            }
            if (colors.pageSubtitleColor) {
                const pageSubtitle = document.querySelector('.page-subtitle');
                if (pageSubtitle) pageSubtitle.style.color = colors.pageSubtitleColor;
            }
            
            // Admin buttons
            if (colors.adminButtonBg) {
                const adminBtns = document.querySelectorAll('.admin-btn:not(.secondary)');
                adminBtns.forEach(btn => {
                    btn.style.background = colors.adminButtonBg;
                });
            }
            if (colors.adminButtonHoverBg) {
                this.setDynamicStyle('admin-button-hover-style', `.admin-btn:not(.secondary):hover { background: ${colors.adminButtonHoverBg} !important; }`);
            }
            
            // Game counter
            if (colors.gameCounterBg) {
                const gameCounter = document.querySelector('.game-counter');
                if (gameCounter && typeof colors.gameCounterBg === 'object') {
                    gameCounter.style.background = this.hexToRgba(colors.gameCounterBg.color, colors.gameCounterBg.opacity);
                }
            }
            if (colors.gameCounterBorder) {
                const gameCounter = document.querySelector('.game-counter');
                if (gameCounter) gameCounter.style.borderColor = colors.gameCounterBorder;
            }
            if (colors.gameCounterText) {
                const gameCounter = document.querySelector('.game-counter');
                if (gameCounter) gameCounter.style.color = colors.gameCounterText;
            }
            
            // Search input
            if (colors.searchInputText) {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.style.color = colors.searchInputText;
            }
            if (colors.searchInputBorder && typeof colors.searchInputBorder === 'object') {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.style.borderBottomColor = this.hexToRgba(colors.searchInputBorder.color, colors.searchInputBorder.opacity);
                }
            }
            if (colors.searchLabelColor) {
                const searchLabel = document.querySelector('.search-label');
                if (searchLabel && typeof colors.searchLabelColor === 'object') {
                    searchLabel.style.color = this.hexToRgba(colors.searchLabelColor.color, colors.searchLabelColor.opacity);
                }
            }
            if (colors.searchLabelFocusColor) {
                this.setDynamicStyle('search-label-focus-style', `.search-input:focus ~ .search-label, .search-input:not(:placeholder-shown) ~ .search-label { color: ${colors.searchLabelFocusColor} !important; }`);
            }
            if (colors.searchBarFocusColor) {
                this.setDynamicStyle('search-bar-focus-style', `.search-bar:before, .search-bar:after { background: ${colors.searchBarFocusColor} !important; }`);
            }
            
            // Sorting dropdown
            if (colors.sortingDropdownBg) {
                this.setDynamicStyle('sorting-dropdown-bg-style', `.sorting-submenu { background: ${colors.sortingDropdownBg} !important; }`);
            }
            if (colors.sortingDropdownText) {
                const sortingLinks = document.querySelectorAll('.sorting-link, .submenu-link');
                sortingLinks.forEach(link => link.style.color = colors.sortingDropdownText);
            }
            if (colors.sortingDropdownHoverBg) {
                this.setDynamicStyle('sorting-hover-bg-style', `.sorting-item:hover .sorting-link::after, .submenu-link:hover:before { background: ${colors.sortingDropdownHoverBg} !important; }`);
            }
            if (colors.sortingDropdownHoverText) {
                this.setDynamicStyle('sorting-hover-text-style', `.sorting-item:hover .sorting-link, .submenu-link:hover { color: ${colors.sortingDropdownHoverText} !important; }`);
            }
            
            // Cards
            if (colors.cardBackBg) {
                const flipCards = document.querySelectorAll('.flip-card-back');
                flipCards.forEach(card => card.style.background = colors.cardBackBg);
            }
            if (colors.cardBackText) {
                const flipCards = document.querySelectorAll('.flip-card-back');
                flipCards.forEach(card => card.style.color = colors.cardBackText);
            }
            if (colors.starColor) {
                this.setDynamicStyle('star-color-style', `.star.filled, .star.half { background: ${colors.starColor} !important; }`);
            }
            
            // Action buttons
            if (colors.editButtonBg) {
                const editBtns = document.querySelectorAll('.edit-btn');
                if (typeof colors.editButtonBg === 'object') {
                    editBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(colors.editButtonBg.color, colors.editButtonBg.opacity);
                    });
                }
            }
            if (colors.editButtonHoverBg) {
                this.setDynamicStyle('edit-button-hover-style', `.edit-btn:hover { background: ${colors.editButtonHoverBg} !important; }`);
            }
            if (colors.deleteButtonBg) {
                const deleteBtns = document.querySelectorAll('.delete-btn');
                if (typeof colors.deleteButtonBg === 'object') {
                    deleteBtns.forEach(btn => {
                        btn.style.background = this.hexToRgba(colors.deleteButtonBg.color, colors.deleteButtonBg.opacity);
                    });
                }
            }
            if (colors.deleteButtonHoverBg) {
                this.setDynamicStyle('delete-button-hover-style', `.delete-btn:hover { background: ${colors.deleteButtonHoverBg} !important; }`);
            }
        }
    }
    
    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'flex';
            document.getElementById('admin-password').focus();
        }
    }
    
    hideLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) passwordInput.value = '';
        }
    }
    
    async handleLogin(e) {
        const email = 'admin@fernle.com';
        const password = e.target.password.value;
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('Login error:', error);
                alert('Invalid credentials!');
                document.getElementById('admin-password').value = '';
                return;
            }
            
            if (data.user) {
                localStorage.setItem('adminEmail', email);
                localStorage.setItem('adminPassword', password);
                this.isAdmin = true;
                this.hideLoginModal();
                this.showSettingsButton();
                
                // Dispatch event for other components
                window.dispatchEvent(new CustomEvent('adminLogin'));
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Invalid credentials!');
            document.getElementById('admin-password').value = '';
        }
    }
    
    async handleLogout() {
        try {
            await window.supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminPassword');
        this.isAdmin = false;
        this.hideSettingsButton();
        this.toggleSettings(false);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('adminLogout'));
        
        alert('Logged out successfully!');
    }
    
    resetToDefault() {
        if (confirm('Are you sure you want to reset all colors to default?')) {
            // Apply default colors to inputs
            this.applyColorsToInputs(this.defaultColors);
            
            // Apply default colors to the page immediately
            this.applyColors(this.defaultColors);
            
            // Update previews
            this.updateAllPreviews();
            
            // Save to storage and Supabase
            this.saveSettings();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.colorManager = new AdminColorManager();
});

// Make functions globally accessible
window.adminColorManager = {
    toggleSettings: (show) => window.colorManager && window.colorManager.toggleSettings(show),
    saveSettings: () => window.colorManager && window.colorManager.saveSettings(),
    resetToDefault: () => window.colorManager && window.colorManager.resetToDefault(),
    handleLogout: () => window.colorManager && window.colorManager.handleLogout()
};


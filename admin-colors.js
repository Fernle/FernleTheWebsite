// Admin Color Management System with Supabase Real-time Sync
class AdminColorManager {
    constructor() {
        this.settingsModal = null;
        this.isAdmin = false;
        this.defaultColors = {
            gradient: ['#FF6B35', '#E63E3E', '#C93333', '#D4581A'],
            headerBg: { color: '#E63E3E', opacity: 10 },
            headerBorder: { color: '#E63E3E', opacity: 20 },
            textColor: '#5D4037'
        };
        
        this.init();
    }
    
    async init() {
        // Wait for Supabase to be loaded
        if (typeof supabase === 'undefined') {
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
        const colors = localStorage.getItem('siteColors');
        if (colors) {
            try {
                const parsed = JSON.parse(colors);
                this.applyColors(parsed);
            } catch (err) {
                console.error('Failed to parse colors from localStorage:', err);
            }
        }
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
        } else if (picker.id === 'text-color') {
            this.updateTextPreview();
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
        }
    }
    
    updateGradientPreview() {
        const color1 = document.getElementById('gradient-color-1').value;
        const color2 = document.getElementById('gradient-color-2').value;
        const color3 = document.getElementById('gradient-color-3').value;
        const color4 = document.getElementById('gradient-color-4').value;
        
        document.body.style.background = `linear-gradient(-45deg, ${color1}, ${color2}, ${color3}, ${color4})`;
        document.body.style.backgroundSize = '400% 400%';
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
    
    updateTextPreview() {
        const textColor = document.getElementById('text-color').value;
        document.body.style.color = textColor;
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
        // Load colors from Supabase or use defaults
        const colors = localStorage.getItem('siteColors');
        if (colors) {
            const parsed = JSON.parse(colors);
            this.applyColorsToInputs(parsed);
            this.updateAllPreviews();
        }
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
        
        if (colors.textColor) {
            const picker = document.getElementById('text-color');
            const textInput = document.getElementById('text-color-text');
            if (picker) picker.value = colors.textColor;
            if (textInput) textInput.value = colors.textColor;
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
                // Only update if Supabase has newer data
                const localColors = localStorage.getItem('siteColors');
                const localData = localStorage.getItem('siteColorsLastUpdated');
                
                if (!localData || new Date(data.updated_at) > new Date(localData)) {
                    localStorage.setItem('siteColors', JSON.stringify(data.colors));
                    localStorage.setItem('siteColorsLastUpdated', data.updated_at);
                    this.applyColors(data.colors);
                }
            }
        } catch (err) {
            console.log('Could not load colors from Supabase:', err);
        }
    }
    
    async saveColorsToSupabase(colors) {
        try {
            const { error } = await window.supabase
                .from('site_settings')
                .upsert({
                    id: 1,
                    colors: colors,
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
        
        const colors = this.collectColorsFromInputs();
        const now = new Date().toISOString();
        localStorage.setItem('siteColors', JSON.stringify(colors));
        localStorage.setItem('siteColorsLastUpdated', now);
        
        // Save to Supabase
        const saved = await this.saveColorsToSupabase(colors);
        
        if (saved) {
            alert('Color settings saved successfully!');
            this.toggleSettings(false);
        } else {
            alert('Failed to save to Supabase. Check console for details. Your settings were saved locally.');
        }
    }
    
    collectColorsFromInputs() {
        return {
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
            textColor: document.getElementById('text-color').value
        };
    }
    
    applyColors(colors) {
        // Apply gradient
        if (colors.gradient) {
            document.body.style.background = `linear-gradient(-45deg, ${colors.gradient.join(', ')})`;
            document.body.style.backgroundSize = '400% 400%';
        }
        
        // Apply header
        if (colors.headerBg && colors.headerBorder) {
            const nav = document.querySelector('.nav');
            if (nav) {
                nav.style.background = this.hexToRgba(colors.headerBg.color, colors.headerBg.opacity);
                nav.style.borderBottom = `1px solid ${this.hexToRgba(colors.headerBorder.color, colors.headerBorder.opacity)}`;
            }
        }
        
        // Apply text color
        if (colors.textColor) {
            document.body.style.color = colors.textColor;
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
                
                alert('Admin login successful!');
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
            this.applyColorsToInputs(this.defaultColors);
            this.updateAllPreviews();
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


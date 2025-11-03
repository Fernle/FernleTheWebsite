// Color Theme Selector with Gradient Animations
class ColorThemeManager {
    constructor() {
        // Define color presets - each with gradient colors and matching text color
        this.presets = [
            {
                id: 'fernle-orange',
                name: 'Fernle Orange',
                colors: ['#FF8C42', '#FF6B35', '#F7931E', '#FF8C42'],
                textColor: '#5D4037' // dark-brown
            },
            {
                id: 'sunset-vibes',
                name: 'Sunset Vibes',
                colors: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569'],
                textColor: '#FFF'
            },
            {
                id: 'ocean-breeze',
                name: 'Ocean Breeze',
                colors: ['#667eea', '#764ba2', '#23a6d5', '#23d5ab'],
                textColor: '#FFF'
            },
            {
                id: 'forest-gloom',
                name: 'Forest Gloom',
                colors: ['#2E8B57', '#228B22', '#556B2F', '#6B8E23'],
                textColor: '#FFF'
            },
            {
                id: 'purple-dream',
                name: 'Purple Dream',
                colors: ['#e73c7e', '#ee7752', '#23a6d5', '#23d5ab'],
                textColor: '#FFF'
            },
            {
                id: 'midnight-blue',
                name: 'Midnight Blue',
                colors: ['#1e3c72', '#2a5298', '#1e90ff', '#00bfff'],
                textColor: '#FFF'
            }
        ];
        
        this.currentPreset = null;
        this.init();
    }
    
    init() {
        // Load saved preference
        const savedPreset = localStorage.getItem('colorThemePreset');
        if (savedPreset) {
            const preset = this.presets.find(p => p.id === savedPreset);
            if (preset) {
                this.applyPreset(preset);
            }
        } else {
            // Default to Fernle Orange
            this.applyPreset(this.presets[0]);
        }
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'color-theme-btn';
        toggleBtn.innerHTML = '🎨';
        toggleBtn.id = 'color-theme-toggle-btn';
        
        // Create panel
        const panel = document.createElement('div');
        panel.className = 'color-theme-panel';
        panel.id = 'color-theme-panel';
        
        const title = document.createElement('h3');
        title.className = 'color-theme-title';
        title.textContent = 'Choose Theme';
        
        const presetsGrid = document.createElement('div');
        presetsGrid.className = 'color-presets';
        
        this.presets.forEach(preset => {
            const presetItem = document.createElement('div');
            presetItem.className = 'color-preset';
            presetItem.dataset.presetId = preset.id;
            
            // Create gradient background
            presetItem.style.background = `linear-gradient(-45deg, ${preset.colors.join(', ')})`;
            presetItem.style.backgroundSize = '400% 400%';
            
            const presetName = document.createElement('div');
            presetName.className = 'color-preset-name';
            presetName.textContent = preset.name;
            
            presetItem.appendChild(presetName);
            presetsGrid.appendChild(presetItem);
        });
        
        panel.appendChild(title);
        panel.appendChild(presetsGrid);
        
        // Create container
        const container = document.createElement('div');
        container.className = 'color-theme-toggle';
        container.appendChild(panel);
        container.appendChild(toggleBtn);
        
        document.body.appendChild(container);
    }
    
    setupEventListeners() {
        const toggleBtn = document.getElementById('color-theme-toggle-btn');
        const panel = document.getElementById('color-theme-panel');
        
        // Toggle panel
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('active');
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== toggleBtn) {
                panel.classList.remove('active');
            }
        });
        
        // Handle preset selection
        const presetItems = document.querySelectorAll('.color-preset');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                const presetId = item.dataset.presetId;
                const preset = this.presets.find(p => p.id === presetId);
                if (preset) {
                    this.applyPreset(preset);
                    this.updateActiveState(presetId);
                    panel.classList.remove('active');
                }
            });
        });
    }
    
    applyPreset(preset) {
        // Apply gradient to body
        const body = document.body;
        body.style.background = `linear-gradient(-45deg, ${preset.colors.join(', ')})`;
        body.style.backgroundSize = '400% 400%';
        
        // Update CSS custom property for text color
        document.documentElement.style.setProperty('--theme-text-color', preset.textColor);
        
        // Save preference
        localStorage.setItem('colorThemePreset', preset.id);
        this.currentPreset = preset;
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('colorThemeChanged', {
            detail: { preset }
        }));
    }
    
    updateActiveState(activePresetId) {
        const presetItems = document.querySelectorAll('.color-preset');
        presetItems.forEach(item => {
            if (item.dataset.presetId === activePresetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.colorThemeManager = new ColorThemeManager();
});


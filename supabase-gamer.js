// Supabase Gamer Page JavaScript
class SupabaseGamerPage {
    constructor() {
        this.games = [];
        this.currentSort = 'alphabetical';
        this.isAdmin = false;
        this.adminEmail = 'admin@fernle.com';
        this.adminPassword = 'fernle2024';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadGamesFromSupabase();
        this.checkAdminStatus();
        this.renderGames();
    }

    setupEventListeners() {
        // Admin login
        const loginModal = document.getElementById('login-modal');
        const loginForm = document.getElementById('login-form');
        const loginClose = document.getElementById('login-close');
        
        // Show login modal (Ctrl + Shift + A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.showLoginModal();
            }
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        loginClose.addEventListener('click', () => {
            this.hideLoginModal();
        });

        // Admin controls
        const addGameBtn = document.getElementById('add-game-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        addGameBtn.addEventListener('click', () => {
            this.showAddGameModal();
        });

        logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });

        // Add game modal
        const addGameModal = document.getElementById('add-game-modal');
        const addGameForm = document.getElementById('add-game-form');
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-btn');

        modalClose.addEventListener('click', () => {
            this.hideAddGameModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.hideAddGameModal();
        });

        addGameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddGame(e);
        });

        // Image input handling
        const imageUrlInput = document.getElementById('game-image-url');
        const imageFileInput = document.getElementById('game-image-file');
        
        imageUrlInput.addEventListener('input', (e) => {
            this.handleImageUrl(e);
        });

        imageFileInput.addEventListener('change', (e) => {
            this.handleImageFile(e);
        });

        // Rating change handling
        const ratingInputs = document.querySelectorAll('.star-rating input[type="radio"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateTotalRating();
            });
        });

        // Sorting
        const sortSelect = document.getElementById('sort-select');
        sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderGames();
        });

        // Modal close on background click
        [addGameModal, loginModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    async loadGamesFromSupabase() {
        try {
            const { data, error } = await window.supabase
                .from('games')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error loading games:', error);
                this.showNotification('Error loading games from database', 'error');
                return;
            }
            
            this.games = data || [];
        } catch (error) {
            console.error('Error loading games:', error);
            this.showNotification('Error loading games from database', 'error');
            this.games = [];
        }
    }

    async checkAdminStatus() {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user && user.email === this.adminEmail) {
            this.isAdmin = true;
            this.showAdminSection();
            // Re-render games to show delete buttons if admin
            this.renderGames();
        }
    }

    showAdminSection() {
        const adminSection = document.getElementById('admin-section');
        adminSection.style.display = 'block';
    }

    hideAdminSection() {
        const adminSection = document.getElementById('admin-section');
        adminSection.style.display = 'none';
    }

    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        loginModal.style.display = 'flex';
        document.getElementById('admin-password').focus();
    }

    hideLoginModal() {
        const loginModal = document.getElementById('login-modal');
        loginModal.style.display = 'none';
        document.getElementById('admin-password').value = '';
    }

    async handleLogin(e) {
        const email = this.adminEmail;
        const password = e.target.password.value;
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('Login error:', error);
                this.showNotification('Invalid credentials!', 'error');
                document.getElementById('admin-password').value = '';
                return;
            }
            
            if (data.user) {
                this.isAdmin = true;
                this.showAdminSection();
                this.hideLoginModal();
                this.showNotification('Admin access granted!', 'success');
                // Re-render games to show delete buttons
                this.renderGames();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Invalid credentials!', 'error');
            document.getElementById('admin-password').value = '';
        }
    }

    async handleLogout() {
        try {
            await window.supabase.auth.signOut();
            this.isAdmin = false;
            this.hideAdminSection();
            this.showNotification('Logged out successfully!', 'success');
            // Re-render games to hide delete buttons
            this.renderGames();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showAddGameModal() {
        const modal = document.getElementById('add-game-modal');
        modal.style.display = 'flex';
        document.getElementById('game-name').focus();
    }

    hideAddGameModal() {
        const modal = document.getElementById('add-game-modal');
        modal.style.display = 'none';
        this.resetAddGameForm();
    }

    resetAddGameForm() {
        document.getElementById('add-game-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('total-rating').textContent = '0/5';
        
        // Reset all ratings to 0
        const ratingInputs = document.querySelectorAll('.star-rating input[value="0"]');
        ratingInputs.forEach(input => {
            input.checked = true;
        });
    }

    handleImageUrl(e) {
        const url = e.target.value.trim();
        const preview = document.getElementById('image-preview');
        
        if (url && this.isValidImageUrl(url)) {
            preview.innerHTML = `<img src="${url}" alt="Game preview" onerror="this.style.display='none'">`;
            document.getElementById('game-image-file').value = '';
        } else if (!url) {
            preview.innerHTML = '';
        }
    }

    handleImageFile(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('image-preview');
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.innerHTML = `<img src="${event.target.result}" alt="Game preview">`;
                document.getElementById('game-image-url').value = '';
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    isValidImageUrl(url) {
        try {
            new URL(url);
            return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        } catch {
            return false;
        }
    }

    updateTotalRating() {
        const categories = ['gameplay', 'graphics', 'audio', 'atmosphere', 'satisfaction'];
        let total = 0;
        
        categories.forEach(category => {
            const selected = document.querySelector(`input[name="${category}"]:checked`);
            if (selected) {
                total += parseFloat(selected.value);
            }
        });
        
        document.getElementById('total-rating').textContent = `${total}/5`;
    }

    async handleAddGame(e) {
        const formData = new FormData(e.target);
        const gameName = formData.get('gameName').trim();
        const imageUrl = formData.get('gameImageUrl').trim();
        const imageFile = formData.get('gameImageFile');
        
        if (!gameName) {
            this.showNotification('Please enter a game name!', 'error');
            return;
        }
        
        let gameImage = '';
        if (imageUrl) {
            gameImage = imageUrl;
        } else if (imageFile && imageFile.size > 0) {
            this.showNotification('File upload not supported. Please use image URL.', 'error');
            return;
        } else {
            this.showNotification('Please provide a game image!', 'error');
            return;
        }
        
        // Get ratings
        const ratings = {};
        const categories = ['gameplay', 'graphics', 'audio', 'atmosphere', 'satisfaction'];
        let totalRating = 0;
        
        categories.forEach(category => {
            const selected = document.querySelector(`input[name="${category}"]:checked`);
            const rating = selected ? parseFloat(selected.value) : 0;
            ratings[category] = rating;
            totalRating += rating;
        });
        
        // Create new game object
        const newGame = {
            name: gameName,
            image_url: gameImage,
            gameplay_rating: ratings.gameplay,
            graphics_rating: ratings.graphics,
            audio_rating: ratings.audio,
            atmosphere_rating: ratings.atmosphere,
            satisfaction_rating: ratings.satisfaction,
            total_rating: totalRating,
            added_by: this.adminEmail
        };
        
        try {
            // Add to Supabase
            const { data, error } = await window.supabase
                .from('games')
                .insert([newGame])
                .select();
            
            if (error) {
                console.error('Error adding game:', error);
                this.showNotification('Error adding game to database', 'error');
                return;
            }
            
            // Add to local array
            if (data && data[0]) {
                this.games.unshift(data[0]);
            }
            
            // Hide modal and show success message
            this.hideAddGameModal();
            this.showNotification('Game added successfully!', 'success');
            
            // Re-render games
            this.renderGames();
            
        } catch (error) {
            console.error('Error adding game:', error);
            this.showNotification('Error adding game to database', 'error');
        }
    }

    async deleteGame(gameId) {
        if (!this.isAdmin) {
            this.showNotification('Admin access required', 'error');
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to delete this game? This action cannot be undone.');
        if (!confirmed) return;

        try {
            this.showNotification('Deleting game...', 'info');

            const { error } = await window.supabase
                .from('games')
                .delete()
                .eq('id', gameId);

            if (error) throw error;

            this.showNotification('Game deleted successfully!', 'success');
            this.loadGames();

        } catch (error) {
            console.error('Error deleting game:', error);
            this.showNotification('Error deleting game: ' + error.message, 'error');
        }
    }

    renderGames() {
        const gamesGrid = document.getElementById('games-grid');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('empty-state');
        
        // Hide loading
        loading.style.display = 'none';
        
        if (this.games.length === 0) {
            gamesGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Sort games
        const sortedGames = this.sortGames([...this.games]);
        
        // Render games
        gamesGrid.innerHTML = sortedGames.map(game => this.createGameCard(game)).join('');
        
        // Add animations
        setTimeout(() => {
            const cards = gamesGrid.querySelectorAll('.game-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
    }

    sortGames(games) {
        switch (this.currentSort) {
            case 'alphabetical':
                return games.sort((a, b) => a.name.localeCompare(b.name));
            case 'rating-high':
                return games.sort((a, b) => b.total_rating - a.total_rating);
            case 'rating-low':
                return games.sort((a, b) => a.total_rating - b.total_rating);
            default:
                return games;
        }
    }

    createGameCard(game) {
        const categoryNames = {
            gameplay: 'Gameplay',
            graphics: 'Graphics',
            audio: 'Audio',
            atmosphere: 'Atmosphere',
            satisfaction: 'Satisfaction'
        };
        
        const ratings = {
            gameplay: game.gameplay_rating,
            graphics: game.graphics_rating,
            audio: game.audio_rating,
            atmosphere: game.atmosphere_rating,
            satisfaction: game.satisfaction_rating
        };
        
        const ratingsHtml = Object.entries(ratings).map(([key, value]) => `
            <div class="rating-item">
                <span class="rating-label">${categoryNames[key]}</span>
                <div class="rating-stars">${this.createStars(value)}</div>
            </div>
        `).join('');
        
        const totalStarsHtml = this.createStars(game.total_rating, 5, true);
        
        const deleteButton = this.isAdmin ? `
            <div class="game-actions">
                <button class="delete-btn" onclick="gamerPage.deleteGame(${game.id})" title="Delete Game">
                    🗑️
                </button>
            </div>
        ` : '';

        return `
            <div class="game-card">
                <img src="${game.image_url}" alt="${game.name}" class="game-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                <div class="game-content">
                    <div class="game-header">
                        <h3 class="game-name">${game.name}</h3>
                        ${deleteButton}
                    </div>
                    <div class="game-ratings">
                        ${ratingsHtml}
                    </div>
                    <div class="game-total">
                        <span class="total-rating-text">Total Rating</span>
                        <div class="total-stars">${totalStarsHtml}</div>
                    </div>
                </div>
            </div>
        `;
    }

    createStars(rating, maxStars = 1, showHalf = false) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<span class="star filled"></span>';
        }
        
        // Add half star if needed (for ratings like 0.5, 1.5, etc.)
        if (hasHalfStar) {
            starsHtml += '<span class="star half"></span>';
        }
        
        // Add empty stars
        const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<span class="star"></span>';
        }
        
        return starsHtml;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#4CAF50';
                break;
            case 'error':
                notification.style.background = '#f44336';
                break;
            case 'warning':
                notification.style.background = '#ff9800';
                break;
            default:
                notification.style.background = '#2196F3';
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SupabaseGamerPage();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Supabase Gamer Page JavaScript
class SupabaseGamerPage {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentSort = 'alphabetical';
        this.searchQuery = '';
        this.isAdmin = false;
        this.adminEmail = 'admin@fernle.com';
        
        this.init();
    }

    async init() {
        console.log('GamerPage initializing...');
        console.log('Supabase client:', window.supabase);
        console.log('Supabase URL:', window.supabase?.supabaseUrl);
        console.log('Supabase Key:', window.supabase?.supabaseKey ? 'Present' : 'Missing');
        
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

        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.filterAndRenderGames();
        });

        // Sorting - New dropdown menu
        const sortLinks = document.querySelectorAll('.submenu-link');
        sortLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const value = e.target.getAttribute('data-value');
                this.currentSort = value;
                
                // Update the displayed text
                const sortText = document.getElementById('sort-text');
                const text = e.target.textContent;
                sortText.textContent = `Sort by: ${text}`;
                
                this.filterAndRenderGames();
            });
        });

        // Edit game modal
        const editGameModal = document.getElementById('edit-game-modal');
        const editGameForm = document.getElementById('edit-game-form');
        const editModalClose = document.getElementById('edit-modal-close');
        const editCancelBtn = document.getElementById('edit-cancel-btn');

        editModalClose.addEventListener('click', () => {
            this.hideEditGameModal();
        });

        editCancelBtn.addEventListener('click', () => {
            this.hideEditGameModal();
        });

        editGameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditGame(e);
        });

        // Edit image input handling
        const editImageUrlInput = document.getElementById('edit-game-image-url');
        const editImageFileInput = document.getElementById('edit-game-image-file');
        
        editImageUrlInput.addEventListener('input', (e) => {
            this.handleEditImageUrl(e);
        });

        editImageFileInput.addEventListener('change', (e) => {
            this.handleEditImageFile(e);
        });

        // Edit rating change handling
        const editRatingInputs = document.querySelectorAll('#edit-game-form .star-rating input[type="radio"]');
        editRatingInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateEditTotalRating();
            });
        });

        // Modal close on background click
        [addGameModal, editGameModal, loginModal].forEach(modal => {
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
            this.updateGameCounter(); // Update the game counter
            this.filterAndRenderGames(); // Filter and re-render the UI after loading games
        } catch (error) {
            console.error('Error loading games:', error);
            this.showNotification('Error loading games from database', 'error');
            this.games = [];
            this.updateGameCounter(); // Update the game counter even on error
            this.filterAndRenderGames(); // Filter and re-render even on error to show empty state
        }
    }

    async checkAdminStatus() {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user && user.email === this.adminEmail) {
            this.isAdmin = true;
            this.showAdminSection();
            // Re-render games to show delete buttons if admin
            this.filterAndRenderGames();
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
                // Re-render games to show delete buttons
                this.filterAndRenderGames();
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
            this.filterAndRenderGames();
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
        const hoursPlayed = formData.get('hoursPlayed');
        
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
            hours_played: hoursPlayed ? parseFloat(hoursPlayed) : null,
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
            
            // Update game counter
            this.updateGameCounter();
            
            // Hide modal and show success message
            this.hideAddGameModal();
            this.showNotification('Game added successfully!', 'success');
            
            // Re-render games
            this.filterAndRenderGames();
            
        } catch (error) {
            console.error('Error adding game:', error);
            this.showNotification('Error adding game to database', 'error');
        }
    }

    async deleteGame(gameId) {
        console.log('deleteGame called with ID:', gameId);
        console.log('isAdmin status:', this.isAdmin);
        
        if (!this.isAdmin) {
            console.log('Admin access denied');
            this.showNotification('Admin access required', 'error');
            return;
        }

        // Show confirmation dialog
        console.log('Showing confirmation dialog');
        const confirmed = confirm('Are you sure you want to delete this game? This action cannot be undone.');
        console.log('Confirmation result:', confirmed);
        
        if (!confirmed) {
            console.log('User cancelled deletion');
            return;
        }

        try {
            console.log('Starting deletion process...');
            this.showNotification('Deleting game...', 'info');

            console.log('Calling Supabase delete...');
            const { error } = await window.supabase
                .from('games')
                .delete()
                .eq('id', gameId);

            console.log('Supabase response:', { error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Deletion successful, reloading games...');
            this.showNotification('Game deleted successfully!', 'success');
            
            // Remove from local array
            this.games = this.games.filter(game => game.id !== gameId);
            this.updateGameCounter();
            
            this.loadGamesFromSupabase();

        } catch (error) {
            console.error('Error deleting game:', error);
            this.showNotification('Error deleting game: ' + error.message, 'error');
        }
    }

    async editGame(gameId) {
        console.log('editGame called with ID:', gameId);
        console.log('isAdmin status:', this.isAdmin);
        
        if (!this.isAdmin) {
            console.log('Admin access denied');
            this.showNotification('Admin access required', 'error');
            return;
        }

        // Find the game in our local array
        const game = this.games.find(g => g.id === gameId);
        if (!game) {
            console.log('Game not found:', gameId);
            this.showNotification('Game not found', 'error');
            return;
        }

        console.log('Editing game:', game);
        
        // Populate the edit form with current game data
        document.getElementById('edit-game-id').value = game.id;
        document.getElementById('edit-game-name').value = game.name;
        document.getElementById('edit-game-image-url').value = game.image_url;
        document.getElementById('edit-hours-played').value = game.hours_played || '';
        
        // Set image preview
        const editPreview = document.getElementById('edit-image-preview');
        if (game.image_url) {
            editPreview.innerHTML = `<img src="${game.image_url}" alt="Game preview" onerror="this.style.display='none'">`;
        }
        
        // Set ratings
        const categories = ['gameplay', 'graphics', 'audio', 'atmosphere', 'satisfaction'];
        categories.forEach(category => {
            const rating = game[`${category}_rating`];
            const radioInput = document.querySelector(`input[name="edit-${category}"][value="${rating}"]`);
            if (radioInput) {
                radioInput.checked = true;
            }
        });
        
        // Update total rating display
        this.updateEditTotalRating();
        
        // Show the edit modal
        this.showEditGameModal();
    }

    showEditGameModal() {
        const modal = document.getElementById('edit-game-modal');
        modal.style.display = 'flex';
        document.getElementById('edit-game-name').focus();
    }

    hideEditGameModal() {
        const modal = document.getElementById('edit-game-modal');
        modal.style.display = 'none';
        this.resetEditGameForm();
    }

    resetEditGameForm() {
        document.getElementById('edit-game-form').reset();
        document.getElementById('edit-image-preview').innerHTML = '';
        document.getElementById('edit-total-rating').textContent = '0/5';
        document.getElementById('edit-game-id').value = '';
    }

    handleEditImageUrl(e) {
        const url = e.target.value.trim();
        const preview = document.getElementById('edit-image-preview');
        
        if (url && this.isValidImageUrl(url)) {
            preview.innerHTML = `<img src="${url}" alt="Game preview" onerror="this.style.display='none'">`;
            document.getElementById('edit-game-image-file').value = '';
        } else if (!url) {
            preview.innerHTML = '';
        }
    }

    handleEditImageFile(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('edit-image-preview');
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.innerHTML = `<img src="${event.target.result}" alt="Game preview">`;
                document.getElementById('edit-game-image-url').value = '';
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    updateEditTotalRating() {
        const categories = ['edit-gameplay', 'edit-graphics', 'edit-audio', 'edit-atmosphere', 'edit-satisfaction'];
        let total = 0;
        
        categories.forEach(category => {
            const selected = document.querySelector(`input[name="${category}"]:checked`);
            if (selected) {
                total += parseFloat(selected.value);
            }
        });
        
        document.getElementById('edit-total-rating').textContent = `${total}/5`;
    }

    async handleEditGame(e) {
        const formData = new FormData(e.target);
        const gameId = formData.get('gameId');
        const gameName = formData.get('gameName').trim();
        const imageUrl = formData.get('gameImageUrl').trim();
        const imageFile = formData.get('gameImageFile');
        const hoursPlayed = formData.get('hoursPlayed');
        
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
        const categories = ['edit-gameplay', 'edit-graphics', 'edit-audio', 'edit-atmosphere', 'edit-satisfaction'];
        let totalRating = 0;
        
        categories.forEach(category => {
            const selected = document.querySelector(`input[name="${category}"]:checked`);
            const rating = selected ? parseFloat(selected.value) : 0;
            ratings[category.replace('edit-', '')] = rating;
            totalRating += rating;
        });
        
        // Create updated game object
        const updatedGame = {
            name: gameName,
            image_url: gameImage,
            gameplay_rating: ratings.gameplay,
            graphics_rating: ratings.graphics,
            audio_rating: ratings.audio,
            atmosphere_rating: ratings.atmosphere,
            satisfaction_rating: ratings.satisfaction,
            total_rating: totalRating,
            hours_played: hoursPlayed ? parseFloat(hoursPlayed) : null
        };
        
        try {
            // Update in Supabase
            const { data, error } = await window.supabase
                .from('games')
                .update(updatedGame)
                .eq('id', gameId)
                .select();
            
            if (error) {
                console.error('Error updating game:', error);
                this.showNotification('Error updating game in database', 'error');
                return;
            }
            
            // Update local array
            const gameIndex = this.games.findIndex(g => g.id === parseInt(gameId));
            if (gameIndex !== -1 && data && data[0]) {
                this.games[gameIndex] = data[0];
            }
            
            // Update game counter (in case of any changes)
            this.updateGameCounter();
            
            // Hide modal and show success message
            this.hideEditGameModal();
            this.showNotification('Game updated successfully!', 'success');
            
            // Re-render games
            this.filterAndRenderGames();
            
        } catch (error) {
            console.error('Error updating game:', error);
            this.showNotification('Error updating game in database', 'error');
        }
    }

    filterGames() {
        if (!this.searchQuery) {
            this.filteredGames = [...this.games];
        } else {
            this.filteredGames = this.games.filter(game => 
                game.name.toLowerCase().includes(this.searchQuery)
            );
        }
    }

    updateGameCounter() {
        const gameCountElement = document.getElementById('game-count');
        const totalGames = this.games.length;
        
        if (gameCountElement) {
            if (totalGames === 0) {
                gameCountElement.textContent = 'Total: 0 games played';
            } else if (totalGames === 1) {
                gameCountElement.textContent = 'Total: 1 game played';
            } else {
                gameCountElement.textContent = `Total: ${totalGames} games played`;
            }
        }
    }

    filterAndRenderGames() {
        this.filterGames();
        this.renderGames();
    }

    renderGames() {
        const gamesGrid = document.getElementById('games-grid');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('empty-state');
        
        // Hide loading
        loading.style.display = 'none';
        
        if (this.filteredGames.length === 0) {
            gamesGrid.innerHTML = '';
            if (this.games.length === 0) {
                emptyState.innerHTML = `
                    <div class="empty-icon">🎮</div>
                    <h3>No games found</h3>
                    <p>No games have been added yet. Check back later!</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <h3>No games found</h3>
                    <p>No games match your search criteria. Try a different search term.</p>
                `;
            }
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Sort games
        const sortedGames = this.sortGames([...this.filteredGames]);
        
        // Adjust grid layout based on search
        if (this.searchQuery) {
            // When searching, use auto-fill to keep cards close together
            gamesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, max-content))';
            gamesGrid.style.justifyContent = 'start';
        } else {
            // When not searching, use auto-fit to fill the width
            gamesGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
            gamesGrid.style.justifyContent = 'start';
        }
        
        // Render games
        gamesGrid.innerHTML = sortedGames.map(game => this.createGameCard(game)).join('');
        
        // Add animations
        setTimeout(() => {
            const cards = gamesGrid.querySelectorAll('.flip-card');
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
        
        const adminButtons = this.isAdmin ? `
            <div class="game-actions">
                <button class="edit-btn" onclick="gamerPage.editGame(${game.id})" title="Edit Game">
                    ✏️
                </button>
                <button class="delete-btn" onclick="gamerPage.deleteGame(${game.id})" title="Delete Game">
                    🗑️
                </button>
            </div>
        ` : '';

        const hoursDisplay = game.hours_played ? `<div class="hours-played">+${game.hours_played} hours</div>` : '';

        return `
            <div class="flip-card">
                ${adminButtons}
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <div class="game-image-container">
                            <img src="${game.image_url}" alt="${game.name}" class="game-image" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                        </div>
                    </div>
                    <div class="flip-card-back">
                        ${hoursDisplay}
                        <div class="rating-details">
                            <div class="rating-header">
                                <h3>${game.name}</h3>
                            </div>
                            <div class="rating-categories">
                                ${ratingsHtml}
                            </div>
                            <div class="rating-footer">
                                <div class="total-rating-container">
                                    <span class="total-rating-text">Total Rating</span>
                                    <div class="total-stars">${totalStarsHtml}</div>
                                </div>
                            </div>
                        </div>
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
    window.gamerPage = new SupabaseGamerPage();
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


// Shelf Life App - Main JavaScript
function shelfLifeApp() {
    return {
        // App State
        currentTab: 'current',
        currentBook: null,
        currentSession: null,
        books: [],
        sessions: [],
        genres: [],
        
        // UI State
        showAddBook: false,
        showUpdateProgress: false,
        showBookDetails: false,
        showRatingModal: false,
        selectedBook: null,
        completedBookTitle: '',
        
        // Book Search State
        searchQuery: '',
        searchResults: [],
        searchLoading: false,
        selectedSearchBook: {
            pages_total: null,
            due_date: '',
            selected_genres: []
        },
        newGenre: '',
        selectedExistingGenre: '',
        
        // Genre Filter State
        selectedGenre: null,
        filteredBooks: [],
        
        // Session Timer (removed - using timestamps only)
        // sessionTimer: null,
        // sessionStartTime: null,
        // sessionElapsedTime: 0,
        
        // Initialize the app
        init() {
            this.loadData();
            this.initGenreChart();
            
            // Load current book if exists
            const currentBookId = localStorage.getItem('currentBookId');
            if (currentBookId) {
                this.currentBook = this.books.find(book => book.id === currentBookId);
            }
            
            // Check for active session
            const activeSession = localStorage.getItem('activeSession');
            if (activeSession) {
                this.currentSession = JSON.parse(activeSession);
            }
        },
        
        // Data Management
        loadData() {
            // Load books
            const savedBooks = localStorage.getItem('shelfLife_books');
            if (savedBooks) {
                this.books = JSON.parse(savedBooks);
            }
            
            // Load sessions
            const savedSessions = localStorage.getItem('shelfLife_sessions');
            if (savedSessions) {
                this.sessions = JSON.parse(savedSessions);
            }
            
            // Load genres
            const savedGenres = localStorage.getItem('shelfLife_genres');
            if (savedGenres) {
                this.genres = JSON.parse(savedGenres);
            }
        },
        
        saveData() {
            localStorage.setItem('shelfLife_books', JSON.stringify(this.books));
            localStorage.setItem('shelfLife_sessions', JSON.stringify(this.sessions));
            localStorage.setItem('shelfLife_genres', JSON.stringify(this.genres));
        },
        
        // Book Management
        selectBook(book) {
            this.selectedBook = book;
            this.showBookDetails = true;
        },
        
        // Progress Calculations
        getProgressPercentage() {
            if (!this.currentBook || !this.currentBook.pages_total) return 0;
            return Math.round((this.currentBook.pages_read / this.currentBook.pages_total) * 100);
        },
        
        getAverageSpeed() {
            if (!this.currentBook) return '0.0';
            
            const bookSessions = this.sessions.filter(s => s.book_id === this.currentBook.id);
            if (bookSessions.length === 0) return '0.0';
            
            const totalTime = bookSessions.reduce((sum, session) => sum + session.total_duration, 0);
            const totalPages = bookSessions.reduce((sum, session) => sum + session.total_pages, 0);
            
            if (totalTime === 0) return '0.0';
            return (totalPages / totalTime).toFixed(1);
        },
        
        getEstimatedTimeRemaining() {
            if (!this.currentBook) return '--';
            
            const pagesRemaining = this.currentBook.pages_total - this.currentBook.pages_read;
            const avgSpeed = parseFloat(this.getAverageSpeed());
            
            if (avgSpeed === 0 || pagesRemaining <= 0) return '--';
            
            const minutesRemaining = pagesRemaining / avgSpeed;
            return this.formatMinutes(minutesRemaining);
        },
        
        getPagesPerDay() {
            if (!this.currentBook || !this.currentBook.due_date) return '--';
            
            const dueDate = new Date(this.currentBook.due_date);
            const today = new Date();
            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0) return 'Overdue!';
            
            const pagesRemaining = this.currentBook.pages_total - this.currentBook.pages_read;
            return Math.ceil(pagesRemaining / daysRemaining);
        },

        getTargetPageToday() {
            if (!this.currentBook || !this.currentBook.due_date) return '--';
            
            const dueDate = new Date(this.currentBook.due_date);
            const today = new Date();
            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0) return 'Overdue!';
            
            const pagesRemaining = this.currentBook.pages_total - this.currentBook.pages_read;
            const pagesPerDay = Math.ceil(pagesRemaining / daysRemaining);
            
            // Calculate what page they should be at by end of today
            const targetPage = this.currentBook.pages_read + pagesPerDay;
            return Math.min(targetPage, this.currentBook.pages_total);
        },
        
        isDueDateAtRisk() {
            if (!this.currentBook || !this.currentBook.due_date) return false;
            
            const dueDate = new Date(this.currentBook.due_date);
            const today = new Date();
            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0) return true;
            
            const pagesRemaining = this.currentBook.pages_total - this.currentBook.pages_read;
            const pagesPerDay = pagesRemaining / daysRemaining;
            const avgSpeed = parseFloat(this.getAverageSpeed());
            
            if (avgSpeed === 0) return false;
            
            // Assuming 30 minutes of reading per day as baseline
            const expectedPagesPerDay = avgSpeed * 30;
            return pagesPerDay > expectedPagesPerDay * 1.5;
        },
        
        // Session Management
        startSession() {
            if (!this.currentBook) return;
            
            const now = new Date().toISOString();
            
            this.currentSession = {
                id: Date.now().toString(),
                book_id: this.currentBook.id,
                start_time: now,
                end_time: null,
                paused: false,
                segments: [{
                    start_time: now,
                    end_time: null
                }],
                total_duration: 0,
                total_pages: 0,
                pages_per_min: 0
            };
            
            localStorage.setItem('activeSession', JSON.stringify(this.currentSession));
        },
        
        togglePause() {
            if (!this.currentSession) return;
            
            const now = new Date().toISOString();
            const currentSegment = this.currentSession.segments[this.currentSession.segments.length - 1];
            
            if (this.currentSession.paused) {
                // Resume - start new segment
                this.currentSession.segments.push({
                    start_time: now,
                    end_time: null
                });
                this.currentSession.paused = false;
            } else {
                // Pause - end current segment
                currentSegment.end_time = now;
                this.currentSession.paused = true;
            }
            
            localStorage.setItem('activeSession', JSON.stringify(this.currentSession));
        },
        
        stopSession() {
            if (!this.currentSession) return;
            
            // Show modal to get current page
            const currentPageStr = prompt(`What page did you read up to? (You started at page ${this.currentBook.pages_read + 1})`);
            if (currentPageStr === null) return;
            
            const currentPage = parseInt(currentPageStr) || this.currentBook.pages_read;
            const pagesRead = Math.max(0, currentPage - this.currentBook.pages_read);
            const now = new Date().toISOString();
            
            // End current segment
            const currentSegment = this.currentSession.segments[this.currentSession.segments.length - 1];
            if (!currentSegment.end_time) {
                currentSegment.end_time = now;
            }
            
            // Calculate totals from all segments
            let totalDuration = 0;
            this.currentSession.segments.forEach(segment => {
                if (segment.end_time) {
                    const duration = (new Date(segment.end_time) - new Date(segment.start_time)) / (1000 * 60);
                    totalDuration += duration;
                }
            });
            
            this.currentSession.total_duration = totalDuration;
            this.currentSession.total_pages = pagesRead;
            this.currentSession.pages_per_min = totalDuration > 0 ? pagesRead / totalDuration : 0;
            this.currentSession.end_time = now;
            
            // Update book progress
            this.currentBook.pages_read = Math.min(
                currentPage,
                this.currentBook.pages_total
            );
            
            // Save session
            this.sessions.push(this.currentSession);
            
            // Check if book is completed
            if (this.currentBook.pages_read >= this.currentBook.pages_total) {
                // Store book title for rating modal
                this.completedBookTitle = this.currentBook.title;
                
                // Show rating modal
                this.showRatingModal = true;
                
                // Mark as completed but don't clear currentBook yet
                this.currentBook.status = 'completed';
                this.currentBook.date_finished = now;
            }
            
            // Clean up
            this.currentSession = null;
            localStorage.removeItem('activeSession');
            
            this.saveData();
        },
        
        // Session Display
        formatSessionTime() {
            if (!this.currentSession) return '00:00';
            
            // Calculate total time from segments
            let totalTime = 0;
            const now = Date.now();
            
            this.currentSession.segments.forEach(segment => {
                const start = new Date(segment.start_time).getTime();
                const end = segment.end_time ? new Date(segment.end_time).getTime() : now;
                totalTime += end - start;
            });
            
            const minutes = Math.floor(totalTime / (1000 * 60));
            const seconds = Math.floor((totalTime % (1000 * 60)) / 1000);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        getEstimatedSessionLength() {
            if (!this.currentBook) return '--';
            
            const avgSpeed = parseFloat(this.getAverageSpeed());
            if (avgSpeed === 0) return '--';
            
            const pagesPerDay = this.getPagesPerDay();
            if (pagesPerDay === '--' || pagesPerDay === 'Overdue!') return '--';
            
            // Calculate estimated session length: pages needed per day / reading speed
            const minutesNeeded = pagesPerDay / avgSpeed;
            
            return this.formatMinutes(minutesNeeded);
        },

        // Utility Functions
        formatTime(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },

        formatDate(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
        },

        getSessionTimestamps() {
            if (!this.currentSession) return [];
            
            const timestamps = [];
            
            // Add start timestamp
            timestamps.push({
                label: 'Start:',
                time: this.formatTime(this.currentSession.start_time),
            });
            
            // Add pause/resume timestamps from segments
            this.currentSession.segments.forEach((segment, index) => {
                if (index > 0) {
                    // This is a resume (start of new segment after first)
                    timestamps.push({
                        label: 'Resume:',
                        time: this.formatTime(segment.start_time),
                    });
                }
                
                if (segment.end_time) {
                    // This segment was paused or finished
                    const isLastSegment = index === this.currentSession.segments.length - 1;
                    const label = this.currentSession.end_time && isLastSegment ? 'Finish:' : 'Pause:';
                    timestamps.push({
                        label: label,
                        time: this.formatTime(segment.end_time),
                    });
                }
            });
            
            return timestamps;
        },

        formatMinutes(minutes) {
            if (minutes < 60) {
                return `${Math.round(minutes)}m`;
            } else {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = Math.round(minutes % 60);
                return `${hours}h ${remainingMinutes}m`;
            }
        },

        // Book Details Modal Helpers
        getBookSessions(bookId) {
            if (!bookId) return [];
            return this.sessions.filter(session => session.book_id === bookId);
        },

        getBookTotalTime(book) {
            if (!book) return '0m';
            const bookSessions = this.getBookSessions(book.id);
            const totalMinutes = bookSessions.reduce((total, session) => total + (session.total_duration || 0), 0);
            return this.formatMinutes(totalMinutes);
        },

        getBookTotalPages(book) {
            if (!book) return 0;
            const bookSessions = this.getBookSessions(book.id);
            return bookSessions.reduce((total, session) => total + (session.total_pages || 0), 0);
        },

        getAverageReadingSpeed(book) {
            if (!book) return '0.0';
            const bookSessions = this.getBookSessions(book.id);
            if (bookSessions.length === 0) return '0.0';
            const totalMinutes = bookSessions.reduce((total, session) => total + (session.total_duration || 0), 0);
            const totalPages = bookSessions.reduce((total, session) => total + (session.total_pages || 0), 0);
            return totalMinutes > 0 ? (totalPages / totalMinutes * 60).toFixed(1) : '0.0';
        },

        formatSessionDuration(session) {
            if (!session || !session.total_duration) return '0m';
            return this.formatMinutes(session.total_duration);
        },

        closeBookDetails() {
            this.showBookDetails = false;
            this.selectedBook = null;
        },
        
        // Genre Chart
        initGenreChart() {
            // Initialize chart when genres tab is first viewed
            this.$watch('currentTab', (newTab) => {
                if (newTab === 'genres') {
                    this.$nextTick(() => {
                        this.updateGenreChart();
                    });
                }
                // Close book details modal when switching tabs
                if (this.showBookDetails) {
                    this.closeBookDetails();
                }
            });
        },
        
        updateGenreChart() {
            const ctx = document.getElementById('genreChart');
            if (!ctx) return;
            
            // Calculate genre counts for all books (not just completed)
            const genreCounts = {};
            const completedGenreCounts = {};
            
            this.books.forEach(book => {
                if (book.genres && book.genres.length > 0) {
                    book.genres.forEach(genre => {
                        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                        if (book.status === 'completed') {
                            completedGenreCounts[genre] = (completedGenreCounts[genre] || 0) + 1;
                        }
                    });
                }
            });
            
            const labels = Object.keys(genreCounts);
            const totalData = Object.values(genreCounts);
            const completedData = labels.map(label => completedGenreCounts[label] || 0);
            
            if (labels.length === 0) {
                // Show a message when no genres are available
                const context = ctx.getContext('2d');
                context.clearRect(0, 0, ctx.width, ctx.height);
                context.font = '16px Arial';
                context.fillStyle = '#6b7280';
                context.textAlign = 'center';
                context.fillText('No books with genres yet', ctx.width / 2, ctx.height / 2);
                context.fillText('Add some books to see your reading genres!', ctx.width / 2, ctx.height / 2 + 25);
                return;
            }
            
            // Create or update chart
            if (this.genreChart) {
                this.genreChart.destroy();
            }
            
            this.genreChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Books',
                        data: totalData,
                        backgroundColor: [
                            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                            '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
                            '#ec4899', '#6b7280', '#f43f5e', '#14b8a6',
                            '#a855f7', '#0ea5e9', '#f97316', '#22c55e'
                        ],
                        borderWidth: 3,
                        borderColor: '#fff',
                        hoverBorderWidth: 4,
                        hoverBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    size: 12
                                },
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const total = totalData[i];
                                            const completed = completedData[i];
                                            return {
                                                text: `${label} (${completed}/${total})`,
                                                fillStyle: data.datasets[0].backgroundColor[i],
                                                strokeStyle: data.datasets[0].borderColor,
                                                lineWidth: data.datasets[0].borderWidth,
                                                pointStyle: 'circle',
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const total = context.parsed;
                                    const completed = completedData[context.dataIndex];
                                    const percentage = ((total / totalData.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                    return [
                                        `${label}: ${total} books (${percentage}%)`,
                                        `Completed: ${completed}`,
                                        `In Progress: ${total - completed}`
                                    ];
                                }
                            }
                        }
                    },
                    cutout: '50%',
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const clickedGenre = labels[elementIndex];
                            this.filterByGenre(clickedGenre);
                        }
                    }
                }
            });
        },

        // Genre Filter Methods
        filterByGenre(genre) {
            this.selectedGenre = genre;
            this.filteredBooks = this.books.filter(book => 
                book.genres && book.genres.includes(genre)
            );
        },

        clearGenreFilter() {
            this.selectedGenre = null;
            this.filteredBooks = [];
        },

        // Book Search Methods
        async searchBooks() {
            if (!this.searchQuery.trim()) return;
            
            this.searchLoading = true;
            this.searchResults = [];
            
            try {
                const query = encodeURIComponent(this.searchQuery.trim());
                const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`);
                const data = await response.json();
                
                this.searchResults = data.docs.map(book => ({
                    key: book.key,
                    title: book.title,
                    author: book.author_name ? book.author_name[0] : 'Unknown Author',
                    first_publish_year: book.first_publish_year,
                    cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                    isbn: book.isbn ? book.isbn[0] : null,
                    subjects: book.subject ? book.subject.slice(0, 10) : [] // Limit to 10 subjects
                }));
            } catch (error) {
                console.error('Error searching books:', error);
                alert('Error searching books. Please try again.');
            } finally {
                this.searchLoading = false;
            }
        },

        async selectSearchResult(book) {
            this.selectedSearchBook = {
                ...book,
                pages_total: null,
                due_date: '',
                selected_genres: [],
                description: ''
            };
            
            // Try to get more details from the book's work page
            try {
                const workKey = book.key.replace('/works/', '');
                const workResponse = await fetch(`https://openlibrary.org/works/${workKey}.json`);
                const workData = await workResponse.json();
                
                if (workData.description) {
                    this.selectedSearchBook.description = typeof workData.description === 'string' 
                        ? workData.description 
                        : workData.description.value;
                }
                
                // Try to get page count from editions
                if (book.isbn) {
                    try {
                        const editionResponse = await fetch(`https://openlibrary.org/isbn/${book.isbn}.json`);
                        const editionData = await editionResponse.json();
                        
                        if (editionData.number_of_pages) {
                            this.selectedSearchBook.pages_total = editionData.number_of_pages;
                        }
                    } catch (editionError) {
                        console.log('Could not fetch edition details:', editionError);
                    }
                }
                
                // If no page count from ISBN, try to get it from the work's editions
                if (!this.selectedSearchBook.pages_total && workData.key) {
                    try {
                        const editionsResponse = await fetch(`https://openlibrary.org${workData.key}/editions.json?limit=5`);
                        const editionsData = await editionsResponse.json();
                        
                        // Find the first edition with page count
                        const editionWithPages = editionsData.entries?.find(edition => edition.number_of_pages);
                        if (editionWithPages) {
                            this.selectedSearchBook.pages_total = editionWithPages.number_of_pages;
                        }
                    } catch (editionsError) {
                        console.log('Could not fetch editions data:', editionsError);
                    }
                }
            } catch (error) {
                console.log('Could not fetch additional book details:', error);
            }
        },

        clearSelection() {
            this.selectedSearchBook = {
                pages_total: null,
                due_date: '',
                selected_genres: []
            };
            this.searchResults = [];
            this.searchQuery = '';
            this.newGenre = '';
            this.selectedExistingGenre = '';
        },

        addBookToLibrary() {
            if (!this.selectedSearchBook?.title) {
                alert('Please select a book first.');
                return;
            }
            
            const pagesTotal = parseInt(this.selectedSearchBook.pages_total);
            if (!pagesTotal || pagesTotal <= 0) {
                alert('Please enter a valid number of pages (greater than 0).');
                return;
            }

            const newBook = {
                id: 'book_' + Date.now(),
                title: this.selectedSearchBook.title,
                author: this.selectedSearchBook.author,
                pages_total: pagesTotal,
                pages_read: 0,
                cover_url: this.selectedSearchBook.cover_url,
                description: this.selectedSearchBook.description,
                genres: this.selectedSearchBook.selected_genres || [],
                status: 'current',
                date_started: new Date().toISOString(),
                due_date: this.selectedSearchBook.due_date || null,
                rating: null
            };

            // Add to books array
            this.books.push(newBook);
            
            // Set as current book
            this.currentBook = newBook;
            localStorage.setItem('currentBookId', newBook.id);
            
            // Update genres list
            newBook.genres.forEach(genre => {
                if (!this.genres.find(g => g.name === genre)) {
                    this.genres.push({ name: genre, count: 1 });
                } else {
                    this.genres.find(g => g.name === genre).count++;
                }
            });
            
            // Save data
            this.saveData();
            
            // Close modal and reset
            this.showAddBook = false;
            this.clearSelection();
            
            // Update genre chart
            this.updateGenreChart();
        },

        editDueDate(book) {
            if (!book) return;
            
            const currentDate = book.due_date ? book.due_date.split('T')[0] : '';
            const newDate = prompt('Enter new due date (YYYY-MM-DD):', currentDate);
            
            if (newDate === null) return; // User cancelled
            
            if (newDate === '') {
                // Remove due date
                book.due_date = null;
            } else {
                // Validate date format
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(newDate)) {
                    alert('Please enter a valid date in YYYY-MM-DD format.');
                    return;
                }
                
                // Check if date is valid
                const testDate = new Date(newDate);
                if (testDate.toISOString().split('T')[0] !== newDate) {
                    alert('Please enter a valid date.');
                    return;
                }
                
                book.due_date = newDate;
            }
            
            // Update the book in the books array
            const bookIndex = this.books.findIndex(b => b.id === book.id);
            if (bookIndex !== -1) {
                this.books[bookIndex] = { ...book };
            }
            
            // If this is the current book, update it too
            if (this.currentBook && this.currentBook.id === book.id) {
                this.currentBook = { ...book };
            }
            
            this.saveData();
        },
        abandonCurrentBook() {
            if (!this.currentBook) return;
            
            if (confirm('Are you sure you want to abandon this book? It will be marked as "Did Not Finish" in your library.')) {
                // Update book status to DNF
                this.currentBook.status = 'DNF';
                this.currentBook.date_abandoned = new Date().toISOString();
                
                // Update the book in the books array
                const bookIndex = this.books.findIndex(book => book.id === this.currentBook.id);
                if (bookIndex !== -1) {
                    this.books[bookIndex] = { ...this.currentBook };
                }
                
                // Clear current book
                this.currentBook = null;
                localStorage.removeItem('currentBookId');
                
                // Save data
                this.saveData();
                
                alert('Book has been marked as "Did Not Finish" and moved to your library.');
            }
        },

        // Delete book from library
        deleteBook(bookId) {
            if (confirm('Are you sure you want to permanently delete this book from your library? This action cannot be undone.')) {
                // Remove book from books array
                this.books = this.books.filter(book => book.id !== bookId);
                
                // If this was the current book, clear it
                if (this.currentBook && this.currentBook.id === bookId) {
                    this.currentBook = null;
                    localStorage.removeItem('currentBookId');
                }
                
                // Save data
                this.saveData();
                
                // Update genre chart
                this.updateGenreChart();
            }
        },

        // Genre Management Methods
        get availableGenres() {
            return this.genres.filter(genre => 
                !this.selectedSearchBook.selected_genres.includes(genre.name)
            );
        },

        addGenre() {
            const genre = this.newGenre?.trim();
            if (!genre) return;
            
            // Check if genre already selected
            if (this.selectedSearchBook.selected_genres.includes(genre)) {
                alert('This genre is already selected.');
                return;
            }
            
            // Add to selected genres
            this.selectedSearchBook.selected_genres.push(genre);
            this.newGenre = '';
        },

        addExistingGenre() {
            if (!this.selectedExistingGenre) return;
            
            // Check if genre already selected
            if (this.selectedSearchBook.selected_genres.includes(this.selectedExistingGenre)) {
                alert('This genre is already selected.');
                this.selectedExistingGenre = '';
                return;
            }
            
            // Add to selected genres
            this.selectedSearchBook.selected_genres.push(this.selectedExistingGenre);
            this.selectedExistingGenre = '';
        },

        removeGenre(genre) {
            const index = this.selectedSearchBook.selected_genres.indexOf(genre);
            if (index > -1) {
                this.selectedSearchBook.selected_genres.splice(index, 1);
            }
        },

        // Rating Methods
        rateBook(isPositive) {
            if (this.currentBook) {
                this.currentBook.rating = isPositive ? 'thumbs_up' : 'thumbs_down';
                this.finishBookCompletion();
            }
        },

        skipRating() {
            if (this.currentBook) {
                this.currentBook.rating = null;
                this.finishBookCompletion();
            }
        },

        finishBookCompletion() {
            // Clear current book and close modal
            this.currentBook = null;
            localStorage.removeItem('currentBookId');
            this.showRatingModal = false;
            this.completedBookTitle = '';
            
            // Save data
            this.saveData();
        }
    };
}

// Demo data for testing (remove in production)
function loadDemoData() {
    const demoBook = {
        id: 'demo-1',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        pages_total: 310,
        pages_read: 125,
        cover_url: 'https://covers.openlibrary.org/b/id/6979861-M.jpg',
        description: 'A classic fantasy adventure following Bilbo Baggins on his unexpected journey.',
        genres: ['Fantasy', 'Adventure', 'Classic'],
        status: 'current',
        date_started: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days from now
    };
    
    // Only add demo data if no books exist
    const existingBooks = localStorage.getItem('shelfLife_books');
    if (!existingBooks) {
        localStorage.setItem('shelfLife_books', JSON.stringify([demoBook]));
        localStorage.setItem('currentBookId', demoBook.id);
    }
}

// Load demo data on first visit
document.addEventListener('DOMContentLoaded', () => {
    loadDemoData();
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
    
    // PWA Install Prompt
    const installButton = document.getElementById('install-button');
    const installBanner = document.getElementById('install-banner');
    
    // Simple install banner - just show it if not installed
    function showInstallBanner() {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('App is already installed');
            return;
        }
        
        const installBanner = document.getElementById('install-banner');
        if (installBanner) {
            installBanner.style.display = 'block';
            console.log('Install banner shown');
        }
    }
    
    // Show banner after page loads
    setTimeout(() => {
        showInstallBanner();
    }, 2000); // Show after 2 seconds
    

    
    // Handle install button click
    if (installButton) {
        installButton.addEventListener('click', () => {
            // Just show instructions for all browsers
            const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
            if (isSafari) {
                alert('To install this app:\n1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"');
            } else {
                alert('To install this app, look for "Add to Home Screen" or "Install" option in your browser menu.');
            }
            
            // Hide banner after showing instructions
            if (installBanner) {
                installBanner.style.display = 'none';
            }
        });
    }
    
    // Handle dismiss button click
    const dismissButton = document.getElementById('dismiss-install');
    if (dismissButton) {
        dismissButton.addEventListener('click', () => {
            if (installBanner) {
                installBanner.style.display = 'none';
            }
            // Just hide the banner - it will show again on next page load
        });
    }
});

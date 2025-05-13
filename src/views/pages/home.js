import { StoryModel } from '../../models/story-model.js';
import { HomePresenter } from '../../presenters/home-presenter.js';
import { AuthHelper } from '../../utils/auth-helper.js';

class HomePage {
  constructor() {
    this._model = new StoryModel();
    this._presenter = null;
  }

  async render() {
    console.log('Rendering home page');
    return `
      <section class="home-page page-transition">
        <div class="coordinator-layout">
          <div class="coordinator-header">
            <div>
              <h2 class="coordinator-title">Cerita Terbaru</h2>
              <p>Jelajahi dan bagikan cerita menarik dari komunitas Dicoding</p>
            </div>
            ${AuthHelper.isLoggedIn() ? 
              `<a href="#/add" class="btn btn-primary">
                <i class="fas fa-plus"></i> Tambah Cerita
               </a>` : 
              `<a href="#/login" class="btn">
                <i class="fas fa-sign-in-alt"></i> Login untuk Berbagi Cerita
               </a>`
            }
          </div>
          
          <div id="stories-container" class="coordinator-grid">
            <div class="loader" id="stories-loader"></div>
          </div>
          
          <div id="error-container" class="error-container hidden"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('Home page afterRender');
    this._presenter = new HomePresenter(this._model, this);
    
    await this._presenter.getStories();
  }

  showLoading() {
    const loader = document.getElementById('stories-loader');
    if (loader) {
      loader.classList.remove('hidden');
    }
    
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.classList.add('hidden');
    }
  }

  hideLoading() {
    const loader = document.getElementById('stories-loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }

  renderStories(stories) {
    console.log('Rendering stories:', stories.length);
    this.hideLoading();
    
    const storiesContainer = document.getElementById('stories-container');
    if (!storiesContainer) {
      console.error('Stories container not found');
      return;
    }
    
    if (stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>Belum ada cerita yang dibagikan.</p>
        </div>
      `;
      return;
    }
    
    storiesContainer.innerHTML = '';
    
    stories.forEach((story, index) => {
      const initial = story.name.charAt(0).toUpperCase();
      
      const storyItemElement = document.createElement('article');
      storyItemElement.classList.add('story-card');
      
      storyItemElement.innerHTML = `
        <div class="story-image-container">
          <img
            src="${story.photoUrl}"
            alt="Cerita dari ${story.name}"
            class="story-image"
            loading="lazy"
          />
        </div>
        <div class="story-content">
          <div class="user-info">
            <div class="user-avatar">${initial}</div>
            <span class="user-name">${story.name}</span>
          </div>
          
          <h3 class="story-title">${story.name}</h3>
          <p class="story-description">${this._truncateText(story.description, 100)}</p>
          
          <div class="story-meta">
            <div class="story-info">
              <i class="fas fa-calendar-alt"></i>
              <span>${this._formatDate(story.createdAt)}</span>
            </div>
            
            ${story.lat && story.lon ? 
              `<div class="story-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>Lokasi tersedia</span>
              </div>` : ''
            }
          </div>
          
          <div class="story-actions">
            <a href="#" class="view-details-btn" data-id="${story.id}">
              View Details
            </a>
          </div>
        </div>
      `;
      
      storiesContainer.appendChild(storyItemElement);
      
      const viewDetailBtn = storyItemElement.querySelector('.view-details-btn');
      viewDetailBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.selectedStoryId = story.id;
        window.location.href = '#/detail';
      });
    });
  }

  showError(message) {
    this.hideLoading();
    
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
      console.error('Error container not found');
      return;
    }
    
    errorContainer.classList.remove('hidden');
    errorContainer.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle fa-3x"></i>
        <h3>Gagal memuat cerita</h3>
        <p>${message}</p>
        <button id="retry-button" class="btn">Coba Lagi</button>
      </div>
    `;
    
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', async () => {
        await this._presenter.getStories();
      });
    }
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substr(0, maxLength) + '...';
  }

  _formatDate(dateString) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }
}

export { HomePage };
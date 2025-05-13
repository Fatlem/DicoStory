import { routes } from './routes/routes.js';
import { UrlParser } from './utils/url-parser.js';
import { AuthHelper } from './utils/auth-helper.js';

window.selectedStoryId = null;

class App {
  constructor() {
    this._initializeApp();
  }

  _initializeApp() {
    console.log('Initializing app...');
    this._initMobileNav();
    
    this._checkAuthStatus();
    
    this._handleRoute();
    
    window.addEventListener('hashchange', () => {
      this._handleRoute();
    });

    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'A' && event.target.href.includes('#/')) {
        if (document.startViewTransition) {
          event.preventDefault();
          document.startViewTransition(() => {
            window.location.href = event.target.href;
          });
        }
      }
    });
  }

  _initMobileNav() {
    const menuButton = document.getElementById('menu');
    const drawer = document.getElementById('drawer');
    
    if (!menuButton || !drawer) {
      console.error('Menu button or drawer not found');
      return;
    }
    
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      drawer.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
      if (drawer.classList.contains('open') && !drawer.contains(event.target)) {
        drawer.classList.remove('open');
      }
    });

    const navLinks = document.querySelectorAll('.nav-item a');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    });
  }

  _checkAuthStatus() {
    console.log('Checking auth status...');
    const isLoggedIn = AuthHelper.isLoggedIn();
    const loginMenuItem = document.getElementById('login-menu');
    const registerMenuItem = document.getElementById('register-menu');
    const logoutMenuItem = document.getElementById('logout-menu');

    if (!loginMenuItem || !registerMenuItem || !logoutMenuItem) {
      console.error('Menu items not found');
      return;
    }

    if (isLoggedIn) {
      console.log('User is logged in');
      loginMenuItem.classList.add('hidden');
      registerMenuItem.classList.add('hidden');
      logoutMenuItem.classList.remove('hidden');
    } else {
      console.log('User is not logged in');
      loginMenuItem.classList.remove('hidden');
      registerMenuItem.classList.remove('hidden');
      logoutMenuItem.classList.add('hidden');
    }

    logoutMenuItem.addEventListener('click', (event) => {
      event.preventDefault();
      AuthHelper.logout();
      window.location.href = '#/';
      window.location.reload();
    });
  }

  async _handleRoute() {
    console.log('Handling route...');
    
    const urlParts = window.location.hash.slice(1).split('/');
    if (urlParts.length > 2 && urlParts[1] === 'detail') {
      window.selectedStoryId = urlParts[2];
      window.history.replaceState(null, null, '#/detail');
    }
    
    const url = UrlParser.parseActiveUrlWithCombiner();
    console.log('Current URL:', url);
    const page = routes[url] || routes['/'];
    console.log('Page to render:', page);
    
    try {
      if (url === '/login' || url === '/register') {
        if (AuthHelper.isLoggedIn()) {
          console.log('User is logged in, redirecting to home');
          window.location.href = '#/';
          return;
        }
      }

      if ((url === '/add' || url === '/map') && !AuthHelper.isLoggedIn()) {
        console.log('Protected route, redirecting to login');
        window.location.href = '#/login';
        return;
      }

      const contentContainer = document.querySelector('#content');
      
      if (!contentContainer) {
        console.error('Content container not found');
        return;
      }
      
      contentContainer.innerHTML = '';

      const view = new page.view();
      console.log('View instantiated');
      const content = await view.render();
      console.log('Content rendered');
      contentContainer.innerHTML = content;
      console.log('Content injected into DOM');
      await view.afterRender();
      console.log('afterRender completed');

      document.getElementById('main-content').focus();
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  new App();
});


const initNotifications = async () => {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      if (AuthHelper.isLoggedIn()) {
        await requestNotificationPermission(registration);
      }
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

const requestNotificationPermission = async (registration) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeUserToPush(registration);
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

const subscribeUserToPush = async (registration) => {
  try {
    const token = AuthHelper.getToken();
    if (!token) return;

    const subscriptionOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
      ),
    };

    const subscription = await registration.pushManager.subscribe(subscriptionOptions);
    
    await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
        },
      }),
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

document.addEventListener('DOMContentLoaded', initNotifications);
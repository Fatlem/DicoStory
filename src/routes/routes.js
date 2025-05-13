import { HomePage } from '../views/pages/home.js';
import { AddStoryPage } from '../views/pages/add-story.js';
import { MapPage } from '../views/pages/map.js';
import { DetailPage } from '../views/pages/detail.js';
import { LoginPage } from '../views/pages/login.js';
import { RegisterPage } from '../views/pages/register.js';

const routes = {
  '/': {
    view: HomePage,
  },
  '/add': {
    view: AddStoryPage,
  },
  '/map': {
    view: MapPage,
  },
  '/detail': {
    view: DetailPage,
  },
  '/login': {
    view: LoginPage,
  },
  '/register': {
    view: RegisterPage,
  },
};

export { routes };
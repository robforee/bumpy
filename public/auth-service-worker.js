self.addEventListener('install', (event) => {
    console.log('Auth Service Worker installed');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Auth Service Worker activated');
  });
  
  self.addEventListener('fetch', (event) => {
    // You can add custom fetch handling here if needed
  });
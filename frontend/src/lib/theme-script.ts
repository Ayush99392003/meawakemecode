export const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('dsa-sheet-theme');
      var root = document.documentElement;
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.setAttribute('data-theme', 'dark');
          root.classList.add('dark');
        } else {
          root.setAttribute('data-theme', 'light');
          root.classList.remove('dark');
        }
      }
    } catch(e) {}
  })();
`;


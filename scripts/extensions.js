// Dark mode functionality
      const initTheme = () => {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
      };

      const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
      };

      const updateThemeIcon = (theme) => {
        const icon = document.getElementById("theme-toggle");
        icon.textContent = theme === "dark" ? "☀️" : "🌙";
      };

      // Initialize theme on load
      initTheme();

      // Event Listeners
      document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
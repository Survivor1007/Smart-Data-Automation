import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Upload from './pages/Upload';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import { applyTheme, getSavedTheme, type Theme } from './utils/theme';
import { useEffect, useState } from 'react';

// We'll add DatasetDetail next

function App() {

  const [theme,setTheme] = useState<Theme>(getSavedTheme());

  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme:dark)");
    const handleChange = () => {
      if(theme === "system") applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  },[theme]);


  const toggleTheme = () => {
    const next: Theme = 
    theme === "light"? "dark":theme === "dark"?"system":"light";
    setTheme(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Router>
        <nav className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/datasets" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Smart Data Automation
            </Link>
            <div className="space-x-6 flex items-center">
              <Link to="/datasets" className="hover:text-blue-600 dark:hover:text-blue-400">
                Datasets
              </Link>
              <Link to="/upload" className="hover:text-blue-600 dark:hover:text-blue-400">
                Upload
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? "🌙" : theme === "dark" ? "☀️" : "⚙️"}
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Datasets />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/datasets/:id" element={<DatasetDetail />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
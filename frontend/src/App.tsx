import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Upload from './pages/Upload';
import Datasets from './pages/Datasets';
// We'll add DatasetDetail next

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/datasets" className="text-xl font-bold text-blue-600">
              Smart Data Automation
            </Link>
            <div className="space-x-6">
              <Link to="/datasets" className="text-gray-700 hover:text-blue-600">
                Datasets
              </Link>
              <Link to="/upload" className="text-gray-700 hover:text-blue-600">
                Upload
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Datasets />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/upload" element={<Upload />} />
          {/* Next: <Route path="/datasets/:id" element={<DatasetDetail />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeView } from './presentation/views/HomeView';
import { NewsDetailView } from './presentation/views/NewsDetailView';
import './i18n'; // Initialize i18n

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/news/:id" element={<NewsDetailView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

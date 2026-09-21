import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Lightbox } from './components/Lightbox'
import { Shell } from './components/Shell'
import { FolderPage } from './pages/FolderPage'
import { LibraryHome } from './pages/LibraryHome'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { PlanPage } from './pages/PlanPage'
import { LibraryProvider } from './store/library'

export default function App() {
  return (
    <LibraryProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/autorender" replace />} />
            <Route path="/autorender" element={<LibraryHome />} />
            <Route path="/autorender/plans/:planId" element={<PlanPage />} />
            <Route
              path="/autorender/plans/:planId/folders/:folderId"
              element={<FolderPage />}
            />
            <Route path="/dashboard" element={<PlaceholderPage id="dashboard" />} />
            <Route path="/plans" element={<PlaceholderPage id="plans" />} />
            <Route path="/communities" element={<PlaceholderPage id="communities" />} />
            <Route path="/lots" element={<PlaceholderPage id="lots" />} />
            <Route path="/options" element={<PlaceholderPage id="options" />} />
            <Route path="/users" element={<PlaceholderPage id="users" />} />
            <Route path="/settings" element={<PlaceholderPage id="settings" />} />
            <Route path="*" element={<Navigate to="/autorender" replace />} />
          </Routes>
        </Shell>
        <Lightbox />
      </HashRouter>
    </LibraryProvider>
  )
}

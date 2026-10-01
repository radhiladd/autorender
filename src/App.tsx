import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Lightbox } from './components/Lightbox'
import { Shell } from './components/Shell'
import { CollectionPage } from './pages/CollectionPage'
import { LibraryHome } from './pages/LibraryHome'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { PlanPage } from './pages/PlanPage'
import { RendersPage } from './pages/RendersPage'
import { SessionsPage } from './pages/SessionsPage'
import { ConfigurePlan } from './pages/ConfigurePlan'
import { RenderStudio } from './pages/RenderStudio'
import { LibraryProvider } from './store/library'
import { RenderFlowProvider } from './store/renderFlow'

function LegacyFolderRedirect() {
  const { folderId } = useParams()
  return <Navigate to={`/autorender/collections/${folderId}`} replace />
}

export default function App() {
  return (
    <LibraryProvider>
      <RenderFlowProvider>
        <HashRouter>
          <Shell>
            <Routes>
              <Route path="/" element={<Navigate to="/autorender" replace />} />
              <Route path="/autorender" element={<LibraryHome />} />
              <Route
                path="/autorender/render"
                element={<Navigate to="/autorender" replace state={{ pickPlan: true }} />}
              />
              <Route path="/autorender/render/configure/:planId" element={<ConfigurePlan />} />
              <Route path="/autorender/render/review/:planId" element={<ConfigurePlan />} />
              <Route path="/autorender/render/studio/:planId" element={<RenderStudio />} />
              <Route
                path="/autorender/render/configure"
                element={<Navigate to="/autorender" replace state={{ pickPlan: true }} />}
              />
              <Route
                path="/autorender/render/studio"
                element={<Navigate to="/autorender" replace state={{ pickPlan: true }} />}
              />
              <Route path="/autorender/plans/:planId" element={<PlanPage />} />
              <Route
                path="/autorender/plans/:planId/folders/:folderId"
                element={<LegacyFolderRedirect />}
              />
              <Route path="/autorender/renders" element={<RendersPage />} />
            <Route path="/autorender/sessions" element={<SessionsPage />} />
              <Route path="/autorender/collections/:collectionId" element={<CollectionPage />} />
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
      </RenderFlowProvider>
    </LibraryProvider>
  )
}

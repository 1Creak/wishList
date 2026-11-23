import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { WishlistPage } from './pages/WishlistPage'
import { ProfilePage } from './pages/ProfilePage'
import { InvitePage } from './pages/InvitePage'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="me" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="w/:id" element={<WishlistPage />} />
          <Route path="u/:username" element={<ProfilePage />} />
          <Route path="invite/:token" element={<InvitePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

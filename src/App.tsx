import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout, ProtectedRoute, AdminRoute } from "./components/layout/AppLayout";
import { AdminGuard } from "./components/admin/AdminGuard";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { CreateBuildPage } from "./pages/CreateBuildPage";
import { EditBuildPage } from "./pages/EditBuildPage";
import { BrowseBuildsPage } from "./pages/BrowseBuildsPage";
import { MyBuildsPage } from "./pages/MyBuildsPage";
import { BuildDetailsPage } from "./pages/BuildDetailsPage";
import { ComparePage } from "./pages/ComparePage";
import { BugReportPage } from "./pages/BugReportPage";
import { AdminHubPage } from "./pages/admin/AdminHubPage";
import { AdminClassesPage } from "./pages/admin/AdminClassesPage";
import { AdminItemsPage } from "./pages/admin/AdminItemsPage";
import { AdminBugReportsPage } from "./pages/admin/AdminBugReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="builds" element={<BrowseBuildsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="builds/new" element={<CreateBuildPage />} />
            <Route path="builds/mine" element={<MyBuildsPage />} />
            <Route path="builds/:id/edit" element={<EditBuildPage />} />
            <Route path="bug-report" element={<BugReportPage />} />
          </Route>

          <Route path="builds/:id/compare" element={<ComparePage />} />
          <Route path="builds/:id" element={<BuildDetailsPage />} />

          <Route element={<AdminRoute />}>
            <Route element={<AdminGuard />}>
              <Route path="admin" element={<AdminHubPage />} />
              <Route path="admin/classes" element={<AdminClassesPage />} />
              <Route path="admin/items" element={<AdminItemsPage />} />
              <Route path="admin/bug-reports" element={<AdminBugReportsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

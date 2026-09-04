import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

import App from "../App";
import Planner from "../planner/Planner";
import PlanningSandbox from "../planner/sandbox/PlanningSandbox";
import BookCoverSandbox from "../planner/book/BookCoverSandbox";
import RuntimePlanningBook from "../planner/planning-book/RuntimePlanningBook";
import R4ShadowPreview from "../planner/planning-book/R4ShadowPreview";
import AdminLogin from "../admin/AdminLogin";
import Concierge from "../concierge/Concierge";

function AdminQuoteEditRoute() {
  const { sessionId } = useParams();
  return <AdminLogin view="quote-edit" sessionId={sessionId} />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/planner-sandbox" element={<PlanningSandbox />} />
        <Route path="/book-cover" element={<BookCoverSandbox />} />

        <Route path="/planning-book" element={<RuntimePlanningBook />} />
        <Route path="/r4-preview" element={<R4ShadowPreview />} />

        <Route path="/admin" element={<AdminLogin view="workspace" />} />
        <Route path="/admin/produtos" element={<AdminLogin view="products" />} />
        <Route path="/admin/editar-pedido" element={<AdminLogin view="quote-edit-index" />} />
        <Route path="/admin/orcamentos/:sessionId/editar" element={<AdminQuoteEditRoute />} />
      </Routes>
      <Concierge />
    </BrowserRouter>
  );
}

export default AppRoutes;

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import App from "../App";
import Planner from "../planner/Planner";
import PlanningSandbox from "../planner/sandbox/PlanningSandbox";
import BookCoverSandbox from "../planner/book/BookCoverSandbox";
import PlanningBook from "../planner/planning-book/PlanningBook";
import R4ShadowPreview from "../planner/planning-book/R4ShadowPreview";
import AdminLogin from "../admin/AdminLogin";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={<App />}
        />

        {/* Planner atual */}
        <Route
          path="/planner"
          element={<Planner />}
        />

        {/* Sandbox antigo */}
        <Route
          path="/planner-sandbox"
          element={<PlanningSandbox />}
        />

        {/* Teste do conceito do caderno */}
        <Route
          path="/book-cover"
          element={<BookCoverSandbox />}
        />

        {/* Novo Planner (em desenvolvimento) */}
        <Route
          path="/planning-book"
          element={<PlanningBook />}
        />

        {/* Laboratorio visual isolado do RF-REC-2 R4 shadow */}
        <Route
          path="/r4-preview"
          element={<R4ShadowPreview />}
        />

        {/* Primeira superficie visual administrativa */}
        <Route
          path="/admin"
          element={<AdminLogin />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

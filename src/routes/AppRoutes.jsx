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

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
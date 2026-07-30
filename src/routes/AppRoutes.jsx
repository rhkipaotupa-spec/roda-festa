import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "../App";
import Planner from "../planner/Planner";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/planner" element={<Planner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
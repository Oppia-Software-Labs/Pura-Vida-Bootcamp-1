import { Navigate, Route, Routes } from "react-router";
import AppLayout from "@layouts/AppLayout";
import CreateDepositPage from "@pages/CreateDepositPage";
import DepositDetailPage from "@pages/DepositDetailPage";
import DepositsPage from "@pages/DepositsPage";
import HomePage from "@pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="crear" element={<CreateDepositPage />} />
        <Route path="depositos" element={<DepositsPage />} />
        <Route path="depositos/:id" element={<DepositDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

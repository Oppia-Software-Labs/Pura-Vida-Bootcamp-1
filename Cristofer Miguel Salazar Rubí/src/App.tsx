import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { FolioProvider } from "./FolioProvider";
import { BookPage } from "./pages/BookPage";
import { ExplorePage } from "./pages/ExplorePage";
import { LibraryPage } from "./pages/LibraryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PublishPage } from "./pages/PublishPage";
import { ReaderPage } from "./pages/ReaderPage";

export default function App() {
  return (
    <FolioProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ExplorePage />} />
          <Route path="libro/:bookId" element={<BookPage />} />
          <Route path="leer/:bookId" element={<ReaderPage />} />
          <Route path="biblioteca" element={<LibraryPage />} />
          <Route path="publicar" element={<PublishPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </FolioProvider>
  );
}

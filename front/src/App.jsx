import { Routes, Route } from "react-router-dom";
import UploadPage from "./app/upload/page";

function App() {
    return (
        <Routes>
            <Route path="/" element={<h1>Bienvenido</h1>} />
            <Route path="/upload" element={<UploadPage />} />
        </Routes>
    );
}

export default App;

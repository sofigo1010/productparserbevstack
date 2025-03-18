import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./app/login/login";
import UploadPage from "./app/upload/page";
import UploadFilterPage from "./app/filter/page";

function App() {
    const user = JSON.parse(localStorage.getItem("user")); 

    return (
        <Routes>
            {/* Si el usuario está logueado, redirigir a /upload */}
            <Route path="/" element={user ? <Navigate to="/upload" /> : <Login />} />
            <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/" />} />
            <Route path="/filter" element={user ? <UploadFilterPage /> : <Navigate to="/" />} />
        </Routes>
    );
}

export default App;

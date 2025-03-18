import React, { useState } from "react";
import axios from "axios";

const UploadFilterPage = () => {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !keyword.trim()) {
      setMessage("⚠️ Debes subir un archivo y escribir una palabra clave.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("keyword", keyword);

    try {
      const response = await axios.post("http://localhost:5000/filter-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${keyword.replace(/\s+/g, "_")}_products.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("✅ Archivo generado y descargado correctamente.");
    } catch (error) {
      const errorMessage = await error.response?.data?.text();
      setMessage(errorMessage || "❌ Error al subir el archivo.");
    }
  };

  return (
    <div className="uploaduploadproduct-page">
      <div className="uploaduploadproduct-container">
        <h1 className="uploaduploadproduct-title">Filtrar Productos por Palabras Clave</h1>

        <label
          className={`dropuploadproduct-zone ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input type="file" accept=".csv" onChange={handleFileChange} hidden />
          <p>{file ? `📂 ${file.name}` : "Arrastra o haz clic para subir un CSV"}</p>
        </label>

        <input
          type="text"
          placeholder="Ejemplo: be tini vodka"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="keyword-input"
        />

        <button className="uploadproduct-button" onClick={handleUpload}>
          Filtrar y Descargar CSV
        </button>

        {message && <p className="uploadproduct-message">{message}</p>}
      </div>
    </div>
  );
};

export default UploadFilterPage;
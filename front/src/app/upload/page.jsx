import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000";

const UploadPage = () => {
    const [mainCSV, setMainCSV] = useState(null);
    const [newProducts, setNewProducts] = useState(null);
    const [storeList, setStoreList] = useState([]);
    const [selectedStores, setSelectedStores] = useState([]);
    const [message, setMessage] = useState("");
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/stores`)
            .then((res) => setStoreList(res.data))
            .catch(() => setMessage("❌ Error cargando las tiendas."));
    }, []);

    const handleFileChange = (e, setter) => {
        setter(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e, setter) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length > 0) {
            setter(e.dataTransfer.files[0]);
        }
    };

    const handleCheckboxChange = (storeId) => {
        setSelectedStores((prev) =>
            prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
        );
    };

    const handleUpload = async () => {
        if (!mainCSV || !newProducts || selectedStores.length === 0) {
            setMessage("⚠️ Selecciona ambos archivos y al menos un Store_ID.");
            return;
        }

        const formData = new FormData();
        formData.append("mainCSV", mainCSV);
        formData.append("newProducts", newProducts);
        formData.append("selectedStores", JSON.stringify(selectedStores));

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "resultado.csv");
            document.body.appendChild(link);
            link.click();
            setMessage("✅ Archivo generado y descargado correctamente.");
        } catch (error) {
            setMessage("❌ Error al subir los archivos.");
        }
    };

    return (
        <div className="container">
            <h1>PRODUCT UPLOAD</h1>

            <div className="upload-container">
                <label className="drop-zone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, setMainCSV)}>
                    <input type="file" accept=".csv" onChange={(e) => handleFileChange(e, setMainCSV)} />
                    {mainCSV ? `📂 ${mainCSV.name}` : "Arrastra o haz clic para subir el CSV principal"}
                </label>

                <label className="drop-zone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, setNewProducts)}>
                    <input type="file" accept=".csv" onChange={(e) => handleFileChange(e, setNewProducts)} />
                    {newProducts ? `📂 ${newProducts.name}` : "Arrastra o haz clic para subir nuevos productos"}
                </label>
            </div>

            <div className="store-table-container">
                <table className="store-table">
                    <thead><tr><th>Seleccionar</th><th>Nombre</th><th>ID</th></tr></thead>
                    <tbody>{storeList.map((store) => (<tr key={store.Store_ID}><td><input type="checkbox" className="store-checkbox" onChange={() => handleCheckboxChange(store.Store_ID)} /></td><td>{store.Store_Name}</td><td>{store.Store_ID}</td></tr>))}</tbody>
                </table>
            </div>

            <button onClick={handleUpload}>Generar CSV</button>
            <p>{message}</p>
        </div>
    );
};

export default UploadPage;

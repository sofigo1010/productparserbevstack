const express = require("express");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); // Permitir acceso desde el frontend
app.use(express.json());

// Función para leer un archivo CSV
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
};

// Función para eliminar archivos después de procesarlos
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error(`❌ Error al eliminar archivo ${filePath}:`, err);
        else console.log(`✅ Archivo eliminado: ${filePath}`);
    });
};

// Endpoint para obtener la lista de tiendas
app.get("/stores", async (req, res) => {
    try {
        const stores = await readCSV("onboardedretailers.csv");
        res.json(stores);
    } catch (error) {
        console.error("❌ Error al leer tiendas:", error);
        res.status(500).send("❌ Error al leer las tiendas.");
    }
});

// Endpoint para subir archivos y actualizar el CSV principal
app.post("/upload", upload.fields([{ name: "mainCSV" }, { name: "newProducts" }]), async (req, res) => {
    try {
        if (!req.files || !req.files["mainCSV"] || !req.files["newProducts"]) {
            return res.status(400).send("❌ No se subieron los archivos correctamente.");
        }

        const mainCSVPath = req.files["mainCSV"][0].path;
        const newProductsPath = req.files["newProducts"][0].path;

        // Leer el CSV con Store_ID y State
        const storeData = {};
        const storeCSV = await readCSV("onboardedretailers.csv");
        storeCSV.forEach((row) => {
            storeData[row.Store_ID] = row.State;
        });

        // Leer los productos actuales y los nuevos
        const mainCSV = await readCSV(mainCSVPath); // CSV principal con todos los productos
        const newProducts = await readCSV(newProductsPath); // CSV con productos a agregar

        // Obtener tiendas seleccionadas desde el frontend
        const selectedStoreIDs = JSON.parse(req.body.selectedStores || "[]");

        if (selectedStoreIDs.length === 0) {
            return res.status(400).send("⚠️ No se seleccionaron tiendas.");
        }

        let updatedProducts = [...mainCSV]; // Mantiene los productos existentes

        // Agregar los nuevos productos con sus Store_IDs seleccionados
        newProducts.forEach((product) => {
            selectedStoreIDs.forEach((store_id) => {
                if (storeData[store_id]) {
                    updatedProducts.push({
                        Partner: product.Partner,
                        SKU: product.SKU,
                        Description: product.Description,
                        UPC_Code: product.UPC_Code,
                        Size: product.Size,
                        Store_ID: store_id,
                        State: storeData[store_id],
                    });
                }
            });
        });

        // Convertir a CSV
        const json2csv = new Parser();
        const csvOutput = json2csv.parse(updatedProducts);
        const outputFilePath = `${__dirname}/uploads/updated_products.csv`;

        // Guardar CSV final (sobrescribe el original sin eliminar nada, solo agregando más filas)
        fs.writeFileSync(outputFilePath, csvOutput);

        // Eliminar archivos subidos para evitar acumulación
        deleteFile(mainCSVPath);
        deleteFile(newProductsPath);

        // Enviar el archivo CSV actualizado como descarga
        res.download(outputFilePath, "resultado.csv", (err) => {
            if (err) {
                console.error("❌ Error al enviar el archivo:", err);
                res.status(500).send("❌ Error al enviar el archivo.");
            } else {
                console.log("✅ Archivo actualizado y enviado correctamente.");
                deleteFile(outputFilePath); // Eliminar el CSV generado después de la descarga
            }
        });

    } catch (error) {
        console.error("❌ Error procesando los archivos:", error);
        res.status(500).send("❌ Error procesando los archivos.");
    }
});

// Iniciar servidor en puerto 5000
app.listen(5000, () => console.log("🚀 Servidor en http://localhost:5000"));

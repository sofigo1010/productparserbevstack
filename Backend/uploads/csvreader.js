const express = require("express");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const cors = require("cors");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); 
app.use(express.json());


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

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error(`❌ Error al eliminar archivo ${filePath}:`, err);
        else console.log(`✅ Archivo eliminado: ${filePath}`);
    });
};

const readUsers = async () => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream("users.csv")
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
};


app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readUsers();


        const user = users.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({ message: "❌ Usuario no encontrado." });
        }


        if (user.password !== password) {
            return res.status(401).json({ message: "❌ Contraseña incorrecta." });
        }

        res.json({ message: "✅ Login exitoso.", role: user.role });

    } catch (error) {
        console.error("❌ Error al procesar el login:", error);
        res.status(500).send("❌ Error en el servidor.");
    }
});


app.get("/stores", async (req, res) => {
    try {
        const stores = await readCSV("onboardedretailers.csv");
        res.json(stores);
    } catch (error) {
        console.error("❌ Error al leer tiendas:", error);
        res.status(500).send("❌ Error al leer las tiendas.");
    }
});


app.post("/upload", upload.fields([{ name: "mainCSV" }, { name: "newProducts" }]), async (req, res) => {
    try {
        if (!req.files || !req.files["mainCSV"] || !req.files["newProducts"]) {
            return res.status(400).send("❌ No se subieron los archivos correctamente.");
        }

        const mainCSVPath = req.files["mainCSV"][0].path;
        const newProductsPath = req.files["newProducts"][0].path;


        const storeData = {};
        const storeCSV = await readCSV("onboardedretailers.csv");
        storeCSV.forEach((row) => {
            storeData[row.Store_ID] = row.State;
        });


        const mainCSV = await readCSV(mainCSVPath);
        const newProducts = await readCSV(newProductsPath);


        const selectedStoreIDs = JSON.parse(req.body.selectedStores || "[]");

        if (selectedStoreIDs.length === 0) {
            return res.status(400).send("⚠️ No se seleccionaron tiendas.");
        }

        let updatedProducts = [...mainCSV];

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


        const json2csv = new Parser();
        const csvOutput = json2csv.parse(updatedProducts);
        const outputFilePath = `${__dirname}/uploads/updated_products.csv`;


        fs.writeFileSync(outputFilePath, csvOutput);


        deleteFile(mainCSVPath);
        deleteFile(newProductsPath);

        res.download(outputFilePath, "resultado.csv", (err) => {
            if (err) {
                console.error("❌ Error al enviar el archivo:", err);
                res.status(500).send("❌ Error al enviar el archivo.");
            } else {
                console.log("✅ Archivo actualizado y enviado correctamente.");
                deleteFile(outputFilePath);
            }
        });

    } catch (error) {
        console.error("❌ Error procesando los archivos:", error);
        res.status(500).send("❌ Error procesando los archivos.");
    }
});


app.post("/filter-csv", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("❌ No se subió ningún archivo.");

        const keywordString = req.body.keyword.toLowerCase().trim();
        if (!keywordString) return res.status(400).send("⚠️ Debes ingresar al menos una palabra clave.");

        const keywords = keywordString.split(/\s+/); 

        const filePath = req.file.path;
        const allProducts = await readCSV(filePath);

        if (!allProducts || allProducts.length === 0) {
            return res.status(400).send("❌ El archivo CSV está vacío o mal formateado.");
        }


        const filteredProducts = allProducts.filter((product) =>
            Object.values(product).some((value) => {
                if (!value) return false; 
                const lowerValue = value.toLowerCase();
                return keywords.every((word) => lowerValue.includes(word)); 
            })
        );


        const uniqueProducts = Array.from(new Map(filteredProducts.map((item) => [item.SKU, item])).values());


        const selectedColumns = uniqueProducts.map(({ Partner, SKU, Description, UPC_Code, Size }) => ({
            Partner, SKU, Description, UPC_Code, Size
        }));


        if (selectedColumns.length === 0) {
            return res.status(404).send(`⚠️ No se encontraron productos con las palabras clave "${keywords.join(" ")}".`);
        }


        const json2csv = new Parser();
        const csvOutput = json2csv.parse(selectedColumns);


        const outputFileName = `${keywords.join("_")}_products.csv`;
        const outputPath = path.join(__dirname, "uploads", outputFileName);
        fs.writeFileSync(outputPath, csvOutput);

        res.download(outputPath, outputFileName, (err) => {
            if (err) {
                console.error("❌ Error al enviar el archivo:", err);
                res.status(500).send("❌ Error al descargar el archivo.");
            } else {
                deleteFile(filePath); 
                deleteFile(outputPath); 
                
            }
        });

    } catch (error) {
        console.error("❌ Error al procesar el CSV:", error);
        res.status(500).send("❌ Error en el servidor al procesar el CSV.");
    }
});


app.listen(5000, () => console.log("🚀 Servidor en http://localhost:5000"));

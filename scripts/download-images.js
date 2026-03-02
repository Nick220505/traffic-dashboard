const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// URLs de imágenes de muestra
const imageUrls = [
  {
    id: "image1",
    url: "https://raw.githubusercontent.com/unsplash/datasets/master/lite/latest/photos.tsv000",
    name: "800x600 (~50KB)",
    fallback: "https://via.placeholder.com/800x600.jpg",
  },
  {
    id: "image2",
    url: "https://via.placeholder.com/1920x1080.jpg",
    name: "1920x1080 (~200KB)",
  },
  {
    id: "image3",
    url: "https://via.placeholder.com/3840x2160.jpg",
    name: "4K (~500KB)",
  },
  {
    id: "image4",
    url: "https://via.placeholder.com/400x400.jpg",
    name: "400x400 (~20KB)",
  },
  {
    id: "image5",
    url: "https://via.placeholder.com/1200x800.jpg",
    name: "1200x800 (~100KB)",
  },
  {
    id: "image6",
    url: "https://via.placeholder.com/2560x1440.jpg",
    name: "QHD (~350KB)",
  },
];

const imagesDir = path.join(__dirname, "..", "public", "images");

// Crear directorio si no existe
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

function downloadImage(imageInfo, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Demasiadas redirecciones"));
      return;
    }

    const filePath = path.join(imagesDir, `${imageInfo.id}.jpg`);

    // Verificar si el archivo ya existe y tiene contenido
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      const size = (fs.statSync(filePath).size / 1024).toFixed(2);
      console.log(
        `✓ ${imageInfo.name} ya existe (${size} KB), omitiendo descarga`,
      );
      resolve();
      return;
    }

    console.log(`Descargando ${imageInfo.name}...`);

    const parsedUrl = new URL(imageInfo.url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const request = protocol.get(imageInfo.url, (response) => {
      // Manejar redirecciones
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        console.log(`  Redirigiendo...`);
        downloadImage(
          { ...imageInfo, url: response.headers.location },
          redirectCount + 1,
        )
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Status code: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      const totalSize = parseInt(response.headers["content-length"], 10);
      let downloadedSize = 0;

      response.on("data", (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
          process.stdout.write(`\r${imageInfo.name}: ${progress}%`);
        }
      });

      response.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          const finalSize = (fs.statSync(filePath).size / 1024).toFixed(2);
          console.log(
            `\n✓ ${imageInfo.name} descargada exitosamente (${finalSize} KB)`,
          );
          resolve();
        });
      });

      file.on("error", (err) => {
        fs.unlink(filePath, () => {});
        console.error(`\n✗ Error escribiendo ${imageInfo.name}:`, err.message);
        reject(err);
      });
    });

    request.on("error", (err) => {
      console.error(`\n✗ Error descargando ${imageInfo.name}:`, err.message);
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function downloadAllImages() {
  console.log("Iniciando descarga de imágenes...\n");

  for (const image of imageUrls) {
    try {
      await downloadImage(image);
    } catch (error) {
      console.error(`Error con ${image.name}:`, error.message);
    }
  }

  console.log("\n¡Descarga completada!");
}

downloadAllImages();

const https = require("https");
const fs = require("fs");
const path = require("path");

// URLs de videos de muestra (puedes reemplazar con tus propios videos)
const videoUrls = [
  {
    id: "video1",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    name: "Video HD 1080p",
  },
  {
    id: "video2",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    name: "Video SD 480p",
  },
  {
    id: "video3",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    name: "Video HD 720p",
  },
  {
    id: "video4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    name: "Video Full HD",
  },
];

const videosDir = path.join(__dirname, "..", "public", "videos");

// Crear directorio si no existe
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

function downloadVideo(videoInfo) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(videosDir, `${videoInfo.id}.mp4`);

    // Verificar si el archivo ya existe
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${videoInfo.name} ya existe, omitiendo descarga`);
      resolve();
      return;
    }

    console.log(`Descargando ${videoInfo.name}...`);
    const file = fs.createWriteStream(filePath);

    https
      .get(videoInfo.url, (response) => {
        const totalSize = parseInt(response.headers["content-length"], 10);
        let downloadedSize = 0;

        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
          process.stdout.write(`\r${videoInfo.name}: ${progress}%`);
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`\n✓ ${videoInfo.name} descargado exitosamente`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        console.error(`\n✗ Error descargando ${videoInfo.name}:`, err.message);
        reject(err);
      });
  });
}

async function downloadAllVideos() {
  console.log("Iniciando descarga de videos...\n");

  for (const video of videoUrls) {
    try {
      await downloadVideo(video);
    } catch (error) {
      console.error(`Error con ${video.name}:`, error.message);
    }
  }

  console.log("\n¡Descarga completada!");
}

downloadAllVideos();

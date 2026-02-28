import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const VIDEOS_DIR = path.join(process.cwd(), "public", "videos");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

fs.mkdirSync(VIDEOS_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Free sample MP4 videos from public sources
const VIDEOS = [
  {
    name: "sample-1.mp4",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    name: "sample-2.mp4",
    url: "https://www.w3schools.com/html/movie.mp4",
  },
  {
    name: "sample-3.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    name: "sample-4.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    name: "sample-5.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
  {
    name: "sample-6.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
];

// Free sample images from picsum
const IMAGES = [
  { name: "img-800x600.jpg", url: "https://picsum.photos/800/600" },
  { name: "img-1920x1080.jpg", url: "https://picsum.photos/1920/1080" },
  { name: "img-400x400.jpg", url: "https://picsum.photos/400/400" },
  { name: "img-1200x800.jpg", url: "https://picsum.photos/1200/800" },
  { name: "img-2560x1440.jpg", url: "https://picsum.photos/2560/1440" },
  { name: "img-3840x2160.jpg", url: "https://picsum.photos/3840/2160" },
];

async function downloadFile(url, destPath, label) {
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    console.log(`[SKIP] ${label} already exists (${(stats.size / 1024).toFixed(1)} KB)`);
    return;
  }

  console.log(`[DOWNLOADING] ${label} from ${url}`);
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fileStream = fs.createWriteStream(destPath);
    await pipeline(Readable.fromWeb(res.body), fileStream);
    const stats = fs.statSync(destPath);
    console.log(`[OK] ${label} saved (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`[ERROR] ${label}: ${err.message}`);
  }
}

async function main() {
  console.log("=== Downloading Videos ===");
  for (const video of VIDEOS) {
    await downloadFile(video.url, path.join(VIDEOS_DIR, video.name), video.name);
  }

  console.log("\n=== Downloading Images ===");
  for (const img of IMAGES) {
    await downloadFile(img.url, path.join(IMAGES_DIR, img.name), img.name);
  }

  console.log("\n=== Done ===");

  // List all files
  console.log("\nVideos:");
  for (const f of fs.readdirSync(VIDEOS_DIR)) {
    const s = fs.statSync(path.join(VIDEOS_DIR, f));
    console.log(`  ${f} - ${(s.size / 1024).toFixed(1)} KB`);
  }
  console.log("\nImages:");
  for (const f of fs.readdirSync(IMAGES_DIR)) {
    const s = fs.statSync(path.join(IMAGES_DIR, f));
    console.log(`  ${f} - ${(s.size / 1024).toFixed(1)} KB`);
  }
}

main();

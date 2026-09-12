import sharp from "sharp";
import { readFileSync } from "fs";

async function main() {
  const svg = readFileSync("public/icons/icon.svg");
  await sharp(svg).resize(192, 192).png().toFile("public/icons/icon-192.png");
  await sharp(svg).resize(512, 512).png().toFile("public/icons/icon-512.png");
  await sharp(svg).resize(512, 512).png().toFile("public/icons/icon-512-maskable.png");
  console.log("Icons generated!");
}

main().catch(console.error);

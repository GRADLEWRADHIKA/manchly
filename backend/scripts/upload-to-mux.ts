import 'dotenv/config';
import Mux from '@mux/mux-node';
import fs from 'fs';
import path from 'path';

const FILE_PATH = process.argv[2];
if (!FILE_PATH) throw new Error('Usage: tsx scripts/upload-to-mux.ts <absolute-file-path>');

async function main() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('MUX_TOKEN_ID / MUX_TOKEN_SECRET missing from .env');
  }
  const abs = path.resolve(FILE_PATH);
  const stat = fs.statSync(abs);
  console.log(`File: ${abs}\nSize: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });

  console.log('\n[1/4] Creating direct upload…');
  const upload = await mux.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['public'],
      video_quality: 'basic',
    },
  });
  console.log('Upload ID:', upload.id);

  console.log('\n[2/4] Uploading file bytes to Mux…');
  const buffer = fs.readFileSync(abs);
  const res = await fetch(upload.url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size.toString(),
      'Content-Range': `bytes 0-${stat.size - 1}/${stat.size}`,
    },
    body: buffer as any,
  });
  if (!res.ok) throw new Error(`PUT failed: ${res.status} ${await res.text()}`);
  console.log('Upload HTTP status:', res.status);

  console.log('\n[3/4] Polling for asset creation…');
  let assetId: string | null = null;
  for (let i = 0; i < 40; i++) {
    const u = await mux.video.uploads.retrieve(upload.id);
    if (u.asset_id) { assetId = u.asset_id; break; }
    if (u.status === 'errored' || u.status === 'cancelled' || u.status === 'timed_out') {
      throw new Error(`Upload state: ${u.status}`);
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('');
  if (!assetId) throw new Error('Timed out waiting for asset_id');
  console.log('Asset ID:', assetId);

  console.log('\n[4/4] Waiting for asset to become ready…');
  let playbackId: string | null = null;
  for (let i = 0; i < 80; i++) {
    const a = await mux.video.assets.retrieve(assetId);
    if (a.status === 'ready') {
      playbackId = a.playback_ids?.[0]?.id || null;
      console.log('Asset is ready.');
      break;
    }
    if (a.status === 'errored') throw new Error('Asset failed to process: ' + JSON.stringify(a.errors));
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('');
  if (!playbackId) throw new Error('Timed out waiting for ready asset');

  console.log('\n===== DONE =====');
  console.log('Playback ID:', playbackId);
  console.log('HLS URL    :', `https://stream.mux.com/${playbackId}.m3u8`);
  console.log('Thumbnail  :', `https://image.mux.com/${playbackId}/thumbnail.jpg`);
}

main().catch(e => { console.error(e); process.exit(1); });

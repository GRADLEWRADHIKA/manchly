import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const SOURCE_COURSE_ID  = '50c4b8ae-fc6e-47e5-97dc-4e33539a3e5e';   // Sahmad — YouTube Automation Blueprint
const TARGET_CREATOR_ID = 'eaddf98c-346e-4e6f-a339-1a9e2f4c5437';   // Harsh Bardhan Raj

async function main() {
  const src = await p.courses.findUnique({
    where: { id: SOURCE_COURSE_ID },
    include: { videos: { orderBy: { order: 'asc' } } },
  });
  if (!src) throw new Error('Source course not found: ' + SOURCE_COURSE_ID);

  // Skip if a clone already exists under the target creator with the same title.
  const existing = await p.courses.findFirst({
    where: { creator_id: TARGET_CREATOR_ID, title: src.title },
    select: { id: true, title: true, _count: { select: { videos: true } } },
  });
  if (existing) {
    console.log('Already cloned:', existing);
    return;
  }

  const cloned = await p.courses.create({
    data: {
      title:         src.title,
      description:   src.description,
      thumbnail:     src.thumbnail,
      thumbnail_url: src.thumbnail_url,
      price:         src.price,
      status:        src.status,
      category:      src.category,
      tags:          src.tags,
      duration:      src.duration,
      level:         src.level,
      language:      src.language,
      creator_id:    TARGET_CREATOR_ID,
      published_at:  src.status === 'PUBLISHED' ? new Date() : null,
    },
  });
  console.log('Cloned course:', { id: cloned.id, title: cloned.title });

  // Copy each video. Mux uniqueness constraints mean we cannot reuse mux_asset_id
  // or mux_upload_id, but mux_playback_id / playback_url are not unique and can
  // be referenced from the clone safely (Mux supports many playbacks per asset).
  let copied = 0;
  for (const v of src.videos) {
    await p.videos.create({
      data: {
        course_id:       cloned.id,
        title:           v.title,
        description:     v.description,
        mux_asset_id:    null,
        mux_upload_id:   null,
        mux_playback_id: v.mux_playback_id,
        upload_url:      null,
        playback_url:    v.playback_url,
        thumbnail_url:   v.thumbnail_url,
        duration:        v.duration,
        status:          v.status,
        order:           v.order,
        is_free:         v.is_free,
      },
    });
    copied++;
  }
  console.log(`Copied ${copied}/${src.videos.length} videos`);
  console.log('\nNew course id:', cloned.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());

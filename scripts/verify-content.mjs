import { createServer } from "vite";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "silent",
});

try {
  const { renderSite } = await server.ssrLoadModule("/src/ui.ts");
  const data = await server.ssrLoadModule("/src/data.ts");
  const html = renderSite();
  const issues = [];

  for (const line of data.solitudeLines) {
    if (!html.includes(line.text)) issues.push(`缺少独处文案 ${line.id}: ${line.text}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of new Set(duplicateIds)) issues.push(`重复 id: ${id}`);

  const targets = new Set(ids);
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const anchor of anchors) {
    if (!targets.has(anchor)) issues.push(`失效锚点: #${anchor}`);
  }

  const voiceButtons = [...html.matchAll(/class="voice-button"[^>]+data-audio="([^"]+)"/g)];
  if (voiceButtons.length !== 9) issues.push(`语音按钮数量应为 9，实际 ${voiceButtons.length}`);

  const officialReels = [...html.matchAll(/class="official-voice"[^>]+data-trailer="([^"]+)"/g)];
  if (officialReels.length !== 5) issues.push(`官方原声短片入口应为 5，实际 ${officialReels.length}`);

  const requiredScenes = ["top", "children", "evangelion", "angels", "tokyo-3", "records", "release"];
  for (const scene of requiredScenes) {
    if (!html.includes(`data-scene="${scene}"`)) issues.push(`缺少场景: ${scene}`);
  }

  const forbidden = ["rain-window", "tokyo-alone", "seaside-dusk", "night-signal", "photos/rain"];
  for (const token of forbidden) {
    if (html.includes(token)) issues.push(`旧素材仍出现在页面模板: ${token}`);
  }

  const projectCredits = await readFile(resolve("assets/official/CREDITS.md"), "utf8");
  if (!projectCredits.includes("非商业")) issues.push("官方素材来源说明缺少使用范围");

  for (const character of data.characters) {
    if (!character.portrait) issues.push(`角色缺少立绘: ${character.name}`);
    if (!character.audio) issues.push(`角色缺少音频: ${character.name}`);
    if (!character.depthLayers || !character.cameraPath || !character.qualityTier || !character.sourceReviewedAt) {
      issues.push(`角色缺少可视化来源元数据: ${character.name}`);
    }
  }

  if (data.mediaCredits.length < 4) issues.push("媒体来源类型不足 4 类");

  for (const path of [
    "assets/textures/grain.png",
    "assets/textures/scanlines.png",
    "assets/official/trailer-1_0.jpg",
    "assets/official/trailer-2_0.jpg",
    "assets/official/trailer-3_0.jpg",
    "assets/official/trailer-final.jpg",
    "assets/audio/bgm/01-initialize.wav",
    "assets/audio/bgm/02-children.wav",
    "assets/audio/bgm/03-evangelion.wav",
    "assets/audio/bgm/04-angels.wav",
    "assets/audio/bgm/05-tokyo-3.wav",
    "assets/audio/bgm/06-records.wav",
    "assets/audio/bgm/07-release.wav",
  ]) {
    try {
      await access(path);
    } catch {
      issues.push(`缺少本地资源: ${path}`);
    }
  }

  if (issues.length) {
    console.error(`内容验证失败（${issues.length}）`);
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
  } else {
    console.log(`内容验证通过：7 个场景、9 个角色档案、${data.solitudeLines.length} 条独处文案、9 个合成语音、5 个官方原声短片、7 条场景 BGM。`);
  }
} finally {
  await server.close();
}

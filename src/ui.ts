import {
  angels,
  characters,
  eras,
  machines,
  pilotMatrix,
  solitudeById,
  type CharacterRecord,
  type EraRecord,
} from "./data";

const navItems = [
  ["top", "接入"],
  ["children", "适格者"],
  ["evangelion", "机体"],
  ["angels", "使徒"],
  ["tokyo-3", "东京-3"],
  ["records", "年代"],
  ["release", "解除"],
] as const;

function icon(name: "play" | "pause" | "arrow" | "close" | "sound"): string {
  const paths: Record<typeof name, string> = {
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M7 5h4v14H7zm6 0h4v14h-4z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sound:
      '<path d="M4 10v4h4l5 4V6L8 10H4Zm12-2a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

function renderNav(): string {
  return navItems
    .map(
      ([id, label], index) =>
        `<a href="#${id}" data-chapter-link="${id}"><span>${String(index).padStart(2, "0")}</span>${label}</a>`,
    )
    .join("");
}

function renderSolitudeList(character: CharacterRecord, compact = false): string {
  if (!character.solitudeIds.length) {
    return `<p class="solitude-empty">${character.faction === "seele" ? "NO HUMAN LOG / 此对象没有可翻译的独处记录。" : "NO RECORD / 档案空位。"}</p>`;
  }
  return character.solitudeIds
    .map((id, index) => {
      const text = solitudeById.get(id) ?? "";
      return `<p${compact && index > 0 ? ' class="secondary-line"' : ""}><span>${id}</span>${text}</p>`;
    })
    .join("");
}

function renderCharacter(character: CharacterRecord): string {
  const sync = character.sync === null ? character.syncLabel : `SYNC ${character.sync.toFixed(1)}%`;
  const alternate = character.alternateNameJa
    ? `<span class="character__alternate" lang="ja">${character.alternateNameJa}</span>`
    : "";

  return `
    <article class="character character--${character.faction}" id="${character.id}" data-character="${character.id}" data-faction="${character.faction}">
      <div class="character__visual">
        <div class="character__portrait-wrap">
          <img src="${character.portrait}" alt="${character.portraitAlt}" width="720" height="1080" loading="lazy" decoding="async" />
          <span class="portrait-scan" aria-hidden="true"></span>
        </div>
        <span class="character__code">${character.code}</span>
        <span class="character__sync">${sync}</span>
        <p class="character__credit">${character.portraitCredit}</p>
      </div>
      <div class="character__content">
        <header class="character__name">
          <h3>${character.name}</h3>
          <p lang="ja">${character.nameJa}</p>
          ${alternate}
          <span>${character.nameEn}</span>
        </header>
        <p class="character__role">${character.role}</p>
        <p class="character__intro">${character.intro}</p>
        <dl class="character__facts">
          <div><dt>初登场</dt><dd>${character.firstAppearance.label}「${character.firstAppearance.titleJa}」</dd></div>
          <div><dt>所属</dt><dd>${character.affiliation}</dd></div>
          <div><dt>机体 / 系统</dt><dd>${character.machineOrSystem}</dd></div>
          <div><dt>连续性</dt><dd>${character.continuity} TV</dd></div>
        </dl>
        <section class="character__solitude" aria-label="${character.name}的独处记录">
          <h4>独处记录 <span>SOLITUDE LOG</span></h4>
          ${renderSolitudeList(character)}
        </section>
        <div class="voice-row">
          <div class="voice-controls">
            <button class="voice-button" type="button" data-audio="${character.audio}" data-voice-name="${character.name}" aria-label="播放${character.name}的日语合成台词" aria-pressed="false">
              <span class="voice-button__state">${icon("play")}${icon("pause")}</span>
              <span class="voice-button__label">合成朗读</span>
              <i class="voice-meter" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i>
            </button>
            ${
              character.officialReel
                ? `<button class="official-voice" type="button" aria-haspopup="dialog" data-trailer="${character.officialReel.videoId}" data-trailer-title="${character.officialReel.title}">
                    <img src="${character.officialReel.thumbnail}" alt="" loading="lazy" />
                    <span><b>官方原声短片</b><small>YouTube · 官方宣传影像</small></span>
                  </button>`
                : '<p class="voice-source-note">未找到该角色独立官方原声短片；合成朗读不冒充原声。<a href="https://www.youtube.com/@khara_official/videos" target="_blank" rel="noreferrer">浏览 khara 官方频道</a></p>'
            }
          </div>
          <blockquote>
            <p lang="ja">${character.quoteJa}</p>
            <p>${character.quoteZh}</p>
            <footer>${character.quoteKind} · 合成音声，非原声${character.officialReel ? " · 另见官方原声短片" : ""}</footer>
          </blockquote>
        </div>
      </div>
    </article>`;
}

function renderHero(): string {
  return `
    <section class="hero scene-section" id="top" data-scene="top" aria-labelledby="hero-title">
      <div class="hero__field" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="hero__frame" aria-hidden="true">
        <span class="hero__frame-index">00 / INITIALIZE</span>
        <span class="hero__frame-coord">35.6297 N · 139.7771 E</span>
      </div>
      <div class="hero__copy">
        <h1 id="hero-title">
          <span class="hero__jp" lang="ja">新世紀エヴァンゲリオン</span>
          <span class="hero__cn">同步协议</span>
        </h1>
        <p class="hero__dek">进入 NERV 同步观测。穿过使徒力场，在角色、机体、城市与两个时代之间完成一次独处。</p>
        <p class="hero__subcopy">清醒自洽 <i></i> 自由浪漫 <i></i> 安静力量</p>
        <div class="hero__actions">
          <button class="action action--primary" type="button" data-start-sync>
            <span>开始同步</span>${icon("arrow")}
          </button>
          <button class="action action--quiet" type="button" data-silent-browse>静音浏览</button>
        </div>
      </div>
      <aside class="hero__telemetry" aria-label="同步状态">
        <p>SYNC RATE / 设计演出数据</p>
        <strong data-sync-value>000.00</strong><span>%</span>
        <i class="sync-track"><b data-sync-bar></b></i>
        <p data-audio-state>BGM / STANDBY</p>
      </aside>
      <div class="hero__cast" aria-label="角色索引">
        ${characters
          .slice(0, 5)
          .map((character) => `<a href="#${character.id}"><img src="${character.portrait}" alt="" loading="lazy" /><span>${character.code} ${character.name}</span></a>`)
          .join("")}
      </div>
      <p class="hero__disclaimer">非官方 · 非商业同人视觉实验 / 力场后空间切片来自公开官方预告，角色与作品权利归原权利方所有</p>
    </section>`;
}

function renderPilotMatrix(): string {
  return `
    <section class="continuity" aria-labelledby="continuity-title">
      <header class="chapter-heading chapter-heading--compact">
        <p class="chapter-heading__index">CHILDREN / TWO SIDES</p>
        <h2 id="continuity-title">同一个人，两个连续性</h2>
        <p>点击卡片翻面。没有旧作记录的适格者保留显式空位，不用仿制画面补齐。</p>
      </header>
      <div class="continuity__deck">
        ${pilotMatrix
          .map(
            (pilot) => `
            <button class="continuity-card" type="button" aria-pressed="false" aria-label="翻转${pilot.name}的 1995 与 2021 档案">
              <span class="continuity-card__inner">
                <span class="continuity-card__face continuity-card__face--tv">
                  ${pilot.portrait ? `<img src="${pilot.portrait}" alt="" loading="lazy" />` : '<i class="continuity-card__void">NO<br />1995<br />RECORD</i>'}
                  <b>1995 TV</b><em>${pilot.tv}</em>
                </span>
                <span class="continuity-card__face continuity-card__face--rebuild">
                  ${pilot.portrait ? `<img src="${pilot.portrait}" alt="" loading="lazy" />` : '<i class="continuity-card__void">NO<br />LOCAL<br />IMAGE</i>'}
                  <b>2021 REBUILD</b><em>${pilot.rebuild}</em>
                </span>
              </span>
              <span class="continuity-card__name">${pilot.name}</span>
            </button>`,
          )
          .join("")}
      </div>
    </section>`;
}

function renderChildren(): string {
  const nerv = characters.filter((character) => character.faction === "nerv");
  const seele = characters.filter((character) => character.faction === "seele");
  return `
    <section class="chapter chapter--children scene-section" id="children" data-scene="children" aria-labelledby="children-title">
      <header class="chapter-heading">
        <p class="chapter-heading__index">01 / CHILDREN + COMMAND</p>
        <h2 id="children-title">被选中的少年，<br /><span>以及替他们做决定的大人。</span></h2>
        <p>两个阵营按首次出现顺序展开。主角团以温热纸张、荧光绿和初号机紫建立呼吸；反派团以黑、红、石碑和制度噪声切进画面。</p>
      </header>
      <div class="faction-banner faction-banner--nerv">
        <span>NERV / 主角团</span>
        <strong>清醒自洽，也是一种同步。</strong>
        <p>${nerv.map((character) => character.code).join(" · ")}</p>
      </div>
      <div class="roster roster--nerv">
        ${nerv.map(renderCharacter).join("")}
      </div>
      ${renderPilotMatrix()}
      <div class="faction-divider" aria-hidden="true"><span>AT FIELD / BOUNDARY DETECTED</span></div>
      <div class="faction-banner faction-banner--seele">
        <span>SEELE / 反派主角团</span>
        <strong>七个声音，一间没有出口的房间。</strong>
        <p>${seele.map((character) => character.code).join(" · ")}</p>
      </div>
      <div class="roster roster--seele">
        ${seele.map(renderCharacter).join("")}
      </div>
    </section>`;
}

export function renderMachinePanel(index = 1): string {
  const machine = machines[index];
  return `
    <article class="machine-panel" data-machine-panel>
      <div class="machine-panel__number">${machine.code}</div>
      <div class="machine-panel__visual">
        ${
          machine.image
            ? `<img src="${machine.image}" alt="${machine.nameJa}" width="1280" height="720" loading="lazy" />`
            : '<div class="archive-gap">LOCAL IMAGE / NO RECORD</div>'
        }
        <span>${machine.imageCredit}</span>
      </div>
      <div class="machine-panel__content">
        <p class="machine-panel__ja" lang="ja">${machine.nameJa}</p>
        <h3>${machine.name}</h3>
        <dl>
          <div><dt>驾驶员</dt><dd>${machine.pilot}</dd></div>
          <div><dt>初登场</dt><dd>${machine.firstAppearance}</dd></div>
          <div><dt>同步率</dt><dd>${machine.sync.toFixed(1)}% <small>设计演出数据</small></dd></div>
          <div><dt>缺陷扫描</dt><dd>${machine.fault}</dd></div>
        </dl>
        <p>${machine.profile}</p>
      </div>
    </article>`;
}

function renderEvangelion(): string {
  return `
    <section class="chapter chapter--hangar scene-section" id="evangelion" data-scene="evangelion" aria-labelledby="evangelion-title">
      <header class="chapter-heading chapter-heading--inverse">
        <p class="chapter-heading__index">02 / EVANGELION</p>
        <h2 id="evangelion-title">深井之下，<br /><span>四具人造的身体。</span></h2>
        <p>真实预告影像被拆成多层空间屏幕；机体本身只由机库梁架、扫描线和编号构成，不做写实 3D 重建。</p>
      </header>
      <div class="machine-tabs" role="tablist" aria-label="选择 EVA 机体">
        ${machines
          .map(
            (machine, index) =>
              `<button id="machine-tab-${index}" type="button" role="tab" tabindex="${index === 1 ? 0 : -1}" aria-controls="machine-panel" aria-selected="${index === 1}" data-machine="${index}"><span>${machine.code}</span>${machine.name}</button>`,
          )
          .join("")}
      </div>
      <div id="machine-panel" role="tabpanel" aria-labelledby="machine-tab-1" aria-live="polite" data-machine-mount>${renderMachinePanel(1)}</div>
      <p class="scene-note">机库镜头会随滚动推进；切换编号会改变舱体灯光与扫描焦点。缩略图属于官方预告影像，不宣称其为角色档案照。</p>
    </section>`;
}

export function renderAngelPanel(index = 0): string {
  const angel = angels[index];
  return `
    <article class="angel-panel" data-angel-panel>
      <p class="angel-panel__code">ANGEL / ${angel.code}</p>
      <h3>${angel.name}</h3>
      <p class="angel-panel__ja" lang="ja">${angel.nameJa}</p>
      <dl>
        <div><dt>分类</dt><dd>${angel.classification}</dd></div>
        <div><dt>初登场</dt><dd>${angel.firstAppearance}</dd></div>
        <div><dt>威胁</dt><dd>${angel.threat}</dd></div>
      </dl>
      <p>${angel.concept}</p>
      <span class="angel-panel__status" data-angel-status>AT FIELD / LOCKED</span>
      ${angel.procedural ? '<span class="angel-panel__procedural">空间测绘重构 · 非官方影像</span>' : `<img src="${angel.image}" alt="${angel.name}档案插画" loading="lazy" />`}
    </article>`;
}

function renderAngels(): string {
  return `
    <section class="chapter chapter--angels scene-section" id="angels" data-scene="angels" aria-labelledby="angels-title">
      <header class="chapter-heading chapter-heading--inverse">
        <p class="chapter-heading__index">03 / ANGELS</p>
        <h2 id="angels-title">AT 力场，<br /><span>是拒绝被理解的形状。</span></h2>
        <p>悬浮的八面体由实时几何组成。选择使徒后按“中和”，力场会碎裂，档案从碎片后面露出。</p>
      </header>
      <div class="angel-layout">
        <div class="angel-layout__field">
          <div class="angel-tabs" role="tablist" aria-label="选择使徒">
            ${angels
              .map(
                (angel, index) =>
                  `<button id="angel-tab-${index}" type="button" role="tab" tabindex="${index === 0 ? 0 : -1}" aria-controls="angel-panel" aria-selected="${index === 0}" data-angel="${index}"><span>${angel.code}</span>${angel.name}</button>`,
              )
              .join("")}
          </div>
          <button class="field-trigger" type="button" data-neutralize aria-pressed="false" aria-keyshortcuts="Enter">
            <span>中和 AT 力场</span><b>ENTER / CLICK</b>
          </button>
          <p class="field-readout" data-field-readout>PATTERN: ORANGE / BOUNDARY: 100%</p>
        </div>
        <div id="angel-panel" role="tabpanel" aria-labelledby="angel-tab-0" aria-live="polite" data-angel-mount>${renderAngelPanel(0)}</div>
      </div>
    </section>`;
}

function renderTokyo(): string {
  return `
    <section class="chapter chapter--tokyo scene-section" id="tokyo-3" data-scene="tokyo-3" aria-labelledby="tokyo-title">
      <header class="chapter-heading chapter-heading--inverse">
        <p class="chapter-heading__index">04 / TOKYO-3</p>
        <h2 id="tokyo-title">城市从地底升起，<br /><span>像一套随时合拢的装甲。</span></h2>
        <p>程序化楼群按滚动进度从 Geofront 抬升。没有借用旧版风景照片，城市只属于这一套同步系统。</p>
      </header>
      <div class="tokyo-layout">
        <ol class="tokyo-stages">
          <li><span>01</span><strong>GEOFRONT</strong><p>地下空洞、LCL 循环与 NERV 本部保持城市的心跳。</p></li>
          <li><span>02</span><strong>ARMOR LAYER</strong><p>地表建筑下降，道路与街区折叠成掩体。</p></li>
          <li><span>03</span><strong>OPERATION YASHIMA</strong><p>全城供电汇入一次射击，繁华瞬间变成武器。</p></li>
        </ol>
        <aside class="tokyo-readout">
          <p>都市同步 / LIVE GEOMETRY</p>
          <strong data-tokyo-value>00.0</strong>
          <span>km</span>
          <i><b data-tokyo-bar></b></i>
          <p>方向：上昇 / 城市装甲层 / 月光</p>
        </aside>
      </div>
      <blockquote class="tokyo-quote">
        <p>世界熙熙攘攘，我独来独往，于无人问津处，寻得内心的丰饶。</p>
        <footer>L12 / 渚薰档案</footer>
      </blockquote>
      <p class="scene-note tokyo-credit">远景材质：khara 官方站《1.0》公开壁纸；程序化楼群与装甲层为页面原创空间，不把官方图误称为城市实拍。</p>
    </section>`;
}

export function renderEraPanel(era: EraRecord): string {
  return `
    <article class="era-panel" data-era-panel>
      <div class="era-panel__visual">
        ${era.image ? `<img src="${era.image}" alt="${era.imageAlt}" loading="lazy" />` : '<div class="archive-gap">LOCAL IMAGE / NO RECORD</div>'}
        <span>${era.imageCredit}</span>
      </div>
      <div class="era-panel__copy">
        <p>${era.chronology} / ${era.year}</p>
        <h3>${era.titleZh}</h3>
        <p lang="ja">${era.titleJa}</p>
        <strong>${era.titleEn}</strong>
        <p>${era.note}</p>
        <div class="era-panel__actions">
          ${era.trailerId ? `<button type="button" aria-haspopup="dialog" data-trailer="${era.trailerId}" data-trailer-title="${era.titleZh}">${icon("play")}打开官方预告</button>` : ""}
          <a href="${era.officialUrl}" target="_blank" rel="noreferrer">官方页面${icon("arrow")}</a>
        </div>
      </div>
    </article>`;
}

function renderRecords(): string {
  return `
    <section class="chapter chapter--records scene-section" id="records" data-scene="records" aria-labelledby="records-title">
      <header class="chapter-heading chapter-heading--inverse">
        <p class="chapter-heading__index">05 / RECORDS</p>
        <h2 id="records-title">两个时代，<br /><span>不是同一条时间线。</span></h2>
        <p>1995 与 1997 是两个入口，2007—2021 是另一条分岔。官方预告以外部播放器打开；页面本地只保存缩略图与版式切片。</p>
      </header>
      <div class="era-nav" role="tablist" aria-label="选择年代">
        ${eras
          .map(
            (era, index) =>
              `<button id="era-tab-${index}" type="button" role="tab" tabindex="${index === 0 ? 0 : -1}" aria-controls="era-panel" aria-selected="${index === 0}" data-era="${era.id}"><span>${era.year}</span>${era.chronology}</button>`,
          )
          .join("")}
      </div>
      <div class="era-mount" id="era-panel" role="tabpanel" aria-labelledby="era-tab-0" aria-live="polite" data-era-mount>${renderEraPanel(eras[0])}</div>
      <ol class="era-timeline" aria-label="作品时间线">
        ${eras.map((era) => `<li><span>${era.year}</span><b>${era.titleZh}</b><em>${era.chronology}</em></li>`).join("")}
      </ol>
    </section>`;
}

function renderRelease(): string {
  return `
    <section class="chapter chapter--release scene-section" id="release" data-scene="release" aria-labelledby="release-title">
      <header class="release-title">
        <p>06 / RELEASE</p>
        <h2 id="release-title">心之壁，<br /><span>解除。</span></h2>
        <p>不必艳羡风月，孤岛有孤岛的好。</p>
        <button class="action action--release" type="button" data-release-field>解除 AT 力场</button>
      </header>
      <div class="release-record">
        <p>享受独处，不是退出现实。</p>
        <p>是终于听见自己的心跳，<br />再选择与世界同频。</p>
        <span>SYNCHRONIZATION COMPLETE / 1995—2021</span>
      </div>
      <div id="release-end" class="release-white">
        <p>FIN / 终幕卡</p>
        <h2>世界熙熙攘攘，<br />我独来独往。</h2>
        <p>本页为非官方、非商业的个人同人视觉实验。角色、台词、作品影像与标识归各自权利方所有。合成日语语音不是原声优演出。</p>
        <details>
          <summary>素材与来源索引</summary>
          <p>角色立绘与群像来自 NeoApo、36ch、ibisPaint、BUFFALO 的公开页面；官方图片与短片缩略图来自 khara 公开页面和 YouTube 频道，视频仅通过官方外链播放。七条章节 BGM 为项目原创程序化音频，不含 EVA OST 或原声采样。完整来源记录见根目录 CREDITS.md。</p>
        </details>
        <a href="#top">返回接入点</a>
      </div>
    </section>`;
}

export function renderSite(): string {
  return `
    <canvas id="scene-canvas" aria-hidden="true"></canvas>
    <div class="page-noise" aria-hidden="true"></div>
    <header class="hud">
      <a class="brand" href="#top" aria-label="回到同步协议首页">
        <span class="brand__mark">N</span>
        <span><b>SYNC PROTOCOL</b><small>非官方视觉实验</small></span>
      </a>
      <nav class="hud__nav" aria-label="章节导航">${renderNav()}</nav>
      <div class="hud__status">
        <span class="hud__track" data-track-status>BGM / STANDBY</span>
        <span data-clock>T+00:00:00</span>
        <button type="button" class="sound-toggle" data-sound-toggle aria-pressed="false">${icon("sound")}<span>BGM OFF</span></button>
      </div>
    </header>
    <aside class="chapter-rail" aria-label="滚动章节">
      <span data-rail-progress></span>
      <ol>${navItems.map(([id, label]) => `<li><a href="#${id}" data-rail-link="${id}">${label}</a></li>`).join("")}</ol>
    </aside>
    <main id="main">
      ${renderHero()}
      ${renderChildren()}
      ${renderEvangelion()}
      ${renderAngels()}
      ${renderTokyo()}
      ${renderRecords()}
      ${renderRelease()}
    </main>
    <footer class="site-footer">
      <span>SYNC PROTOCOL / FAN-MADE EXPERIENCE</span>
      <p>Made for reading, listening and leaving the noise outside.</p>
      <a href="#top">回到顶端</a>
    </footer>
    <dialog class="trailer-dialog" data-trailer-dialog aria-labelledby="trailer-title">
      <div class="trailer-dialog__bar"><h2 id="trailer-title">官方预告</h2><button type="button" data-close-trailer aria-label="关闭预告">${icon("close")}</button></div>
      <div class="trailer-dialog__frame" data-trailer-frame></div>
      <p>影像由 YouTube 官方嵌入播放。关闭后停止加载，避免后台播放。<a data-trailer-external href="https://www.youtube.com/" target="_blank" rel="noreferrer">在 YouTube 打开</a></p>
    </dialog>
    <audio data-voice-audio preload="none"></audio>
    <p class="sr-only" aria-live="polite" data-live-status></p>`;
}

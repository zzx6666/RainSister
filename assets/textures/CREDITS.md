# 程序化纹理资产登记

## 资产声明

本目录中的 `grain.png` 与 `scanlines.png` 均为**项目原创程序化资产**。两者由本仓库内的 Node.js 脚本通过像素数据与标准 DEFLATE 压缩直接编码生成，没有使用图片生成模型、第三方纹理素材或网络下载素材。

- 生成日期：2026-10-19
- 生成脚本：[generate-textures.mjs](./generate-textures.mjs)
- 运行环境：Node.js v24.19.0
- 纹理类型：可平铺 PNG
- 授权状态：项目原创，仅随本项目使用；公开分发前仍需按项目整体授权策略复核

## 资产清单

| 文件 | 尺寸 | PNG 格式 | 文件大小 | SHA-256 |
| --- | ---: | --- | ---: | --- |
| [grain.png](./grain.png) | 256 × 256 | 8 位灰度，颜色类型 0 | 65,084 字节（约 63.56 KiB） | `8e85bfe82bb533e9b02458c4151aa33db437127c44d0783cf6e0f8fcda6832f5` |
| [scanlines.png](./scanlines.png) | 64 × 8 | 8 位 RGBA，颜色类型 6 | 87 字节 | `305d5d31ab311ca1df7400e5605f2b4fce6b9fbff4a63a9bb399e2a03e1acbe5` |

## 生成方式与视觉特征

### `grain.png`

- 使用固定种子 `0x4e455256`（对应字符 `NERV`）的确定性伪随机算法生成均匀灰度颗粒，并叠加极轻微的周期起伏，避免噪声显得过于数字化。
- 像素范围为 8–247，保留高光与暗部层次；纹理四边不依赖额外接缝处理，随机像素天然可平铺。
- 建议以 `repeat` 重复，并在 CSS 中缩放或降低透明度使用。例如：

```css
.film-grain {
  background-image: url("./assets/textures/grain.png");
  background-repeat: repeat;
  background-size: 128px 128px;
  mix-blend-mode: soft-light;
  opacity: 0.12;
  pointer-events: none;
}
```

### `scanlines.png`

- 64 × 8 RGBA 透明底纹理；每 8 像素为一个完整循环。
- 第 1 行为透明度 150 的黑色主扫描线，第 2 行为透明度 38 的柔和回响，其余 6 行完全透明。
- 纹理左右与上下均可无缝平铺，适合叠加在影像、纸张或 WebGL 画布上。例如：

```css
.crt-scanlines {
  background-image: url("./assets/textures/scanlines.png");
  background-repeat: repeat;
  background-size: 64px 8px;
  mix-blend-mode: multiply;
  opacity: 0.55;
  pointer-events: none;
}
```

## 复现命令

在项目根目录执行：

```powershell
node .\assets\textures\generate-textures.mjs
```

脚本会覆盖生成两张 PNG，并依次检查：

1. PNG 文件签名与全部数据块 CRC；
2. `IHDR` 中的尺寸、色深和颜色类型；
3. `IDAT` 解压后的扫描线长度与滤波字节；
4. 扫描线纹理每一行的透明度分布；
5. 输出文件字节数与 SHA-256。

固定种子和无时间元数据的设计使输出可重复；相同 Node.js/zlib 环境下应得到相同哈希。

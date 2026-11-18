<h1 align="center">Narrated Explainer Video</h1>

<p align="center">让旁白带动画面，让图示讲清观点。</p>
<p align="center">知识 · 科普 · 课程 · 产品讲解</p>

<p align="center">
  <a href="https://skills.sh/docs"><img src="https://img.shields.io/badge/install-skills.sh-151515?style=flat-square" alt="通过 skills.sh CLI 安装"></a>
  <a href="assets/starter/package.json"><img src="https://img.shields.io/badge/Node.js-22%2B-347b73?style=flat-square" alt="制作模板需要 Node.js 22 或以上"></a>
  <a href="scripts/new_project.py"><img src="https://img.shields.io/badge/Python-3.10%2B-775293?style=flat-square" alt="工具脚本需要 Python 3.10 或以上"></a>
  <a href="https://github.com/shaokeyibb/narrated-explainer-video/releases"><img src="https://img.shields.io/badge/download-Releases-bd862c?style=flat-square" alt="下载安装包"></a>
</p>

<p align="center">
  <a href="#安装">安装</a> ·
  <a href="#看效果">看效果</a> ·
  <a href="#开始制作">开始制作</a> ·
  <a href="#制作方法">制作方法</a> ·
  <a href="#文档与工具">文档与工具</a>
</p>

<p align="center">
  <img src="docs/images/narration-demo.gif" width="800" alt="16 秒图解演示。两组请求的平均用时相同，条形逐项显示后，高亮揭示第二组的最长等待更久。">
</p>

<p align="center"><sub>起步模板的真实导出画面 · 16 秒无声循环 · 虚构数据演示</sub></p>

把逐字稿、分章录音和口播视频制作成可发布的讲解视频。这套 Agent Skill 包含分镜方法、Web 动画模板、时间映射和混音工具，并覆盖字幕、封面、章节信息与投稿简介的交付。

## 安装

使用 [skills.sh 提供的 CLI](https://skills.sh/docs) 安装，按提示选择需要使用的 Agent：

```sh
npx skills add shaokeyibb/narrated-explainer-video
```

在 Codex 的所有项目中使用：

```sh
npx skills add shaokeyibb/narrated-explainer-video --skill narrated-explainer-video -a codex -g
```

仓库目前为私有，安装账号需要仓库访问权限。CLI 会使用已有的 Git、GitHub CLI 或 SSH 认证。CLI 当前要求 Node.js 22.20+。[安装选项与私有仓库说明](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)

安装后，可以直接这样开始：

> 用 $narrated-explainer-video 把我的分章录音和逐字稿做成面向新手的知识视频。先确定标题和分镜，采用深色图解，提供 B 站和小红书封面，以及章节明细和投稿简介。

<details>
<summary>手动安装与更新</summary>

也可以从 [Releases](https://github.com/shaokeyibb/narrated-explainer-video/releases) 下载 ZIP，将其中的 narrated-explainer-video 文件夹放入 Codex 用户技能目录。该目录由 CODEX_HOME 指定，默认位于用户主目录下的 .codex/skills。

通过 skills CLI 安装后，可以检查和更新技能：

```sh
npx skills check
npx skills update
```

</details>

## 看效果

**让每个动作承载信息。** 示例先展示两组等待，再随字幕逐项揭示数值，最后比较最长等待。模板默认关闭字幕，方便检查图示本身能否讲清关系。

<table>
  <tr>
    <th>横版封面 · 4:3</th>
    <th>竖版封面 · 3:4</th>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/cover-landscape.png" width="360" alt="横版封面，平均值相同、谁等得更久的标题与两条等待时间并列"></td>
    <td align="center"><img src="docs/images/cover-portrait.png" width="250" alt="竖版封面，标题和等待时间上下排列"></td>
  </tr>
</table>

同一主题按画幅重新排版。标题、主体和比较关系保持完整，封面尺寸、安全区和 JPG／PNG 格式均可配置。

<details>
<summary>查看四种画幅的安全区与裁切预览</summary>

![上排为四种封面及安全框，下排为模拟居中裁切后的效果](docs/images/cover-safe-areas.png)

绿色实线标出设计安全区，橙色虚线标出测试裁框。平台入口及带日期的参考规格见[投稿与封面](references/publishing.md)。

</details>

## 开始制作

已安装 Skill 时，把素材位置、受众和制作要求交给 Agent 即可。需要自己编辑模板，可以克隆仓库并创建独立工程：

```sh
git clone https://github.com/shaokeyibb/narrated-explainer-video.git
cd narrated-explainer-video
python scripts/new_project.py projects/my-video
cd projects/my-video
npm ci
```

打开工程中的 `index.html`，即可播放、拖动进度、开关字幕和加载剪后音轨。

| 编辑位置 | 用途 |
| --- | --- |
| `project-brief.json` | 受众、风格、出镜、节奏与发布要求 |
| `storyboard.md` | 每句旁白对应的图示、标签、动作与转场 |
| `project.js` | 剪后时间、字幕、章节、简介、配色与封面规格 |
| `film.js` | 本期的图形、场景和封面构图 |
| `motion.js` | 淡入、对象移动、避开图例边框的引线 |

导出投稿材料与视频：

```sh
node export.cjs materials output
node export.cjs movie mixed.m4a output/full.mp4
```

`mixed.m4a` 是你制作完成的连续音轨，其时长应与项目时间线一致。制作环境需要 Node.js 22+、Python 3.10+、FFmpeg、FFprobe 及可用的中文字体。创建工程时加 `--with-sound`，可带上附赠的试听音乐与授权信息。[字体、混音与验收的完整步骤](references/starter.md)

## 制作方法

```mermaid
flowchart LR
  A["素材与题目"] --> B["剪后旁白"]
  B --> C["分镜与图解"]
  C --> D["代表片段"]
  D --> E["全片与混音"]
  E --> F["成片验收"]
  F --> G["投稿包"]
```

- **以剪后旁白为准。** 图示、标签、字幕和音效共用同一时间线。
- **逐步揭示。** 对象名随讲述出现，高亮和动作指出当前重点。
- **关字幕也能看懂。** 短标签说明对象，图形展示关系与变化。
- **每部片有自己的选择。** 品牌、人物、音乐、字幕修订和停留时间写入项目约定。
- **检查实际成片。** 复核闪字、遮挡、口型、轻声词和跨镜同步，再交付完整审阅版。

最终交付包括完整 MP4、独立 SRT、可编辑工程、章节起止与介绍、视频简介、声音署名，以及目标平台的封面和裁切预览。

## 文档与工具

| 需要完成的工作 | 入口 |
| --- | --- |
| 了解完整工作流 | [Skill 指令](SKILL.md) |
| 建立项目并运行模板 | [起步说明](references/starter.md) · [创建工程](scripts/new_project.py) |
| 剪气口、修字幕、做混音 | [声音与字幕](references/edit-and-sound.md) · [混音工具](scripts/mix_audio.py) |
| 把源词点映射到剪后时间 | [时间映射工具](scripts/map_cues.py) |
| 设计布局、重点与转场 | [视觉方法](references/visual-direction.md) |
| 检查完整 MP4 | [验收方法](references/verification.md) · [导出检查工具](scripts/audit_export.py) |
| 准备封面、章节和简介 | [投稿说明](references/publishing.md) |
| 排查常见制作问题 | [返工经验](references/lessons.md) |

<details>
<summary>能力边界、素材授权与问题反馈</summary>

模板提供可编辑的场景示例和确定性工具。正式视频需要按主题编写分镜与图示；保留 Webcam 时需开发人物合成层，扩展位置见起步说明。

README 中的图和动画来自随附模板。示例数据用于说明平均值与最长等待的差别。随附第三方音乐及音效按各自许可证使用，发布前保留实际使用曲目的署名。[作者与授权](assets/sound/CREDITS.md)

反馈问题时，请提供复现命令、操作系统、Node／Python／FFmpeg 版本，以及可共享的最小素材或截图。涉及播放问题时请附时间点。[提交问题](https://github.com/shaokeyibb/narrated-explainer-video/issues)

</details>

# Narrated Explainer Video

从逐字稿、录音或口播视频出发，制作旁白驱动的知识、科普、课程和产品讲解视频。仓库同时提供 Codex Skill、Web 动画起步模板、剪后时间映射、混音、封面和成片检查工具。

整个流程围绕剪后旁白安排图示，最终交付完整 MP4、SRT、逐章时间段与介绍、视频简介、平台封面、安全区预览和可编辑工程。[阅读 Skill](SKILL.md)

## 安装与调用

下载 Release 中的安装包，将其中的 narrated-explainer-video 文件夹放入 Codex 用户技能目录。该目录由 CODEX_HOME 指定，默认位于用户主目录下的 .codex/skills。文件夹内直接包含 SKILL.md。

也可以把本仓库克隆到该技能目录，文件结构与安装包一致。调用示例：

> 用 $narrated-explainer-video 把我的录音和逐字稿做成面向新手的知识视频。先确定标题与分镜，采用深色图解，给出 B 站和小红书封面以及投稿简介。

## 从独立工程开始

需要 Node.js 22+、Python 3.10+、FFmpeg 与 FFprobe。中文渲染需要本机可用的中文字体。图像生成仅在需要新插画或人物动作时使用。

```sh
python scripts/new_project.py projects/my-video
cd projects/my-video
npm ci
node export.cjs materials output
```

打开工程中的 index.html 可播放、跳转、开关字幕并载入剪后音频。填写 project-brief.json，按主题编写 project.js 中的时序、字幕、章节和简介，改写 film.js 中的图示。封面画幅、安全区及颜色可在 project.js 中配置。随附十六秒示例讲解两组请求的平均等待时间，供初次验证工具。

完成连续混音后输出视频：

```sh
node export.cjs movie mixed.m4a output/full.mp4
```

完整的字体配置、混音、按旁白写镜头和实际成片检查见[模板使用说明](references/starter.md)。需要复制可试听的音乐时，创建工程加上 --with-sound，发布时保留实际使用曲目的署名。[音频作者与许可](assets/sound/CREDITS.md)

## 复用范围

每个项目分别确定品牌、角色、风格、出镜、字幕修订习惯、节奏、音乐和发布位置。封面中的平台尺寸是注明日期的参考，发布前复核具体入口。静态时间上限用于发现解释断档，复杂图表的阅读停留应结合受众判断。

模板提供可编辑的绘图例子和确定性工具，逐字转写、语义剪辑、图示设计及声音审美由制作过程完成。第三方音频按各自许可证使用。仓库权限和对外发布范围遵循持有者设置。

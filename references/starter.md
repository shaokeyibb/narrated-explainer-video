# 新工程起步

在仓库或已安装 Skill 根目录运行 `python scripts/new_project.py 项目目录`。它会复制 Web 模板、分镜表和制作约定；加 `--with-sound` 会带上可选试听音频及署名。也可以手动复制 [starter 文件夹](../assets/starter)。样例题材是「平均响应时间相同，为什么仍有人等得更久」。两组各四个虚构观测值，平均都是 200 ms，最长分别是 200 和 500 ms；这些数字仅用于演示比较法。

直接打开 `index.html` 可播放、拖动、开关字幕、载入本地剪后音轨。未载入音频时走预览时钟。时序和字幕在 `project.js`，Canvas 图解及横竖封面构图在 `film.js`。以新题材改写两者，再按受众调整配色、字号和分辨率。样例时长 16 秒、30 fps，逻辑画布为 1280×720，只供检查工具。正式片使用自己的时间表。示例封面单独构图；换标题后在手机缩略图中检查断行和留白。

可单独取用 [motion.js](../assets/starter/motion.js) 中的动画函数。用 `ramp(t, wordTime, .35)` 和 `reveal(ctx, amount, draw)` 让字与线跟随同一词点。跨镜保留主体时，用 `matchRect(t, start, duration, from, to)` 得到当前构图的位置与大小。引线用 `leaderEndpoints(主体框, 标签框, 净空像素)` 计算两端；返回 null 时略去连线。若路径上还有第三个标签，改道或用成对符号。所有框都用最终画布像素的 `{x,y,w,h}`。

## 可编辑设置

- project-brief.json 记录本片要求与已批准决定。它供制作时读取；按这些决定更新实际绘图及音频参数。
- project.js 保存标题、简介、章节及 summary、字幕、帧率、剪后时长、事件时间与声音署名。theme 覆盖纸色、文字色和图形强调色；深色方案要同时核验全部图形与字幕的对比度。
- coverProfiles 可选任意数量的画幅。每项有唯一 id、像素 w/h、safe 的左上右下比例、crop 的宽高比。封面函数按选定画幅生成独立构图。coverFormat 可取 png 或 jpeg。
- film.js 是当前例子的具体场景。新主题需重写图示与标签；修改视频宽高比时重排场景并更新导出的 W/H 及 index.html 的画布大小。封面比例独立于视频画幅。
- 修改标题或字号后核验真实字宽；替换数组数据时同步调整旁白和图示中的数值标签。

例如只交付一份方形封面时，设 coverProfiles 为 `[{id:'square',w:1200,h:1200,safe:[.1,.1,.9,.9],crop:[1,1]}]`。默认的四画幅来自[带日期的投稿参考](publishing.md)。

## 出镜与新增场景

保留 Webcam 的项目需额外实现人物合成。brief.picture.presenter 记录呈现决定，示例的浏览器和导出器目前提供图解绘制。先按同一份剪辑区间表处理人物视频，使帧起点、时长和旁白一致，再选择以下扩展位置：

- Web 绘制中加入人物层时，浏览器拖动要同步视频时间，离线导出则为对应绝对时间解码人物帧；字幕绘制安排在最后。
- 也可以在图解 MP4 导出后由 FFmpeg overlay 合成已剪人物视频，再映射连续混音与章节。镜头中预留人物位置，文字和指示线避开它；抠像按[素材处理](edit-and-sound.md)验收。
- 两种做法都需从最终合成 MP4 检查首、中、末段的口型和原声，完整解码后再交付。

示例场景的 values、cues 和标签围绕等待时间设计。新题材先写分镜，再替换 film.js 中的图示，沿用 motion.js、导出、章节、字幕与封面工具。

## 校准剪后词点

将下面内容保存为 edit.json。在 Skill 根目录运行 `python scripts/map_cues.py edit.json`。其中 `in/out` 是已校正首 PTS 的源秒数，`frames` 是该区间在剪后占用的帧；没有 source 的条目表示留白。每个保留区间内播放速度恒定。重复回放保留多个结果，词被完全剪掉时工具会指出问题。同一词的多个动画引用同一事件 ID。示例的 beam 位于成片 2.5 秒，对应从零起算的第 75 帧。first_frame 表示允许触发的第一帧。淡入曲线在起点的透明度为零，可读时间还取决于字重、对比和淡入长度。导出后取第 74、75 帧及随后几帧，对照原声检查何时真正看得清。

```json
{"fps":30,"clips":[{"source":"ch1","in":1,"out":3,"frames":60},{"frames":6},{"source":"ch1","in":4,"out":8,"frames":120}],"cues":[{"id":"beam","source":"ch1","time":4.3}]}
```

## 制作并导出

在复制出来的 starter 中使用 Node.js 22+ 安装列出的绘图库。FFmpeg 与 FFprobe 放入 PATH，或分别设置 `FFMPEG`、`FFPROBE` 完整路径。用与命令所在系统一致的路径调用。指定中文字体时，`FILM_FONT`、`FILM_FONT_BOLD` 指向有权使用的字体文件，浏览器另行确认字宽；渲染器使用字体别名 Film Sans。工程包携带可分发字体或注明安装要求。

```sh
npm ci
node export.cjs materials out
node export.cjs movie mixed.m4a out/full.mp4
```

`materials` 写出与烧录一致的 SRT、选定的平台封面、安全区预览、逐章起止与介绍（chapters-detailed.txt）、含署名的投稿简介（upload-description.txt）。为新工程填写 project.description、chapters[].summary 和实际署名，按[投稿规格](publishing.md)复查当前发布入口；`movie` 需要时长匹配的剪后音频，先生成纯视频，再映射连续音轨和章节。把实际使用素材的署名写入 project.credits 和发布说明。改为自己的镜头时，只引用剪后秒数，确保从任意帧开始绘制和从头播放结果相同。正式长片宜分段落盘再合并，详见[交付验收](verification.md)。

## 配乐和成片检查

下面两条命令从 Skill 根目录执行，文件路径按新工程替换。混音工具使用标准库和 FFmpeg，从干声读取时长；`--loop-in`、`--loop-seconds` 需针对所选录音试听，整小节裁切。音效参数可重复使用，每个时间点都应对应具体动作。示例选用现成小节；按章换歌可先分段编排音乐、交叉淡化，再与连续干声混合。[随附音频与署名](../assets/sound/CREDITS.md)

```sh
python scripts/mix_audio.py voice.wav assets/sound/back-on-track.mp3 mixed.m4a --loop-in 4 --loop-seconds 64 --music-db -13 --credit "Back on Track, Kevin MacLeod (incompetech.com), CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ — edited and mixed"
python scripts/audit_export.py out/full.mp4 --duration 16 --fps 30 --chapters 1 --captions out/captions.srt --pace --diagram-bottom 0.82
```

验收时将 duration、fps、chapters 换为实际成片数据。按 brief 的静态时间上限传 `--hold 秒数`，默认三秒只用于开始筛查，人工复核阅读停留是否合理。

可选 `--pace` 需要 Pillow（`python -m pip install Pillow`）。无此选项时仅需 Python 标准库及 FFmpeg。程序会完整解码音画、检查首帧与帧时钟、长度、章节数、字幕时间，并按需列出需人工查看的画面区间。它无法判断配乐是否合拍、指示线是否挡住目标或动画是否真的解释了论点。

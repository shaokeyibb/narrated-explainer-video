// Edited seconds. Use this same data for preview, export and external captions.
(function (host) {
  const project = {
    title: '为什么平均值藏得住慢请求？',
    description: '两组请求的平均用时都是 200 毫秒。把每次等待分别画出来，看看哪一组让人等得最久，以及平均值藏住了什么。',
    coverLines: ['平均值相同', '谁等得更久？'],
    // Sample settings. Set these from the current project's edited narration.
    fps: 30, duration: 16,
    theme: {
      paper:'#f6f4ee', ink:'#302c39', muted:'#706a73', grid:'#dbd7d0',
      card:'#fffefa', teal:'#347b73', violet:'#775293', gold:'#bd862c'
    },
    coverFormat: 'png',
    // Select or replace profiles for the actual upload surfaces.
    coverProfiles: [
      {id:'16x9', w:3840, h:2160, safe:[.16,.12,.84,.82], crop:[4,3]},
      {id:'4x3', w:1600, h:1200, safe:[.09,.19,.91,.81], crop:[16,9]},
      {id:'3x4', w:1080, h:1440, safe:[.09,.16,.86,.81], crop:[1,1]},
      {id:'9x16', w:2160, h:3840, safe:[.09,.24,.82,.75], crop:[1,1]}
    ],
    chapters: [{start: 0, title: '平均与最长等待', summary: '比较两组示意数据中每次请求的用时，找出相同平均值背后的最长等待。'}],
    values: [[200, 200, 200, 200], [100, 100, 100, 500]],
    cues: {measure: 2.78, mean: 4.02, first: 5.08, firstValue: 6.62, three: 8.62, threeValue: 9.56, slow: 10.29, slowValue: 11.68, compare: 14.18, delta: 15.24},
    captions: [
      [0.1, 2.28, '两组请求，哪一组让人等得更久？'],
      [2.35, 4.85, '它们的平均响应时间都是 200 毫秒。'],
      [5, 7.58, '第一组，每次都等 200 毫秒。'],
      [7.7, 10.04, '第二组，前三次只等 100 毫秒。'],
      [10.2, 12.85, '最后一次却等了 500 毫秒。'],
      [13, 15.94, '平均值一样，最长的一次相差 300 毫秒。']
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = project;
  else host.project = project;
})(globalThis);

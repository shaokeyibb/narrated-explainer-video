(function (host) {
  const project = typeof module !== 'undefined' && module.exports ? require('./project.js') : host.project;
  const W = 1280, H = 720;
  const C = {paper:'#f6f4ee', ink:'#302c39', muted:'#706a73', grid:'#dbd7d0',
    card:'#fffefa', teal:'#347b73', violet:'#775293', gold:'#bd862c', ...project.theme};
  const longest = project.values.map(group => Math.max(...group));
  const scaleMax = Math.max(...longest, 1);
  const face = '"Film Sans", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  const {ramp, reveal} = typeof module !== 'undefined' && module.exports ? require('./motion.js') : host.filmMotion;
  function box(ctx,x,y,w,h,color,r=10) {
    if (w<=0 || h<=0) return;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2));
    ctx.fillStyle=color; ctx.fill();
  }
  function label(ctx, value,x,y,size,color=C.ink,align='left',weight=500) {
    ctx.font=weight+' '+size+'px '+face; ctx.fillStyle=color;
    ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillText(value,x,y);
  }
  function clock(ctx,x,y,r,p,col) {
    ctx.strokeStyle=col; ctx.lineWidth=Math.max(3,r*.095); ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
    const a=-Math.PI/2+p*Math.PI*1.55;
    ctx.beginPath(); ctx.moveTo(x,y-r*.55); ctx.lineTo(x,y);
    ctx.lineTo(x+Math.cos(a)*r*.67,y+Math.sin(a)*r*.67); ctx.stroke();
  }
  function subtitle(ctx, text) {
    ctx.font='500 32px '+face;
    const lines=[];
    for (const para of text.split('\n')) {
      let line='';
      for (const ch of para) {
        if (line && ctx.measureText(line+ch).width>1100) {lines.push(line); line='';}
        line+=ch;
      }
      lines.push(line);
    }
    const height=lines.length*41+16;
    const width=Math.max(...lines.map(l=>ctx.measureText(l).width))+38;
    const y=H-24-height;
    box(ctx,(W-width)/2,y,width,height,'rgba(16,16,18,.76)',8);
    lines.forEach((s,i)=>label(ctx,s,W/2,y+29+41*i,32,'#fff','center'));
  }
  function draw(ctx,t,withCaptions=true) {
    const q=project.cues, intro=1-ramp(t,q.measure,.45);
    ctx.save(); ctx.fillStyle=C.paper; ctx.fillRect(0,0,W,H);
    reveal(ctx,intro,()=>{
      clock(ctx,434,335,64,ramp(t,.05,1.28),C.teal);
      clock(ctx,846,335,64,ramp(t,.05,2.68),C.violet);
    });
    reveal(ctx,ramp(t,q.measure,.55),()=>label(ctx,'请求用时 · 示意数据',100,99,23,C.muted));
    for (let group=0;group<2;group++) {
      const x=group?690:100, col=group?C.violet:C.teal;
      reveal(ctx,ramp(t,q.measure,.55),()=>{
        box(ctx,x,134,490,395,C.card,17);
        label(ctx,group?'第二组':'第一组',x+31,176,27,C.muted);
        const mean=project.values[group].reduce((a,b)=>a+b,0)/project.values[group].length;
        label(ctx,'平均',x+31,235,42,col,'left',700);
        reveal(ctx,ramp(t,q.mean,.32),()=>label(ctx,mean+' ms',x+148,235,42,col,'left',700));
        for(let i=0;i<4;i++){
          const y=322+i*46;

          const start=group?(i===3?q.slow:q.three+i*.23):q.first+i*.30;
          const word=group?(i===3?q.slowValue:q.threeValue):q.firstValue;
          box(ctx,x+38,y,300*ramp(t,start,.45),9,C.grid);
          const progress=ramp(t,word+i*.045,.55);
          const value=project.values[group][i],width=value/scaleMax*300;
          box(ctx,x+38,y-5,width*progress,19,col);
          reveal(ctx,progress,()=>label(ctx,String(value),x+433,y+5,22,col,'right'));
        }
      });
    }
    reveal(ctx,ramp(t,q.compare,.65),()=>{
      const diff=Math.abs(longest[1]-longest[0]);
      for (const x of [138,728]) box(ctx,x,482,300*ramp(t,q.compare,.5),3,C.gold,1.5);
      reveal(ctx,ramp(t,q.delta,.34),()=>label(ctx,'最长等待相差 '+diff+' ms',640,568,37,C.ink,'center',700));
    });
    if(withCaptions){
      const cue=project.captions.find(([start,end])=>start<=t && t<end);
      if(cue)subtitle(ctx,cue[2]);
    }
    ctx.restore();
  }
  function cover(ctx,width,height) {
    const portrait=height>width;
    ctx.fillStyle=C.paper;ctx.fillRect(0,0,width,height);
    const u=width/(portrait?720:1280);ctx.save();ctx.scale(u,u);
    const lines=project.coverLines;
    lines.forEach((s,i)=>label(ctx,s,portrait?54:82,(portrait?245:236)+i*(portrait?90:81),portrait?69:63,C.ink,'left',700));
    const x=portrait?73:705,y=portrait?624:241;
    for(let i=0;i<2;i++){
      const col=i?C.violet:C.teal, yy=y+i*116;
      clock(ctx,x+32,yy+15,23,i?.85:.35,col);
      box(ctx,x+87,yy,portrait?430:350,25,C.grid);
      box(ctx,x+87,yy,(portrait?430:350)*longest[i]/scaleMax,25,col);
    }
    ctx.restore();
  }
  const coverDesign = {
    profiles:project.coverProfiles, format:project.coverFormat,
    paper:C.paper, ink:C.ink, accent:C.violet, font:face,
    wide:project.coverLines, tall:project.coverLines, emphasis:1,
    artBounds:[0,0,520,205],
    drawArt(ctx) {
      longest.forEach((value,i)=>{
        const col=i?C.violet:C.teal, y=48+i*107;
        clock(ctx,35,y,26,i?.85:.35,col);
        box(ctx,95,y-13,405,26,C.grid);
        box(ctx,95,y-13,405*value/scaleMax,26,col);
      });
    }
  };
  const api={W,H,draw,cover,coverDesign};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else host.explainer=api;
})(globalThis);

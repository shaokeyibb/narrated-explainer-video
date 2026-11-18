// Fractions describe the editorial safe rectangle, measured from the top-left.
const fs = require('node:fs');
const path = require('node:path');
const profiles = [
  {id:'16x9', w:3840, h:2160, safe:[.16,.12,.84,.82], crop:[4,3]},
  {id:'4x3', w:1600, h:1200, safe:[.09,.19,.91,.81], crop:[16,9]},
  {id:'3x4', w:1080, h:1440, safe:[.09,.16,.86,.81], crop:[1,1]},
  {id:'9x16', w:2160, h:3840, safe:[.09,.24,.82,.75], crop:[1,1]}
];
function safeRect(p) {
  const [l,t,r,b] = p.safe;
  return {x:Math.ceil(l*p.w), y:Math.ceil(t*p.h), w:Math.floor(r*p.w)-Math.ceil(l*p.w), h:Math.floor(b*p.h)-Math.ceil(t*p.h)};
}
function drawCover(ctx,p,design) {
  const box=safeRect(p);
  ctx.fillStyle=design.paper;
  ctx.fillRect(0,0,p.w,p.h);
  ctx.save();
  ctx.translate(box.x,box.y);
  const wide=box.w>box.h*1.4;
  const textW=wide?box.w*.47:box.w;
  const textH=wide?box.h:box.h*.45;
  const lines=wide?design.wide:design.tall;
  let size=textH/(lines.length+1);
  ctx.font='700 '+size+'px '+design.font;
  const longest=Math.max(...lines.map(s=>ctx.measureText(s).width));
  size=Math.min(size,size*textW*.95/longest);
  ctx.font='700 '+size+'px '+design.font;
  ctx.textAlign='left';ctx.textBaseline='middle';
  const leading=size*1.14;
  const mid=(wide?textH*.50:textH*.52)+(design.kicker?size*.28:0);
  if(design.kicker){
    ctx.font='700 '+size*.46+'px '+design.font;
    ctx.fillStyle=design.accent;
    ctx.fillText(design.kicker,textW*.02,mid-(lines.length-1)*leading/2-size*.94);
    ctx.font='700 '+size+'px '+design.font;
  }
  lines.forEach((line,i)=>{
    ctx.fillStyle=i===design.emphasis?design.accent:design.ink;
    ctx.fillText(line,textW*.02, mid+(i-(lines.length-1)/2)*leading);
  });
  const art=wide?{x:box.w*.49,y:0,w:box.w*.51,h:box.h}:{x:0,y:textH,w:box.w,h:box.h-textH};
  const [x,y,w,h]=design.artBounds;
  const scale=.97*Math.min(art.w/w,art.h/h);
  ctx.translate(art.x+(art.w-w*scale)/2,art.y+(art.h-h*scale)/2);
  ctx.scale(scale,scale);
  ctx.translate(-x,-y);
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  design.drawArt(ctx);
  ctx.restore();
}
function writeCovers(dir,createCanvas,design,paint=drawCover) {
  const selected=design.profiles??profiles;
  if(!Array.isArray(selected)||!selected.length) throw Error('Choose at least one cover profile');
  const ids=new Set();
  for(const p of selected){
    const safe=p.safe, crop=p.crop;
    if(!/^[a-zA-Z0-9_-]+$/.test(p.id)||ids.has(p.id) ||
      !Number.isInteger(p.w)||!Number.isInteger(p.h)||p.w<=0||p.h<=0 ||
      !Array.isArray(safe)||safe.length!==4||!safe.every(Number.isFinite) ||
      !(0<=safe[0]&&safe[0]<safe[2]&&safe[2]<=1&&0<=safe[1]&&safe[1]<safe[3]&&safe[3]<=1) ||
      !Array.isArray(crop)||crop.length!==2||!crop.every(v=>Number.isFinite(v)&&v>0))
      throw Error('Invalid cover dimensions, crop or safe area: '+p.id);
    ids.add(p.id);
  }
  fs.mkdirSync(dir,{recursive:true});
  const sheet=createCanvas(250*selected.length,600), sc=sheet.getContext('2d');
  sc.fillStyle='#edece6';sc.fillRect(0,0,sheet.width,600);
  sc.font='20px sans-serif';sc.textAlign='center';sc.fillStyle='#292833';
  selected.forEach((p,i)=>{
    const card=createCanvas(p.w,p.h), ctx=card.getContext('2d');
    paint(ctx,p,design);
    const jpeg=design.format==='jpeg';
    fs.writeFileSync(path.join(dir,'cover-'+p.id+(jpeg?'.jpg':'.png')),
      jpeg?card.toBuffer('image/jpeg',93):card.toBuffer('image/png'));
    const cw=Math.min(p.w,p.h*p.crop[0]/p.crop[1]), ch=cw*p.crop[1]/p.crop[0];
    const cx=(p.w-cw)/2, cy=(p.h-ch)/2;
    const column=250*i+125;
    const thumb=Math.min(230/cw,175/ch);
    sc.save();
    sc.translate(column-cw*thumb/2,480-ch*thumb/2);
    sc.scale(thumb,thumb);
    sc.beginPath();sc.rect(0,0,cw,ch);sc.clip();
    sc.translate(-cx,-cy);paint(sc,p,design);sc.restore();
    const r=safeRect(p);
    const zoom=Math.min(230/p.w,300/p.h);
    sc.save();sc.translate(column-p.w*zoom/2,185-p.h*zoom/2);sc.scale(zoom,zoom);
    paint(sc,p,design);
    sc.strokeStyle='#0b8879';sc.lineWidth=1.2/zoom;sc.strokeRect(r.x,r.y,r.w,r.h);
    sc.strokeStyle='#b86620';sc.lineWidth=1/zoom;
    sc.setLineDash([4/zoom,3/zoom]);sc.strokeRect(cx+sc.lineWidth/2,cy+sc.lineWidth/2,cw-sc.lineWidth,ch-sc.lineWidth);
    sc.restore();
    sc.fillText(p.id.replace('x',':'),column,365);
    sc.fillText(p.crop.join(':'),column,592);
  });
  fs.writeFileSync(path.join(dir,'safe-area-preview.png'),sheet.toBuffer('image/png'));
}
function stamp(seconds,precise=false) {
  const ms=Math.round(seconds*1000),s=precise?Math.floor(ms/1000):Math.round(ms/1000);
  const hours=Math.floor(s/3600);
  return (hours?hours+':':'')+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+(precise?'.'+String(ms%1000).padStart(3,'0'):'');
}
function writeCopy(dir,{description,chapters,duration,credits}) {
  if(!description?.trim() || !chapters?.length || chapters[0].start!==0 || !(duration>0)) throw Error('Provide a description and chapters starting at zero.');
  const ranges=[], times=[];
  for(let i=0;i<chapters.length;i++){
    const {start,title,summary}=chapters[i], end=chapters[i+1]?.start??duration;
    if(!title?.trim() || !summary?.trim() || !(end>start) || !Number.isFinite(end)) throw Error('Check title, summary and timing for chapter '+(i+1));
    ranges.push(stamp(start,true)+'–'+stamp(end,true)+'  '+title+'\n'+summary);
    times.push(stamp(start)+' '+title);
  }
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'chapters-detailed.txt'),ranges.join('\n\n')+'\n');
  const sections=[description.trim()];
  if(chapters.length>=3 && chapters.every((c,i)=>Math.round(chapters[i+1]?.start??duration)-Math.round(c.start)>=10 && (chapters[i+1]?.start??duration)-c.start>=10)) sections.push(times.join('\n'));
  if(credits?.trim()) sections.push(credits.trim());
  fs.writeFileSync(path.join(dir,'upload-description.txt'),sections.join('\n\n')+'\n');
}
module.exports={profiles,safeRect,drawCover,writeCovers,writeCopy};

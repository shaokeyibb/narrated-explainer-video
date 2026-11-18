// node export.cjs materials OUT_DIR | node export.cjs movie MIXED_AUDIO OUTPUT.mp4
const fs=require('node:fs'), path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const {pipeline}=require('node:stream/promises');
const {Readable}=require('node:stream');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const film=require('./film.js'), project=require('./project.js');
const publishing=require('./publishing.cjs');
const ffmpeg=process.env.FFMPEG||'ffmpeg', ffprobe=process.env.FFPROBE||'ffprobe';
for(const file of [process.env.FILM_FONT,process.env.FILM_FONT_BOLD].filter(Boolean)){
  if(!fs.existsSync(file)||!GlobalFonts.registerFromPath(file,'Film Sans'))throw Error('Cannot register font: '+file);
}
function secondsAsSrt(t){
  const ms=Math.round(t*1000);
  return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60]
    .map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');
}
function materials(dir){
  fs.mkdirSync(dir,{recursive:true});
  publishing.writeCopy(dir,project);
  publishing.writeCovers(dir,createCanvas,film.coverDesign);
  const srt=project.captions.map(([a,b,s],i)=>(i+1)+'\n'+secondsAsSrt(a)+' --> '+secondsAsSrt(b)+'\n'+s).join('\n\n')+'\n';
  fs.writeFileSync(path.join(dir,'captions.srt'),'\ufeff'+srt);

}
function parallelFailure(child){
  return new Promise((ok,fail)=>{
    child.once('error',fail);
    child.once('close',code=>code===0?ok():fail(Error('Video encoder exited '+code)));
  });
}
function meta(value){return String(value).replace(/[\\;#=]/g,'\\$&').replace(/[\r\n]+/g,' ');}
async function movie(input,dest,frames){
  const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-select_streams','a:0','-show_streams','-show_format','-of','json',input]));
  const audio=probe.streams[0],d=Number(audio?.duration??probe.format.duration);
  if(!audio||!Number.isFinite(d)||Math.abs(d-project.duration)>.08)
    throw Error('Use the edited audio clock. Audio seconds: '+d+'; project seconds: '+project.duration);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const temp=fs.mkdtempSync(path.join(path.dirname(dest),'.render-'));
  try{
    const picture=path.join(temp,'picture.mp4'), metadata=path.join(temp,'chapters.txt');
    const chapterText=project.chapters.flatMap(({start,title},i)=>['[CHAPTER]','TIMEBASE=1/1000',
      'START='+Math.round(start*1000),'END='+Math.round((project.chapters[i+1]?.start??project.duration)*1000),'title='+meta(title)]);
    fs.writeFileSync(metadata,[';FFMETADATA1','title='+meta(project.title),'comment='+meta(project.credits||''),...chapterText].join('\n')+'\n');
    const c=createCanvas(film.W,film.H),ctx=c.getContext('2d');
    const child=spawn(ffmpeg,['-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',film.W+'x'+film.H,'-r',String(project.fps),
      '-i','pipe:0','-an','-c:v','libx264','-crf','18','-preset','veryfast','-pix_fmt','yuv420p',picture],{stdio:['pipe','ignore','inherit']});
    async function* pixels(){for(let i=0;i<frames;i++){film.draw(ctx,i/project.fps,true);yield Buffer.from(c.data());}}
    await Promise.all([parallelFailure(child),pipeline(Readable.from(pixels()),child.stdin)]);
    const partial=path.join(temp,'final.mp4');
    execFileSync(ffmpeg,['-v','error','-y','-i',picture,'-i',input,'-f','ffmetadata','-i',metadata,
      '-map','0:v:0','-map','1:a:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k',
      '-ar','48000','-af','apad','-t',String(frames/project.fps),'-avoid_negative_ts','disabled','-movflags','+faststart',partial],{stdio:'inherit'});
    fs.renameSync(partial,dest);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
(async()=>{
  const [mode,input,output]=process.argv.slice(2),frames=Math.round(project.duration*project.fps);
  if(!Number.isFinite(frames)||frames<1||project.fps<=0)throw Error('Invalid project clock');
  let previous=0;
  for(const [a,b,text] of project.captions){
    if(!(a>=previous&&b>a&&b<=project.duration&&typeof text==='string'&&text.trim()))throw Error('Invalid caption grid at '+a);
    previous=b;
  }
  if(mode==='materials'&&input&&!output)materials(input);
  else if(mode==='movie'&&input&&output)await movie(input,output,frames);
  else throw Error('Usage: node export.cjs materials OUT_DIR | movie MIXED_AUDIO OUTPUT.mp4');
})().catch(error=>{console.error(error.message);process.exitCode=1;});

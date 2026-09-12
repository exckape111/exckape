const $=s=>document.querySelector(s), canvas=$('#canvas'),ctx=canvas.getContext('2d'),source=document.createElement('canvas'),sc=source.getContext('2d',{willReadFrequently:true});
let zoomLevel=null,lastSample=-1;
const defs=[['bleed','Ink bleed',[['spread','Spread',2,0,6],['wear','Wear',12,0,60]]],['dither','Dither',[['scale','Pixel size',3,1,12]]],['half','Halftone',[['dot','Dot spacing',8,3,22]]],['riso','Risograph',[['offset','Misregistration',5,0,16],['grain','Grain',22,0,65]]],['ascii','ASCII',[['cell','Character size',10,6,24]]],['sort','Pixel sorting',[['threshold','Threshold',100,10,240],['length','Streak length',60,10,200]]]];
defs.push(
 ['pixel','Pixelate',[['size','Block size',10,2,40]]],
 ['poster','Posterize',[['levels','Tonal levels',4,2,12]]],
 ['hatch','Crosshatch',[['spacing','Line spacing',8,3,20],['weight','Line weight',1,1,4]]],
 ['edge','Edge sketch',[['strength','Sensitivity',65,10,150]]],
 ['vhs','VHS',[['warp','Tracking distortion',8,0,35],['lines','Scanlines',25,0,75]]],
 ['film','Film grain',[['amount','Grain amount',20,0,80]]]
);
defs.push(
 ['spray','Spray paint',[['contrast','Contrast',65,10,100],['speckle','Speckle',35,0,80]]],
 ['faded','Faded copy',[['fade','Fade',35,0,80],['grain','Paper grain',18,0,60]]],
 ['gameboy','Gameboy',[['size','Pixel size',5,2,16],['dither','Dither',35,0,100]]],
 ['receipt','Receipt',[['threshold','Threshold',140,40,220],['wear','Print wear',20,0,70]]],
 ['thermal','Thermal',[['heat','Heat shift',20,0,100]]],
 ['cyano','Cyanotype',[['exposure','Exposure',50,0,100],['grain','Print grain',16,0,60]]],
 ['glass','Glass panes',[['width','Pane width',48,12,160],['bend','Refraction',18,0,60]]],
 ['signal','Bad signal',[['waves','Wave spacing',7,3,20],['warp','Distortion',20,0,65]]],
 ['streak','Light streaks',[['length','Trail length',30,4,100],['mix','Strength',55,0,100]]]
);
defs.push(
 ['rgbh','RGB hatch',[['spacing','Stripe spacing',3,2,12],['depth','Stripe depth',65,0,100]]],
 ['weave','Digital weave',[['size','Weave size',4,2,14],['texture','Thread texture',55,0,100]]],
 ['grunge','Grunge',[['threshold','Ink threshold',125,30,220],['grit','Grit',40,0,100]]],
 ['stamp','Print stamp',[['pressure','Ink pressure',145,30,230],['wear','Wear',25,0,80]]],
 ['emboss','Emboss',[['depth','Relief depth',3,1,12],['grain','Surface grain',12,0,60]]],
 ['stipple','Stippling',[['density','Dot density',55,10,100],['size','Dot size',1,1,5]]],
 ['matrix','Dot matrix',[['spacing','Dot spacing',6,3,18],['weight','Dot weight',70,10,100]]],
 ['gold','Golden film',[['warmth','Warmth',40,0,100],['grain','Film grain',18,0,70]]],
 ['shutter','Slow shutter',[['distance','Movement',35,0,120],['angle','Angle',20,0,180],['blend','Ghost exposure',55,0,100]]]
);
for(const [, ,knobs] of defs)knobs.push(['toneExposure','Exposure adjustment',0,-60,60],['contrastTune','Tonal contrast',0,-60,60]);
let state={},original=false,job=0;
const identities={
 bleed:['#ff5746','<path d="M24 4C20 13 10 21 10 29a14 14 0 0 0 28 0C38 21 28 13 24 4Z"/>'],
 dither:['#c5ee32','<path d="M5 5h10v10H5zm14 0h10v10H19zm14 0h10v10H33zM5 19h10v10H5zm14 0h10v10H19zM5 33h10v10H5z"/>'],
 half:['#38b7ff','<circle cx="15" cy="15" r="10"/><circle cx="36" cy="14" r="6"/><circle cx="14" cy="36" r="6"/><circle cx="35" cy="35" r="3"/>'],
 riso:['#ffacd5','<circle cx="18" cy="22" r="15"/><circle cx="31" cy="28" r="14" fill="none" stroke="currentColor" stroke-width="4"/>'],
 ascii:['#c2a8ff','<path d="m17 10-12 14 12 14M31 10l12 14-12 14" fill="none" stroke="currentColor" stroke-width="6"/>'],
 sort:['#ffbd24','<path d="M4 7h28v6H4zm8 10h32v6H12zM4 27h24v6H4zm14 10h26v6H18z"/>'],
 pixel:['#68dbb4','<path d="M5 5h18v18H5zm20 0h18v18H25zM5 25h18v18H5z"/>'],
 poster:['#ff894b','<path d="M5 8h38v8H5zm0 12h28v8H5zm0 12h18v8H5z"/>'],
 hatch:['#d5d3c9','<path d="M16 5 9 43M34 5l-7 38M4 17h40M2 32h40" fill="none" stroke="currentColor" stroke-width="5"/>'],
 edge:['#89bfff','<path d="M6 40V8h32M16 40V18h26" fill="none" stroke="currentColor" stroke-width="5"/>'],
 vhs:['#e3a3ff','<path d="M4 8h40v7H4zm5 12h30v7H9zM4 32h40v7H4z"/>'],
 film:['#f1e867','<circle cx="12" cy="12" r="5"/><circle cx="33" cy="9" r="3"/><circle cx="25" cy="25" r="7"/><circle cx="8" cy="33" r="3"/><circle cx="39" cy="35" r="5"/><circle cx="24" cy="42" r="2"/>']
};
for(const [i,[id]] of defs.slice(12).entries())identities[id]=[['#ff7835','#9bd4ce','#b6d85c','#eeeece','#ff4e35','#76a5ff','#e8b1ff','#5ee4db','#ffcf60'][i%9],'<circle cx="24" cy="24" r="17"/>'];
for(const [index,[id,name,knobs]]of defs.entries()){
 state[id]={on:false};
 const el=document.createElement('div');el.className='effect'+(state[id].on?' active':'');el.style.setProperty('--effect-color',identities[id][0]);
 el.innerHTML=`<label class="title" for="${id}"><span class="effect-copy"><span class="effect-number">${String(index+1).padStart(2,'0')}</span><span class="effect-name">${name}</span></span><span class="effect-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="currentColor">${identities[id][1]}</svg></span><input id="${id}" type="checkbox" aria-controls="${id}-controls" ${state[id].on?'checked':''}></label><div class="knobs" id="${id}-controls" ${state[id].on?'':'inert'}><div class="knobs-inner">${knobs.map(([k,label,val,min,max])=>{state[id][k]=val;return `<div class="knob"><label for="${id}-${k}">${label}<output id="${id}-${k}-val">${val}</output></label><input id="${id}-${k}" type="range" min="${min}" max="${max}" value="${val}"></div>`}).join('')}</div></div>`;
 $('#effects').append(el);
 el.querySelector('input[type=checkbox]').onchange=e=>{state[id].on=e.target.checked;el.classList.toggle('active',e.target.checked);el.querySelector('.knobs').inert=!e.target.checked;render()};
 for(const[k]of knobs)el.querySelector('#'+id+'-'+k).oninput=e=>{state[id][k]=+e.target.value;$('#'+id+'-'+k+'-val').value=e.target.value;render()}
}

function updateThumb(){zoomLevel=null;updateZoom();const el=$('#sourceThumb');if(el){const c=document.createElement('canvas');c.width=120;c.height=120;const t=c.getContext('2d'),r=Math.min(120/source.width,120/source.height);t.drawImage(source,(120-source.width*r)/2,(120-source.height*r)/2,source.width*r,source.height*r);el.src=c.toDataURL('image/png')}}
async function sample(){
 const button=$('#sample');if(button.disabled)return;button.disabled=true;button.setAttribute('aria-busy','true');
 const next=lastSample<0?Math.floor(Math.random()*8):(lastSample+1+Math.floor(Math.random()*7))%8;
 try{const response=await fetch('samples/sample-'+String(next+1).padStart(2,'0')+'.jpg');if(!response.ok)throw new Error('Image unavailable');const blob=await response.blob();await upload(new File([blob],'Sample '+String(next+1).padStart(2,'0')+'.jpg',{type:'image/jpeg'}));lastSample=next}
 catch{$('#status').textContent='Could not load a sample. Please try again.'}
 finally{button.disabled=false;button.removeAttribute('aria-busy')}
}

function rgb(v){return [1,3,5].map(i=>parseInt(v.slice(i,i+2),16))}function noise(i){const x=Math.sin(i*127.1+19.7)*43758.5453;return x-Math.floor(x)}
function render(){cancelAnimationFrame(job);job=requestAnimationFrame(process)}
function process(){const w=source.width,h=source.height;canvas.width=w;canvas.height=h;updateZoom();ctx.drawImage(source,0,0);$('#dimensions').textContent=w+' × '+h+' PX';if(original){$('#status').textContent='Original artwork';return}const enabled=defs.filter(([id])=>state[id].on);if(!enabled.length){$('#status').textContent='Original · enable an effect to begin';return}$('#status').textContent=enabled.map(x=>x[1]).join(' + ');let img=sc.getImageData(0,0,w,h),lum=new Float32Array(w*h),alpha=new Uint8Array(w*h);const activeStates=defs.filter(([id])=>state[id].on).map(([id])=>state[id]);const exposure=activeStates.reduce((v,st)=>v+st.toneExposure,0),contrast=activeStates.reduce((v,st)=>v*(1+st.contrastTune/100),1);for(let j=0;j<img.data.length;j+=4)for(let k=0;k<3;k++)img.data[j+k]=(img.data[j+k]-128)*contrast+128+exposure*2;for(let i=0;i<lum.length;i++){lum[i]=(.2126*img.data[i*4]+.7152*img.data[i*4+1]+.0722*img.data[i*4+2])/255;alpha[i]=img.data[i*4+3]}
if(state.sort.on){const len=state.sort.length,t=state.sort.threshold/255;for(let y=0;y<h;y++)for(let x=0;x<w;){if(lum[y*w+x]<t){x++;continue}let end=x;while(end<w&&end-x<len&&lum[y*w+end]>=t)end++;const sorted=lum.slice(y*w+x,y*w+end).sort();lum.set(sorted,y*w+x);x=end}}
if(state.bleed.on){const r=state.bleed.spread,old=lum;lum=new Float32Array(old.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=1;for(let d=-r;d<=r;d++){v=Math.min(v,old[y*w+Math.max(0,Math.min(w-1,x+d))],old[Math.max(0,Math.min(h-1,y+d))*w+x])}lum[y*w+x]=v<.54? (noise(y*w+x)<state.bleed.wear/500?1:0):1}}
if(state.pixel.on){const z=state.pixel.size;for(let y=0;y<h;y+=z)for(let x=0;x<w;x+=z){let sum=0,count=0;for(let yy=y;yy<Math.min(y+z,h);yy++)for(let xx=x;xx<Math.min(x+z,w);xx++){sum+=lum[yy*w+xx];count++}for(let yy=y;yy<Math.min(y+z,h);yy++)for(let xx=x;xx<Math.min(x+z,w);xx++)lum[yy*w+xx]=sum/count}}
if(state.poster.on){const n=state.poster.levels-1;for(let i=0;i<lum.length;i++)lum[i]=Math.round(lum[i]*n)/n}
if(state.edge.on){const old=lum;lum=new Float32Array(old.length);lum.fill(1);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x;const gx=-old[i-w-1]+old[i-w+1]-2*old[i-1]+2*old[i+1]-old[i+w-1]+old[i+w+1],gy=-old[i-w-1]-2*old[i-w]-old[i-w+1]+old[i+w-1]+2*old[i+w]+old[i+w+1];lum[i]=1-Math.min(1,Math.hypot(gx,gy)*state.edge.strength/35)}}
const ink=rgb($('#ink').value),paper=rgb($('#paper').value),transparent=$('#transparent').checked;ctx.clearRect(0,0,w,h);if(!transparent){ctx.fillStyle=$('#paper').value;ctx.fillRect(0,0,w,h)}
const output=ctx.createImageData(w,h),bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let coverage=1-lum[i];if(state.dither.on){const z=state.dither.scale;coverage=coverage>(bayer[(Math.floor(y/z)%4)*4+Math.floor(x/z)%4]+.5)/16?1:0}if(state.riso.on)coverage=Math.max(0,coverage-noise(i)*state.riso.grain/100);for(let k=0;k<3;k++)output.data[4*i+k]=transparent?ink[k]:paper[k]+(ink[k]-paper[k])*coverage;output.data[4*i+3]=transparent?alpha[i]*coverage:alpha[i]}
ctx.putImageData(output,0,0);if(!defs.slice(0,12).some(([id])=>state[id].on))ctx.putImageData(img,0,0);
if(state.half.on||state.ascii.on){ctx.clearRect(0,0,w,h);if(!transparent){ctx.fillStyle=$('#paper').value;ctx.fillRect(0,0,w,h)}const ascii=state.ascii.on,s=ascii?state.ascii.cell:state.half.dot;ctx.fillStyle=$('#ink').value;ctx.font=s+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';const chars=' .:-=+*#%@';for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){const i=Math.min(h-1,y+Math.floor(s/2))*w+Math.min(w-1,x+Math.floor(s/2));let v=1-lum[i];if(state.dither.on)v=Math.round(v*4)/4;if(state.riso.on)v=Math.max(0,v-noise(i)*state.riso.grain/100);ctx.globalAlpha=alpha[i]/255;if(ascii){ctx.fillText(chars[Math.round(v*9)],x+s/2,y+s/2)}else{ctx.beginPath();ctx.arc(x+s/2,y+s/2,s*.5*Math.sqrt(v),0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1}
if(state.hatch.on){const a=ctx.getImageData(0,0,w,h),s=state.hatch.spacing,t=state.hatch.weight;for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=y*w+x,v=1-lum[i];const mark=(v>.15&&(x+y)%s<t)||(v>.45&&((x-y)%s+s)%s<t)||(v>.75&&y%s<t);for(let k=0;k<3;k++)a.data[4*i+k]=mark?ink[k]:paper[k];a.data[4*i+3]=transparent?(mark?alpha[i]:0):alpha[i]}ctx.putImageData(a,0,0)}
if(state.vhs.on){const a=ctx.getImageData(0,0,w,h),b=ctx.createImageData(w,h);for(let y=0;y<h;y++){const shift=Math.round(Math.sin(y*.035)*state.vhs.warp+(noise(Math.floor(y/18))-.5)*state.vhs.warp*2);for(let x=0;x<w;x++){const i=(y*w+x)*4,j=(y*w+Math.max(0,Math.min(w-1,x+shift)))*4,dim=y%3===0?1-state.vhs.lines/100:1;for(let k=0;k<3;k++)b.data[i+k]=a.data[j+k]*dim;b.data[i+3]=a.data[j+3]}}ctx.putImageData(b,0,0)}
if(state.film.on){const a=ctx.getImageData(0,0,w,h);for(let i=0;i<w*h;i++){const n=(noise(i)-.5)*state.film.amount*2;for(let k=0;k<3;k++)a.data[i*4+k]+=n}ctx.putImageData(a,0,0)}
if(state.riso.on&&state.riso.offset){const copy=document.createElement('canvas');copy.width=w;copy.height=h;const c=copy.getContext('2d');c.drawImage(canvas,0,0);ctx.globalAlpha=.25;ctx.globalCompositeOperation=transparent?'source-over':'screen';ctx.drawImage(copy,state.riso.offset,-state.riso.offset);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
applyExtraEffects(w,h);
}
function applyExtraEffects(w,h){
 const clamp=v=>Math.max(0,Math.min(255,v));
 for(const [id] of defs.slice(12)){
 if(!state[id].on)continue;
 const a=ctx.getImageData(0,0,w,h),d=a.data,old=new Uint8ClampedArray(d),st=state[id];
 const pal=id==='gameboy'?[[20,43,36],[65,91,58],[137,166,77],[212,228,157]]:id==='thermal'?[[18,8,38],[100,8,83],[239,30,18],[255,146,20],[255,246,169]]:null;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const i=y*w+x,j=i*4;let r=old[j],g=old[j+1],b=old[j+2],l=(r*.2126+g*.7152+b*.0722)/255,n=noise(i)-.5;
 if(id==='spray'){let v=clamp((l-.5)*(1+st.contrast/20)*255+128+n*st.speckle*4)/255;[r,g,b]=v<.3?[16,10,9]:v<.7?[248,54,12]:[255,240,198]}
 if(id==='faded'){const f=st.fade/100; r=r*(1-f*.6)+55*f+n*st.grain;g=g*(1-f*.5)+62*f+n*st.grain;b=b*(1-f*.65)+66*f+n*st.grain}
 if(id==='gameboy'){const z=st.size,k=(Math.floor(y/z)*z*w+Math.floor(x/z)*z)*4;const v=(old[k]*.2126+old[k+1]*.7152+old[k+2]*.0722)/255;const ordered=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5][(Math.floor(y/z)%4)*4+Math.floor(x/z)%4]/16-.5;[r,g,b]=pal[Math.max(0,Math.min(3,Math.round(v*3+ordered*st.dither/60)))]}
 if(id==='receipt'){const white=l*255+n*70>st.threshold||noise(i+91)<st.wear/400||((y%91<2)&&noise(y)>.6);r=g=b=white?246:20}
 if(id==='thermal'){const v=Math.max(0,Math.min(.999,l+(st.heat-20)/150)),k=v*4,t=k-Math.floor(k),c=pal[Math.floor(k)],e=pal[Math.min(4,Math.floor(k)+1)];[r,g,b]=c.map((v,k)=>v+(e[k]-v)*t)}
 if(id==='cyano'){const v=Math.max(0,Math.min(1,(l-.5)*(1.4)+(st.exposure/100)+n*st.grain/255));r=15+v*213;g=39+v*195;b=102+v*142}
 if(id==='glass'){const z=st.width,offset=Math.round(Math.sin((x%z)/z*Math.PI*2)*st.bend),xx=Math.max(0,Math.min(w-1,x+offset)),k=(y*w+xx)*4;r=old[k];g=old[k+1];b=old[k+2];d[j+3]=old[k+3];if(x%z<2){r+=22;g+=22;b+=22}}
 if(id==='signal'){const v=Math.sin((x+Math.sin(y*.05)*st.warp+l*st.warp)*Math.PI*2/st.waves)>(l*1.7-.8);r=g=b=v?240:9}
 if(id==='streak'){let sums=[r,g,b],weights=1;for(let t=1;t<=12;t++){const xx=Math.max(0,x-Math.round(t*st.length/12)),k=(y*w+xx)*4;const bright=Math.max(old[k],old[k+1],old[k+2])/255,weight=bright*bright*(1-t/14)*st.mix/70;for(let c=0;c<3;c++)sums[c]+=old[k+c]*weight;weights+=weight}[r,g,b]=sums.map(v=>v/weights)}
 if(id==='rgbh'){const c=Math.floor(x/st.spacing)%3,v=1-st.depth/100;r*=c===0?1:v;g*=c===1?1:v;b*=c===2?1:v}
 if(id==='weave'){const z=st.size,k=(Math.floor(y/z)*z*w+Math.floor(x/z)*z)*4,f=1-(((x%z===0)||(y%z===0))?st.texture/100:0);r=old[k]*f;g=old[k+1]*f;b=old[k+2]*f}
 if(id==='grunge'){const v=l*255+n*st.grit*2>st.threshold;r=v?252:40;g=v?229:5;b=v?249:48}
 if(id==='stamp'){const dark=l*255+n*55<st.pressure&&noise(i+713)>st.wear/160;r=dark?45:245;g=dark?39:241;b=dark?33:230}
 if(id==='emboss'){const xx=Math.max(0,x-st.depth),yy=Math.max(0,y-st.depth),k=(yy*w+xx)*4,prev=(old[k]+old[k+1]+old[k+2])/765,v=128+(l-prev)*600+n*st.grain;r=v*1.03;g=v;b=v*.9}
 if(id==='stipple'){const z=st.size,k=Math.floor(y/z)*w+Math.floor(x/z),v=noise(k)<Math.pow(1-l,1.6-st.density/100);r=g=b=v?20:246}
 if(id==='matrix'){const z=st.spacing,xx=Math.min(w-1,Math.floor(x/z)*z+Math.floor(z/2)),yy=Math.min(h-1,Math.floor(y/z)*z+Math.floor(z/2)),k=(yy*w+xx)*4,v=1-(old[k]+old[k+1]+old[k+2])/765,rad=z*.5*Math.sqrt(v)*st.weight/100,dark=Math.hypot(x%z-z/2,y%z-z/2)<rad;r=g=b=dark?18:246}
 if(id==='gold'){const v=st.warmth/100;r=r*.96+v*28+n*st.grain;g=g*.96+v*13+n*st.grain;b=b*(1-v*.25)+n*st.grain}
 if(id==='shutter'){const a=st.angle*Math.PI/180,dx=Math.cos(a)*st.distance,dy=Math.sin(a)*st.distance;let sum=[r,g,b],weight=1;for(let t=1;t<=10;t++){const xx=Math.max(0,Math.min(w-1,Math.round(x-dx*t/10))),yy=Math.max(0,Math.min(h-1,Math.round(y-dy*t/10))),k=(yy*w+xx)*4,f=st.blend/100*(1-t/12);for(let c=0;c<3;c++)sum[c]+=old[k+c]*f;weight+=f}[r,g,b]=sum.map(v=>v/weight)}
 d[j]=clamp(r);d[j+1]=clamp(g);d[j+2]=clamp(b);
 }
 ctx.putImageData(a,0,0);
 }
}
async function upload(file){if(!file)return;if(!file.type.startsWith('image/')){$('#status').textContent='Choose an image file.';return}try{const image=await createImageBitmap(file);const scale=Math.min(1,1800/Math.max(image.width,image.height));source.width=Math.max(1,Math.round(image.width*scale));source.height=Math.max(1,Math.round(image.height*scale));sc.drawImage(image,0,0,source.width,source.height);image.close();$('#sourceName').textContent=file.name;updateThumb();original=false;$('#compare').textContent='Show original';$('#compare').setAttribute('aria-pressed','false');render()}catch{$('#status').textContent='Could not open this image. Try PNG, JPG or WebP.'}}
$('#upload').onclick=()=>$('#file').click();$('#file').onchange=e=>{upload(e.target.files[0]);e.target.value=''};for(const id of ['ink','paper','transparent'])$('#'+id).oninput=render;$('#compare').onclick=()=>{original=!original;$('#compare').textContent=original?'Show effects':'Show original';$('#compare').setAttribute('aria-pressed',String(original));render()};$('#reset').onclick=()=>{for(const[id,,ks]of defs){state[id].on=false;$('#'+id).checked=state[id].on;$('#'+id).closest('.effect').classList.toggle('active',state[id].on);$('#'+id+'-controls').inert=!state[id].on;for(const[k,,v]of ks){state[id][k]=v;$('#'+id+'-'+k).value=v;$('#'+id+'-'+k+'-val').value=v}}$('#ink').value='#f5f5f7';$('#paper').value='#111111';$('#transparent').checked=false;original=false;$('#compare').textContent='Show original';$('#compare').setAttribute('aria-pressed','false');render()};$('#export').onclick=()=>{process();canvas.toBlob(blob=>{if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='inklab-artwork.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)},'image/png')};const dz=$('#dropzone');dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');upload(e.dataTransfer.files[0])};;sample();

// A short typographic opening, using the studio's own effect identities.
function showIntro(){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const intro=document.createElement('section');intro.className='intro';intro.setAttribute('aria-label','Welcome to INKLAB');
 const names=defs.slice(0,12).map(([id,name],i)=>`<span class="intro-word" style="--i:${i}">${name}</span>${[0,2,3,5,7,9,11].includes(i)?`<span class="intro-symbol" aria-hidden="true" style="--symbol-color:${identities[id][0]};--i:${i}"><svg viewBox="0 0 48 48" fill="currentColor">${identities[id][1]}</svg></span>`:''}`).join(' ');
 intro.innerHTML=`<div class="intro-top"><span class="brand">INKLAB<span>®</span></span><button type="button" class="intro-skip">Enter studio ↗</button></div><div class="intro-type">${names}</div><div class="intro-bottom"><span>YOUR IMAGE. EVERY POSSIBILITY.</span><span>12 EFFECTS / ONE STUDIO</span></div>`;
 const surfaces=[document.querySelector('header'),document.querySelector('main')];const previousFocus=document.activeElement;
 surfaces.forEach(el=>el.inert=true);document.body.append(intro);const skip=intro.querySelector('button');skip.focus({preventScroll:true});
 let closing=false,timer;function dismiss(){if(closing)return;closing=true;clearTimeout(timer);intro.classList.add('leaving');setTimeout(()=>{intro.remove();surfaces.forEach(el=>el.inert=false);if(previousFocus&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});else document.querySelector('#upload').focus({preventScroll:true})},700)}
 skip.onclick=dismiss;intro.addEventListener('click',dismiss);intro.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dismiss()}});timer=setTimeout(dismiss,3400);
}
showIntro();

// Row-based effect browser: the control drawer participates in normal layout.
(function glassBrowser(){
 const list=$('#effects'),cards=[...list.children],rows=[],panels=[],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const palettes=[['#ff3b0d','#ffb335','#16031b'],['#d4fa08','#8350ff','#213806'],['#27dc76','#b4ffb5','#021b10'],['#ff81d4','#b340ff','#200626'],['#60e6f0','#fb70df','#00262b'],['#4567ff','#84eaff','#08063e'],['#ffa520','#fff5a1','#6b230b'],['#ff606c','#b180ff','#2c093e'],['#53d7c2','#bfff94','#002c25'],['#b6a0ff','#f7b2ff','#170747'],['#4477ff','#d466ff','#000e43'],['#ffc2df','#fff08f','#541d36']];
 let selected=null;const visited=new Set();
 function height(panel){panel.style.height=panel.firstElementChild.getBoundingClientRect().height+'px'}
 function open(index){const id=defs[index][0],card=cards[index],panel=panels[Math.floor(index/3)];
  for(const p of panels){if(p!==panel){p.style.height='0px';p.inert=true;p.setAttribute('aria-hidden','true')}}
  cards.forEach(c=>{c.classList.remove('selected');c.querySelector('.tile-button').setAttribute('aria-expanded','false')});
  if(selected===id){panel.style.height='0px';panel.inert=true;panel.setAttribute('aria-hidden','true');selected=null;return}
  selected=id;card.classList.add('selected');card.querySelector('.tile-button').setAttribute('aria-expanded','true');
  panel.querySelectorAll('.drawer-content').forEach(c=>{c.hidden=c.dataset.id!==id});panel.style.setProperty('--drawer-color',palettes[index%palettes.length][2]);panel.style.setProperty('--glow',palettes[index%palettes.length][0]);panel.inert=false;panel.setAttribute('aria-hidden','false');height(panel);
 }
 cards.forEach((card,i)=>{
  const [id,name]=defs[i];if(i%3===0){const row=document.createElement('div');row.className='effect-row';const tiles=document.createElement('div');tiles.className='tile-pair pair-'+(i%4===0?'wide-left':'wide-right');const panel=document.createElement('div');panel.className='effect-drawer';panel.id='drawer-'+i/3;panel.inert=true;panel.setAttribute('aria-hidden','true');panel.innerHTML='<div class="drawer-body"></div>';row.append(tiles,panel);list.append(row);rows.push(tiles);panels.push(panel)}
  const pair=rows.at(-1),panel=panels.at(-1);pair.append(card);card.dataset.effect=id;palettes[i%palettes.length].forEach((v,n)=>card.style.setProperty('--g'+n,v));
  const checkbox=card.querySelector('input[type=checkbox]'),knobs=card.querySelector('.knobs');const oldLabel=card.querySelector('.title');const button=document.createElement('button');button.type='button';button.className='tile-button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);button.innerHTML='<span class="tile-motif" aria-hidden="true"></span><span class="tile-name">'+name+'</span><span class="tile-applied" aria-hidden="true">Applied</span>' ;oldLabel.replaceWith(button);card.append(checkbox);checkbox.hidden=true;
  const content=document.createElement('div');content.className='drawer-content';content.dataset.id=id;content.hidden=true;const head=document.createElement('div');head.className='drawer-heading';head.innerHTML='<span>'+name+'</span>';const toggle=document.createElement('button');toggle.type='button';toggle.className='apply-toggle';function sync(){toggle.textContent=state[id].on?'Applied · turn off':'Apply effect';toggle.setAttribute('aria-pressed',String(state[id].on));card.classList.toggle('active',state[id].on);checkbox.checked=state[id].on}toggle.onclick=()=>{visited.add(id);state[id].on=!state[id].on;sync();render()};head.append(toggle);content.append(head,knobs);knobs.inert=false;panel.firstElementChild.append(content);
  button.onclick=()=>{if(selected!==id){visited.add(id);state[id].on=true;sync();render()}open(i)};sync();
 });
 // Stable hit regions avoid hover feedback while visual neighbours move.
 rows.forEach((pair,rowIndex)=>{
  let bounds=null,hover=-1;
  function clear(){hover=-1;pair.querySelectorAll('.effect').forEach(c=>{c.style.removeProperty('--shift-x');c.style.removeProperty('--tile-scale')});list.querySelectorAll('.effect-row').forEach(r=>r.style.removeProperty('--shift-y'))}
  pair.addEventListener('pointerenter',e=>{if(e.pointerType==='touch'||reduce)return;bounds=[...pair.children].map(c=>{const r=c.getBoundingClientRect();return {left:r.left,right:r.right}})});
  pair.addEventListener('pointermove',e=>{if(!bounds||reduce||e.pointerType==='touch')return;const next=bounds.findIndex(r=>e.clientX>=r.left&&e.clientX<=r.right);if(next===hover)return;clear();hover=next;if(next<0)return;[...pair.children].forEach((c,k)=>{c.style.setProperty('--tile-scale',k===next?'1.035':'1');c.style.setProperty('--shift-x',k<next?'-3px':k>next?'3px':'0px')});[...list.children].forEach((r,k)=>r.style.setProperty('--shift-y',k<rowIndex?'-2px':k>rowIndex?'2px':'0px'))});
  pair.addEventListener('pointerleave',()=>{bounds=null;clear()});
 });
 const oldReset=$('#reset').onclick;$('#reset').onclick=()=>{oldReset();selected=null;visited.clear();cards.forEach((card,i)=>{card.classList.remove('selected');card.querySelector('button').setAttribute('aria-expanded','false');const id=defs[i][0],content=document.querySelector('.drawer-content[data-id="'+id+'"]');content.querySelector('.knobs').inert=false;content.querySelector('.apply-toggle').textContent=state[id].on?'Applied · turn off':'Apply effect';content.querySelector('.apply-toggle').setAttribute('aria-pressed',String(state[id].on))});panels.forEach(p=>{p.style.height='0px';p.inert=true;p.setAttribute('aria-hidden','true')})};
 const ro=new ResizeObserver(()=>{if(selected){const index=defs.findIndex(d=>d[0]===selected);height(panels[Math.floor(index/3)])}});rows.forEach(r=>ro.observe(r));
})();

function updateZoom(){
 const area=$('#dropzone');if(!area||!source.width)return;
 const fit=Math.min((area.clientWidth-32)/source.width,(area.clientHeight-32)/source.height);const scale=zoomLevel===null?Math.max(.01,fit):zoomLevel/100;
 canvas.style.width=Math.round(source.width*scale)+'px';canvas.style.height=Math.round(source.height*scale)+'px';
 const out=$('#zoomReadout');if(out)out.textContent=zoomLevel===null?'Fit · '+Math.round(scale*100)+'%':Math.round(scale*100)+'%';
 const sel=$('#zoomSelect');if(sel){const v=zoomLevel===null?'fit':String(zoomLevel);sel.value=[...sel.options].some(o=>o.value===v)?v:'custom'}
}
(function setupZoom(){
 const area=$('#dropzone'),stage=document.createElement('div');stage.className='zoom-stage';area.append(stage);stage.append(canvas);
 function setZoom(value){zoomLevel=value;updateZoom();requestAnimationFrame(()=>{area.scrollLeft=(area.scrollWidth-area.clientWidth)/2;area.scrollTop=(area.scrollHeight-area.clientHeight)/2})}
 function change(delta){const current=zoomLevel===null?Math.round(Math.min((area.clientWidth-32)/source.width,(area.clientHeight-32)/source.height)*100):zoomLevel;setZoom(Math.max(10,Math.min(400,Math.round(current/25)*25+delta)))}
 $('#zoomIn').onclick=()=>change(25);$('#zoomOut').onclick=()=>change(-25);$('#zoomFit').onclick=()=>setZoom(null);$('#zoomSelect').onchange=e=>{if(e.target.value!=='custom')setZoom(e.target.value==='fit'?null:Number(e.target.value))};
 const ro=new ResizeObserver(updateZoom);ro.observe(area);updateZoom();
})();

(function refinePreview(){
 const area=$('#dropzone'),header=document.querySelector('header');let drag=null;
 function syncLayout(){
  if(innerWidth>760){header.style.left=area.getBoundingClientRect().left+'px';header.style.paddingLeft='0px'}else{header.style.removeProperty('left');header.style.removeProperty('padding-left')}
  area.classList.toggle('pannable',area.scrollWidth>area.clientWidth+1||area.scrollHeight>area.clientHeight+1);
 }
 const ro=new ResizeObserver(syncLayout);ro.observe(area);ro.observe(canvas);window.addEventListener('resize',syncLayout);syncLayout();
 area.addEventListener('pointerdown',e=>{
  if(e.button!==0||!area.classList.contains('pannable'))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:area.scrollLeft,top:area.scrollTop};area.setPointerCapture(e.pointerId);area.classList.add('panning');e.preventDefault();
 });
 area.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;area.scrollLeft=drag.left-(e.clientX-drag.x);area.scrollTop=drag.top-(e.clientY-drag.y);e.preventDefault()});
 function end(e){if(!drag||drag.id!==e.pointerId)return;drag=null;area.classList.remove('panning');if(area.hasPointerCapture(e.pointerId))area.releasePointerCapture(e.pointerId)}
 area.addEventListener('pointerup',end);area.addEventListener('pointercancel',end);area.addEventListener('lostpointercapture',()=>{drag=null;area.classList.remove('panning')});
})();

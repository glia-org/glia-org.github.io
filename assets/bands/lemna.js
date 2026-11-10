/* glia-org.github.io, Lemna's band: the demo of Lemna's page (lemna, commit 2a325d6, site/assets/site.js, last changed
   in ea059ad), ported with its ids and classes prefixed lm-: an app window, then the use case as a loop: ⌃⌥Space, the
   dim and the box fade in, Code builds in on the dim, three paragraphs type themselves on the gliding line, the middle
   scrubbed like a tape, ⌘⏎, the box fades while MO1's ring leaves its outline and the wash lifts, the text lands in the
   app. The reader can click into the box and write instead. Every duration, curve and magnitude is the app's, as on
   Lemna's page. Left out: the sound (the clicks, the Lab bed and their switches; nothing here plays a sound) and the
   Ambience tiles. The loop runs only while the demo is in view: it stops when the demo leaves the view and starts
   again when it comes back. Under reduced motion this file does nothing and the band shows its stills. Fetched by
   bands/load.js as the band comes near; nothing is left on window. */
(function(){
'use strict';
var band=document.getElementById('lemna');if(!band||band.dataset.run)return;band.dataset.run='1';
function $(id){return document.getElementById('lm-'+id)}
var fit=$('fit'),stage=$('stage'),box=$('box'),dim=$('dim'),ringEl=$('ring'),hint=$('hint'),inp=$('ll-in'),pasted=$('pasted');
if(!fit||!stage||!box)return;
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,darkQ=matchMedia('(prefers-color-scheme: dark)');
if(reduced||!('IntersectionObserver' in window))return;
var Q='cubic-bezier(0.23, 1, 0.32, 1)',SW=1100,SH=620,rnd=Math.random;
/* Effects.Tuning: the open and the close (Still's P1, fades), the glide, the glyph and paragraph fades; the paste about
   130 ms after ⌘⏎'s key-down, Return's key-up before it; MO1's ring */
var T={open:300,close:200,glide:140,paste:130,keyUp:100,ringLife:1.2,ringSpeed:60,ringOnset:.18};
/* Theme.still's ink (A1's C1): one colour for heads and trails, laid over at 0.6 by day, added at 0.5 by night; MO1's
   ring peak by day and by night */
var STILL={day:{ink:'#3f4a3c',add:false,inkA:.6,ringPeak:.18},night:{ink:'#c9d3c4',add:true,inkA:.5,ringPeak:.08}};
function palette(){return darkQ.matches?STILL.night:STILL.day}
var SERIF='"Lemna Literata", Charter, "Iowan Old Style", Georgia, serif';
var MONO='Menlo, ui-monospace, "SF Mono", SFMono-Regular, Consolas, "DejaVu Sans Mono", monospace';
var KANAF='"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Noto Sans CJK JP", Meiryo, sans-serif';
function lerp(a,b,t){return a+(b-a)*t}
function mix(r,u){return r[0]+(r[1]-r[0])*u}
function logu(a,b){return a*Math.pow(b/a,rnd())}
function smooth(u){u=Math.min(Math.max(u,0),1);return u*u*(3-2*u)}
/* easeOutQuint, cubic-bezier(0.23, 1, 0.32, 1): Glide.swift's Curve */
function ease(u){
  if(u<=0)return 0;if(u>=1)return 1;
  var x1=.23,y1=1,x2=.32,y2=1,cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by,t=u,i;
  function x(t){return((ax*t+bx)*t+cx)*t}function y(t){return((ay*t+by)*t+cy)*t}
  for(i=0;i<8;i++){var e=x(t)-u,s=(3*ax*t+2*bx)*t+cx;if(Math.abs(e)<1e-9)return y(t);if(Math.abs(s)<1e-6)break;t-=e/s}
  var lo=0,hi=1;t=u;for(i=0;i<60;i++){var v=x(t);if(Math.abs(v-u)<1e-9)break;if(v<u)lo=t;else hi=t;t=(lo+hi)/2}
  return y(t);
}
function anim(el,frames,o){return el.animate?el.animate(frames,o):null}
function cancel(el){if(el.getAnimations)el.getAnimations().forEach(function(a){a.cancel()})}

/* ---------- fit each 1100 × 620 stage into its place; each scene's canvas at the pixels it shows ---------- */
var fits=Array.prototype.slice.call(band.querySelectorAll('.lm-fit')),scenes=[];
function scale(){
  fits.forEach(function(f){var st=f.querySelector('.lm-stage'),s=Math.min(1,f.clientWidth/SW);f.fitScale=s;st.style.transform=s<1?'scale('+s+')':''});
  scenes.forEach(function(sc){sc.resize()});
}
function pixels(cv){var f=cv.closest('.lm-fit');return (f&&f.fitScale||1)*Math.min(window.devicePixelRatio||1,2)}

/* where a key is on a MacBook's main block (Keyboard.swift, ANSI): its row (0 the number row, 4 the space bar's) and
   the middle of its column in key units (0 to 15) */
var KEYPOS=(function(){var t={};
  function row(r,keys,first){keys.split('').forEach(function(c,i){t[c]={row:r,column:first+i,width:1}})}
  row(0,'1234567890',1.5);row(1,'qwertyuiop',2);row(2,'asdfghjkl',2.25);row(3,'zxcvbnm,.',2.75);
  t[' ']={row:4,column:6.75,width:5};return t})();
function keyAt(ch){return KEYPOS[ch.toLowerCase()]||null}
/* the box on the stage (BoxFrame.line: 60 % of a 1512 pt screen, 4 × Literata 30, its centre two thirds down), the
   caret's x in it */
var B={x:96,y:353,w:907,h:120},CARET=B.x+1+.6*(B.w-2),SPAN=[.1,.9];
function screenX(k){return k?SW*mix(SPAN,k.column/15):null}

/* ---------- Ambience ▸ Code (A1; pass 27 the dense curtain, pass 27b its build-in and lift), Scenes.swift's
   Code: glyphs of K1's set and 46 half-width katakana, mirrored, fixed in a grid of square cells half the atlas cell
   high (Menlo at the line's 30, 19.5 px), at 0.6 of the line's size; a nearer sheet over it 1.6 times larger, sampled
   1.5 mipmap levels softer (here an atlas drawn at 2^-1.5 of its pixels, scaled up) and 1.6 times brighter. Heads step
   down the columns a cell at a time, each column at its own 8–16 rows a second, about 0.8 heads a column for each
   1,000 px of height at rest and 1.6 typing, some starting lower down; each cell a head enters lit in the ink and
   dimming in place over its trail of 30–150 cells (40–200 typing), at its stream's gain and its own brightness, the
   two right behind the head at 0.7 and 0.49 of it; a halo under each head where light adds (Still by night). One
   intensity, 0 at rest, 1 at 6 keys a second, up with τ 0.15 s, down with τ 1.5 s from 0.8 s after the last key,
   sets heads, trails, brightness and glyph changes, never speed; each glyph key starts a head where it is on the
   keyboard, the typed glyph at it as typed. Born 20 s stepped ahead at each show, veiled, and built in over 4 s on a
   smoothstep while new heads fall in at once. 30 Hz at rest, 60 typing; at most `cap` glyphs a frame, the dimmest
   going first. */
var KANA=[0xFF66];for(var u=0xFF71;u<=0xFF9D;u++)KANA.push(u);
var CODESET='012345789Zz:."=*+-<>|_'.split('').concat(KANA.map(function(u){return String.fromCharCode(u)})),NSET=CODESET.length;
var LINE=30,CELLW=LINE*.602+4,CELLH=LINE*1.164+4;  // Menlo's advance and its ascent + descent at the line's size, 2 px pad round each
var C={speed:[8,16],active:[.8,1.6],height:1000,most:3,gap:[8,5],wait:[.5,1.5],high:.3,highRows:[.05,.6],
  trail:[[30,150],[40,200]],head:[.8,1],neck:.7,top:[.5,.9],gain:[.3,2],level:[.3,1],skew:1.5,halo:[.22,.4],haloW:.8,
  change:[.5,3],near:1.6,nearActive:[.06,.15],nearBright:1.6,nearBlur:1.5,keyHead:1,keyHalo:.7,keyTop:1,keyTrail:[20,60],
  fast:6,rise:.15,settle:1.5,hold:.8,ahead:20,idleRate:30,calm:.05,shown:.02,buildIn:4,keyRows:[.55,.95]};
function level(){return mix(C.level,Math.pow(rnd(),C.skew))}
function Sheet(depth,blur,bright,active){
  var p=CELLH*.5*depth,cols=Math.max(1,Math.floor(SW/p)),rows=Math.max(1,Math.ceil(SH/p)),n=cols*rows,i,c;
  this.pitch=p;this.columns=cols;this.rows=rows;this.left=(SW-cols*p)/2;this.scale=.6*depth;this.blur=blur;this.bright=bright;
  this.active=active;
  this.xs=new Float32Array(cols);for(c=0;c<cols;c++)this.xs[c]=this.left+(c+.5)*p;
  this.ys=new Float32Array(rows);for(i=0;i<rows;i++)this.ys[i]=(i+.5)*p;
  this.glyph=new Uint8Array(n);this.level=new Float32Array(n);this.lit=new Float64Array(n);this.trail=new Float32Array(n);
  this.top=new Float32Array(n);this.gain=new Float32Array(n);this.under=new Uint8Array(n);this.veiled=new Uint8Array(n);
  for(i=0;i<n;i++){this.glyph[i]=rnd()*NSET|0;this.level[i]=level();this.lit[i]=-Infinity;this.trail[i]=1;this.gain[i]=1}
  this.speed=new Float32Array(cols);this.travel=new Float64Array(cols);this.moved=new Float32Array(cols);
  this.falling=new Int16Array(cols);this.due=new Float32Array(cols);this.wait=new Float32Array(cols);
  for(c=0;c<cols;c++){this.speed[c]=mix(C.speed,rnd());this.wait[c]=mix(C.wait,rnd());this.due[c]=this.wait[c]*rnd()}
  this.heads=[];this.veiling=true;
  this.most=Math.max(C.most,Math.round(C.most*rows*p/C.height));this.limit=(this.most+1)*cols;
}
Sheet.prototype.light=function(c,r,t,a,g,v){var x=c*this.rows+r;
  this.lit[x]=this.travel[c];this.trail[x]=t;this.top[x]=a;this.gain[x]=g;this.veiled[x]=v?1:0};
Sheet.prototype.advance=function(dt,I){
  var cols=this.columns,rows=this.rows,hs=this.heads,c,k,h,r;
  for(c=0;c<cols;c++){this.moved[c]=this.speed[c]*dt;this.travel[c]+=this.moved[c]}
  for(k=0;k<hs.length;){h=hs[k];var from=Math.floor(h.row);h.row+=this.moved[h.column];var to=Math.floor(h.row);
    if(to>from&&from+1<rows)for(r=from+1;r<=Math.min(to,rows-1);r++)this.light(h.column,r,h.trail,h.key?C.keyTop:0,h.gain,h.veiled);
    if(to>=rows){if(!h.key)this.falling[h.column]--;hs[k]=hs[hs.length-1];hs.pop();continue}  // its trail lingers
    k++}
  var lo=lerp(C.trail[0][0],C.trail[1][0],I),hi=lerp(C.trail[0][1],C.trail[1][1],I),gap=lerp(C.gap[0],C.gap[1],I);
  var act=lerp(this.active[0],this.active[1],I)*rows*this.pitch/C.height;
  var fall=rows*(1-C.high*(C.highRows[0]+C.highRows[1])/2);
  for(c=0;c<cols;c++){this.due[c]+=act*this.speed[c]/fall*dt;
    if(this.due[c]<this.wait[c]||this.falling[c]>=this.most||hs.length>=this.limit)continue;
    var row=rnd()<C.high?Math.floor(mix(C.highRows,rnd())*rows):0,clash=false;
    for(k=0;k<hs.length;k++){h=hs[k];if(h.column===c&&Math.abs(h.row-row)<gap){clash=true;break}}
    if(clash)continue;
    var t=logu(lo,hi),g=logu(C.gain[0],C.gain[1]);
    this.due[c]=0;this.wait[c]=mix(C.wait,rnd());this.falling[c]++;
    hs.push({column:c,row:row,trail:t,gain:g,glyph:null,key:false,veiled:this.veiling});
    this.light(c,row,t,0,g,this.veiling)}
};
function makeCode(cv,cap){
  var ctx=cv&&cv.getContext&&cv.getContext('2d');
  var none={show:function(){},close:function(){},still:function(){},see:function(){},key:function(){},pulse:function(){},lapse:function(){},resize:function(){},recolour:function(){}};
  if(!ctx)return none;
  var main=null,near=null,I=0,sinceKey=1e9,age=0,cut=C.shown,keys=[],now=0,raf=0,prev=0,on=false,seen=true,K=0,A=null;
  var lapse=1,lapseTo=1;  // scene seconds a second: above 1 while the loop's tape scrubs, eased toward lapseTo
  /* the atlases: every code glyph mirrored, in the ink, one cell each, for both sheets (the nearer one at 2^-blur of
     its pixels, so it comes out soft when scaled up); a halo, the shader's ring of radius 0 (a Gaussian, e^-2 one
     width out, nothing at two); the typed glyphs as typed, drawn when first typed */
  function atlas(sc,k){  // k: the atlas's pixels per stage px
    var fs=LINE*sc,w=Math.ceil(CELLW*sc*k),h=Math.ceil(CELLH*sc*k),a=document.createElement('canvas'),x=a.getContext('2d');
    a.width=16*w;a.height=Math.ceil(NSET/16)*h;x.fillStyle=palette().ink;x.textAlign='center';x.textBaseline='alphabetic';
    CODESET.forEach(function(g,i){var kana=g.charCodeAt(0)>=0xFF00;x.font=(kana?'600 ':'400 ')+(fs*k).toFixed(2)+'px '+(kana?KANAF:MONO);
      x.save();x.translate((i%16+.5)*w,((i>>4)+.5)*h);x.scale(-1,1);x.fillText(g,0,.346*fs*k);x.restore()});
    return {cv:a,w:w,h:h,cw:CELLW*sc,ch:CELLH*sc};
  }
  function halo(){
    var n=Math.max(16,Math.ceil(4*C.haloW*CELLH*.5*C.near*K)),a=document.createElement('canvas'),x=a.getContext('2d');a.width=a.height=n;
    var g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2),ink=palette().ink;
    [[0,1],[.125,.969],[.25,.882],[.375,.755],[.5,.607],[.625,.458],[.75,.325],[.875,.216],[1,.135],[1.25,.044],[1.5,.011],[2,0]].forEach(function(s){
      g.addColorStop(s[0]/2,hexA(ink,s[1]))});
    x.fillStyle=g;x.fillRect(0,0,n,n);return a;
  }
  function typed(ch){
    if(A.typed[ch])return A.typed[ch];
    var w=A.main.w,h=A.main.h,a=document.createElement('canvas'),x=a.getContext('2d');a.width=w;a.height=h;
    x.fillStyle=palette().ink;x.textAlign='center';x.font='400 '+(2*LINE).toFixed(2)+'px '+MONO;x.fillText(ch,w/2,h/2+.346*2*LINE);
    return A.typed[ch]=a;
  }
  /* the main sheet's atlas as the app's: drawn once at twice the line's size and scaled down to each glyph's with
     mipmapped smoothing (its strokes as soft as the app's sampled atlas); the nearer one at 2^-1.5 of its pixels */
  function build(){A={main:atlas(.6,2/.6),near:atlas(.6*C.near,K*Math.pow(2,-C.nearBlur)),halo:halo(),typed:{}}}
  function resize(){
    var k=pixels(cv);if(Math.abs(k-K)<.02*K&&A)return;
    K=k;cv.width=Math.round(SW*K);cv.height=Math.round(SH*K);build();if(main&&!raf)paint(0);
  }
  function advance(dt){
    now+=dt;while(keys.length&&now-keys[0]>=2)keys.shift();
    var target=Math.min(keys.length/2/C.fast,1);  // up at once, down only after a pause
    if(target>I)I+=(target-I)*(1-Math.exp(-dt/C.rise));else if(sinceKey>=C.hold)I+=(target-I)*(1-Math.exp(-dt/C.settle));
    sinceKey+=dt;main.advance(dt,I);near.advance(dt,I);
  }
  function birth(){
    main=new Sheet(1,0,1,C.active);near=new Sheet(C.near,C.nearBlur,C.nearBright,C.nearActive);
    I=0;sinceKey=1e9;age=0;cut=C.shown;keys=[];now=0;
    for(var k=0;k<C.ahead*C.idleRate;k++)advance(1/C.idleRate);  // 20 s ahead, undrawn and veiled
    main.veiling=near.veiling=false;
  }
  var shown=0,drawn=0;
  function sheet(sh,at,look,veil,p,glow,inkA){
    var rows=sh.rows,cols=sh.columns,b=sh.bright,cw=at.cw,ch=at.ch,hw=cw/2,hh=ch/2,hs=sh.heads,pass,k,h,r,x,v,a,X,Y,c;
    for(pass=0;pass<2;pass++)for(k=0;k<hs.length;k++){h=hs[k];if(h.key!==(pass===0))continue;  // a key's heads first
      r=Math.floor(h.row);x=h.column*rows+r;if(sh.under[x])continue;sh.under[x]=1;
      v=h.veiled?veil:1;if(v<=cut)continue;
      X=sh.xs[h.column];Y=sh.ys[r];shown++;if(drawn>=cap)continue;drawn++;
      if(glow){var hw2=2*C.haloW*sh.pitch;ctx.globalAlpha=Math.min((h.key?C.keyHalo:look.halo)*b*v,1)*inkA;ctx.drawImage(A.halo,X-hw2,Y-hw2,2*hw2,2*hw2)}
      ctx.globalAlpha=Math.min((h.key?C.keyHead:look.head)*b*v,1)*inkA;
      if(h.glyph)ctx.drawImage(typed(h.glyph),X-hw,Y-hh,cw,ch);
      else{var g=sh.glyph[x];ctx.drawImage(at.cv,(g&15)*at.w,(g>>4)*at.h,at.w,at.h,X-hw,Y-hh,cw,ch)}
    }
    var odds=Math.log(1-Math.min(Math.max(p,1e-9),.5)),skip=Math.floor(Math.log(1-rnd())/odds);
    for(c=0;c<cols;c++){var tr=sh.travel[c];X=sh.xs[c];
      for(r=0;r<rows;r++){x=c*rows+r;var age2=tr-sh.lit[x],t=sh.trail[x];if(!(age2<t))continue;
        if(skip>0)skip--;else{sh.glyph[x]=rnd()*NSET|0;sh.level[x]=level();skip=Math.floor(Math.log(1-rnd())/odds)}
        if(sh.under[x]){sh.under[x]=0;continue}
        if(age2<3)a=(sh.top[x]>0?C.keyHead:look.head)*Math.pow(C.neck,Math.floor(age2))*b;  // right behind a head
        else{a=(sh.top[x]>0?sh.top[x]:look.top*sh.gain[x])*sh.level[x]*(1-age2/t)*b;if(a<=cut)continue}
        if(sh.veiled[x]){a*=veil;if(a<=cut)continue}
        shown++;if(drawn>=cap)continue;drawn++;
        var gg=sh.glyph[x];ctx.globalAlpha=Math.min(a,1)*inkA;
        ctx.drawImage(at.cv,(gg&15)*at.w,(gg>>4)*at.h,at.w,at.h,X-hw,sh.ys[r]-hh,cw,ch)}}
  }
  /* one frame: moved on by dt (none: drawn again as it is; in steps of at most 1/15 s, so a scrub's long frames light
     every cell their heads pass), then drawn */
  function paint(dt){
    if(dt>0){for(var n=Math.ceil(dt*15),k=0;k<n;k++)advance(dt/n);age+=dt}
    var L=palette(),veil=smooth(age/C.buildIn),look={head:lerp(C.head[0],C.head[1],I),top:lerp(C.top[0],C.top[1],I),halo:lerp(C.halo[0],C.halo[1],I)};
    var p=lerp(C.change[0],C.change[1],I)*dt;
    ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,cv.width,cv.height);
    ctx.setTransform(K,0,0,K,0,0);ctx.globalCompositeOperation=L.add?'lighter':'source-over';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    shown=0;drawn=0;
    sheet(main,A.main,look,veil,p,L.add,L.inkA);sheet(near,A.near,look,veil,p,L.add,L.inkA);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    if(dt>0){if(shown>cap)cut=Math.min(cut*1.25,.25);else if(shown<cap*.75)cut=Math.max(cut/1.05,C.shown)}
  }
  function frame(t){
    if(!on||!seen){raf=0;return}
    raf=requestAnimationFrame(frame);
    var fast=I>C.calm||sinceKey<C.hold||lapse>1.01||lapseTo>1;
    if(prev&&t-prev<1000/(fast?60:C.idleRate)-4)return;
    var dt=prev?Math.min((t-prev)/1000,.1):1/60;prev=t;
    lapse+=(lapseTo-lapse)*(1-Math.exp(-dt/.12));if(Math.abs(lapse-lapseTo)<.01)lapse=lapseTo;paint(dt*lapse);
  }
  function go(){if(on&&seen&&!reduced&&!raf){prev=0;raf=requestAnimationFrame(frame)}}
  function startHead(ch){
    if(main.heads.length>=main.limit)return;
    var k=keyAt(ch),spread=(rnd()*.8-.4)*SW*(SPAN[1]-SPAN[0])/15*(k?k.width:0);
    var along=k?screenX(k)+spread:CARET,height=k?mix(C.keyRows,1-k.row/4):mix(C.keyRows,rnd());
    var c=Math.min(Math.max(Math.floor((along-main.left)/main.pitch),0),main.columns-1);
    var r=Math.min(Math.max(Math.floor((1-height+(rnd()*.06-.03))*SH/main.pitch),0),main.rows-1),t=logu(C.keyTrail[0],C.keyTrail[1]);
    main.heads.push({column:c,row:r,trail:t,gain:1,glyph:ch,key:true,veiled:false});main.light(c,r,t,C.keyTop,1,false);
  }
  var sc={
    show:function(){resize();birth();paint(0);on=true;go()},
    close:function(){on=false;if(raf)cancelAnimationFrame(raf);raf=0},
    still:function(){resize();birth();for(var k=0;k<4*C.idleRate;k++){advance(1/C.idleRate);age+=1/C.idleRate}paint(0)},  // the rest, built in
    see:function(v){seen=v;go()},
    key:function(ch){if(!main)return;keys.push(now);sinceKey=0;if(on&&!reduced&&ch.trim())startHead(ch)},
    pulse:function(){if(!main)return;keys.push(now);sinceKey=0},
    lapse:function(f){lapseTo=f||1},
    resize:resize,
    recolour:function(){if(!K)return;build();if(main&&!raf)paint(0)}
  };
  scenes.push(sc);return sc;
}
function hexA(hex,a){var n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a.toFixed(4)+')'}

var Code=makeCode(dim.querySelector('canvas'),2800);
scale();addEventListener('resize',scale);
function recolour(){scenes.forEach(function(s){s.recolour()})}
if(darkQ.addEventListener)darkQ.addEventListener('change',function(){recolour();OSD.redraw()});
else if(darkQ.addListener)darkQ.addListener(function(){recolour();OSD.redraw()});

/* ---------- no sound: the page's clicks and bed are left out; the calls to them stay, and do nothing ---------- */
var Sound={play:function(){}},Bed={up:function(){}};

/* ---------- the line: the band and its glide (Line.swift, Glide.swift). Two offsets: the edit's moves only the text
   before the caret (an insertion pushes it left by the inserted text's own width, measured alone, as Line.width does;
   a deletion glides it back), the caret move's moves both parts; each restarts from what remains of it plus the new
   step, a remainder in the same direction capped at one step, and eases to 0 over 140 ms. The newest glyph fades in
   over 80 ms, a paragraph end's ` ¶ ` over 200 ms: its two spaces in Literata, its pilcrow in Menlo, muted. The line is
   set without ligatures or kerning (site.css .box), so each glyph takes the advance it was measured with: Literata's
   Th or fi would fold a glyph into the one before it, and a pair such as Te or y. would move the line by up to 2.6 px
   the step did not. Reduced motion jumps. ---------- */
var Line=(function(){
  var bEl=box.querySelector('.lm-ll-b>span'),aEl=box.querySelector('.lm-ll-a>span');
  var text=[],caret=0,edit={from:0,start:0},move={from:0,start:0},raf=0,widths={},m=document.createElement('canvas').getContext('2d');
  if('fontKerning' in m)m.fontKerning='none';  // as the line sets its glyphs (site.css .box): each its own advance
  function width(ch){
    if(widths[ch]!=null)return widths[ch];
    var w;m.font='400 30px '+SERIF;
    if(ch==='\n'){w=2*m.measureText(' ').width;m.font='400 30px '+MONO;w+=m.measureText('¶').width}else w=m.measureText(ch).width;
    return widths[ch]=w;
  }
  function off(g,t){return g.from*(1-ease((t-g.start)/T.glide))}
  function add(g,dw,t){if(reduced){g.from=0;return}
    var r=off(g,t),c=Math.abs(dw);if(r*dw>0)r=dw>0?Math.min(r,c):Math.max(r,-c);g.from=r+dw;g.start=t}
  function esc(ch){return ch==='<'?'&lt;':ch==='>'?'&gt;':ch==='&'?'&amp;':ch}
  function glyph(ch,fresh){
    if(ch==='\n')return '<span class="lm-p'+(fresh?' lm-new':'')+'"> <b>¶</b> </span>';
    return fresh?'<span class="lm-new">'+esc(ch)+'</span>':esc(ch);
  }
  function render(fresh){
    var h='',i;
    for(i=Math.max(0,caret-120);i<caret;i++)h+=glyph(text[i],fresh&&i===caret-1);
    bEl.innerHTML=h;var a='';for(i=caret;i<Math.min(text.length,caret+120);i++)a+=glyph(text[i],false);aEl.innerHTML=a;
  }
  function paint(t){var mv=off(move,t),e=off(edit,t);
    bEl.style.transform='translateX('+(e+mv).toFixed(2)+'px)';aEl.style.transform='translateX('+mv.toFixed(2)+'px)';
    return t<edit.start+T.glide||t<move.start+T.glide}
  function loop(t){raf=paint(t)?requestAnimationFrame(loop):0}
  function moved(){if(paint(performance.now())&&!raf)raf=requestAnimationFrame(loop)}  // drawn on the key event
  if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',function(){widths={}});
  return {
    text:function(){return text.join('')},
    set:function(s){text=Array.from(s);caret=text.length;edit.from=move.from=0;render(false);moved()},
    insert:function(ch){text.splice(caret,0,ch);caret++;add(edit,width(ch),performance.now());render(true);moved()},
    back:function(){if(!caret)return;var ch=text[caret-1];text.splice(caret-1,1);caret--;add(edit,-width(ch),performance.now());render(false);moved()},
    left:function(){if(!caret)return;caret--;add(move,-width(text[caret]),performance.now());render(false);moved()},
    right:function(){if(caret>=text.length)return;add(move,width(text[caret]),performance.now());caret++;render(false);moved()}
  };
})();

/* ---------- the box: open, close, hand-off (Still: P1 a fade both ways, the hand-off the box's fade with MO1's ring)
   ---------- */
var up=false,gen=0,ringRaf=0;
function show(){
  cancel(box);cancel(dim);endRing();up=true;box.classList.add('lm-up');dim.classList.add('lm-up');
  if(reduced)Code.still();else Code.show();
  Bed.up(true);
  if(!reduced){  // 300 ms, a fade alone (Theme.still's open), the dim with it
    anim(box,[{opacity:0},{opacity:1}],{duration:T.open,easing:Q});
    anim(dim,[{opacity:0},{opacity:1}],{duration:T.open,easing:Q});
  }
}
function hideNow(){cancel(box);cancel(dim);endRing();up=false;box.classList.remove('lm-up');dim.classList.remove('lm-up');Code.close();Bed.up(false)}
function closeFade(){  // Esc, a click outside: a 200 ms fade, the dim with it
  if(!up)return;if(reduced)return hideNow();
  up=false;var g=++gen;Bed.up(false);
  anim(box,[{opacity:1},{opacity:0}],{duration:T.close,easing:Q,fill:'forwards'});
  anim(dim,[{opacity:1},{opacity:0}],{duration:T.close,easing:Q,fill:'forwards'});
  setTimeout(function(){if(g===gen)hideNow()},T.close);
}
/* R1, the fixed pass applied to what goes out, in each paragraph: runs of spaces become one, no trailing space, a
   capital at the start and after a sentence's end, a lone i becomes I */
function tidy(s){
  return s.split('\n').map(function(p){
    return p.replace(/ {2,}/g,' ').trim().replace(/(^|[.!?] )([a-z])/g,function(m,a,b){return a+b.toUpperCase()})
      .replace(/(^| )i(?=[ ,.;:!?]|$)/g,'$1I');
  }).filter(Boolean).join('\n');
}
/* what has landed in the app window: its paragraphs as a document's, a blank line between them, the caret after the
   last; all of a hand-off shows, and only text sent before it gives way when the window is full */
var Doc=(function(){
  var paras=[],caret=pasted.querySelector('.lm-ic');
  function render(){
    pasted.textContent='';
    paras.forEach(function(t){var e=document.createElement('p');e.textContent=t;pasted.appendChild(e)});
    (pasted.lastElementChild||pasted).appendChild(caret);
  }
  return {
    clear:function(){paras=[];render()},
    add:function(s){var n=s.split('\n').length;paras=paras.concat(s.split('\n'));render();
      while(pasted.scrollHeight>pasted.clientHeight+1&&paras.length>n){paras.shift();render()}
      pasted.scrollTop=pasted.scrollHeight}
  };
})();
function paste(s){if(s)Doc.add(s)}
/* MO1's ring (Handoff.ring, ringOutline, ringAlpha): two crests 9 px apart leave the box's outline at 60 px/s from
   ⌘⏎'s key-down, each with a trough 3 px inside it at 0.4 of its alpha, each line three strokes laid over each other
   (3.2 px at 0.2, 1.8 at 0.35, 0.9 at 0.45), the box's rectangle grown by how far out it is, its corners with it; the
   ring's alpha up over 0.18 s on the curve to 0.18 by day, 0.08 by night, down as (1 − t / 1.2 s)^1.5 */
var RING=[[0,1],[.05,.4],[.15,1],[.2,.4]],STROKES=[[3.2,.2],[1.8,.35],[.9,.45]];
function ring(){
  endRing();var t0=performance.now(),peak=palette().ringPeak,ls=[];
  RING.forEach(function(l){STROKES.forEach(function(s){var e=document.createElement('i');e.style.borderWidth=s[0]+'px';ringEl.appendChild(e);
    ls.push({e:e,start:l[0],share:l[1]*s[1],w:s[0]})})});
  function f(now){var t=(now-t0)/1000;if(t>=T.ringLife){endRing();return}
    var A=peak*ease(t/T.ringOnset)*Math.pow(1-t/T.ringLife,1.5);
    ls.forEach(function(o){var d=T.ringSpeed*(t-o.start),st=o.e.style;if(d<0){st.opacity=0;return}
      var g=d+o.w/2;st.left=(B.x-g).toFixed(2)+'px';st.top=(B.y-g).toFixed(2)+'px';st.width=(B.w+2*g).toFixed(2)+'px';
      st.height=(B.h+2*g).toFixed(2)+'px';st.borderRadius=(16+g).toFixed(2)+'px';st.opacity=(A*o.share).toFixed(4)});
    ringRaf=requestAnimationFrame(f)}
  ringRaf=requestAnimationFrame(f);
}
function endRing(){if(ringRaf)cancelAnimationFrame(ringRaf);ringRaf=0;ringEl.innerHTML=''}
/* ⌘⏎ under Still: the send sound at the key-down, MO1's ring from it and the wash lifting evenly over the ring's 1.2 s,
   Code fading with it; at Return's key-up the box fades in place over 200 ms, text and all; the paste lands at about
   130 ms and waits for none of it. */
function handOff(){
  var s=tidy(Line.text());if(!s||!up)return false;
  Sound.play('send');Bed.up(false);
  var g=++gen;up=false;
  if(reduced){hideNow();paste(s);Line.set('');return true}
  cancel(box);cancel(dim);ring();
  anim(dim,[{opacity:1},{opacity:0}],{duration:T.ringLife*1000,easing:'linear',fill:'forwards'});
  setTimeout(function(){if(g===gen)anim(box,[{opacity:1},{opacity:0}],{duration:T.close,easing:Q,fill:'forwards'})},T.keyUp);
  setTimeout(function(){paste(s)},T.paste);
  setTimeout(function(){if(g!==gen)return;hideNow();Line.set('')},T.ringLife*1000);
  return true;
}

/* ---------- key hints: in the loop, the chord the demo presses as large keycaps over the dim above the box (site.css
   .caps), one cap per key, in the page's ink with paper glyphs, as its button; they rise in, go down together at the
   press (the modifiers a beat before the last key) and come back, hold about 1.2 s and fade. Reduced motion's still
   frame keeps the small labels (`hintShow`). ---------- */
var caps=document.createElement('div');caps.className='lm-caps';caps.setAttribute('aria-hidden','true');stage.appendChild(caps);
function capsShow(keys,press){
  cancel(caps);caps.innerHTML=keys.map(function(k){return '<kbd'+(k.length>1?' class="lm-word"':k==='⌃'?' class="lm-ctl"':'')+'>'+k+'</kbd>'}).join('');
  var els=caps.querySelectorAll('kbd'),n=els.length;
  anim(caps,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:T.glide,easing:Q,fill:'forwards'});
  Array.prototype.forEach.call(els,function(e,i){
    later(press-(n-1-i)*45,function(){e.classList.add('lm-down')});
    later(press+110,function(){e.classList.remove('lm-down')})});
  later(1200,function(){anim(caps,[{opacity:1},{opacity:0}],{duration:250,easing:Q,fill:'forwards'})});
}
function capsHide(){cancel(caps);caps.style.opacity=0;caps.innerHTML=''}
function hintShow(html){hint.innerHTML=html;if(reduced){hint.style.opacity=1;return}
  cancel(hint);anim(hint,[{opacity:0},{opacity:1}],{duration:T.glide,easing:Q,fill:'forwards'})}
function hintHide(){cancel(hint);if(reduced){hint.style.opacity=0;return}
  anim(hint,[{opacity:1},{opacity:0}],{duration:T.close,easing:Q,fill:'forwards'})}

/* ---------- keys, from the loop or the reader: the line, the click, the ambience ---------- */
function key(ch,quiet){  // quiet: the loop's fast-forward, where a click per key would be a rattle
  var play=quiet?function(){}:Sound.play;
  if(ch==='\b'){Line.back();play('backspace');Code.pulse();return}
  Line.insert(ch);
  if(ch==='\n'){play('paragraph');Code.pulse()}
  else if(ch===' '){play('space');Code.pulse()}
  else{play('letter');Code.key(ch)}
}

/* ---------- the loop: three paragraphs, so the line is seen carrying a longer piece, in at most 10 s from the first
   hint to the hand-off (`LOOP.most`): the first four words at a human pace, the middle fast-forwarded as a tape
   scrubbing, the last three words at the pace again, then ⌘⏎. The scrub never switches: the keys' speed-up rises from
   1 to its peak on a smoothstep over `SCRUB.ramp`, holds, and falls back over the same into the last words; the peak is
   what fits the middle into the time left (`plan`). The clicks fall silent above `SCRUB.quiet`, so a few audible keys
   bracket it, and the scrub's look and Code's curtain follow the same curve (`scrubRun`). ---------- */
var SEQ='The morning was grey and I kept circling the same paragraph, so I closed everything and started again from what I actually knew.\nThe argument is simpler than the draft makes it look. Three claims, one example each, and the figure can go.\nWhat worries me is the second claim, which rests on teh\b\bhe older data. Say so plainly, and move on.';
var FAST={from:SEQ.indexOf('grey')+4,to:SEQ.lastIndexOf('and move on.')};  // the scrub's first key, the first key after it
var LOOP={most:9700,show:500,settle:500,send:550,go:450};  // ms: hint to hand-off at most; the fixed waits in it
var SCRUB={ramp:800,quiet:3,least:1600};  // ms up and down; the speed-up above which keys are silent; its shortest
var timers=[],mode='auto',idleT=0;
function later(ms,f){var id=setTimeout(function(){var i=timers.indexOf(id);if(i>=0)timers.splice(i,1);f()},ms);timers.push(id)}
function cancelTimers(){timers.forEach(clearTimeout);timers=[];scrubStop()}
function gap(prev,ch){  // a human pace: 90–200 ms a key, longer after a space or a full stop, a pause before fixing a typo
  if(ch==='\b')return prev==='\b'?130:420;
  var g=90+rnd()*110;if(prev===' ')g+=rnd()*150;if(prev==='.'||prev===',')g+=260;if(prev==='\n')g+=320;return g;
}
/* the scrub's speed-up `t` ms into it: 1, rising on a smoothstep over the ramp to `peak`, held, falling back over the
   ramp to 1 at `span` */
function lapse(t,P){var r=t<P.ramp?smooth(t/P.ramp):t>P.span-P.ramp?smooth((P.span-t)/P.ramp):1;return 1+(P.peak-1)*r}
/* the loop's keys in time: each key's human-pace time (`tape`), the slow parts as they are, the middle stepped through
   ms by ms at the speed-up, whose peak is set so that its integral over the time left covers the middle's tape:
   span + (peak − 1)(span − ramp) */
function plan(){
  var keys=Array.from(SEQ),tape=[],prev='',u=0,i;
  keys.forEach(function(ch){u+=gap(prev,ch);prev=ch;tape.push(u)});
  var a=FAST.from-1,b=FAST.to-1,uA=tape[a],U=tape[b]-uA,slow=uA+(u-tape[b]);
  var span=Math.max(SCRUB.least,LOOP.most-LOOP.show-T.open-LOOP.settle-LOOP.send-LOOP.go-slow);
  var P={ramp:Math.min(SCRUB.ramp,span/2),span:span},at=[],quiet=[];P.peak=1+(U-span)/(span-P.ramp);
  for(i=0;i<=a;i++){at.push(tape[i]);quiet.push(false)}
  var t=0,v=0;i=a+1;
  while(i<=b){v+=lapse(t,P);t++;while(i<=b&&v>=tape[i]-uA){at.push(uA+t);quiet.push(lapse(t,P)>SCRUB.quiet);i++}if(t>span)break}
  for(;i<=b;i++){at.push(uA+span);quiet.push(false)}
  for(i=b+1;i<keys.length;i++){at.push(uA+span+tape[i]-tape[b]);quiet.push(false)}
  P.tape=uA;return {keys:keys,at:at,quiet:quiet,start:uA,P:P,end:at[at.length-1]};
}
/* the scrub's look (site.css .vhs, the line's jitter and smear) at its level 0–1 in `--ff`, the jitter's step in
   `--jit` (at 24 Hz), Code's curtain stepped at the speed-up itself. The on-screen display is a deck's: a ▶▶ at the
   top left and a tape counter at the top right (H:MM:SS of the text's time at a human pace, running as the tape
   does), drawn pixel by pixel into two tiny canvases with a one-pixel hard edge and shown five times larger,
   unsmoothed (site.css .osd), with a faint flicker */
var vhs=document.createElement('div');vhs.className='lm-vhs';vhs.setAttribute('aria-hidden','true');
vhs.innerHTML='<i class="lm-trk"></i><i class="lm-trk"></i><div class="lm-osd"><canvas class="lm-osd-ff" width="14" height="12"></canvas>'+
  '<canvas class="lm-osd-n" width="36" height="8"></canvas></div>';stage.appendChild(vhs);
var OSD=(function(){
  var FONT={'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11111','00010','00100','00010','00001','10001','01110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','11110','00001','00001','10001','01110'],
    '6':['00110','01000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00010','01100'],
    ':':['00','11','11','00','11','11','00']};
  var tri=[];for(var r=0;r<11;r++)tri.push(new Array(Math.min(r,10-r)+2).join('1'));  // 11 rows, 1 to 6 pixels: ▶
  var wrap=vhs.querySelector('.lm-osd'),ff=vhs.querySelector('.lm-osd-ff'),n=vhs.querySelector('.lm-osd-n'),shown='',at=0;
  function colours(){var cs=getComputedStyle(stage);return [cs.getPropertyValue('--osd').trim(),cs.getPropertyValue('--osd-edge').trim()]}
  function put(c,rows,x,y,col){rows.forEach(function(row,j){for(var i=0;i<row.length;i++)if(row[i]==='1'){c.fillStyle=col;c.fillRect(x+i,y+j,1,1)}})}
  function paint(cv,glyphs){  // glyphs: [rows, x] pairs; the edge one pixel right and down, the face over it
    var c=cv.getContext('2d'),k=colours();c.clearRect(0,0,cv.width,cv.height);
    [[1,k[1]],[0,k[0]]].forEach(function(l){glyphs.forEach(function(g){put(c,g[0],g[1]+l[0],l[0],l[1])})});
  }
  function counter(ms){
    at=ms;var s=Math.floor(ms/1000),txt=Math.floor(s/3600)+':'+('0'+Math.floor(s/60)%60).slice(-2)+':'+('0'+s%60).slice(-2);
    if(txt===shown)return;shown=txt;var x=0,g=[];
    txt.split('').forEach(function(ch){g.push([FONT[ch],x]);x+=FONT[ch][0].length+1});paint(n,g);
  }
  return {
    redraw:function(){paint(ff,[[tri,0],[tri,7]]);shown='';counter(at)},  // a new scheme's colours
    counter:counter,
    flicker:function(v){wrap.style.opacity=v.toFixed(2)}
  };
})();
OSD.redraw();
var scrubRaf=0;
function scrubStop(){if(scrubRaf)cancelAnimationFrame(scrubRaf);scrubRaf=0;stage.classList.remove('lm-ff');
  stage.style.setProperty('--ff','0');stage.style.setProperty('--jit','0px');Code.lapse(1)}
function scrubRun(P){
  scrubStop();stage.classList.add('lm-ff');var t0=performance.now(),last=t0,jt=0,u=P.tape;OSD.counter(u);
  function f(now){var t=now-t0;if(t>=P.span){scrubStop();return}
    var x=lapse(t,P),level=(x-1)/Math.max(P.peak-1,1e-6);u+=x*(now-last);last=now;
    stage.style.setProperty('--ff',level.toFixed(3));
    if(now-jt>42){jt=now;stage.style.setProperty('--jit',((2*rnd()-1)*1.5*level).toFixed(2)+'px');OSD.flicker(.88+.12*rnd());OSD.counter(u)}
    Code.lapse(x);scrubRaf=requestAnimationFrame(f)}
  scrubRaf=requestAnimationFrame(f);
}
function loop(){
  mode='auto';Doc.clear();cancel(pasted);scrubStop();
  var t=600;later(t,function(){capsShow(['⌃','⌥','Space'],LOOP.show-120)});  // pressed just before the box opens
  t+=LOOP.show;later(t,show);
  t+=T.open+LOOP.settle;  // Code builds in for a moment before the first key
  var p=plan();
  later(t+p.start,function(){scrubRun(p.P)});
  p.keys.forEach(function(ch,i){later(t+p.at[i],function(){key(ch,p.quiet[i])})});
  t+=p.end+LOOP.send;later(t,function(){capsShow(['⌘','⏎'],LOOP.go)});  // pressed at the hand-off
  t+=LOOP.go;later(t,handOff);
  t+=T.ringLife*1000+2600;
  later(t,function(){anim(pasted,[{opacity:1},{opacity:0}],{duration:T.close,easing:Q,fill:'forwards'})});
  later(t+T.close,loop);
}
function still(){  // reduced motion: one frame of the box over the dimmed app and Code's rest, the key hints as labels
  mode='still';Doc.clear();up=true;box.classList.add('lm-up');dim.classList.add('lm-up');Code.still();
  Line.set(SEQ.replace('teh\b\bhe','the'));
  hintShow('<kbd>⌃⌥Space</kbd><span>opens the box</span><kbd>⌘⏎</kbd><span>sends the text into the app</span>');
}
function idle(){clearTimeout(idleT);idleT=setTimeout(resume,10000)}
function resume(){  // 10 s without the reader: the loop again, unless a sentence of theirs is still in the box
  if(document.activeElement===inp&&Line.text()){idle();return}
  inp.blur();hideNow();Line.set('');if(!inView){mode='away';return}reduced?still():loop();
}
function takeOver(){  // the reader's turn: the loop stops, the box is theirs and empty
  if(mode!=='user'){
    cancelTimers();gen++;hintHide();capsHide();
    if(up&&mode==='auto'){cancel(box);cancel(dim);box.classList.add('lm-up');dim.classList.add('lm-up')}  // open already: it stays
    else{hideNow();show()}
    mode='user';Line.set('');
  }else if(!up)show();
  inp.focus({preventScroll:true});idle();
}

stage.addEventListener('pointerdown',function(e){
  if(mode==='user'&&up&&!box.contains(e.target)){closeFade();inp.blur();idle();e.preventDefault();return}  // a click outside hides it
  if(e.target!==inp)e.preventDefault();
  takeOver();
});
stage.addEventListener('keydown',function(e){if(e.target===stage&&(e.key==='Enter'||e.key===' ')){e.preventDefault();takeOver()}});
inp.addEventListener('focus',function(){if(mode!=='user')takeOver()});
inp.addEventListener('keydown',function(e){
  if(e.isComposing)return;idle();
  if(e.key==='Enter'){e.preventDefault();if(handOff())inp.blur();return}  // ⏎ or ⌘⏎ sends
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key==='Backspace'){e.preventDefault();if(up)key('\b')}
  else if(e.key==='ArrowLeft'){e.preventDefault();Line.left()}
  else if(e.key==='ArrowRight'){e.preventDefault();Line.right()}
  else if(e.key==='Escape'){e.preventDefault();closeFade();inp.blur()}
});
function typed(){var v=inp.value;inp.value='';if(!up)return;Array.from(v).forEach(function(ch){if(ch>=' ')key(ch)})}
inp.addEventListener('input',function(e){if(!e.isComposing)typed()});
inp.addEventListener('compositionend',typed);

/* start the loop when the demo is first in view and Literata is in (the glide measures with it); stop it when the demo
   leaves the view, start it again when it comes back */
var started=false,inView=false;
function begin(){
  if(started)return;started=true;
  function go(){if(inView)loop();else mode='away'}
  if(document.fonts&&document.fonts.load)Promise.race([document.fonts.load('400 30px "Lemna Literata"'),new Promise(function(ok){setTimeout(ok,1500)})]).then(go,go);
  else go();
}
function away(){if(mode!=='auto')return;cancelTimers();gen++;capsHide();hintHide();hideNow();Line.set('');Doc.clear();mode='away'}
new IntersectionObserver(function(es){inView=es[0].isIntersecting;Code.see(inView);
  if(inView){if(!started)begin();else if(mode==='away')loop()}else if(started)away()}).observe(fit);
})();

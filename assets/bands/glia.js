/* glia-org.github.io, Glia's band: the hero of Glia's page (glia.github.io, commit 1e02732, assets/site.js), ported:
   the astrocyte field (WebGL 2, the calcium waves) behind the band's panes, the specimen pane as its loupe, and the
   drawn window playing its task of about 58 s. Its ids and classes carry the prefix gl-; nothing is left on window.
   The field's context is made when the band first comes into view, and the field and the window run only while the
   band is in view and the tab is shown. Without WebGL 2 (or with ?nogl in the URL) the band shows its still, the PNG
   of the window at rest. Under reduced motion the field is drawn once and the window stays at rest. Fetched by
   bands/load.js as the band comes near. Left out from Glia's page: the colour schemes, the palette, the canvas view,
   the waves beside each section, ?still, ?waves and ?at. */
(function(){
'use strict';
var band=document.getElementById('glia');if(!band||band.dataset.run)return;band.dataset.run='1';
var reduced=matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- the GPU piece (WebGL 2) ----------
   Astrocytes tile the ground; calcium waves cross them, from where you click and at random. 1-bit pixel art through a
   4×4 Bayer threshold at whole pixels, two theme colours, faint behind the panes (the panes are opaque); the specimen
   pane is a loupe on the tissue behind it: it opens at 1×, as the field around it, then zooms to 2× and full strength
   (once; the app's 140 ms ease-out). The canvas covers the band; the field is laid out in the viewport's pixels as on
   Glia's page (gl-field's corner is passed to the shader), so it moves at half the scroll's speed. */
var GL_HEAD='#version 300 es\nprecision highp float;precision highp int;\n';
var GL_B4='float b4(ivec2 p){int m[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);return (float(m[(p.y&3)*4+(p.x&3)])+.5)/16.;}\n';
var GL_LEN='const int RS=6;int len(int e,int n){return clamp(16+e*8/5,16,n);}\n'+
  'float fall(int s,int e,int n){float t=1.-float(s-RS)/float(len(e,n)-RS);return t*t;}\n';
var GL_TRI='#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
function rnd(seed){return function(){seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(R){return (R()+R()+R()-1.5)*1.15}
function glKit(){
  var c=document.createElement('canvas');c.className='gl-field';c.setAttribute('aria-hidden','true');
  var g=c.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false});
  if(!g)return null;
  band.insertBefore(c,band.firstChild);
  var K={c:c,gl:g,dpr:1,seen:true,ac:new AbortController()};K.sig={signal:K.ac.signal};K.sigP={signal:K.ac.signal,passive:true};
  function sh(t,s){var x=g.createShader(t);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw g.getShaderInfoLog(x);return x}
  K.prog=function(vs,fs,names,attrs){var p=g.createProgram();g.attachShader(p,sh(g.VERTEX_SHADER,vs));g.attachShader(p,sh(g.FRAGMENT_SHADER,fs));
    (attrs||['p']).forEach(function(a,i){g.bindAttribLocation(p,i,a)});g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw g.getProgramInfoLog(p);
    var u={};names.forEach(function(n){u[n]=g.getUniformLocation(p,n)});return{p:p,u:u}};
  K.tex=function(w,h,data){var t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,w,h,0,g.RGBA,g.UNSIGNED_BYTE,data);
    [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER].forEach(function(k){g.texParameteri(g.TEXTURE_2D,k,g.NEAREST)});
    [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T].forEach(function(k){g.texParameteri(g.TEXTURE_2D,k,g.CLAMP_TO_EDGE)});return t};
  var vao=g.createVertexArray();g.bindVertexArray(vao);var vb=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,vb);
  g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);g.enableVertexAttribArray(0);g.vertexAttribPointer(0,2,g.FLOAT,false,0,0);g.bindVertexArray(null);
  K.tri=function(){g.bindVertexArray(vao);g.drawArrays(g.TRIANGLES,0,3)};
  // the canvas at the band's size in device pixels; its corner in the viewport, in whole device pixels
  K.size=function(){K.dpr=Math.min(devicePixelRatio||1,2);var w=Math.round(band.clientWidth*K.dpr),h=Math.round(band.clientHeight*K.dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h}return K.dpr};
  K.org=function(){var r=c.getBoundingClientRect();return [Math.round(r.left*K.dpr),Math.round(r.top*K.dpr)]};
  K.rgb=function(v){var x=parseInt(getComputedStyle(band).getPropertyValue(v).trim().slice(1),16);return [(x>>16&255)/255,(x>>8&255)/255,(x&255)/255]};
  K.spec=band.querySelector('.gl-specimen');
  K.specRect=function(){var r=K.spec.getBoundingClientRect(),d=K.dpr;return [Math.round((r.left+1)*d),Math.round((r.top+1)*d),Math.round((r.width-2)*d),Math.round((r.height-2)*d)]};
  K.wide=function(){return innerWidth>760};
  K.heroSeen=true;if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){K.heroSeen=es[es.length-1].isIntersecting},{threshold:.2});io.observe(K.spec);K.ac.signal.addEventListener('abort',function(){io.disconnect()})}
  // one frame loop: update(now, dt, live) draws and returns whether it wants another frame
  K.loop=function(update){var raf=0,last=0,dead=false;
    function live(){return !dead&&K.seen&&!document.hidden&&!reduced.matches}
    // a wave fired inside update() kicks a frame already; asking again would start a second chain of frames (on Glia's
    // page each such wave adds one that never ends), hence !raf
    function tick(now){raf=0;if(dead)return;var L=live(),dt=last&&L?Math.min(200,now-last):0;last=L?now:0;if(update(now,dt,L)&&L&&!raf)raf=requestAnimationFrame(tick)}
    K.kick=function(){if(!raf&&!dead)raf=requestAnimationFrame(tick)};
    K.live=live;K.stop=function(){dead=true;if(raf)cancelAnimationFrame(raf);raf=0}};
  addEventListener('scroll',function(){if(!K.seen)return;K.dirty=true;K.kick&&K.kick()},K.sigP);
  document.addEventListener('visibilitychange',function(){K.kick&&K.kick()},K.sig);
  return K}
// grows one tapering, forking process the way glia's assets/logo/cell.py does; inside(x,y) bounds it, stamp(x,y,r,v) draws
function growBranch(R,inside,stamp,x,y,ang,len,w0,w1,depth,target,pull){var pts=[[x,y]],da=0,step=.9,m=Math.max(3,Math.floor(len/step));
  for(var i=0;i<m;i++){da=da*.8+gauss(R)*.07;ang+=da;if(target){var ta=Math.atan2(target[1]-y,target[0]-x),df=((ta-ang+Math.PI)%6.283+6.283)%6.283-Math.PI;ang+=df*pull}
    var nx=x+step*Math.cos(ang),ny=y+step*Math.sin(ang);if(!inside(nx,ny))break;x=nx;y=ny;pts.push([x,y])}
  var L=pts.length-1;if(L<2)return pts;
  for(var i=0;i<=L;i++){var t=i/L;stamp(pts[i][0],pts[i][1],Math.max(.55,w0+(w1-w0)*Math.pow(t,.75))/2,1-.45*Math.pow(t,1.5))}
  if(target)return pts;
  for(var i=2;i<L-1;i++){var t=i/L,h=Math.atan2(pts[i+1][1]-pts[i-1][1],pts[i+1][0]-pts[i-1][0]);
    if(depth>0&&R()<.08)growBranch(R,inside,stamp,pts[i][0],pts[i][1],h+(R()<.5?-1:1)*(.35+R()*.6),len*(1-t)*(.45+R()*.4),Math.max(.9,(w0+(w1-w0)*t)*.62),w1*.8,depth-1);
    if(R()<.16*(.5+t)){var a=h+(R()<.5?-1:1)*(.6+R()*.8),tx=pts[i][0],ty=pts[i][1];for(var s=0;s<3+R()*5;s++){a+=gauss(R)*.25;tx+=.8*Math.cos(a);ty+=.8*Math.sin(a);if(!inside(tx,ty))break;stamp(tx,ty,.45,.75)}}}
  return pts}
// the halo of fine processes: blur, modulated by a spongy value noise (period W×H, lattice G)
function haloField(D,W,H,R,wrap){var n=W*H,Bl=D.slice(),T=new Float32Array(n);
  function at(x,y){if(wrap){x=((x%W)+W)%W;y=((y%H)+H)%H}else if(x<0||y<0||x>=W||y>=H)return 0;return Bl[y*W+x]}
  for(var pass=0;pass<2;pass++){for(var y=0;y<H;y++)for(var x=0;x<W;x++){var s=0;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)s+=at(x+dx,y+dy);T[y*W+x]=s/9}var sw=Bl;Bl=T;T=sw}
  var G=3,gw=Math.ceil(W/G),gh=Math.ceil(H/G),lat=new Float32Array(gw*gh);for(var i=0;i<lat.length;i++)lat[i]=R();
  function L(i,j){return lat[(((j%gh)+gh)%gh)*gw+(((i%gw)+gw)%gw)]}
  var out=new Float32Array(n);
  for(var y=0;y<H;y++)for(var x=0;x<W;x++){var fx=x/G,fy=y/G,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);
    var v=(L(i0,j0)*(1-tx)+L(i0+1,j0)*tx)*(1-ty)+(L(i0,j0+1)*(1-tx)+L(i0+1,j0+1)*tx)*ty,p=y*W+x;
    out[p]=Math.max(D[p],Math.min(.82,Bl[p]*(.3+1.1*v)*1.35))}
  return out}

/* ---------- W1 calcium ---------- */
function calcium(){var K=glKit();if(!K)return null;var gl=K.gl;
  // a step is 50 ms: fronts at 20 cells/s (astrocyte waves: 10–20 µm/s), a soft 0.3 s rise, a fall that lasts
  // 1 s for a small event and up to 7.5 s for a big one, and a 0.8 s pause at each junction between cells
  var P=2,HZ=2,H=480,RM=70,N=150,J=22,JD=16,STEP=50;
  var W=0,mask=null,hero=null,heroTid=0,procPx=[],heroPx=[];
  function grow(W){
    var R=rnd(6),n=W*H,D=new Float32Array(n),own=new Int32Array(n).fill(-1),marg=new Float32Array(n),ves=new Uint8Array(n);
    function ix(x,y){x=((x%W)+W)%W;y=((y%H)+H)%H;return y*W+x}
    function td(ax,ay,bx,by){var dx=Math.abs(ax-bx),dy=Math.abs(ay-by);dx=Math.min(dx,W-dx);dy=Math.min(dy,H-dy);return Math.sqrt(dx*dx+dy*dy)}
    var S=[[120,240]],bw=Math.max(1,Math.floor(W/RM)),bh=Math.max(1,Math.floor(H/RM)),B=[];for(var b=0;b<bw*bh;b++)B.push([]);
    function bk(x,y){return Math.min(bh-1,Math.floor(y/(H/bh)))*bw+Math.min(bw-1,Math.floor(x/(W/bw)))}
    function near(x,y,r,fn){var cx=Math.floor(x/(W/bw)),cy=Math.floor(y/(H/bh));for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){var l=B[(((cy+dy)%bh+bh)%bh)*bw+(((cx+dx)%bw+bw)%bw)];for(var k=0;k<l.length;k++)fn(l[k])}}
    B[bk(120,240)].push(0);
    for(var t=0;t<W*H/RM/RM*40;t++){var x=R()*W,y=R()*H,ok=true;near(x,y,1,function(k){if(td(x,y,S[k][0],S[k][1])<RM*.82)ok=false});if(ok){B[bk(x,y)].push(S.length);S.push([x,y])}}
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var d1=1e9,d2=1e9,k1=-1;near(x+.5,y+.5,2,function(k){var d=td(x+.5,y+.5,S[k][0],S[k][1]);if(d<d1){d2=d1;d1=d;k1=k}else if(d<d2)d2=d});var p=y*W+x;own[p]=k1;marg[p]=d2-d1}
    var vpts=[];
    // two capillaries run top to bottom; the first passes left of the hero cell
    for(var v=0;v<2;v++){var x0=v?W*.68+R()*W*.08:S[0][0]-70-R()*20,a1=10+R()*14,a2=4+R()*6,f1=R()*6.283,f2=R()*6.283;
      for(var yy=0;yy<H;yy+=.5){var xc=x0+a1*Math.sin(6.283*yy/H+f1)+a2*Math.sin(6.283*2*yy/H+f2);vpts.push([xc,yy]);
        for(var dx=-5;dx<=5;dx++){var px=Math.round(xc+dx),q=ix(px,Math.floor(yy)),d=Math.abs(px+.5-xc);if(d<2.2)ves[q]=2;else if(d<3.3&&ves[q]!==2)ves[q]=1}}}
    var k;
    function stamp(x,y,r,val){var r2=r*r+.3;for(var j=Math.floor(y-r-1);j<=Math.ceil(y+r);j++)for(var i=Math.floor(x-r-1);i<=Math.ceil(x+r);i++){var dx=i+.5-x,dy=j+.5-y;if(dx*dx+dy*dy<=r2){var q=ix(i,j);if(own[q]===k&&ves[q]!==2&&D[q]<val)D[q]=val}}}
    function inside(x,y){var q=ix(Math.floor(x),Math.floor(y));return own[q]===k&&ves[q]!==2}
    for(k=0;k<S.length;k++){var sx=S[k][0],sy=S[k][1],sr=2.6+R()*1.2;
      for(var j=-5;j<=5;j++)for(var i=-5;i<=5;i++){var a=Math.atan2(j,i),rr=sr*(1+.12*Math.sin(2*a+k)+.08*Math.sin(3*a+2*k));if(i*i+j*j<=rr*rr){var q=ix(Math.round(sx+i),Math.round(sy+j));if(own[q]===k&&ves[q]!==2)D[q]=1}}
      var np=6+Math.floor(R()*4),a0=R()*6.283;
      for(var i=0;i<np;i++){var a=a0+6.283*i/np+(R()-.5)*.6;growBranch(R,inside,stamp,sx+sr*.6*Math.cos(a),sy+sr*.6*Math.sin(a),a,RM*(.42+R()*.3),2.4+R()*.9,.7,2)}
      var best=null,bd=RM*.75;for(var v=0;v<vpts.length;v+=3){var d=td(sx,sy,vpts[v][0],vpts[v][1]);if(d<bd){bd=d;best=vpts[v]}}
      if(best){var end=growBranch(R,inside,stamp,sx,sy,Math.atan2(best[1]-sy,best[0]-sx),bd+6,2.2,1.5,0,best,.3),e=end[end.length-1];
        if(td(e[0],e[1],best[0],best[1])<6)for(var s=-6;s<=6;s+=.7)stamp(e[0]+(best[0]>e[0]?1:-1)*.4,e[1]+s,1.15,.95)}}
    var F=haloField(D,W,H,R,true),out=new Uint8Array(n*4);procPx=[];heroPx=[];
    for(var p=0;p<n;p++){var d=F[p],edge=Math.min(1,Math.max(0,marg[p]/3.5));d*=.3+.7*edge*edge*(3-2*edge);if(ves[p]===2)d=0;
      out[p*4]=Math.round(Math.min(1,d)*255);out[p*4+1]=(own[p]%254)+1;out[p*4+2]=ves[p]===1?128:ves[p]===2?255:0;
      if(D[p]>.25&&D[p]<.8&&(p%7===0))procPx.push([p%W,Math.floor(p/W)]);if(own[p]===0&&out[p*4]>40)heroPx.push([p%W,Math.floor(p/W)])}
    hero=[Math.floor(S[0][0]),Math.floor(S[0][1])];
    [[0,0],[1,0],[0,1],[1,1]].forEach(function(o){out[ix(hero[0]+o[0]-1,hero[1]+o[1]-1)*4+3]=255});
    heroTid=(own[ix(hero[0],hero[1])]%254)+1;mask=out;return out}
  var SIM=GL_HEAD+'uniform sampler2D uS,uM;uniform ivec2 uSize;uniform int uN,uJ,uD,uF;uniform ivec4 uK[6];out vec4 o;\n'+GL_LEN+
    'ivec2 w(ivec2 p){return (p+uSize)%uSize;}\n'+
    'float hs(ivec2 p,int f){uint h=uint(p.x)*1973u+uint(p.y)*9277u+uint(f)*26699u;h=(h^(h>>13u))*1274126177u;h^=h>>16u;return float(h&65535u)/65535.;}\n'+
    'void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 m=texelFetch(uM,p,0);if(m.r<.04){o=vec4(0);return;}\n'+
    ' vec4 c=texelFetch(uS,p,0);int s=int(c.r*255.+.5),e=int(c.g*255.+.5),t=int(m.g*255.+.5);\n'+
    ' int b=0;for(int i=0;i<6;i++){if(uK[i].w>0&&abs(p.x-uK[i].x)<=1&&abs(p.y-uK[i].y)<=1)b=max(b,uK[i].z);}\n'+
    ' if(hs(p,uF)>.07){for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){if(dx==0&&dy==0)continue;ivec2 q=w(p+ivec2(dx,dy));vec4 n=texelFetch(uS,q,0);\n'+
    '  int ns=int(n.r*255.+.5);if(ns<1)continue;vec4 mq=texelFetch(uM,q,0);if(mq.r<.04)continue;bool same=int(mq.g*255.+.5)==t;\n'+
    '  if(ns!=(same?1:uD))continue;b=max(b,int(n.g*255.+.5)-(same?1:uJ));}}\n'+
    // a fading cell fires again for a wave stronger than what is left of its own (relative refractory period);
    // b keeps the level it rises from
    ' float f=c.b;if(b>0&&(s==0||s>RS&&float(b)>=float(e)*fall(s,e,uN)+8.)){f=s==0?0.:fall(s,e,uN);s=1;e=min(b,255);}\n'+
    ' else if(s>0){s++;if(s>len(e,uN)){s=0;e=0;f=0.;}}o=vec4(float(s)/255.,float(e)/255.,f,1.);}';
  // uOrg: the canvas's corner in the viewport (device px), so f is in the viewport's device pixels as on Glia's page
  var DRAW=GL_HEAD+'uniform sampler2D uS,uM;uniform ivec2 uSize;uniform vec2 uRes,uOrg,uOff,uHC;uniform float uPix,uHPix,uRest,uLit,uN;uniform int uHid;\n'+
    'uniform vec4 uH;uniform float uZk;uniform vec3 cRest,cHRest,cHi,cWave;out vec4 o;\n'+GL_B4+GL_LEN+
    'void main(){vec2 f=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)+uOrg;\n'+
    ' bool h=f.x>=uH.x&&f.y>=uH.y&&f.x<uH.x+uH.z&&f.y<uH.y+uH.w;\n'+
    ' if(!h&&uRest<=0.){o=vec4(0);return;}\n'+
    // in the specimen: uHPix device px per cell, uZk from 0 (as the field) to 1 (full strength) while it zooms in
    ' vec2 c=h?uHC+(f-(uH.xy+.5*uH.zw))/uHPix:f/uPix+uOff;float k=uZk;\n'+
    ' ivec2 q=ivec2(floor(c));q=((q%uSize)+uSize)%uSize;\n'+
    ' vec4 m=texelFetch(uM,q,0);vec4 s4=texelFetch(uS,q,0);int s=int(s4.r*255.+.5);float e=s4.g*255.;\n'+
    ' float I=0.;if(s>0&&s<=RS)I=mix(s4.b,1.,float(s)/float(RS));else if(s>RS)I=fall(s,int(e+.5),int(uN));I*=.3+.7*min(1.,e/50.);\n'+
    ' vec3 col;float a;\n'+
    ' if(h&&m.a>.5){col=cWave;a=k;}\n'+
    ' else if(m.r>.04&&I*smoothstep(.04,.7,m.r)>b4(q+ivec2(2,1))){col=cWave;a=h?mix(uLit,1.,k):uLit;}\n'+
    ' else if(m.r>b4(q)){col=h?mix(cRest,int(m.g*255.+.5)==uHid?cHi:cHRest,k):cRest;a=h?mix(uRest,1.,k):uRest;}\n'+
    ' else if(m.b>.3&&m.b<.7){col=h?cHRest:cRest;a=(h?mix(uRest,1.,k):uRest)*.8;}\n'+
    ' else{o=vec4(0);return;}\n'+
    ' o=vec4(col*a,a);}';
  var sim=K.prog(GL_TRI,SIM,['uS','uM','uSize','uN','uJ','uD','uF','uK']);
  var draw=K.prog(GL_TRI,DRAW,['uS','uM','uSize','uRes','uOrg','uOff','uHC','uPix','uHPix','uRest','uLit','uN','uHid','uH','uZk','cRest','cHRest','cHi','cWave']);
  var mt=null,st=[],fb=[],cur=0,sparks=[],cols={},frame=0;
  function build(){var need=Math.ceil((innerWidth/P+8)/24)*24;if(need<=W&&mt)return;W=need;var data=grow(W);
    [mt].concat(st).forEach(function(t){if(t)gl.deleteTexture(t)});fb.forEach(function(f){gl.deleteFramebuffer(f)});
    mt=K.tex(W,H,data);st=[K.tex(W,H,null),K.tex(W,H,null)];
    fb=st.map(function(t){var f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);return f});
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);cur=0}
  function step(){gl.bindFramebuffer(gl.FRAMEBUFFER,fb[1-cur]);gl.viewport(0,0,W,H);gl.useProgram(sim.p);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,st[cur]);gl.uniform1i(sim.u.uS,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,mt);gl.uniform1i(sim.u.uM,1);
    var k=new Int32Array(24);sparks.splice(0,6).forEach(function(s,i){k[i*4]=s[0];k[i*4+1]=s[1];k[i*4+2]=s[2];k[i*4+3]=1});
    gl.uniform4iv(sim.u.uK,k);gl.uniform2i(sim.u.uSize,W,H);gl.uniform1i(sim.u.uN,N);gl.uniform1i(sim.u.uJ,J);gl.uniform1i(sim.u.uD,JD);gl.uniform1i(sim.u.uF,frame++&65535);K.tri();cur=1-cur}
  function offY(){return Math.round(scrollY*.5*K.dpr)/(P*K.dpr)}
  // the field is shifted (whole cells) so that the hero cell lies behind the specimen's centre; the specimen shows what
  // is behind it, so it pans across the tissue as the page scrolls (the field moves at half speed)
  var ax=0,ay=0;function anchor(){var r=K.spec.getBoundingClientRect();ax=Math.round(hero[0]-(r.left+r.width/2)/P);ay=Math.round(hero[1]-(r.top+scrollY+r.height/2)/P)}
  // the zoom: null until the specimen is first seen, then its start time, -1 when done; whole device pixels per cell,
  // held at 1× for 500 ms so the match with the field shows, then the app's 140 ms ease-out to 2×
  var zoomAt=null,lens={c:[0,0],x:0,y:0,z:1},sb=band.querySelector('.gl-sb');
  function zoomPix(d){var z0=Math.round(P*d),z1=Math.round(P*HZ*d);if(zoomAt===-1||reduced.matches)return z1;if(zoomAt===null)return z0;
    var t=(performance.now()-zoomAt-500)/140;if(t<=0)return z0;if(t>=1){zoomAt=-1;return z1}return z0+Math.round((1-(1-t)*(1-t))*(z1-z0))}
  function render(){var d=K.size();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,K.c.width,K.c.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(draw.p);var u=draw.u;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,st[cur]);gl.uniform1i(u.uS,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,mt);gl.uniform1i(u.uM,1);
    gl.uniform2i(u.uSize,W,H);gl.uniform2f(u.uRes,K.c.width,K.c.height);var o=K.org();gl.uniform2f(u.uOrg,o[0],o[1]);
    anchor();var sp=K.specRect(),z=zoomPix(d),z0=Math.round(P*d),z1=Math.round(P*HZ*d);
    lens={x:sp[0]+sp[2]/2,y:sp[1]+sp[3]/2,z:z};lens.c=[lens.x/(P*d)+ax,lens.y/(P*d)+ay+offY()];
    if(sb.dataset.z!=z){sb.dataset.z=z;sb.style.width=20*z/d+'px'}
    gl.uniform2f(u.uOff,ax,ay+offY());gl.uniform2f(u.uHC,lens.c[0],lens.c[1]);gl.uniform1f(u.uZk,z1>z0?(z-z0)/(z1-z0):1);
    gl.uniform1f(u.uPix,P*d);gl.uniform1f(u.uHPix,z);gl.uniform1f(u.uRest,K.wide()?.13:0);gl.uniform1f(u.uLit,K.wide()?.42:0);gl.uniform1f(u.uN,N);gl.uniform1i(u.uHid,heroTid);
    gl.uniform4fv(u.uH,sp);gl.uniform3fv(u.cRest,cols.rest);gl.uniform3fv(u.cHRest,cols.hrest);gl.uniform3fv(u.cHi,cols.hi);gl.uniform3fv(u.cWave,cols.wave);K.tri()}
  function wrap(x,y){return [((x%W)+W)%W,((y%H)+H)%H]}
  function nearest(x,y,r){for(var d=0;d<=r;d++)for(var dy=-d;dy<=d;dy++)for(var dx=-d;dx<=d;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;var q=wrap(x+dx,y+dy);if(mask[(q[1]*W+q[0])*4]>40)return q}return null}
  function fire(q,e){if(q){sparks.push([q[0],q[1],e]);if(sparks.length>12)sparks.shift();K.kick()}}
  function toCell(cx,cy){return [Math.floor(cx/P+ax),Math.floor(cy/P+ay+offY())]}
  // waves without input start at a random spot of a cell (in the specimen: of the hero cell), at random times
  // (a floor plus an exponential wait), with random reach
  function wait(floor,mean){return floor-mean*Math.log(1-Math.random())}
  function anywhere(){for(var i=0;i<4;i++){var q=nearest(Math.floor(Math.random()*W),Math.floor(Math.random()*H),8);if(q)return q}return null}
  function inHero(){return heroPx[Math.floor(Math.random()*heroPx.length)]}
  var acc=0,nextWave=0,nextHero=0;
  K.loop(function(now,dt,live){
    if(live){acc+=dt;if(zoomAt===null&&K.heroSeen)zoomAt=performance.now();if(zoomAt!==null&&zoomAt!==-1)K.dirty=true;
      if(Math.random()<dt/220&&procPx.length)fire(procPx[Math.floor(Math.random()*procPx.length)],3+Math.floor(Math.random()*7));
      if(now>nextWave){fire(anywhere(),40+Math.floor(Math.random()*40));nextWave=now+wait(1000,3300)}
      if(K.heroSeen&&now>nextHero){fire(inHero(),70+Math.floor(Math.random()*70));nextHero=now+wait(2500,6500)}
      var n=0;while(acc>=STEP&&n<3){acc-=STEP;step();n++;K.dirty=true}}
    if(K.dirty){render();K.dirty=false}return live});
  build();
  var rt=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){build();K.dirty=true;K.kick()},150);K.dirty=true;K.kick()},K.sig);
  // clicks add up: each adds one to a charge that fades with a 1.5 s time constant; one click alone is 140
  var charge=0,lastClick=0;
  function clickEnergy(){var now=performance.now();charge=charge*Math.exp(-(now-lastClick)/1500)+1;lastClick=now;return Math.min(255,Math.round(100+40*charge))}
  K.spec.addEventListener('pointerdown',function(e){var d=K.dpr;fire(nearest(Math.floor(lens.c[0]+(e.clientX*d-lens.x)/lens.z),Math.floor(lens.c[1]+(e.clientY*d-lens.y)/lens.z),6),clickEnergy())},K.sig);
  // a click on the band's ground, between the panes, starts a wave there
  band.addEventListener('pointerdown',function(e){var t=e.target;
    if(t===band||t.classList.contains('gl-tiles')||t.classList.contains('gl-row')){var c=toCell(e.clientX,e.clientY);fire(nearest(c[0],c[1],8),clickEnergy())}},K.sig);
  cols={rest:K.rgb('--line'),hrest:K.rgb('--line'),hi:K.rgb('--mid'),wave:K.rgb('--accent')};
  sb.style.display='block';K.dirty=true;render();K.dirty=false;K.kick();
  return {seen:function(v){K.seen=v;if(v){K.dirty=true;K.kick()}}}}

/* ---------- the drawn window plays one task (Glia's page, the website's clip, 2026-11-06): the state is a function of
   the time t, so pausing and the loop are exact. The agent writes its job script and asks; the user reads both files
   (⌘ preview of boot.sh, boot.R opened with ⌘-click, zoomed with ⌘⏎, closed with ⌘W); the jail's box asks before the job
   goes; the history, the figure zoomed around the pointer, another project and back, the link down and up. Plays while
   a quarter of it is on screen; a click pauses and resumes. ---------- */
function play(){
  var el=function(id){return document.getElementById('gl-'+id)};
  var app=el('app');if(!app)return;
  var apOut=el('ap-out'),shOut=el('sh-out'),kb=el('kb'),ptr=el('ptr'),agent=el('agentpane'),shell=el('shpane'),ed=el('edpane'),ov=el('ov'),res=el('respane'),fig=el('res-fig'),nav=el('res-nav'),navBox=el('res-navbox'),resZ=el('res-z');
  var glyphs=[el('side-g'),el('ap-g'),el('side-pg')],sideS1=el('side-s1'),nWork=el('n-work'),nNeed=el('n-need'),nDone=el('n-done'),env=el('asl-env'),proj=el('asl-proj'),sideRes=el('side-res'),resPop=el('res-pop');
  var sideS2=el('side-s2');
  var p1s=Array.prototype.slice.call(app.querySelectorAll('.gl-side .gl-p1s')),p2s=Array.prototype.slice.call(app.querySelectorAll('.gl-side .gl-p2s'));
  var stage=el('stage1');
  var box=document.createElement('div');box.className='gl-bbox';box.hidden=true;agent.appendChild(box);
  var pv=document.createElement('div');pv.className='gl-pv';pv.hidden=true;agent.appendChild(pv);
  var PROMPT='fit the mixed model in fit.R and bootstrap its band',PROMPT2='looks good, submit it',SQ='squeue --me',LEN=58;
  var T={type0:.8,type1:3,enter:3,click:4.2,sq0:4.8,sq1:5.8,sqEnter:5.9,ready:7.8,hover:9.6,pv:9.9,pvEnd:12,hoverR:13,open:13.4,zoom:15.2,unzoom:20.5,close:21.6,
    t2a:22.4,t2b:24,enter2:24,shell2:24.2,ask:24.8,jump:25.8,submit:30.2,plot:32.4,done:33.2,hist:34,histEnd:39,resClick:40.2,z1:41,z2:41.8,z0:44.4,p2:45.4,p1:51.4,down:52.6,up:54.8};
  var SCRIPT=['#!/bin/bash','#SBATCH --job-name=boot','#SBATCH --partition=cpu','#SBATCH --time=02:00:00','#SBATCH --mem=32G','#SBATCH --cpus-per-task=16','module load R/4.4','Rscript boot.R && Rscript plot_band.R'];
  var LINES=[[3.5,'<span class="gl-t">⏺</span> Read(fit.R)\n  <span class="gl-r">⎿ 84 lines</span>'],
    [4.6,'<span class="gl-t">⏺</span> Read(data/trials.csv)\n  <span class="gl-r">⎿ 12,408 rows</span>'],
    [5.8,'<span class="gl-t">⏺</span> Update(fit.R)\n  <span class="gl-r">⎿ lme4 model with random slopes</span>'],
    [6.5,'<span class="gl-t">⏺</span> Write(<span id="gl-lnkr">boot.R</span>)\n  <span class="gl-r">⎿ 10 lines</span>'],
    [7.1,'<span class="gl-t">⏺</span> Write(<span id="gl-lnk">boot.sh</span>)\n  <span class="gl-r">⎿ 8 lines</span>'],
    [T.ready,'<span class="gl-t">⏺</span> boot.sh runs 2,000 resamples, about an hour. Submit it?'],
    [T.ask-.2,'<span class="gl-t">⏺</span> Bash(sbatch boot.sh)'],
    [T.submit,'  <span class="gl-r">⎿ Submitted batch job 81225</span>'],
    [T.done,'<span class="gl-t">⏺</span> Done: the bootstrap band is on the plot in results/fit.svg']];
  var BOX='<span class="gl-ph">jail · fit mixed model asks</span><div class="gl-l gl-c">sbatch --partition=cpu boot.sh</div>'+
    '<div class="gl-l"><span class="gl-k">resources</span><span class="gl-v">partition cpu · time 02:00:00 · mem 32G · cpus 16</span></div>'+
    '<div class="gl-l"><span class="gl-k">writes</span><span class="gl-v">on the node: rw ~/analysis</span></div>'+
    SCRIPT.map(function(l){return '<div class="gl-l">'+l+'</div>'}).join('')+
    '<div class="gl-a"><span>submit</span><kbd>⏎</kbd></div><div class="gl-a"><span>refuse</span><kbd>⎋</kbd></div>';
  var PV='<span class="gl-ph">boot.sh:1</span>'+SCRIPT.map(function(l,i){return '<span class="gl-r">'+(i+1)+'</span>  '+l}).join('\n')+'\n<div class="gl-ft">sh · 8 lines · 196 B · written 17:24</div>';
  var BADGES=[[T.enter,'⏎'],[T.sqEnter,'⏎'],[T.hover,'⌘',T.pvEnd],[T.hoverR,'⌘',T.open+.4],[T.zoom,'⌘⏎'],[T.unzoom,'⌘⏎'],[T.close,'⌘W'],[T.enter2,'⏎'],[T.jump,'⌘⇧A'],[T.submit,'⏎'],
    [T.hist,'⌘⇧Y'],[T.histEnd,'⌘⇧Y'],[T.z1,'⌘='],[T.z2,'⌘='],[T.z0,'⌘0'],[T.p2,'⌘2'],[T.p1,'⌘1']];
  // the pointer: shown from half a second before it moves until half a second after its click (or its rest); before the move it waits below the target
  var POINTS=[{t0:T.click-.4,tc:T.click,el:function(){return shell}},{t0:8.8,tc:T.pvEnd-.5,el:function(){return el('lnk')},rest:true},{t0:T.hoverR-.4,tc:T.open,el:function(){return el('lnkr')}},
    {t0:T.shell2-.4,tc:T.shell2,el:function(){return shell}},{t0:T.resClick-.4,tc:T.resClick,el:function(){return fig},fig:true}];
  function esc(x){return x.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function slice(s,t,t0,t1){return s.slice(0,Math.max(0,Math.min(s.length,Math.round((t-t0)/(t1-t0)*s.length))))}
  function setGlyph(cls,ch){glyphs.forEach(function(g){g.className='gl-g'+(cls?' gl-'+cls:'');g.textContent=ch});
    agent.classList.toggle('gl-st-work',cls==='work');agent.classList.toggle('gl-st-need',cls==='need');sideS1.classList.toggle('gl-st-work',cls==='work');sideS1.classList.toggle('gl-st-need',cls==='need')}
  var last={};function put(node,key,html){if(last[key]===html)return;last[key]=html;node.innerHTML=html}
  function render(t){
    // the agent pane: the first prompt, the turns, the second prompt
    var typed=t<T.type0?'':slice(PROMPT,t,T.type0,T.type1),out='<span class="gl-u">❯ '+esc(typed)+(t<T.enter?'▍':'')+'</span>';
    if(t>=T.enter){out+='\n';LINES.forEach(function(l){if(t>=l[0]&&l[0]<T.t2a)out+='\n'+l[1]});
      if(t>=T.t2a){out+='\n<span class="gl-u">❯ '+esc(slice(PROMPT2,t,T.t2a,T.t2b))+(t<T.enter2?'▍':'')+'</span>';
        if(t>=T.enter2){out+='\n';LINES.forEach(function(l){if(t>=l[0]&&l[0]>=T.t2a)out+='\n'+l[1]})}}}
    put(apOut,'ap',out);
    // the preview box over boot.sh; boot.R in the editor pane, zoomed; the dock; the other project
    var showPv=t>=T.pv&&t<T.pvEnd;if(showPv){put(pv,'pv',PV);var l=el('lnk');if(l){var a0=agent.getBoundingClientRect(),r0=l.getBoundingClientRect();pv.style.left=Math.round(r0.left-a0.left+12)+'px';pv.style.top=Math.round(r0.bottom-a0.top+6)+'px'}}pv.hidden=!showPv;
    var split=t>=T.open+.3&&t<T.close,zoom=t>=T.zoom&&t<T.unzoom+.14,hs=t>=T.hist+.1&&t<T.histEnd,p2=t>=T.p2+.2&&t<T.p1+.2;
    // the zoom's glide: 140 ms ease-out in and out (the app's), the editor's rectangle between its slot and the whole stage
    var zp=!zoom?0:t<T.unzoom?Math.min(1,(t-T.zoom)/.14):1-Math.min(1,(t-T.unzoom)/.14);zp=1-Math.pow(1-zp,3);
    if(zoom){var st=stage.getBoundingClientRect(),ag=agent.getBoundingClientRect(),sh=shell.getBoundingClientRect(),rs=res.getBoundingClientRect();
      var a1={x:ag.left-st.left,y:rs.top-st.top,w:ag.width,h:rs.height},b1={x:ag.left-st.left,y:ag.top-st.top,w:sh.right-ag.left,h:rs.bottom-ag.top};
      ed.style.left=Math.round(a1.x+(b1.x-a1.x)*zp)+'px';ed.style.top=Math.round(a1.y+(b1.y-a1.y)*zp)+'px';ed.style.width=Math.round(a1.w+(b1.w-a1.w)*zp)+'px';ed.style.height=Math.round(a1.h+(b1.h-a1.h)*zp)+'px'}
    else ed.style.cssText='';
    app.classList.toggle('gl-split',split);app.classList.toggle('gl-zoom',zoom);app.classList.toggle('gl-zoomed',zoom&&zp>=.999&&t<T.unzoom);app.classList.toggle('gl-hist',hs);ed.hidden=!split;ov.hidden=!(zoom&&t<T.unzoom);
    app.classList.toggle('gl-p2',p2);p1s.forEach(function(e){e.hidden=p2});p2s.forEach(function(e){e.hidden=!p2});proj.textContent=p2?'thesis-figs':'analysis';
    sideS1.classList.toggle('gl-on',!p2);sideS2.classList.toggle('gl-on',p2);
    // the jail's box: from the sbatch until it is submitted
    var asking=t>=T.ask&&t<T.submit;if(asking)put(box,'box',BOX);box.hidden=!asking;
    // the shell
    var sq=t<T.sq0?'':slice(SQ,t,T.sq0,T.sq1),sh='<span class="gl-r">$</span> <span class="gl-u">'+esc(sq)+(t<T.sqEnter?'▍':'')+'</span>';
    if(t>=T.sqEnter)sh+='\n<span class="gl-r">  JOBID  NAME     ST  TIME</span>\n  81223  qc       R   1:02:17\n  81224  qc       PD  0:00'+(t>=T.submit+.6?'\n  81225  boot     R   0:0'+Math.min(9,Math.floor((t-T.submit-.6)*2)):'')+'\n<span class="gl-r">$</span> <span class="gl-u">▍</span>';
    put(shOut,'sh',sh);
    // status: the glyphs, the frames (decisions 32 and 33) and the counts
    var st=t<T.enter?'idle':t<T.ready?'work':t<T.enter2?'done':asking?'need':t<T.done?'work':'done';
    setGlyph(st==='idle'?'':st,{idle:'○',work:'●',need:'!',done:'✓'}[st]);
    nWork.textContent=st==='work'?1:0;nNeed.textContent=1+(st==='need'?1:0);nDone.textContent=1+(st==='done'?1:0);
    // focus: the shell after its click, the editor while open, the agent again with ⌘⇧A, the history while open, the results pane after its click
    var f=t>=T.click&&t<T.open+.3?'shell':split?'ed':t>=T.shell2&&t<T.jump?'shell':hs?'dock':t>=T.resClick&&t<LEN-.3?'res':'agent';
    agent.classList.toggle('gl-focus',f==='agent');shell.classList.toggle('gl-focus',f==='shell');ed.classList.toggle('gl-focus',f==='ed');res.classList.toggle('gl-focus',f==='res');
    // the plot lands: the results pane follows, the sidebar row says it is new; then the zoom steps around the pointer and the navigator
    resPop.style.display=t>=T.plot?'':'none';sideRes.classList.toggle('gl-new',t>=T.plot&&t<T.plot+1.6);
    var z=t>=T.z0?1:t>=T.z2?2:t>=T.z1?1.41:1;fig.firstElementChild.style.transform=z===1?'':'scale('+z+')';resZ.textContent=z===1?'':Math.round(z*100)+' %';
    nav.hidden=z===1;if(z!==1){var s=100/z;navBox.style.left=(86*(1-1/z))+'%';navBox.style.top=(40*(1-1/z))+'%';navBox.style.width=s+'%';navBox.style.height=s+'%'}
    // the link
    var down=t>=T.down&&t<T.up;app.classList.toggle('gl-down',down);env.textContent=down?'reconnecting login1 · '+Math.floor(t-T.down+1)+' s':'r-env · login1';
    // the key badge and the pointer
    var b=null;BADGES.forEach(function(x){if(t>=x[0]&&t<(x[2]||x[0]+.9))b=x[1]});kb.textContent=b||kb.textContent;kb.classList.toggle('gl-on',!!b);
    var pt=null;POINTS.forEach(function(x){if(t>=x.t0-.5&&t<x.tc+.5)pt=x});ptr.classList.toggle('gl-on',!!pt);ptr.classList.toggle('gl-click',!!pt&&!pt.rest&&t>=pt.tc&&t<pt.tc+.3);
    if(pt){var tg=pt.el(),a=app.getBoundingClientRect(),r=tg?tg.getBoundingClientRect():a,from=t<pt.t0,inl=tg&&(tg.id==='gl-lnk'||tg.id==='gl-lnkr');
      var x=from?r.left-60:pt.fig?r.left+r.width*.86:inl?r.left+r.width/2:r.left+r.width*.55,y=from?r.bottom+40:pt.fig?r.top+r.height*.4:inl?r.top+r.height/2:r.top+r.height*.45;
      ptr.style.transform='translate('+Math.round(x-a.left-5)+'px,'+Math.round(y-a.top-5)+'px)'}
    app.classList.toggle('gl-fade',t>LEN-.18||t<.14);
  }
  var playing=false,seen=false,paused=false,base=0,t0=0,raf=0;
  function frame(now){if(!playing)return;var t=(base+(now-t0)/1000)%LEN;render(t);raf=requestAnimationFrame(frame)}
  function start(){if(playing)return;playing=true;t0=performance.now();raf=requestAnimationFrame(frame)}
  function stop(){if(!playing)return;playing=false;base=(base+(performance.now()-t0)/1000)%LEN;cancelAnimationFrame(raf)}
  function update(){if(seen&&!paused&&!document.hidden&&!reduced.matches)start();else stop()}
  band.classList.add('gl-play');render(0);
  new IntersectionObserver(function(es){seen=es[es.length-1].isIntersecting;update()},{threshold:.25}).observe(app);
  document.addEventListener('visibilitychange',update);
  app.addEventListener('click',function(){paused=!paused;update()});
  reduced.addEventListener('change',function(){if(reduced.matches){paused=true;update()}});
}

/* ---------- start: the field's context once the band is first in view (in the upper four fifths of the window, so a sliver
   at the foot of the first screen does not start it); then the window, unless motion is reduced ---------- */
if(!('IntersectionObserver' in window))return;
var field=null,begun=false;
new IntersectionObserver(function(es){var v=es[es.length-1].isIntersecting;
  if(v&&!begun){begun=true;
    if(!/[?&]nogl/.test(location.search)){try{field=calcium()}catch(e){field=null;var c=band.querySelector('.gl-field');if(c)c.remove()}}
    if(!field){band.classList.add('gl-nogl');return}
    band.classList.add('gl-gl');
    if(!reduced.matches)play()}
  if(field)field.seen(v)},{rootMargin:'0px 0px -20% 0px'}).observe(band);
})();

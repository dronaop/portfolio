/**
 * GLSL for the Signals voyage: lit planets (simplex-noise surfaces with
 * relief, clouds and night lights), their atmospheres and halos, one ring,
 * and the black hole's accretion disk. Colors arrive as raw sRGB
 * and are written straight out (no tone mapping), so they match the hero
 * shader's palette exactly.
 */

const NOISE = /* glsl */ `
float hash(vec3 p) {
  p=fract(p*.3183099+.1);
  p*=17.;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float noise(vec3 x) {
  vec3 i=floor(x), f=fract(x);
  f=f*f*(3.-2.*f);
  return mix(
    mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
    f.z);
}
float fbm(vec3 p) {
  float t=0., a=.5;
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p=p*2.03+vec3(1.7,9.2,3.1);
    a*=.5;
  }
  return t;
}
`;

/** 3D simplex noise, -1..1 (Ian McEwan, Ashima Arts; MIT license). */
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x) { return x-floor(x*(1./289.))*289.; }
vec4 mod289(vec4 x) { return x-floor(x*(1./289.))*289.; }
vec4 permute(vec4 x) { return mod289(((x*34.)+1.)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159-.85373472095314*r; }
float snoise(vec3 v) {
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  vec3 ns=.142857142857*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

/** The air at a planet's edge, shared by its surface (fading into it at the
 *  limb) and its atmosphere shell (fading out of it into space), so the two
 *  meet at exactly the same brightness and the edge has no hard step. */
const AIR = /* glsl */ `
vec3 airAt(vec3 color, float nl) {
  return mix(color,vec3(.8,.9,1.),.15)*(.1+.8*smoothstep(-.4,.7,nl))*.85;
}
`;

/** World-space normal and view direction, for shells and halos. */
export const shellVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world=modelMatrix*vec4(position,1.);
  vNormal=normalize(mat3(modelMatrix)*normal);
  vView=normalize(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

/** Lights a planet in its own (turning) space: the sun and the camera are
 *  brought into it, so the surface, its relief and its lighting all turn
 *  together. */
export const planetVertex = /* glsl */ `
uniform vec3 uLight;
varying vec3 vPos;
varying vec3 vSun;
varying vec3 vView;
void main() {
  vPos=position;
  vec4 world=modelMatrix*vec4(position,1.);
  mat3 toObject=transpose(mat3(modelMatrix));
  vSun=toObject*uLight;
  vView=toObject*(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

/** A planet's surface, by kind:
 *  0 — a gas giant: turbulent bands and a great storm eye.
 *  1 — cracked basalt over molten rock, its veins glowing.
 *  2 — oceans and continents under drifting clouds that cast shadows, a
 *      glint of sun on the water, and lights on the night side.
 *  3 — thick, swirling golden storm clouds.
 *  Lit by one sun with real relief (bump from the height field where there
 *  is ground), a warm band along the terminator, and haze toward the limb. */
export const planetFragment = /* glsl */ `
uniform int uKind;
uniform vec3 uColor;
uniform float uTime;
uniform int uOctaves;
varying vec3 vPos;
varying vec3 vSun;
varying vec3 vView;
${SIMPLEX}
${AIR}
float fbm(vec3 p) {
  float t=0., a=.5;
  for (int i=0; i<8; i++) {
    if (i>=uOctaves) break;
    t+=a*snoise(p);
    p=p*2.02+vec3(3.1,1.7,5.3);
    a*=.5;
  }
  return t;
}
// Sharp ridges where the noise crosses zero: a network of cracks.
float ridged(vec3 p) {
  float t=0., a=.5;
  for (int i=0; i<8; i++) {
    if (i>=uOctaves) break;
    float n=1.-abs(snoise(p));
    t+=a*n*n;
    p=p*2.07+vec3(1.3,7.1,2.9);
    a*=.5;
  }
  return t;
}
float basalt(vec3 p) { return .55*fbm(p*3.)-.7*pow(ridged(p*2.4),5.); }
float terrain(vec3 q) { return fbm(q*2.2); }
// Tilts normal N by the slope of a height field sampled around p.
vec3 bump(vec3 N, vec3 T, vec3 B, float h, float hT, float hB, float e, float strength) {
  return normalize(N-strength*((hT-h)/e*T+(hB-h)/e*B));
}
void main() {
  vec3 p=normalize(vPos), N=p, L=normalize(vSun), V=normalize(vView);
  vec3 T=normalize(cross(abs(p.y)<.99?vec3(0,1,0):vec3(1,0,0),p)), B=cross(p,T);
  const float E=.004;
  float nl=dot(N,L);
  vec3 Nb=N;
  vec3 albedo;
  vec3 emit=vec3(0);
  float spec=0., relief=1.;

  if (uKind==0) {
    float warp=fbm(p*vec3(1.5,4.,1.5)+vec3(0,0,uTime*.01));
    float lat=p.y+.07*warp+.012*snoise(p*vec3(3.,40.,3.));
    float bands=.5+.26*sin(lat*19.)+.14*sin(lat*47.+1.3)+.08*sin(lat*103.+.7);
    bands+=.06*snoise(p*vec3(2.,70.,2.)+warp);
    vec3 cream=mix(uColor,vec3(1.),.8);
    albedo=mix(uColor*.28,uColor*.62,smoothstep(.2,.5,bands));
    albedo=mix(albedo,mix(uColor,vec3(1.),.45),smoothstep(.5,.72,bands));
    albedo=mix(albedo,cream,smoothstep(.74,.95,bands)*.7);
    // On the face the camera sees first, in the sun.
    vec3 eyeAt=normalize(vec3(-.3,-.28,.9));
    float eye=length((p-eyeAt)*vec3(1.,2.1,1.));
    float storm=smoothstep(.2,.04,eye);
    vec3 swirl=mix(cream,uColor*.4,.5+.5*sin(eye*70.+warp*5.));
    albedo=mix(albedo,swirl,storm*.8);
    albedo=mix(albedo,cream,smoothstep(.045,0.,eye));
  } else if (uKind==1) {
    float h=basalt(p);
    Nb=bump(N,T,B,h,basalt(p+E*T),basalt(p+E*B),E,.05);
    float crust=fbm(p*3.);
    albedo=mix(vec3(.07,.045,.035),vec3(.3,.2,.15),smoothstep(-.5,.6,crust))+uColor*.05;
    float veins=pow(ridged(p*2.4),3.5);
    float fissures=pow(ridged(p*6.+3.),6.);
    emit=mix(uColor,vec3(1.,.86,.55),smoothstep(.45,.85,veins))*(smoothstep(.12,.6,veins)*1.8+fissures*.6);
  } else if (uKind==2) {
    vec3 q=p+.3*vec3(fbm(p*1.5),fbm(p*1.5+4.3),fbm(p*1.5+8.1));
    float h=terrain(q);
    float land=smoothstep(.04,.09,h);
    vec3 sea=mix(uColor*.1+vec3(0.,.015,.04),uColor*.45,smoothstep(-.25,.06,h));
    vec3 ground=mix(vec3(.09,.15,.11),vec3(.42,.37,.27),smoothstep(.15,.45,h));
    albedo=mix(sea,ground,land);
    albedo=mix(albedo,vec3(.9,.94,.97),smoothstep(.76,.86,abs(p.y)));
    Nb=bump(N,T,B,h,terrain(q+E*T),terrain(q+E*B),E,.035*land);
    spec=1.-land;
    vec3 drift=vec3(uTime*.012,0.,0.);
    float clouds=smoothstep(.05,.5,fbm(p*3.+q*1.5+drift));
    float shade=smoothstep(.05,.5,fbm((p-L*.03)*3.+q*1.5+drift));
    albedo*=1.-.45*shade;
    albedo=mix(albedo,vec3(.95,.97,1.),clouds*.92);
    Nb=normalize(mix(Nb,N,clouds));
    spec*=1.-clouds;
    float night=1.-smoothstep(-.25,.02,nl);
    float cities=smoothstep(.55,.8,snoise(q*70.))*smoothstep(0.,.5,snoise(q*9.))*land*(1.-clouds);
    emit=vec3(1.,.8,.52)*cities*night*1.8;
  } else {
    vec3 q=p+.45*vec3(fbm(p*1.3+uTime*.004),fbm(p*1.3+5.2),fbm(p*1.3+9.7));
    vec3 r=q+.22*vec3(fbm(q*2.6),fbm(q*2.6+3.3),fbm(q*2.6+7.1));
    float n=fbm(r*2.4+vec3(0.,p.y*3.,0.));
    albedo=mix(uColor*.42,uColor*.92,smoothstep(-.7,.6,n));
    albedo=mix(albedo,vec3(1.,.96,.86),smoothstep(.4,.85,n)*.5);
    relief=.8+.35*smoothstep(-.3,.6,n);
  }

  // Toward the rim the surface is seen edge-on, so fine detail would crowd
  // into a few pixels and sparkle: it fades into its average color instead.
  float nv=max(dot(N,V),0.);
  float grazing=1.-smoothstep(.04,.4,nv);
  albedo=mix(albedo,uColor*.45,grazing*.6);
  emit*=1.-grazing;
  spec*=1.-grazing;

  float terminator=smoothstep(-.1,.2,nl);
  float light=terminator*(.2+.85*clamp(dot(Nb,L)*1.1,0.,1.))*relief;
  vec3 col=albedo*light+albedo*.012;
  vec3 sunset=mix(vec3(1.,.55,.3),uColor,.35);
  col+=albedo*sunset*exp(-pow((nl-.03)/.09,2.))*.5;
  col+=spec*terminator*pow(max(dot(reflect(-L,Nb),V),0.),60.)*vec3(1.,.95,.85)*.9;
  col=mix(col,airAt(uColor,nl),pow(1.-nv,3.));
  col+=emit*(1.-.75*terminator);
  gl_FragColor=vec4(col,1.);
}
`;

/** A shell of air around a planet, rendered from the inside so only the
 *  part beyond the planet's edge shows: starting from the same air the
 *  surface fades into at its limb, then thinning smoothly out to space. */
export const atmosphereFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLight;
varying vec3 vNormal;
varying vec3 vView;
${AIR}
void main() {
  vec3 N=normalize(vNormal), V=normalize(vView);
  float d=clamp(-dot(N,V)/.49,0.,1.);
  gl_FragColor=vec4(airAt(uColor,dot(N,normalize(uLight)))*d*d,1.);
}
`;

/** Ring geometry: its own plane for the bands, the world for shadows. */
export const ringVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vWorld;
void main() {
  vPos=position;
  vec4 world=modelMatrix*vec4(position,1.);
  vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const quadVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv=uv;
  vPos=position;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
`;

/** A soft round glow on a camera-facing quad. */
export const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float d=length(vUv-.5)*2.;
  float a=exp(-d*d*5.)*(1.-smoothstep(.7,1.,d));
  gl_FragColor=vec4(uColor*a*uStrength,1.);
}
`;

/** A ring of fine bands with a dark gap, faint at its edges and finely
 *  grained, with the planet's shadow falling across it. */
export const ringFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
uniform vec3 uCenter;
uniform float uRadius;
uniform vec3 uLight;
varying vec3 vPos;
varying vec3 vWorld;
${NOISE}
void main() {
  float t=(length(vPos.xy)-uInner)/(uOuter-uInner);
  float bands=.6+.4*noise(vec3(t*55.,0.,0.));
  bands*=.75+.25*sin(t*26.+sin(t*7.)*2.);
  bands*=.82+.18*noise(vec3(t*420.,0.,0.));
  float a=bands*smoothstep(0.,.1,t)*smoothstep(1.,.75,t)*(1.-.7*smoothstep(.4,.48,t)*smoothstep(.56,.48,t));
  vec3 L=normalize(uLight), toCenter=uCenter-vWorld;
  float along=dot(toCenter,L);
  float shadow=along>0.?smoothstep(uRadius*1.03,uRadius*.95,length(toCenter-L*along)):0.;
  gl_FragColor=vec4(mix(uColor,vec3(1.),.4)*a*.6*(1.-.88*shadow),1.);
}
`;

/** The black hole, ray traced on a camera-facing quad. Each pixel's light
 *  ray is followed backwards from the camera as gravity bends it (the
 *  Schwarzschild photon orbit, in units of the horizon radius `uRs`):
 *  rays that fall below the horizon are black, and every time a ray
 *  crosses the accretion disk's plane it picks up that bit of disk. So the
 *  disk's far side shows arched over and under the shadow, a thin photon
 *  ring hugs it, and the side of the disk turning toward the camera is
 *  brighter (Doppler beaming). Output is premultiplied: the shadow hides
 *  what is behind it, the disk glows over it. */
export const holeVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world=modelMatrix*vec4(position,1.);
  vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const holeFragment = /* glsl */ `
uniform vec3 uCenter;
uniform float uRs;
uniform vec3 uNormal;
uniform vec3 uAxis;
uniform float uTime;
varying vec3 vWorld;
${NOISE}

// In horizon radii: the disk from the innermost stable orbit outward, and
// how far out light is bent enough to bother tracing.
const float INNER=3.;
const float OUTER=10.;
const float BOUND=14.;

// Disk light where a ray crosses it, at q, travelling along dir.
vec4 diskAt(vec3 q, vec3 dir) {
  float r=length(q), t=(r-INNER)/(OUTER-INNER);
  if(t<0.||t>1.) return vec4(0.);
  // Inner gas laps the outer (Kepler), streaking it around.
  float a=atan(dot(q,cross(uNormal,uAxis)),dot(q,uAxis))-uTime*.9*pow(INNER/r,1.5);
  vec2 around=vec2(cos(a),sin(a));
  float streaks=.35+.65*noise(vec3(around*3.,r*2.2))*(.6+.4*noise(vec3(around*9.,r*7.+5.)));
  // Orbital speed (as a fraction of light's), and how much that brightens
  // the gas coming at the camera and dims the gas going away.
  float beta=sqrt(.5/r);
  vec3 orbit=normalize(cross(uNormal,q));
  float shift=sqrt(1.-beta*beta)/(1.-beta*dot(orbit,-dir));
  float heat=pow(1.-t,1.7)*sqrt(1.-1./r);
  vec3 col=mix(vec3(1.,.42,.12),vec3(1.,.93,.8),pow(1.-t,3.));
  col=mix(col,vec3(.95,.97,1.),clamp((shift-1.)*1.5,0.,1.));
  float edge=smoothstep(0.,.05,t)*smoothstep(1.,.55,t);
  float density=clamp(heat*streaks*2.2,0.,.95)*edge;
  return vec4(col*heat*streaks*pow(shift,2.5)*3.,density);
}

void main() {
  vec3 dir=normalize(vWorld-cameraPosition);
  vec3 p=(cameraPosition-uCenter)/uRs;
  // Far out light runs straight, so start at the edge of the bent region.
  float b=dot(p,dir), c=dot(p,p)-BOUND*BOUND;
  if(c>0.) {
    float h=b*b-c;
    if(h<0.||b>0.) discard;
    p+=dir*(-b-sqrt(h));
  }
  vec3 v=dir;
  vec3 spin=cross(p,v);
  float h2=dot(spin,spin);
  vec3 col=vec3(0.);
  float cover=0.;
  for(int i=0;i<140;i++) {
    float r=length(p);
    if(r<1.) { cover=1.; break; }
    if(r>BOUND+.5&&dot(p,v)>0.) break;
    float dt=clamp(.08*r,.02,1.);
    vec3 prev=p;
    v+=-1.5*h2*p/pow(r,5.)*dt;
    p+=v*dt;
    float s0=dot(prev,uNormal), s1=dot(p,uNormal);
    if(s0*s1<0.) {
      vec4 disk=diskAt(mix(prev,p,s0/(s0-s1)),normalize(v));
      col+=(1.-cover)*disk.rgb*disk.a;
      cover+=(1.-cover)*disk.a;
      if(cover>.98) break;
    }
  }
  gl_FragColor=vec4(1.-exp(-col*1.4),cover);
}
`;

const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8');const end=source.indexOf('/*HELPERS-END*/');const sandbox={document:{documentElement:{lang:'en'}},window:{},console};vm.runInNewContext(source.slice(0,end)+'})();',sandbox);const M=sandbox.window.MathLabs;let count=0;
function near(a,b,t=1e-10){assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);count++;}
function values(a,b){assert.deepEqual(Array.from(a),b);count++;}
values(M.homology(3,[],[]),[3,0,0]);values(M.homology(3,[[0,1],[1,2],[0,2]],[]),[1,1,0]);values(M.homology(3,[[0,1],[1,2],[0,2]],[[0,1,2]]),[1,0,0]);values(M.homology(4,[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]),[1,0,1]);
for(const [a,b] of [[1,1],[4,2],[8,8],[38,38]]){const n=10000,dx=1/n;let integral=0,mean=0;for(let i=0;i<n;i++){const x=(i+.5)*dx,y=M.betaDensity(x,a,b);integral+=y*dx;mean+=x*y*dx;}near(integral,1,1e-6);near(mean,a/(a+b),1e-6);}
near(M.logistic(2,.2,100).at(-1),.5);assert.ok(M.logistic(4,.231,100).every(x=>x>=0&&x<=1));count++;
const coarse=M.ode(.1),fine=M.ode(.05),exact=Math.exp(-10);assert.ok(Math.abs(fine.r.at(-1)[1]-exact)<Math.abs(coarse.r.at(-1)[1]-exact));count++;near(M.ode(.5).e[1][1],-1.5);near(M.ode(.5).e.at(-1)[1],5.0625);
for(const cheb of [0,1]){const p=M.interpolation(10,cheb);p.xs.forEach((x,i)=>near(p.f(x),p.ys[i]));}const eq=M.interpolation(10,0),ch=M.interpolation(10,1);assert.ok(Math.abs(ch.f(.95)-1/(1+25*.95**2))<Math.abs(eq.f(.95)-1/(1+25*.95**2)));count++;
near(M.gcd(6,2),2);near(M.gcd(12,0),12);
const data=JSON.parse(fs.readFileSync(__dirname+'/content.json'));const nAdd=fs.existsSync(__dirname+'/additions')?fs.readdirSync(__dirname+'/additions').filter(f=>f.endsWith('.py')).length:0;assert.equal(data.length,36+nAdd);assert.equal(data.reduce((s,t)=>s+t.labs.length,0),110+3*nAdd);assert.equal(new Set(data.map(t=>t.slug)).size,data.length);count+=3;
// Models behind the six topics added in 2026-09: load each topic module with a stub kit and check the mathematics.
const stub={clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),T:(a)=>a,seq:(n,f)=>Array.from({length:n},(_,i)=>f(i)),fmt:String,ja:false};
const W={Lab:stub};for(const slug of ['lie-groups','hamiltonian-mechanics','stochastic-processes','solid-state-physics','control-theory','logic-computability'])vm.runInNewContext(fs.readFileSync(`${__dirname}/topics/${slug}.js`,'utf8'),{window:W,Math,Array,Object,Number,String,Map,Float64Array,BigInt,console});
const ok=(c,msg)=>{assert.ok(c,msg);count++;};
{const G=W.LabModels['lie-groups'];const n=[0.36,0.48,0.8];
 const R=G.rot(n,1.1),S=G.expSeries(n,1.1,30);R.forEach((r,i)=>r.forEach((x,j)=>near(x,S[i][j],1e-12)));
 near(G.orthErr(R),0,1e-12);ok(G.orthErr(G.expSeries(n,2,3))>0.1,'truncated series is not orthogonal');
 const C=G.commutator(0.01),ax=G.axisOf(C);near(G.angleOf(C)/1e-4,1,1e-3);near(ax[2],-1,1e-4);
 const q=G.quat([1,0,0],2*Math.PI);near(q[0],-1,1e-12);const v=G.qrot(q,[0.2,0.5,-0.3]);near(v[1],0.5,1e-12);
 for(const u of [0.3,0.6,1]){const e=G.ribbonQ(1,720,u);near(e[0],1,1e-9);}const f=G.ribbonQ(0.5,720,1);near(f[0],1,1e-9);}
{const H=W.LabModels['hamiltonian-mechanics'];const fr=H.flowDisc(1.5,0.3,0.4,8);near(H.shoelace(fr.at(-1))/H.shoelace(fr[0]),1,5e-3);
 const lf=H.integrateKepler('leapfrog',0.5,0.1,200*2*Math.PI),rk=H.integrateKepler('rk4',0.5,0.1,200*2*Math.PI),eu=H.integrateKepler('euler',0.5,0.05,6*2*Math.PI);
 ok(Math.max(...lf.errs.map(x=>Math.abs(x[1])))<0.05,'leapfrog energy bounded');ok(rk.final<-0.02,'RK4 loses energy');ok(eu.final>0.1,'Euler gains energy');
 const r0=H.integrateRipple(0,3,40);const Ls=r0.map(s=>s.L);near(Math.max(...Ls)-Math.min(...Ls),0,1e-9);
 const r1=H.integrateRipple(0.3,3,40);ok(Math.max(...r1.map(s=>s.L))-Math.min(...r1.map(s=>s.L))>0.05,'ripple breaks L');const Es=r1.map(s=>s.E);near(Math.max(...Es)-Math.min(...Es),0,1e-3);
 const h=1e-6,x=0.7,y=-0.4;const F=H.rippleForce(x,y,0.3,3);near(F[0],-(H.rippleV(x+h,y,0.3,3)-H.rippleV(x-h,y,0.3,3))/(2*h),1e-7);near(F[1],-(H.rippleV(x,y+h,0.3,3)-H.rippleV(x,y-h,0.3,3))/(2*h),1e-7);}
{const P=W.LabModels['stochastic-processes'];const B=P.brownian(14,3);const v14=P.variations(B,14);near(v14.qv,1,0.05);near(v14.strat,B[B.length-1]**2/2,1e-9);near(v14.strat-v14.ito,v14.qv/2,1e-9);
 const r=P.rng(5);let m=0,s2=0;const N=4000;for(let i=0;i<N;i++){const e=P.walkEnd(256,r);m+=e;s2+=e*e;}near(s2/N,1,0.08);near(m/N,0,0.06);
 near(P.ouVar(1,1,50),0.5,1e-9);near(P.ouVar(2,1e-12,3),12,1e-6);const paths=P.ouPaths(1.5,1,1,4,0.02,600,11);const xs=paths.map(p=>p[50]);const mm=xs.reduce((a,b)=>a+b)/600;near(mm,P.ouMean(1.5,1,1),0.08);}
{const S=W.LabModels['solid-state-physics'];near(S.sshE(1,0.5,Math.PI),0.5,1e-12);near(S.sshE(1,0.5,0),1.5,1e-12);
 for(const E of [0.5,3,7.7,20])near(S.kpF(E,0,0.3),Math.cos(Math.sqrt(E)),1e-9);
 const bands=S.kpBands(20,0.2,45);ok(bands.length>=2&&bands[0][1]<bands[1][0],'Kronig-Penney has a gap');
 const [b1,b2]=S.reciprocal([1,0],[0.5,Math.sqrt(3)/2]);near(b1[0]*1+b1[1]*0,2*Math.PI,1e-12);near(b1[0]*0.5+b1[1]*Math.sqrt(3)/2,0,1e-12);near(b2[0]*0.5+b2[1]*Math.sqrt(3)/2,2*Math.PI,1e-12);
 const Gs=[];for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){if(!i&&!j)continue;const gx=i*b1[0]+j*b2[0],gy=i*b1[1]+j*b2[1];Gs.push([gx,gy,gx*gx+gy*gy]);}Gs.sort((a,b)=>a[2]-b[2]);
 ok(S.zoneIndex(0.1,0.1,Gs)===1,'origin neighbourhood is zone 1');const bz=4*Math.PI**2/(Math.sqrt(3)/2);let area=[0,0,0,0];const R=9,n=400;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=-R+(i+0.5)*2*R/n,y=-R+(j+0.5)*2*R/n,z=S.zoneIndex(x,y,Gs);if(z<=3)area[z]+=(2*R/n)**2;}for(let z=1;z<=3;z++)near(area[z]/bz,1,0.02);}
{const K=W.LabModels['control-theory'];near(K.step2(-0.8,2.5,Math.PI/2.5),1+Math.exp(Math.PI*-0.8/2.5),1e-12);near(K.step2(-1,0,0),0,1e-12);
 const rts=K.roots([1,-6,11,-6]).map(z=>z[0]).sort((a,b)=>a-b);near(rts[0],1,1e-9);near(rts[1],2,1e-9);near(rts[2],3,1e-9);
 const m8=K.margins(8,0);near(m8.w180,Math.sqrt(3),1e-9);near(m8.gm,1,1e-9);ok(K.encirclements(4,0)===0&&K.encirclements(9,0)===2,'Nyquist count');
 const run=K.simulatePID(1.5,0.6,1);near(run.at(-1)[1],1,1e-3);ok(K.pidPoles(1.5,0.6,1).every(z=>z[0]<0),'tuned loop stable');ok(K.pidPoles(6,3,0).some(z=>z[0]>0),'high gain unstable');}
{const C=W.LabModels['logic-computability'];const runs=C.MACHINES.map(m=>C.runMachine(m));
 const tape=(h)=>{const t=h.tape;const ks=[...t.keys()].sort((a,b)=>a-b);return ks.map(k=>t.get(k)).join('');};
 ok(tape(runs[0].at(-1))==='11000','10111 + 1 = 11000');ok(runs[1].length-1===6&&C.countOnes(runs[1].at(-1).tape)===4,'BB(2): 6 steps, 4 ones');ok(runs[2].length-1===107&&C.countOnes(runs[2].at(-1).tape)===13,'BB(4): 107 steps, 13 ones');ok(tape(runs[3].at(-1))==='11111','3 + 2 = 5');
 const tab=C.haltTable(9,4),d=C.diagonal(tab);ok(tab.every((row,i)=>row[i]!==d[i]),'D differs from every row');
 ok(C.godel(['0','=','0'])===243000000n,'Goedel number of 0 = 0');const f=['∀','x','(','x','=','x',')'];ok(C.decode(C.godel(f)).join('')===f.join(''),'decoding inverts coding');}

// Scheduled additions: checks/<slug>.cjs exports (Model, {ok, near, values}) => void; every addition must have one.
if(fs.existsSync(__dirname+'/additions'))for(const f of fs.readdirSync(__dirname+'/additions').filter(f=>f.endsWith('.py')).sort()){const slug=f.replace(/^\d+-/,'').replace(/\.py$/,'');
 const chk=`${__dirname}/checks/${slug}.cjs`;assert.ok(fs.existsSync(chk),`missing checks/${slug}.cjs`);
 vm.runInNewContext(fs.readFileSync(`${__dirname}/topics/${slug}.js`,'utf8'),{window:W,Math,Array,Object,Number,String,Map,Set,Float64Array,Float32Array,Int32Array,Uint8Array,BigInt,console});
 const Mdl=W.LabModels&&W.LabModels[slug];assert.ok(Mdl,`topics/${slug}.js must export window.LabModels['${slug}']`);const before=count;require(chk)(Mdl,{ok,near,values});assert.ok(count-before>=4,`checks/${slug}.cjs ran fewer than 4 checks`);}
console.log(`${count} mathematical and content checks passed`);

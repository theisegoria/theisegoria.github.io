const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8');const end=source.indexOf('function chart(');const sandbox={document:{documentElement:{lang:'en'}},window:{},console};vm.runInNewContext(source.slice(0,end)+'})();',sandbox);const M=sandbox.window.MathLabs;let count=0;
function near(a,b,t=1e-10){assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);count++;}
function values(a,b){assert.deepEqual(Array.from(a),b);count++;}
values(M.homology(3,[],[]),[3,0,0]);values(M.homology(3,[[0,1],[1,2],[0,2]],[]),[1,1,0]);values(M.homology(3,[[0,1],[1,2],[0,2]],[[0,1,2]]),[1,0,0]);values(M.homology(4,[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]),[1,0,1]);
for(const [a,b] of [[1,1],[4,2],[8,8],[38,38]]){const n=10000,dx=1/n;let integral=0,mean=0;for(let i=0;i<n;i++){const x=(i+.5)*dx,y=M.betaDensity(x,a,b);integral+=y*dx;mean+=x*y*dx;}near(integral,1,1e-6);near(mean,a/(a+b),1e-6);}
near(M.logistic(2,.2,100).at(-1),.5);assert.ok(M.logistic(4,.231,100).every(x=>x>=0&&x<=1));count++;
const coarse=M.ode(.1),fine=M.ode(.05),exact=Math.exp(-10);assert.ok(Math.abs(fine.r.at(-1)[1]-exact)<Math.abs(coarse.r.at(-1)[1]-exact));count++;near(M.ode(.5).e[1][1],-1.5);near(M.ode(.5).e.at(-1)[1],5.0625);
for(const cheb of [0,1]){const p=M.interpolation(10,cheb);p.xs.forEach((x,i)=>near(p.f(x),p.ys[i]));}const eq=M.interpolation(10,0),ch=M.interpolation(10,1);assert.ok(Math.abs(ch.f(.95)-1/(1+25*.95**2))<Math.abs(eq.f(.95)-1/(1+25*.95**2)));count++;
near(M.gcd(6,2),2);near(M.gcd(12,0),12);
const data=JSON.parse(fs.readFileSync(__dirname+'/content.json'));assert.equal(data.length,8);assert.equal(data.reduce((s,t)=>s+t.labs.length,0),26);count+=2;
console.log(`${count} mathematical and content checks passed`);

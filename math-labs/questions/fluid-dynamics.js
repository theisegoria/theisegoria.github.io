'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI;

  // ---------- 1. potential-flow streamlines (singularities start at (−1, 0) and (1, 0)) ----------
  Q.streamlines = [
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const m = r.step(0.5, 2, 0.1), d = r.pick([0.25, 0.5, 1, 1.5, 2]), u = m / (2 * PI * d);
        return {
          q: [`A two-dimensional source of strength $m = ${n(m)}$ (area per unit time) sits alone in still fluid. What is the flow speed at distance $r = ${n(d)}$ from it? Give three decimals.`, `強さ $m = ${n(m)}$（単位時間あたりの面積）の二次元の湧き出しが、静止した流体の中に1つだけあります。そこから距離 $r = ${n(d)}$ での流れの速さを小数第3位まで求めてください。`],
          a: { type: 'num', v: u, tol: 6e-4 },
          hint: ['All the fluid produced crosses every circle around the source.', '湧き出した流体はすべて、湧き出しを囲むどの円も横切ります。'],
          sol: [[`The flux through a circle of radius $r$ is $2\\pi r\\,u = m$.`, `半径 $r$ の円を通る流量は $2\\pi r\\,u = m$ です。`], [`$u = m/(2\\pi r) = ${n(m)}/(2\\pi\\times ${n(d)}) = ${n(u, 4)}$: the speed falls like $1/r$ in two dimensions.`, `$u = m/(2\\pi r) = ${n(m)}/(2\\pi\\times ${n(d)}) = ${n(u, 4)}$ で、二次元では速さは $1/r$ に比例して減ります。`]],
          set: { source: m, sink: 0, uniform: 0 },
        };
      }
      if (k === 1) {
        const m = r.step(0.5, 2, 0.1), U = r.step(0.5, 2, 0.1), d = m / (2 * PI * U);
        return {
          q: [`A source of strength $m = ${n(m)}$ sits in a uniform stream $U = ${n(U)}$ flowing in $+x$. How far upstream of the source is the stagnation point? Give three decimals.`, `強さ $m = ${n(m)}$ の湧き出しが、$+x$ 向きの一様流 $U = ${n(U)}$ の中にあります。よどみ点は湧き出しの何だけ上流にありますか（小数第3位まで）。`],
          a: { type: 'num', v: d, tol: 6e-4 },
          hint: ['Upstream on the axis the source pushes back against the stream; find where the two speeds cancel.', '軸上の上流では湧き出しが流れを押し返します。2つの速さが打ち消し合う点を探してください。'],
          sol: [[`At distance $d$ upstream the source gives $-m/(2\\pi d)$, so $U = m/(2\\pi d)$.`, `上流の距離 $d$ では湧き出しが $-m/(2\\pi d)$ を与えるので、$U = m/(2\\pi d)$ です。`], [`$d = m/(2\\pi U) = ${n(m)}/(2\\pi\\times ${n(U)}) = ${n(d, 4)}$. With the source at $(-1, 0)$ the gold point sits at $x = ${n(-1 - d, 4)}$, the nose of a Rankine half-body.`, `$d = m/(2\\pi U) = ${n(m)}/(2\\pi\\times ${n(U)}) = ${n(d, 4)}$ です。湧き出しが $(-1, 0)$ にあれば金色の点は $x = ${n(-1 - d, 4)}$ にあり、ランキンの半無限物体の先端になります。`]],
          set: { source: m, sink: 0, uniform: U },
        };
      }
      const m1 = r.step(-2, 2, 0.1), m2 = r.step(-2, 2, 0.1);
      return {
        q: [`Strengths $m_1 = ${n(m1)}$ and $m_2 = ${n(m2)}$, plus a uniform stream. What net volume flux (per unit depth, per unit time) leaves a large circle enclosing both singularities?`, `強さ $m_1 = ${n(m1)}$ と $m_2 = ${n(m2)}$ に一様流が加わっています。両方の特異点を囲む大きな円から出ていく正味の流量（単位奥行き・単位時間あたり）はいくつですか。`],
        a: { type: 'num', v: m1 + m2, tol: 1e-6 },
        hint: ['A uniform stream enters one side of the circle and leaves the other.', '一様流は円の片側から入り、反対側から出ていきます。'],
        sol: [['The stream contributes nothing net, and each singularity contributes its strength.', '一様流の正味の寄与は 0 で、各特異点はその強さだけ寄与します。'], [`Net flux $= ${n(m1)} + ${n(m2)} = ${n(m1 + m2)}$, the readout\u2019s $m_1 + m_2$. ${Math.abs(m1 + m2) < 1e-9 ? 'Zero net outflow is what lets the dividing streamline close into an oval.' : 'Nonzero net outflow means the dividing streamline cannot close: the body is open downstream.'}`, `正味の流量 $= ${n(m1)} + ${n(m2)} = ${n(m1 + m2)}$ で、読み取り欄の $m_1 + m_2$ です。${Math.abs(m1 + m2) < 1e-9 ? '正味の湧き出しが 0 だからこそ、分離流線は閉じて楕円になります。' : '正味の湧き出しが 0 でないので分離流線は閉じず、物体は下流側に開いています。'}`]],
        set: { source: m1, sink: m2 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const m = r.step(0.5, 2, 0.1), U = r.step(0.3, 2, 0.1), xs = Math.sqrt(1 + m / (PI * U));
        return {
          q: [`A source $m = ${n(m)}$ at $(-1, 0)$ and a sink $-${n(m)}$ at $(1, 0)$ sit in a stream $U = ${n(U)}$. Where on the $x$ axis are the stagnation points? Give $|x|$ to three decimals.`, `湧き出し $m = ${n(m)}$ が $(-1, 0)$ に、吸い込み $-${n(m)}$ が $(1, 0)$ にあり、一様流 $U = ${n(U)}$ の中に置かれています。$x$ 軸上のよどみ点はどこですか。$|x|$ を小数第3位まで答えてください。`],
          a: { type: 'num', v: xs, tol: 6e-4 },
          hint: ['On the axis, $u(x) = U + \\dfrac{m}{2\\pi}\\left(\\dfrac{1}{x + 1} - \\dfrac{1}{x - 1}\\right)$.', '軸上では $u(x) = U + \\dfrac{m}{2\\pi}\\left(\\dfrac{1}{x + 1} - \\dfrac{1}{x - 1}\\right)$ です。'],
          sol: [['The bracket is $-2/(x^2 - 1)$, so $u = 0$ when $x^2 - 1 = m/(\\pi U)$.', '括弧は $-2/(x^2 - 1)$ なので、$x^2 - 1 = m/(\\pi U)$ のとき $u = 0$ です。'], [`$x = \\pm\\sqrt{1 + ${n(m)}/(\\pi\\times ${n(U)})} = \\pm${n(xs, 4)}$.`, `$x = \\pm\\sqrt{1 + ${n(m)}/(\\pi\\times ${n(U)})} = \\pm${n(xs, 4)}$ です。`], ['These are the front and back of the Rankine oval: a stronger pair or a slower stream makes a longer body.', 'これがランキン楕円の前端と後端です。対が強いほど、また流れが遅いほど物体は長くなります。']],
          set: { source: m, sink: -m, uniform: U },
        };
      }
      if (k === 1) {
        const m = r.step(0.5, 2, 0.1), U = r.step(0.5, 2, 0.1);
        return {
          q: [`A source $m = ${n(m)}$ in a stream $U = ${n(U)}$ makes a Rankine half-body. How wide does the body become far downstream?`, `一様流 $U = ${n(U)}$ の中の湧き出し $m = ${n(m)}$ がランキンの半無限物体をつくります。下流の遠くで物体の幅はいくらになりますか。`],
          a: { type: 'num', v: m / U, tol: 6e-4 },
          hint: ['Far downstream all of the source\u2019s fluid moves at speed $U$ inside the body.', '下流の遠くでは、湧き出した流体はすべて物体の内側を速さ $U$ で流れます。'],
          sol: [['The dividing streamline separates source fluid from stream fluid. Far downstream the source fluid fills a strip of width $w$ at speed $U$.', '分離流線は湧き出しの流体と一様流の流体を分けます。下流の遠くでは湧き出しの流体が幅 $w$ の帯を速さ $U$ で満たします。'], [`Conservation: $Uw = m$, so $w = ${n(m)}/${n(U)} = ${n(m / U, 4)}$.`, `保存則より $Uw = m$ なので $w = ${n(m)}/${n(U)} = ${n(m / U, 4)}$ です。`]],
          set: { source: m, sink: 0, uniform: U },
        };
      }
      const cas = r.pick([
        { en: 'water flowing at 1 m/s past a 2 cm pipe', ja: '直径 2 cm の管のまわりを 1 m/s で流れる水', U: 1, L: 0.02, nu: 1.0e-6 },
        { en: 'air at 30 m/s over a 1.5 m car roof', ja: '長さ 1.5 m の車の屋根を 30 m/s で流れる空気', U: 30, L: 1.5, nu: 1.5e-5 },
        { en: 'blood at 0.3 m/s in a 2.5 cm aorta', ja: '直径 2.5 cm の大動脈を 0.3 m/s で流れる血液', U: 0.3, L: 0.025, nu: 3.3e-6 },
        { en: 'honey sliding at 1 cm/s off a 1 cm spoon', ja: '幅 1 cm のスプーンから 1 cm/s で垂れる蜂蜜', U: 0.01, L: 0.01, nu: 7e-3 },
        { en: 'a 1 mm bacterium-sized flow at 10 μm/s in water', ja: '水中を 10 μm/s で動く 1 mm 規模の流れ', U: 1e-5, L: 1e-3, nu: 1.0e-6 },
      ]);
      const Re = cas.U * cas.L / cas.nu;
      return {
        q: [`Estimate the Reynolds number $Re = UL/\\nu$ for ${cas.en} ($\\nu = ${sig(cas.nu, 2)}$ m²/s).`, `${cas.ja}のレイノルズ数 $Re = UL/\\nu$ を見積もってください（$\\nu = ${sig(cas.nu, 2)}$ m²/s）。`],
        a: { type: 'num', v: Re, rel: 0.01 },
        hint: ['Use SI units throughout; $Re$ compares inertia with viscosity.', 'すべて SI 単位にします。$Re$ は慣性と粘性を比べる量です。'],
        sol: [[`$Re = ${sig(cas.U, 2)}\\times ${sig(cas.L, 2)}/${sig(cas.nu, 2)} = ${sig(Re, 3)}$.`, `$Re = ${sig(cas.U, 2)}\\times ${sig(cas.L, 2)}/${sig(cas.nu, 2)} = ${sig(Re, 3)}$ です。`], [Re > 1e4 ? 'Inertia dominates: viscosity matters only in thin boundary layers, and the potential-flow picture in the figure describes the flow outside them well.' : Re > 1 ? 'Intermediate: viscosity and inertia both matter, and a real wake behind the body departs from the potential-flow picture.' : 'Viscosity dominates: the flow is creeping (Stokes) flow, quite unlike the inviscid streamlines in the figure.', Re > 1e4 ? '慣性が支配的です。粘性が効くのは薄い境界層だけで、その外側の流れは図のポテンシャル流の描像でよく表せます。' : Re > 1 ? '中間的で、粘性と慣性の両方が効きます。実際の物体の後ろにできる伴流はポテンシャル流の描像からずれます。' : '粘性が支配的で、流れはストークスの遅い流れです。図の非粘性の流線とはまったく異なります。']],
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const m = r.step(0.5, 2, 0.1), U = r.step(0.3, 2, 0.1), L = Number(Math.sqrt(1 + m / (PI * U)).toFixed(4)), ans = PI * U * (L * L - 1);
        return {
          q: [`A source $m$ at $(-1, 0)$ and an equal sink at $(1, 0)$ sit in a stream $U = ${n(U)}$. What strength $m$ puts the stagnation points at $x = \\pm${L}$?`, `湧き出し $m$ が $(-1, 0)$ に、同じ強さの吸い込みが $(1, 0)$ にあり、一様流 $U = ${n(U)}$ の中に置かれています。よどみ点を $x = \\pm${L}$ にする強さ $m$ はいくつですか。`],
          a: { type: 'num', v: ans, tol: 0.005 },
          hint: ['The stagnation points satisfy $x_s^2 = 1 + m/(\\pi U)$.', 'よどみ点は $x_s^2 = 1 + m/(\\pi U)$ を満たします。'],
          sol: [[`$m = \\pi U(x_s^2 - 1) = \\pi\\times ${n(U)}\\times(${n(L * L, 5)} - 1)$.`, `$m = \\pi U(x_s^2 - 1) = \\pi\\times ${n(U)}\\times(${n(L * L, 5)} - 1)$ です。`], [`$m = ${n(ans, 3)}$. Designing a body shape this way, by placing singularities until the dividing streamline matches it, is the oldest method of computing flow round airships and hulls.`, `$m = ${n(ans, 3)}$ です。分離流線が目的の形に合うまで特異点を配置して物体の形を設計するこの方法は、飛行船や船体のまわりの流れを計算する最も古い手法です。`]],
          set: { source: m, sink: -m, uniform: U },
        };
      }
      if (k === 1) {
        const m = r.step(0.5, 2, 0.1), U = r.step(0.5, 2, 0.1);
        return {
          q: [`A source $m = ${n(m)}$ sits at the origin in a stream $U = ${n(U)}$. Write the velocity $u(x)$ along the positive $x$ axis, downstream of the source.`, `原点にある湧き出し $m = ${n(m)}$ が一様流 $U = ${n(U)}$ の中にあります。湧き出しの下流、正の $x$ 軸に沿った速度 $u(x)$ を式で書いてください。`],
          a: { type: 'expr', v: `${U} + ${m}/(2*pi*x)`, vars: ['x'], dom: { x: [0.3, 3] }, lhs: ['$u(x) =$', '$u(x) =$'] },
          hint: ['Superpose: the stream gives $U$, the source gives $m/(2\\pi r)$ directed away from it.', '重ね合わせます。一様流は $U$、湧き出しは自分から遠ざかる向きに $m/(2\\pi r)$ を与えます。'],
          sol: [[`$u(x) = ${n(U)} + \\dfrac{${n(m)}}{2\\pi x}$ for $x > 0$.`, `$x > 0$ で $u(x) = ${n(U)} + \\dfrac{${n(m)}}{2\\pi x}$ です。`], ['Downstream the two add, so the flow is fastest close to the source and relaxes to $U$; upstream they oppose, which produces the stagnation point.', '下流では2つが足し合わされるので流れは湧き出しの近くで最も速く、遠くで $U$ に戻ります。上流では逆向きに働き、よどみ点が生まれます。']],
          set: { source: m, sink: 0, uniform: U },
        };
      }
      const m = r.step(0.5, 2, 0.1), U = r.step(0.5, 2, 0.1), y = r.pick([0.25, 0.5, 0.75, 1]), v = m / (2 * PI * y), Cp = -((v / U) ** 2);
      return {
        q: [`A source $m = ${n(m)}$ at the origin sits in a stream $U = ${n(U)}$. Find the pressure coefficient $C_p = (p - p_\\infty)/(\\tfrac12\\rho U^2)$ at the point $(0, ${n(y)})$ directly above it. Give three decimals.`, `原点の湧き出し $m = ${n(m)}$ が一様流 $U = ${n(U)}$ の中にあります。その真上の点 $(0, ${n(y)})$ における圧力係数 $C_p = (p - p_\\infty)/(\\tfrac12\\rho U^2)$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: Cp, tol: 6e-4 },
        hint: ['Bernoulli along a streamline from far upstream: $C_p = 1 - |\\mathbf u|^2/U^2$.', '上流の遠くからの流線に沿ったベルヌーイの定理により $C_p = 1 - |\\mathbf u|^2/U^2$ です。'],
        sol: [[`At $(0, ${n(y)})$ the source adds $m/(2\\pi y) = ${n(v, 4)}$ straight up, so $|\\mathbf u|^2 = ${n(U * U, 4)} + ${n(v * v, 4)}$.`, `$(0, ${n(y)})$ では湧き出しが真上向きに $m/(2\\pi y) = ${n(v, 4)}$ を加えるので、$|\\mathbf u|^2 = ${n(U * U, 4)} + ${n(v * v, 4)}$ です。`], [`$C_p = 1 - |\\mathbf u|^2/U^2 = -(${n(v, 4)}/${n(U)})^2 = ${n(Cp, 4)}$: suction, the low pressure where the shading in the figure is darkest.`, `$C_p = 1 - |\\mathbf u|^2/U^2 = -(${n(v, 4)}/${n(U)})^2 = ${n(Cp, 4)}$ です。負圧で、図の濃淡が最も濃い所の低い圧力です。`]],
      };
    },
  ];

  // ---------- 2. Bernoulli in a venturi (water, ρ = 1000 kg/m³, inlet 150 kPa) ----------
  const RHO = 1000, P1 = 150;
  const dp = (v1, ar) => 0.5 * RHO * v1 * v1 * (1 / (ar * ar) - 1) / 1000; // kPa
  Q.bernoulli = [
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const ar = r.step(0.3, 2, 0.05), v1 = r.step(0.5, 4, 0.1);
        return {
          q: [`Water enters a pipe at $v_1 = ${n(v1)}$ m/s and reaches a section with area ratio $A_2/A_1 = ${n(ar)}$. How fast does it flow there?`, `水が $v_1 = ${n(v1)}$ m/s で管に入り、面積比 $A_2/A_1 = ${n(ar)}$ の断面に達します。そこでの流速はいくらですか。`],
          a: { type: 'num', v: v1 / ar, unit: ['m/s', 'm/s'] },
          hint: ['An incompressible fluid has the same volume flow $Av$ through every section.', '非圧縮性流体では、どの断面でも体積流量 $Av$ が等しくなります。'],
          sol: [[`$v_2 = v_1A_1/A_2 = ${n(v1)}/${n(ar)}$.`, `$v_2 = v_1A_1/A_2 = ${n(v1)}/${n(ar)}$ です。`], [`$v_2 = ${n(v1 / ar, 4)}$ m/s: ${ar < 1 ? 'faster in the narrow throat, which is why the tracers spread out there.' : 'slower in a wider section, so the tracers bunch up.'}`, `$v_2 = ${n(v1 / ar, 4)}$ m/s です。${ar < 1 ? '狭いのど部では速く、トレーサーの間隔がそこで広がるのはこのためです。' : '広い断面では遅くなり、トレーサーは詰まります。'}`]],
          set: { area: ar, speed: v1 },
        };
      }
      if (k === 1) {
        const D = r.pick([1, 2, 2.5, 5, 10]), v = r.step(0.5, 4, 0.5), Qf = PI * (D / 200) ** 2 * v * 1000;
        return {
          q: [`Water flows at $${n(v)}$ m/s through a pipe of internal diameter $${D}$ cm. What is the volume flow rate in litres per second?`, `内径 $${D}$ cm の管を水が $${n(v)}$ m/s で流れています。体積流量は毎秒何 L ですか。`],
          a: { type: 'num', v: Qf, rel: 0.005, unit: ['L/s', 'L/s'] },
          hint: ['$Q = Av$ with $A = \\pi D^2/4$; $1$ m³ $= 1000$ L.', '$Q = Av$、$A = \\pi D^2/4$ です。$1$ m³ $= 1000$ L です。'],
          sol: [[`$A = \\pi(${n(D / 100)})^2/4 = ${sig(PI * (D / 200) ** 2, 4)}$ m².`, `$A = \\pi(${n(D / 100)})^2/4 = ${sig(PI * (D / 200) ** 2, 4)}$ m² です。`], [`$Q = Av = ${sig(PI * (D / 200) ** 2 * v, 4)}$ m³/s $= ${n(Qf, 4)}$ L/s, and it is the same at every section of the pipe.`, `$Q = Av = ${sig(PI * (D / 200) ** 2 * v, 4)}$ m³/s $= ${n(Qf, 4)}$ L/s で、管のどの断面でも同じです。`]],
        };
      }
      return {
        q: ['Water speeds up through the narrow throat of a horizontal venturi. What happens to its static pressure there?', '水平なベンチュリ管の狭いのど部で、水は速くなります。そこでの静圧はどうなりますか。'],
        a: { type: 'choice', opts: [['It falls, by exactly the rise in $\\tfrac12\\rho v^2$', '$\\tfrac12\\rho v^2$ の増加分だけちょうど下がる'], ['It rises, because the water is squeezed', '水が押し込まれるので上がる'], ['It stays the same, since the pipe is horizontal', '管が水平なので変わらない'], ['It falls to zero', '0 まで下がる']], v: 0 },
        hint: ['Along a streamline in steady flow, $p + \\tfrac12\\rho v^2$ is constant when height does not change.', '定常流の流線に沿って、高さが変わらなければ $p + \\tfrac12\\rho v^2$ は一定です。'],
        sol: [['To speed up, each parcel needs a net force forward: the pressure behind it must exceed the pressure ahead.', '流体の塊が加速するには前向きの正味の力が必要で、後ろの圧力が前の圧力より大きくなければなりません。'], ['So the pressure is lowest where the flow is fastest, and Bernoulli makes it quantitative: the columns in the figure drop at the throat.', 'したがって圧力は流れが最も速い所で最も低くなり、ベルヌーイの定理がそれを定量化します。図の液柱はのど部で下がります。']],
        set: { area: 0.5 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0 || k === 1) {
        const ar = r.step(0.3, 0.9, 0.05), v1 = r.step(0.5, 4, 0.1), d = dp(v1, ar), askP = k === 1;
        return {
          q: [askP ? `Water enters a horizontal venturi at $${n(v1)}$ m/s and $150$ kPa. The throat has $A_2/A_1 = ${n(ar)}$. What is the pressure at the throat, in kPa?` : `Water flows at $v_1 = ${n(v1)}$ m/s into a venturi with $A_2/A_1 = ${n(ar)}$. By how much does the pressure drop at the throat, in kPa? ($\\rho = 1000$ kg/m³.)`, askP ? `水が $${n(v1)}$ m/s、$150$ kPa で水平なベンチュリ管に入ります。のど部は $A_2/A_1 = ${n(ar)}$ です。のど部の圧力は何 kPa ですか。` : `水が $v_1 = ${n(v1)}$ m/s で $A_2/A_1 = ${n(ar)}$ のベンチュリ管に流れ込みます。のど部で圧力は何 kPa 下がりますか（$\\rho = 1000$ kg/m³）。`],
          a: { type: 'num', v: askP ? P1 - d : d, rel: 0.005, unit: ['kPa', 'kPa'] },
          hint: ['Continuity gives $v_2$; Bernoulli gives $p_1 - p_2 = \\tfrac12\\rho(v_2^2 - v_1^2)$.', '連続の式で $v_2$ を求め、ベルヌーイの定理 $p_1 - p_2 = \\tfrac12\\rho(v_2^2 - v_1^2)$ を使います。'],
          sol: [[`$v_2 = ${n(v1)}/${n(ar)} = ${n(v1 / ar, 4)}$ m/s.`, `$v_2 = ${n(v1)}/${n(ar)} = ${n(v1 / ar, 4)}$ m/s です。`], [`$p_1 - p_2 = \\tfrac12(1000)(${n((v1 / ar) ** 2, 4)} - ${n(v1 * v1, 4)})$ Pa $= ${n(d, 4)}$ kPa${askP ? `, so $p_2 = 150 - ${n(d, 4)} = ${n(P1 - d, 4)}$ kPa` : ''}.`, `$p_1 - p_2 = \\tfrac12(1000)(${n((v1 / ar) ** 2, 4)} - ${n(v1 * v1, 4)})$ Pa $= ${n(d, 4)}$ kPa ${askP ? `なので $p_2 = 150 - ${n(d, 4)} = ${n(P1 - d, 4)}$ kPa です` : 'です'}。`], ['Halving the area quadruples the dynamic pressure at the throat, which is why venturis make sensitive flow meters.', '面積を半分にするとのど部の動圧は4倍になります。ベンチュリ管が感度のよい流量計になるのはこのためです。']],
          set: { area: ar, speed: v1 },
        };
      }
      const v = r.step(0.5, 3, 0.5), D = r.pick([0.5, 1, 2, 5, 10]), Re = v * D / 100 / 1.0e-6;
      return {
        q: [`Water ($\\nu = 1.0\\times 10^{-6}$ m²/s) flows at $${n(v)}$ m/s in a pipe of diameter $${D}$ cm. Is the flow laminar? Pipe flow usually turns turbulent above $Re \\approx 2300$.`, `水（$\\nu = 1.0\\times 10^{-6}$ m²/s）が直径 $${D}$ cm の管を $${n(v)}$ m/s で流れています。流れは層流ですか。管内流はふつう $Re \\approx 2300$ を超えると乱流になります。`],
        a: { type: 'choice', opts: [[`Turbulent: $Re \\approx ${sig(Re, 2)}$`, `乱流：$Re \\approx ${sig(Re, 2)}$`], [`Laminar: $Re \\approx ${sig(Re, 2)}$`, `層流：$Re \\approx ${sig(Re, 2)}$`]], v: Re > 2300 ? 0 : 1, fixed: true },
        hint: ['$Re = vD/\\nu$, with $D$ in metres.', '$Re = vD/\\nu$ で、$D$ はメートルで表します。'],
        sol: [[`$Re = ${n(v)}\\times ${n(D / 100)}/10^{-6} = ${sig(Re, 3)}$.`, `$Re = ${n(v)}\\times ${n(D / 100)}/10^{-6} = ${sig(Re, 3)}$ です。`], [Re > 2300 ? 'Far above 2300: the flow is turbulent, as almost all water flow in ordinary pipes is. The one-dimensional Bernoulli picture still works well for the mean flow, with a small loss to friction.' : 'Below 2300: the flow is laminar, with a parabolic velocity profile across the pipe rather than the uniform one the figure assumes.', Re > 2300 ? '2300 をはるかに超えるので乱流で、ふつうの水道管の流れはほとんどそうです。それでも平均流については一次元のベルヌーイの描像がよく成り立ち、摩擦による損失はわずかです。' : '2300 より小さいので層流で、断面の速度分布は図が仮定する一様な分布ではなく放物線状になります。']],
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const ar = r.step(0.3, 0.9, 0.05), v1 = r.step(0.5, 4, 0.1), d = Number(dp(v1, ar).toFixed(2)), ans = Math.sqrt(2 * d * 1000 / (RHO * (1 / (ar * ar) - 1)));
        return {
          q: [`A venturi meter with $A_2/A_1 = ${n(ar)}$ in a water main shows a pressure difference of $${n(d)}$ kPa between inlet and throat. What is the inlet speed?`, `水道本管に入れた $A_2/A_1 = ${n(ar)}$ のベンチュリ流量計が、入口とのど部の間に $${n(d)}$ kPa の圧力差を示しています。入口の流速はいくらですか。`],
          a: { type: 'num', v: ans, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['Write $v_2 = v_1/(A_2/A_1)$ inside Bernoulli and solve for $v_1$.', 'ベルヌーイの式に $v_2 = v_1/(A_2/A_1)$ を入れて $v_1$ について解きます。'],
          sol: [[`$\\Delta p = \\tfrac12\\rho v_1^2\\left[(A_1/A_2)^2 - 1\\right] = 500\\,v_1^2\\times ${n(1 / (ar * ar) - 1, 4)}$ Pa.`, `$\\Delta p = \\tfrac12\\rho v_1^2\\left[(A_1/A_2)^2 - 1\\right] = 500\\,v_1^2\\times ${n(1 / (ar * ar) - 1, 4)}$ Pa です。`], [`$v_1 = \\sqrt{${n(d * 1000)}/(500\\times ${n(1 / (ar * ar) - 1, 4)})} = ${n(ans, 4)}$ m/s.`, `$v_1 = \\sqrt{${n(d * 1000)}/(500\\times ${n(1 / (ar * ar) - 1, 4)})} = ${n(ans, 4)}$ m/s です。`], ['Because $\\Delta p \\propto v^2$, the meter is most sensitive at high flow and needs a fine gauge at low flow.', '$\\Delta p \\propto v^2$ なので、この流量計は流量が大きいほど感度が高く、流量が小さいときは精密な圧力計が必要です。']],
          set: { area: ar, speed: v1 },
        };
      }
      if (k === 1) {
        const ar = r.step(0.3, 0.6, 0.05), pv = 2.3, vc = Math.sqrt(2 * (P1 - pv) * 1000 / (RHO * (1 / (ar * ar) - 1)));
        return {
          q: [`In the venturi (water at $20^\\circ$C, inlet pressure $150$ kPa, $A_2/A_1 = ${n(ar)}$), cavitation starts when the throat pressure falls to the vapour pressure, $2.3$ kPa. At what inlet speed does this happen?`, `ベンチュリ管（$20^\\circ$C の水、入口圧力 $150$ kPa、$A_2/A_1 = ${n(ar)}$）では、のど部の圧力が蒸気圧 $2.3$ kPa まで下がるとキャビテーションが始まります。入口の流速がいくらのとき起こりますか。`],
          a: { type: 'num', v: vc, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['Set $p_2 = 2.3$ kPa in Bernoulli and solve for $v_1$.', 'ベルヌーイの式で $p_2 = 2.3$ kPa とおき、$v_1$ について解きます。'],
          sol: [[`We need $\\tfrac12\\rho v_1^2\\left[(A_1/A_2)^2 - 1\\right] = (150 - 2.3)$ kPa $= 147\\,700$ Pa.`, `$\\tfrac12\\rho v_1^2\\left[(A_1/A_2)^2 - 1\\right] = (150 - 2.3)$ kPa $= 147\\,700$ Pa が必要です。`], [`$v_1 = \\sqrt{147\\,700/(500\\times ${n(1 / (ar * ar) - 1, 4)})} = ${n(vc, 4)}$ m/s, with the throat at $${n(vc / ar, 4)}$ m/s.`, `$v_1 = \\sqrt{147\\,700/(500\\times ${n(1 / (ar * ar) - 1, 4)})} = ${n(vc, 4)}$ m/s で、のど部は $${n(vc / ar, 4)}$ m/s です。`], ['Above this the water boils at room temperature in the throat, and the collapsing bubbles erode the metal: a design limit for pumps and propellers.', 'これを超えると水はのど部で室温のまま沸騰し、つぶれる気泡が金属を侵食します。ポンプやスクリューの設計上の限界です。']],
          set: vc <= 4 ? { area: ar, speed: Math.floor(vc * 10) / 10 } : { area: ar, speed: 4 },
        };
      }
      const ar = r.step(0.3, 0.9, 0.05), c = 0.5 * (1 / (ar * ar) - 1);
      return {
        q: [`For the venturi with $A_2/A_1 = ${n(ar)}$ and water, write the pressure drop $\\Delta p$ in kPa as a function of the inlet speed $v$ in m/s.`, `$A_2/A_1 = ${n(ar)}$ のベンチュリ管と水について、圧力降下 $\\Delta p$（kPa）を入口の流速 $v$（m/s）の式で書いてください。`],
        a: { type: 'expr', v: `${c}*v^2`, vars: ['v'], dom: { v: [0.5, 4] }, lhs: ['$\\Delta p =$', '$\\Delta p =$'] },
        hint: ['$\\Delta p = \\tfrac12\\rho v^2[(A_1/A_2)^2 - 1]$ in pascals; divide by 1000.', '$\\Delta p = \\tfrac12\\rho v^2[(A_1/A_2)^2 - 1]$（Pa）を 1000 で割ります。'],
        sol: [[`$(A_1/A_2)^2 - 1 = ${n(1 / (ar * ar) - 1, 5)}$, and $\\tfrac12\\rho/1000 = 0.5$ kPa·s²/m².`, `$(A_1/A_2)^2 - 1 = ${n(1 / (ar * ar) - 1, 5)}$、$\\tfrac12\\rho/1000 = 0.5$ kPa·s²/m² です。`], [`$\\Delta p = ${n(c, 5)}\\,v^2$ kPa: quadratic in the speed, so doubling the flow quadruples the reading.`, `$\\Delta p = ${n(c, 5)}\\,v^2$ kPa で、流速の2乗に比例します。流量を2倍にすると読みは4倍になります。`]],
        set: { area: ar },
      };
    },
  ];

  // ---------- 3. vorticity and circulation (core radius a = 0.6) ----------
  const A = 0.6;
  const PROF = [['solid-body rotation', '剛体回転'], ['free vortex', '自由渦'], ['Rankine vortex', 'ランキン渦']];
  Q.vorticity = [
    (r) => {
      const k = r.int(0, 2), Om = r.step(-2, 2, 0.1) || 1;
      if (k === 0) return {
        q: [`Fluid rotates as a solid body with angular speed $\\Omega = ${n(Om)}$. What is its vorticity $\\omega$?`, `流体が角速度 $\\Omega = ${n(Om)}$ で剛体回転しています。渦度 $\\omega$ はいくつですか。`],
        a: { type: 'num', v: 2 * Om, tol: 1e-6 },
        hint: ['$\\omega = \\dfrac1r\\dfrac{d(ru_\\theta)}{dr}$ with $u_\\theta = \\Omega r$.', '$u_\\theta = \\Omega r$ として $\\omega = \\dfrac1r\\dfrac{d(ru_\\theta)}{dr}$ です。'],
        sol: [[`$\\omega = \\dfrac1r\\dfrac{d(\\Omega r^2)}{dr} = 2\\Omega = ${n(2 * Om)}$.`, `$\\omega = \\dfrac1r\\dfrac{d(\\Omega r^2)}{dr} = 2\\Omega = ${n(2 * Om)}$ です。`], ['Vorticity is twice the local spin rate: a paddle wheel anywhere in the fluid turns at $\\Omega$, the same as the whole flow.', '渦度は局所的な回転速度の2倍です。流体のどこに置いた水車も、流れ全体と同じ $\\Omega$ で回ります。']],
        set: { profile: 0, rotation: Om },
      };
      if (k === 1) {
        const R = r.step(0.2, 1.5, 0.05), G = 2 * PI * Om * R * R;
        return {
          q: [`In solid-body rotation with $\\Omega = ${n(Om)}$, what is the circulation $\\Gamma$ round a circle of radius $${n(R)}$ centred on the axis?`, `$\\Omega = ${n(Om)}$ の剛体回転で、軸を中心とする半径 $${n(R)}$ の円のまわりの循環 $\\Gamma$ はいくつですか。`],
          a: { type: 'num', v: G, tol: 0.002 },
          hint: ['On the circle the speed is $\\Omega R$ and always along the path.', '円上の速さは $\\Omega R$ で、常に経路に沿っています。'],
          sol: [[`$\\Gamma = \\oint u\\,dl = (\\Omega R)(2\\pi R) = 2\\pi\\Omega R^2$.`, `$\\Gamma = \\oint u\\,dl = (\\Omega R)(2\\pi R) = 2\\pi\\Omega R^2$ です。`], [`$= 2\\pi\\times ${n(Om)}\\times ${n(R * R, 4)} = ${n(G, 4)}$, equal to $\\omega\\times$ area $= ${n(2 * Om)}\\times\\pi(${n(R)})^2$, as Stokes requires.`, `$= 2\\pi\\times ${n(Om)}\\times ${n(R * R, 4)} = ${n(G, 4)}$ で、ストークスの定理のとおり $\\omega\\times$面積 $= ${n(2 * Om)}\\times\\pi(${n(R)})^2$ に等しくなります。`]],
        set: { profile: 0, rotation: Om, radius: R },
        };
      }
      return {
        q: ['In a free vortex, $u_\\theta \\propto 1/r$. A small paddle wheel is carried round by the flow, away from the centre. What does it do?', '自由渦では $u_\\theta \\propto 1/r$ です。中心から離れた所にある小さな水車が流れに運ばれて回ります。水車はどうなりますか。'],
        a: { type: 'choice', opts: [['It orbits the centre without turning about its own axis', '自分の軸のまわりには回転せずに中心のまわりを周回する'], ['It spins the same way as the flow circulates', '流れが回るのと同じ向きに自転する'], ['It spins the opposite way', '逆向きに自転する'], ['It stays still', '静止したまま']], v: 0 },
        hint: ['Compute $\\omega = \\frac1r\\frac{d(ru_\\theta)}{dr}$ for $u_\\theta = c/r$.', '$u_\\theta = c/r$ について $\\omega = \\frac1r\\frac{d(ru_\\theta)}{dr}$ を計算してください。'],
        sol: [['$ru_\\theta = c$ is constant, so $\\omega = 0$ everywhere except at the centre.', '$ru_\\theta = c$ は一定なので、中心以外のどこでも $\\omega = 0$ です。'], ['The faster flow on the inner side and the slower flow on the outer side exactly cancel their turning effects, so the wheel keeps its orientation: watch the crosses in the figure.', '内側の速い流れと外側の遅い流れの回転させる効果がちょうど打ち消し合うので、水車は向きを保ちます。図の十字を見てください。']],
        set: { profile: 1 },
      };
    },
    (r) => {
      const k = r.int(0, 2), Om = r.step(0.5, 2, 0.1) * r.sign();
      if (k === 0) {
        const R = r.step(0.2, 1.5, 0.05), G = R < A ? 2 * PI * Om * R * R : 2 * PI * Om * A * A;
        return {
          q: [`A Rankine vortex rotates rigidly with $\\Omega = ${n(Om)}$ inside $r = a = 0.6$ and is a free vortex outside. Find the circulation round a centred circle of radius $${n(R)}$.`, `ランキン渦は $r = a = 0.6$ の内側で $\\Omega = ${n(Om)}$ の剛体回転、外側で自由渦です。中心にある半径 $${n(R)}$ の円のまわりの循環を求めてください。`],
          a: { type: 'num', v: G, tol: 0.002 },
          hint: ['Stokes: $\\Gamma$ is the vorticity flux through the circle, and vorticity $2\\Omega$ exists only in the core.', 'ストークスの定理より $\\Gamma$ は円を貫く渦度の流束で、渦度 $2\\Omega$ は芯の中にしかありません。'],
          sol: [[R < A ? `The circle lies inside the core, so $\\Gamma = 2\\Omega\\cdot\\pi R^2 = 2\\pi(${n(Om)})(${n(R * R, 4)})$.` : `The circle encloses the whole core, so $\\Gamma = 2\\Omega\\cdot\\pi a^2 = 2\\pi(${n(Om)})(0.36)$.`, R < A ? `円は芯の内側にあるので $\\Gamma = 2\\Omega\\cdot\\pi R^2 = 2\\pi(${n(Om)})(${n(R * R, 4)})$ です。` : `円は芯全体を囲むので $\\Gamma = 2\\Omega\\cdot\\pi a^2 = 2\\pi(${n(Om)})(0.36)$ です。`], [`$\\Gamma = ${n(G, 4)}$. ${R < A ? 'It grows with the area enclosed.' : 'Any larger circle gives the same value: outside the core there is no vorticity to add.'}`, `$\\Gamma = ${n(G, 4)}$ です。${R < A ? '囲む面積とともに増えます。' : 'これより大きな円でも同じ値で、芯の外には加わる渦度がありません。'}`]],
          set: { profile: 2, rotation: Om, radius: R },
        };
      }
      if (k === 1) {
        const R = r.step(0.7, 1.5, 0.05), G = 2 * PI * Om * A * A, u = Om * A * A / R;
        return {
          q: [`Outside the core of the Rankine vortex ($a = 0.6$, $\\Omega = ${n(Om)}$), what is the swirl speed $u_\\theta$ at $r = ${n(R)}$?`, `ランキン渦の芯の外（$a = 0.6$、$\\Omega = ${n(Om)}$）で、$r = ${n(R)}$ における周方向速度 $u_\\theta$ はいくつですか。`],
          a: { type: 'num', v: u, tol: 6e-4 },
          hint: ['Outside the core the circulation is constant, $\\Gamma = 2\\pi\\Omega a^2$, and $u_\\theta = \\Gamma/(2\\pi r)$.', '芯の外では循環は一定で $\\Gamma = 2\\pi\\Omega a^2$、$u_\\theta = \\Gamma/(2\\pi r)$ です。'],
          sol: [[`$\\Gamma = 2\\pi\\times ${n(Om)}\\times 0.36 = ${n(G, 4)}$.`, `$\\Gamma = 2\\pi\\times ${n(Om)}\\times 0.36 = ${n(G, 4)}$ です。`], [`$u_\\theta = \\Gamma/(2\\pi r) = \\Omega a^2/r = ${n(u, 4)}$. The speed peaks at the edge of the core, $\\Omega a = ${n(Om * A)}$, and decays like $1/r$ outside it, the blue curve on the right.`, `$u_\\theta = \\Gamma/(2\\pi r) = \\Omega a^2/r = ${n(u, 4)}$ です。速さは芯の縁で最大 $\\Omega a = ${n(Om * A)}$ となり、外では $1/r$ で減衰します。右図の青い曲線です。`]],
          set: { profile: 2, rotation: Om, radius: R },
        };
      }
      const kk = r.pick([1, 2, 0.5, 3, -1, -2]);
      return {
        q: [`A shear flow has $\\mathbf u = (${n(kk)}y,\\ 0)$: every streamline is a straight line. What is its vorticity $\\omega = \\partial v/\\partial x - \\partial u/\\partial y$?`, `せん断流 $\\mathbf u = (${n(kk)}y,\\ 0)$ では、流線はすべて直線です。渦度 $\\omega = \\partial v/\\partial x - \\partial u/\\partial y$ はいくつですか。`],
        a: { type: 'num', v: -kk, tol: 1e-6 },
        hint: ['Straight streamlines do not mean zero vorticity; just differentiate.', '流線が直線でも渦度が 0 とは限りません。そのまま微分してください。'],
        sol: [[`$\\partial v/\\partial x = 0$ and $\\partial u/\\partial y = ${n(kk)}$, so $\\omega = ${n(-kk)}$.`, `$\\partial v/\\partial x = 0$、$\\partial u/\\partial y = ${n(kk)}$ なので $\\omega = ${n(-kk)}$ です。`], ['A paddle wheel in this flow spins, because one side is pushed harder than the other, even though no fluid goes round in circles. Conversely, the free vortex goes round in circles with no vorticity.', 'このような流れに置いた水車は、片側が反対側より強く押されるので回転します。流体が円を描いて回っていなくてもそうなります。逆に自由渦は、円を描いて回るのに渦度はありません。']],
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const U0 = r.pick([40, 50, 60, 80]), r0 = r.pick([50, 100, 150, 200]), r1 = r.pick([300, 400, 500, 1000]), G = 2 * PI * r0 * U0;
        return {
          q: [`A tornado\u2019s winds peak at $${U0}$ m/s at radius $${r0}$ m; outside, it behaves like a free vortex. Estimate the wind speed $${r1}$ m from the centre.`, `竜巻の風速は半径 $${r0}$ m で最大 $${U0}$ m/s となり、その外側は自由渦のようにふるまいます。中心から $${r1}$ m での風速を見積もってください。`],
          a: { type: 'num', v: G / (2 * PI * r1), rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['Outside the core the circulation is the same round every circle.', '芯の外では、どの円のまわりでも循環は同じです。'],
          sol: [[`$\\Gamma = 2\\pi r_0U_0 = 2\\pi\\times ${r0}\\times ${U0} = ${sig(G, 4)}$ m²/s.`, `$\\Gamma = 2\\pi r_0U_0 = 2\\pi\\times ${r0}\\times ${U0} = ${sig(G, 4)}$ m²/s です。`], [`$u = \\Gamma/(2\\pi r) = U_0r_0/r = ${n(G / (2 * PI * r1), 4)}$ m/s: the damage zone is narrow because the speed falls off like $1/r$.`, `$u = \\Gamma/(2\\pi r) = U_0r_0/r = ${n(G / (2 * PI * r1), 4)}$ m/s です。速さが $1/r$ で減るので、被害の範囲は狭くなります。`]],
        };
      }
      if (k === 1) {
        const Om = r.step(0.5, 2, 0.1), R = r.step(0.2, 0.55, 0.05), G = Number((2 * PI * Om * R * R).toFixed(4)), ans = Math.sqrt(G / (2 * PI * Om));
        return {
          q: [`In a Rankine vortex with $\\Omega = ${n(Om)}$ and core radius $a = 0.6$, what radius of centred loop gives circulation $\\Gamma = ${G}$?`, `$\\Omega = ${n(Om)}$、芯の半径 $a = 0.6$ のランキン渦で、循環 $\\Gamma = ${G}$ を与える中心のループの半径はいくらですか。`],
          a: { type: 'num', v: ans, tol: 0.002 },
          hint: ['Check first whether the loop must lie inside the core: the largest circulation possible is $2\\pi\\Omega a^2$.', 'まずループが芯の内側にあるべきか確かめます。循環の最大値は $2\\pi\\Omega a^2$ です。'],
          sol: [[`The maximum is $2\\pi\\times ${n(Om)}\\times 0.36 = ${n(2 * PI * Om * 0.36, 4)}$, larger than $${G}$, so the loop lies inside the core.`, `最大値は $2\\pi\\times ${n(Om)}\\times 0.36 = ${n(2 * PI * Om * 0.36, 4)}$ で $${G}$ より大きいので、ループは芯の内側にあります。`], [`$2\\pi\\Omega R^2 = \\Gamma$ gives $R = \\sqrt{${G}/(2\\pi\\times ${n(Om)})} = ${n(ans, 4)}$.`, `$2\\pi\\Omega R^2 = \\Gamma$ より $R = \\sqrt{${G}/(2\\pi\\times ${n(Om)})} = ${n(ans, 4)}$ です。`]],
          set: { profile: 2, rotation: Om, radius: R },
        };
      }
      if (k === 2) {
        const Om = r.step(0.5, 2, 0.1), R = r.step(0.3, 0.8, 0.05), d = r.pick([0.4, 0.6, 0.8, 1]);
        return {
          q: [`In solid-body rotation with $\\Omega = ${n(Om)}$, a circular loop of radius $${n(R)}$ is centred at $(${n(d)}, 0)$, off the axis. What is the circulation round it?`, `$\\Omega = ${n(Om)}$ の剛体回転で、半径 $${n(R)}$ の円形ループの中心が軸から外れた $(${n(d)}, 0)$ にあります。そのまわりの循環はいくつですか。`],
          a: { type: 'num', v: 2 * PI * Om * R * R, tol: 0.002 },
          hint: ['Use Stokes rather than integrating the velocity round the shifted circle.', 'ずれた円に沿って速度を積分するのではなく、ストークスの定理を使います。'],
          sol: [['The vorticity is $2\\Omega$ everywhere, so the flux through the loop is $2\\Omega$ times its area, wherever it is.', '渦度はどこでも $2\\Omega$ なので、ループを貫く流束はその位置によらず $2\\Omega$ と面積の積です。'], [`$\\Gamma = 2\\Omega\\pi R^2 = ${n(2 * PI * Om * R * R, 4)}$, exactly as for the centred loop. Drag the loop in the figure to check that the readout does not change.`, `$\\Gamma = 2\\Omega\\pi R^2 = ${n(2 * PI * Om * R * R, 4)}$ で、中心にあるループとまったく同じです。図でループをドラッグしても読み取り欄が変わらないことを確かめてください。`]],
          set: { profile: 0, rotation: Om, radius: R },
        };
      }
      const c = r.pick([1, 2, 0.5, 3]), nn = r.pick([2, 0.5, -0.5, 3, -2]);
      return {
        q: [`A swirling flow has $u_\\theta(r) = ${n(c)}\\,r^{${n(nn)}}$. Write its vorticity $\\omega(r)$.`, `回転する流れが $u_\\theta(r) = ${n(c)}\\,r^{${n(nn)}}$ をもちます。渦度 $\\omega(r)$ を式で書いてください。`],
        a: { type: 'expr', v: `${c * (nn + 1)}*r^(${nn - 1})`, vars: ['r'], dom: { r: [0.3, 2] }, lhs: ['$\\omega(r) =$', '$\\omega(r) =$'] },
        hint: ['In polar coordinates, $\\omega = \\dfrac1r\\dfrac{d}{dr}(ru_\\theta)$.', '極座標では $\\omega = \\dfrac1r\\dfrac{d}{dr}(ru_\\theta)$ です。'],
        sol: [[`$ru_\\theta = ${n(c)}\\,r^{${n(nn + 1)}}$, whose derivative is $${n(c * (nn + 1))}\\,r^{${n(nn)}}$.`, `$ru_\\theta = ${n(c)}\\,r^{${n(nn + 1)}}$ で、その導関数は $${n(c * (nn + 1))}\\,r^{${n(nn)}}$ です。`], [`$\\omega(r) = ${n(c * (nn + 1))}\\,r^{${n(nn - 1)}}$. Only $u_\\theta \\propto 1/r$ (the free vortex) gives zero, and only $u_\\theta \\propto r$ gives uniform vorticity.`, `$\\omega(r) = ${n(c * (nn + 1))}\\,r^{${n(nn - 1)}}$ です。0 になるのは $u_\\theta \\propto 1/r$（自由渦）だけで、渦度が一様になるのは $u_\\theta \\propto r$ だけです。`]],
      };
    },
  ];
})();

/* Apple M-series die floorplans — interactive workbench.
   Bilingual (en / ja), mounts into [data-interactive-mount] inside [data-lesson="silicon"].
   Also exposes window.SiliconFloorplans for the static print build. */
(() => {
  const root = document.documentElement;
  const lang = (root.lang || 'en').toLowerCase().startsWith('ja') ? 'ja' : 'en';
  const t = (en, ja) => (lang === 'ja' ? ja : en);

  const CATS = [
    ['cpup',  t('CPU · performance / super cores', 'CPU · 高性能 / スーパーコア')],
    ['cpue',  t('CPU · efficiency / performance cores', 'CPU · 高効率 / パフォーマンスコア')],
    ['gpu',   t('GPU cores', 'GPU コア')],
    ['npu',   t('Neural Engine & Neural Accelerators', 'Neural Engine と Neural Accelerator')],
    ['cache', t('Cache (L2 / SLC / Dynamic Caching)', 'キャッシュ（L2 / SLC / Dynamic Caching）')],
    ['mem',   t('Memory controllers & PHY', 'メモリコントローラと PHY')],
    ['media', t('Media, display & image signal', 'メディア・ディスプレイ・画像処理')],
    ['io',    t('I/O, security & fabric', 'I/O・セキュリティ・ファブリック')],
    ['bond',  t('Inter-die bond interface', 'ダイ間ボンド界面')]
  ];
  const fill = c => `var(--fp-${c}-f)`;
  const line = c => `var(--fp-${c}-l)`;

  /* ---------------- block data ---------------- */
  function baseDie(o) {
    return [
      { x:10, y:10, w:340, h:330, cat:'gpu', label:t('GPU','GPU'), sub:o.gpuSub,
        grid:{ n:10, cols:2, pfx:'GPU', na:o.gpuNA }, detail:o.gpuDetail },
      { x:10, y:348, w:340, h:56, cat:'cache', label:t('GPU L2 · Dynamic Caching pool','GPU L2 · Dynamic Caching プール'), sub:o.dcSub,
        detail:t('Dynamic Caching, introduced with M3, lets the hardware allocate on-chip memory to shaders at run time instead of reserving a fixed worst-case block at compile time. Occupancy rises, and the same silicon does more work. ',
                 'M3 で導入された Dynamic Caching は、コンパイル時に最悪ケース分を固定確保するのではなく、実行時にオンチップメモリをシェーダへ割り当てます。占有率が上がり、同じシリコンでより多くの仕事ができます。') + o.dcDetail },
      { x:358, y:10, w:222, h:170, cat:'cpup', label:o.pLabel, sub:o.pSub, grid:{ n:4, cols:2, pfx:'P' }, detail:o.pDetail },
      { x:358, y:188, w:222, h:152, cat:'cpue', label:o.eLabel, sub:o.eSub, grid:{ n:o.eCores, cols:o.eCores>4?3:2, pfx:'E' }, detail:o.eDetail },
      { x:358, y:348, w:222, h:56, cat:'cache', label:t('CPU L2 + matrix units','CPU L2 + 行列演算ユニット'), sub:t('shared per cluster','クラスタ共有'),
        detail:t('Each CPU cluster shares an L2 and an undocumented matrix coprocessor (AMX) that Accelerate and BNNS dispatch to. Apple has never published its instruction set; it is reached through the frameworks, not directly.',
                 '各 CPU クラスタは L2 と、非公開の行列コプロセッサ（AMX）を共有します。Accelerate や BNNS が発行先とします。命令セットは公開されておらず、フレームワーク経由でのみ利用できます。') },
      { x:588, y:10, w:202, h:210, cat:'npu', label:t('Neural Engine','Neural Engine'), sub:t('16 cores · ','16 コア · ')+o.neTops, grid:{ n:16, cols:4, pfx:'' }, detail:o.neDetail },
      { x:588, y:228, w:202, h:52, cat:'media', label:t('Media Engine','メディアエンジン'), sub:'H.264 · HEVC · ProRes · AV1',
        detail:t('Hardware video codecs: H.264, HEVC and AV1 decode, plus ProRes and ProRes RAW encode and decode. This block is why a Mac can scrub multi-stream ProRes at almost no CPU cost.',
                 'ハードウェアコーデック群です。H.264・HEVC・AV1 のデコードに加え、ProRes と ProRes RAW のエンコード / デコードを担います。Mac が複数ストリームの ProRes をほぼ CPU 負荷なしで再生できるのはこのブロックのおかげです。') },
      { x:588, y:288, w:202, h:52, cat:'media', label:t('Display Engine','ディスプレイエンジン'), sub:o.display, detail:o.displayDetail },
      { x:588, y:348, w:202, h:56, cat:'media', label:t('Image Signal Processor','画像信号プロセッサ'), sub:t('camera pipeline','カメラ経路'),
        detail:t('Fixed-function ISP: demosaic, noise reduction, tone mapping, and the face and subject detection feeds. Handles the built-in camera and Center Stage-class processing.',
                 '固定機能の ISP です。デモザイク、ノイズ低減、トーンマッピング、顔・被写体検出の入力を担当し、内蔵カメラとセンターフレーム相当の処理を受け持ちます。') },
      { x:10, y:412, w:180, h:48, cat:'io', label:t('Secure Enclave','Secure Enclave'), sub:t('isolated coprocessor','独立コプロセッサ'),
        detail:t('A separate CPU with its own boot ROM, AES engine and key storage. It holds Touch ID templates and the class keys for FileVault and Data Protection; the main CPU can request operations but never reads the keys.',
                 '専用のブート ROM、AES エンジン、鍵ストレージを備えた独立 CPU です。Touch ID のテンプレートや FileVault・Data Protection のクラス鍵を保持し、メイン CPU は処理を依頼できても鍵そのものは読めません。') },
      { x:198, y:412, w:152, h:48, cat:'io', label:t('SoC Fabric &amp; Control','SoC ファブリックと制御'), sub:t('coherent interconnect','コヒーレント相互接続'),
        detail:t('The coherent fabric every other block hangs off. It arbitrates access to the system level cache and the memory controllers and maintains coherence between CPU, GPU and NPU — the reason "unified memory" means no copies rather than merely shared capacity.',
                 '他のすべてのブロックがぶら下がるコヒーレントファブリックです。システムレベルキャッシュとメモリコントローラへのアクセスを調停し、CPU・GPU・NPU 間のコヒーレンシを保ちます。ユニファイドメモリが「容量の共有」ではなく「コピー不要」を意味するのはこのためです。') },
      { x:358, y:412, w:222, h:48, cat:'io', label:t('Thunderbolt / USB4 · PCIe','Thunderbolt / USB4 · PCIe'), sub:o.tb, detail:o.tbDetail },
      { x:588, y:412, w:202, h:48, cat:'io', label:t('System I/O','システム I/O'), sub:t('sensors · audio · power','センサ · 音声 · 電源'),
        detail:t('The always-on domain: power management, audio DSP, the sensor hub and the low-speed peripheral controllers.',
                 '常時オン領域です。電源管理、オーディオ DSP、センサハブ、低速ペリフェラルのコントローラが置かれます。') },
      { x:10, y:468, w:780, h:38, cat:'cache', label:t('System Level Cache (SLC)','システムレベルキャッシュ（SLC）'), sub:o.slc,
        detail:t('A last-level cache shared by CPU, GPU, NPU and the media blocks, sitting in front of DRAM. It absorbs traffic that unified memory would otherwise push off-chip, which is most of what makes Apple’s comparatively narrow memory bus perform the way it does.',
                 'CPU・GPU・NPU・メディアブロックが共有する、DRAM の手前のラストレベルキャッシュです。ユニファイドメモリがチップ外へ押し出すはずのトラフィックを吸収します。Apple の比較的狭いメモリバスがあの性能を出せる主因です。') },
      { x:10, y:514, w:780, h:36, cat:'mem', label:t('Memory Controllers &amp; ','メモリコントローラと ')+o.memType+' PHY', sub:o.memSub, detail:o.memDetail }
    ];
  }

  const DIES = {};

  DIES.m3 = { name:'M3', meta:[
      [t('Released','発売'), t('Oct 2023','2023年10月')], [t('Process','プロセス'),'TSMC N3B'],
      [t('Transistors','トランジスタ'), t('25 B','250 億')], [t('Die area','ダイ面積'), t('~146 mm² est.','約 146 mm²（推定）')],
      ['CPU', t('8-core (4P + 4E)','8 コア（4P + 4E）')], ['GPU', t('10-core','10 コア')],
      [t('Bandwidth','帯域'),'100 GB/s'], [t('Max memory','最大メモリ'),'24 GB']],
    dies:[{ ox:70, oy:70, w:800, h:560, title:t('M3 · monolithic die','M3 · モノリシックダイ'), blocks: baseDie({
      eCores:4, gpuNA:false, gpuSub:t('10 cores · 1st-gen ray tracing','10 コア · 第1世代レイトレーシング'),
      gpuDetail:t('Ten GPU cores. Each holds shader ALUs, a texture unit, a ray-tracing unit and a slice of the Dynamic Caching pool. M3 is the generation that first brought hardware ray tracing and mesh shading to the Mac.',
                  '10 個の GPU コア。各コアはシェーダ ALU、テクスチャユニット、レイトレーシングユニット、Dynamic Caching プールの一部を持ちます。M3 はハードウェアレイトレーシングとメッシュシェーディングを Mac に初めてもたらした世代です。'),
      dcSub:t('1st generation','第1世代'), dcDetail:t('This is its debut generation.','この世代が初登場です。'),
      pLabel:t('Performance Cores','高性能コア'), pSub:t('4 cores · wide OoO','4 コア · 広幅アウトオブオーダ'),
      pDetail:t('Four out-of-order performance cores with a very wide decode and a large reorder window — the design point behind Apple’s single-thread lead. Up to 35% faster than M1.',
                '非常に広いデコード幅と大きなリオーダウィンドウを持つ 4 個のアウトオブオーダコアです。Apple のシングルスレッド優位を支える設計で、M1 比で最大 35% 高速です。'),
      eLabel:t('Efficiency Cores','高効率コア'), eSub:t('4 cores','4 コア'),
      eDetail:t('Four narrower cores on a separate voltage domain. macOS schedules background and utility-QoS work here, which is most of why idle power is so low.',
                '独立した電圧ドメインに置かれた、より狭い 4 コアです。macOS はバックグラウンドや utility QoS の処理をここへ回します。アイドル電力が低い主因です。'),
      neTops:'18 TOPS', neDetail:t('A fixed-function 16-core NPU with its own SRAM, tuned for low-power sustained inference. About 60% faster than the M1 family.',
                                    '専用 SRAM を持つ固定機能の 16 コア NPU で、低消費電力の継続的な推論に最適化されています。M1 系比で約 60% 高速です。'),
      display:t('up to 2 external displays','外部ディスプレイ最大 2 台'),
      displayDetail:t('Composites and scales the final frame, drives panel timing, and handles panel-specific compensation.','最終フレームの合成とスケーリング、パネルのタイミング駆動、パネル固有の補正を担当します。'),
      tb:t('Thunderbolt 4 · 40 Gb/s','Thunderbolt 4 · 40 Gb/s'),
      tbDetail:t('Thunderbolt 4 controllers at 40 Gb/s, plus the PCIe root complex for internal NVMe.','40 Gb/s の Thunderbolt 4 コントローラと、内蔵 NVMe 用の PCIe ルートコンプレックスです。'),
      slc:t('8 MB shared','8 MB 共有'), memType:'LPDDR5', memSub:t('128-bit · 100 GB/s · ≤24 GB','128 ビット · 100 GB/s · 24 GB 以下'),
      memDetail:t('A 128-bit LPDDR5 interface at 100 GB/s. The PHYs sit on the die edge because they need short, length-matched routing to the memory packages beside the die on the same substrate.',
                  '128 ビット LPDDR5、100 GB/s。PHY がダイ端にあるのは、同じ基板上でダイの隣に載るメモリパッケージまで、短く長さの揃った配線が必要だからです。') })}]};

  DIES.m4 = { name:'M4', meta:[
      [t('Released','発売'), t('May 2024','2024年5月')], [t('Process','プロセス'),'TSMC N3E'],
      [t('Transistors','トランジスタ'), t('28 B','280 億')], [t('Die area','ダイ面積'), t('~165 mm² est.','約 165 mm²（推定）')],
      ['CPU', t('10-core (4P + 6E)','10 コア（4P + 6E）')], ['GPU', t('10-core','10 コア')],
      [t('Bandwidth','帯域'),'120 GB/s'], [t('Max memory','最大メモリ'),'32 GB']],
    dies:[{ ox:70, oy:70, w:800, h:560, title:t('M4 · monolithic die','M4 · モノリシックダイ'), blocks: baseDie({
      eCores:6, gpuNA:false, gpuSub:t('10 cores · 2nd-gen ray tracing','10 コア · 第2世代レイトレーシング'),
      gpuDetail:t('Ten GPU cores again. M4 keeps the count and improves the ray-tracing unit rather than adding cores.',
                  '同じく 10 コア。M4 はコア数を増やさず、レイトレーシングユニットを改良しました。'),
      dcSub:t('1st generation','第1世代'), dcDetail:t('Carried over from M3.','M3 から引き継がれています。'),
      pLabel:t('Performance Cores','高性能コア'), pSub:t('4 cores · wider decode','4 コア · デコード幅拡張'),
      pDetail:t('Improved branch prediction, a wider decode and wider execution engines over M3, plus next-generation ML accelerators in each core. Apple claimed up to 1.5× M2 CPU performance.',
                'M3 比で分岐予測を改善し、デコードと実行エンジンを広げ、各コアに次世代の ML アクセラレータを備えます。Apple は M2 比で最大 1.5 倍としています。'),
      eLabel:t('Efficiency Cores','高効率コア'), eSub:t('6 cores','6 コア'),
      eDetail:t('Two more efficiency cores than M3, each with a deeper execution engine. This is where most of M4’s multithreaded gain actually comes from.',
                'M3 より 2 コア多く、実行エンジンも深くなっています。M4 のマルチスレッド性能向上の大半はここから来ています。'),
      neTops:'38 TOPS', neDetail:t('Roughly double M3, and the headline number of the Apple Intelligence launch.','M3 のおよそ 2 倍で、Apple Intelligence 発表時の目玉となった数字です。'),
      display:t('tandem OLED · 10–120 Hz','タンデム OLED · 10–120 Hz'),
      displayDetail:t('M4 added tandem OLED support with per-panel brightness and colour compensation, built for the iPad Pro it launched in.',
                      'M4 はタンデム OLED に対応し、パネルごとの輝度・色補正を加えました。同時に発売された iPad Pro 向けの設計です。'),
      tb:t('Thunderbolt 4 · 40 Gb/s','Thunderbolt 4 · 40 Gb/s'),
      tbDetail:t('Thunderbolt 4 controllers and the PCIe root complex. Thunderbolt 5 arrived on M4 Pro and M4 Max, not the base M4.',
                 'Thunderbolt 4 コントローラと PCIe ルートコンプレックスです。Thunderbolt 5 は M4 Pro / M4 Max からで、標準の M4 にはありません。'),
      slc:t('8 MB shared','8 MB 共有'), memType:'LPDDR5X', memSub:t('128-bit · 120 GB/s · ≤32 GB','128 ビット · 120 GB/s · 32 GB 以下'),
      memDetail:t('Moves to LPDDR5X for 120 GB/s over the same 128-bit width, and raises the ceiling to 32 GB.',
                  'LPDDR5X へ移行し、同じ 128 ビット幅で 120 GB/s を得ました。上限は 32 GB です。') })}]};

  DIES.m5 = { name:'M5', meta:[
      [t('Released','発売'), t('Oct 2025','2025年10月')], [t('Process','プロセス'),'TSMC N3P'],
      [t('Transistors','トランジスタ'), t('not disclosed','非公開')], [t('Die area','ダイ面積'), t('not disclosed','非公開')],
      ['CPU', t('10-core (4P + 6E)','10 コア（4P + 6E）')], ['GPU', t('10-core + 10 NA','10 コア + NA 10 基')],
      [t('Bandwidth','帯域'),'153 GB/s'], [t('Max memory','最大メモリ'),'32 GB']],
    dies:[{ ox:70, oy:70, w:800, h:560, title:t('M5 · monolithic die','M5 · モノリシックダイ'), blocks: baseDie({
      eCores:6, gpuNA:true, gpuSub:t('10 cores · Neural Accelerator each','10 コア · 各コアに Neural Accelerator'),
      gpuDetail:t('The M5 change: every core gains a Neural Accelerator, a matrix engine doing FP16 and INT8 multiply-accumulate next to the ALUs. Over 4× M4’s peak GPU compute for AI, up to 45% more graphics performance, and third-generation ray tracing.',
                  'M5 の変更点はこれです。各コアが Neural Accelerator を得ました。ALU の隣で FP16 / INT8 の積和を行う行列エンジンです。AI 向けのピーク GPU 演算性能は M4 の 4 倍超、グラフィックス性能は最大 45% 向上、レイトレーシングは第3世代です。'),
      dcSub:t('2nd generation','第2世代'),
      dcDetail:t('Second generation, with the allocation policy extended to cover the new matrix engines’ working set.','第2世代となり、割り当て方針が新しい行列エンジンの作業セットまで広がりました。'),
      pLabel:t('Performance Cores','高性能コア'), pSub:t('4 cores · "world’s fastest"','4 コア · 「世界最速」'),
      pDetail:t('Apple describes these as the world’s fastest CPU performance core. Up to 15% faster multithreaded than M4 overall — a modest step that makes clear the M5’s budget went to the GPU.',
                'Apple はこれを世界最速の CPU 高性能コアと説明しています。全体のマルチスレッド性能は M4 比で最大 15% 向上にとどまり、M5 の設計予算が GPU へ振られたことを示しています。'),
      eLabel:t('Efficiency Cores','高効率コア'), eSub:t('6 cores','6 コア'),
      eDetail:t('Six efficiency cores, as on M4. Note that when the M5 Pro and Max arrived five months later, Apple had switched vocabulary entirely, to "Super Cores" and "Performance Cores".',
                'M4 と同じく 6 コアです。5 か月後に登場した M5 Pro / Max では、Apple は呼称を「スーパーコア」と「パフォーマンスコア」へ完全に切り替えています。'),
      neTops:t('faster, wider BW','高速化・帯域拡張'),
      neDetail:t('Improved and given more memory bandwidth, but no longer the centre of the AI story — that is now the GPU’s Neural Accelerators.',
                 '改良され帯域も増えましたが、AI の主役ではなくなりました。その座は GPU の Neural Accelerator に移っています。'),
      display:t('tandem OLED · ProMotion','タンデム OLED · ProMotion'),
      displayDetail:t('Carries the tandem OLED and variable-refresh pipeline forward.','タンデム OLED と可変リフレッシュの経路を引き継いでいます。'),
      tb:t('Thunderbolt 4 · 40 Gb/s','Thunderbolt 4 · 40 Gb/s'),
      tbDetail:t('Thunderbolt 4 on the base M5; the on-chip Thunderbolt 5 controllers are a Pro and Max feature.',
                 '標準の M5 は Thunderbolt 4 です。オンチップの Thunderbolt 5 コントローラは Pro / Max の機能です。'),
      slc:t('shared last level','共有ラストレベル'), memType:'LPDDR5X', memSub:t('153 GB/s · ≤32 GB','153 GB/s · 32 GB 以下'),
      memDetail:t('153 GB/s, nearly 30% up on M4. The ten new matrix engines are bandwidth-hungry; this increase is what keeps them fed.',
                  '153 GB/s、M4 比で約 30% 増です。新設された 10 基の行列エンジンは帯域を要求します。この増加がそれを支えます。') })}]};

  function cpuDie() { return [
    { x:10, y:10, w:290, h:190, cat:'cpup', label:t('Super Cores','スーパーコア'), sub:t('6 cores · Armv9','6 コア · Armv9'), grid:{ n:6, cols:3, pfx:'S' },
      detail:t('Six Super Cores on Armv9 — the top performance tier, and a new name. Apple has not published a mapping to the old P-core label, but the position in the hierarchy is the same.',
               'Armv9 のスーパーコア 6 基。最上位の性能階層で、名称は新しくなりました。従来の P コアとの対応は公表されていませんが、階層上の位置は同じです。') },
    { x:10, y:206, w:290, h:174, cat:'cpue', label:t('Performance Cores','パフォーマンスコア'), sub:t('12 cores · Armv9','12 コア · Armv9'), grid:{ n:12, cols:4, pfx:'P' },
      detail:t('Twelve Performance Cores. With the six Super Cores this is an 18-core CPU delivering up to 30% more multithreaded performance than the M4 generation, and 2.5× M1 Pro and M1 Max.',
               'パフォーマンスコア 12 基。スーパーコア 6 基と合わせて 18 コア CPU となり、M4 世代比で最大 30%、M1 Pro / M1 Max 比で 2.5 倍のマルチスレッド性能です。') },
    { x:308, y:10, w:184, h:180, cat:'npu', label:t('Neural Engine','Neural Engine'), sub:t('16 cores','16 コア'), grid:{ n:16, cols:4, pfx:'' },
      detail:t('The 16-core Neural Engine lives on the CPU die, with enhanced bandwidth to reach unified memory — which now means reaching across the bond interface to the controllers on the other die.',
               '16 コアの Neural Engine は CPU ダイ側にあり、ユニファイドメモリへの帯域が強化されています。ただしその到達先は、ボンド界面を越えた先のもう一方のダイのコントローラです。') },
    { x:308, y:198, w:184, h:80, cat:'io', label:t('Thunderbolt 5','Thunderbolt 5'), sub:t('4 × on-chip controllers','オンチップ 4 基'),
      detail:t('Four Thunderbolt 5 controllers integrated on the CPU die — 80 Gb/s bidirectional, 120 Gb/s in Bandwidth Boost. Bringing them on-die removes a discrete controller and its latency.',
               'CPU ダイに統合された Thunderbolt 5 コントローラ 4 基。双方向 80 Gb/s、Bandwidth Boost 時 120 Gb/s です。オンダイ化により外付けコントローラとその遅延がなくなります。') },
    { x:308, y:286, w:184, h:46, cat:'io', label:t('Secure Enclave','Secure Enclave'), sub:t('+ memory integrity','+ メモリ整合性保護'),
      detail:t('Alongside the usual Secure Enclave duties, the M5 generation carries Memory Integrity Enforcement — always-on memory tagging that turns most memory-safety bugs into deterministic crashes rather than exploitable primitives.',
               '通常の Secure Enclave の役割に加え、M5 世代は Memory Integrity Enforcement を備えます。常時有効のメモリタグ付けにより、多くのメモリ安全性バグを悪用可能な足がかりではなく確定的なクラッシュへ変えます。') },
    { x:308, y:340, w:184, h:40, cat:'io', label:t('SoC Control','SoC 制御'), sub:t('power · clocks','電源 · クロック'),
      detail:t('Power management, clock domains and the always-on controllers for the CPU die.','CPU ダイの電源管理、クロックドメイン、常時オンのコントローラ群です。') },
    { x:10, y:388, w:482, h:50, cat:'cache', label:t('CPU Cache &amp; Coherence','CPU キャッシュとコヒーレンシ'), sub:t('cluster L2 + snoop filters','クラスタ L2 + スヌープフィルタ'),
      detail:t('Per-cluster L2 plus the coherence directory. Because DRAM sits behind the other die, the hit rate here matters more than it did on a monolithic part.',
               'クラスタごとの L2 とコヒーレンシディレクトリです。DRAM がもう一方のダイの向こうにあるため、ここのヒット率はモノリシック品より重要になります。') },
    { x:10, y:446, w:482, h:64, cat:'io', label:t('Inter-die Fabric','ダイ間ファブリック'), sub:t('routes all off-die traffic','ダイ外トラフィックを集約'),
      detail:t('Every request that leaves the CPU die — memory, display, media, GPU work submission — funnels through here and into the bond interface.',
               'CPU ダイを出るすべての要求（メモリ、ディスプレイ、メディア、GPU への処理投入）はここに集まり、ボンド界面へ入ります。') },
    { x:500, y:10, w:50, h:500, cat:'bond', label:'BOND', sub:'', vertical:true,
      detail:t('Hybrid bond interface: TSMC SoIC-mH. Copper pads bonded directly die-to-die at a pitch far finer than microbumps, giving very high bandwidth per millimetre at a fraction of the energy per bit of an off-package link. Drawn on the die edge here for legibility; in the real package the two dies are bonded face-to-face, one above the other.',
               'ハイブリッドボンド界面（TSMC SoIC-mH）です。マイクロバンプよりはるかに細かいピッチで銅パッドを直接ダイ間接合し、1 mm あたり非常に高い帯域を、パッケージ外リンクの何分の一かのビットあたりエネルギーで実現します。ここでは可読性のためダイ端に描いていますが、実際のパッケージでは 2 つのダイが face-to-face で上下に接合されます。') }
  ];}

  function gpuDie(n) { return [
    { x:10, y:10, w:50, h:500, cat:'bond', label:'BOND', sub:'', vertical:true,
      detail:t('The mating half of the SoIC-mH hybrid bond. Unified memory is maintained across both dies through this interface, so software sees one address space and one pool of RAM.',
               'SoIC-mH ハイブリッドボンドの対向側です。この界面を通して両ダイにまたがるユニファイドメモリが維持され、ソフトウェアからは 1 つのアドレス空間と 1 つのメモリプールに見えます。') },
    { x:68, y:10, w:482, h:272, cat:'gpu', label:t('GPU Cores','GPU コア'), sub:n+t(' cores · Neural Accelerator each',' コア · 各コアに Neural Accelerator'), grid:{ n:n, cols:n>20?8:5, na:true, pfx:'' },
      detail:t('Each core carries a Neural Accelerator supporting FP16 and INT8 matrix operations. ','各コアが FP16 / INT8 の行列演算に対応する Neural Accelerator を備えます。')
        + (n>20 ? t('The M5 Max doubles the array to 40 cores; the CPU die is unchanged from the Pro. ','M5 Max はこの配列を 40 コアへ倍増します。CPU ダイは Pro と同一です。')
                : t('Twenty cores on the M5 Pro. The M5 Max uses an identical CPU die with a 40-core GPU die. ','M5 Pro は 20 コアです。M5 Max は同一の CPU ダイに 40 コアの GPU ダイを組み合わせます。'))
        + t('Over 4× the previous generation’s peak GPU compute for AI, and up to 35% better ray tracing.','AI 向けピーク GPU 演算性能は前世代の 4 倍超、レイトレーシングは最大 35% 向上です。') },
    { x:68, y:290, w:482, h:40, cat:'cache', label:t('GPU L2 · Dynamic Caching','GPU L2 · Dynamic Caching'), sub:t('2nd generation','第2世代'),
      detail:t('Second-generation Dynamic Caching, feeding both the shader ALUs and the per-core matrix engines.','第2世代の Dynamic Caching で、シェーダ ALU とコア内の行列エンジンの双方に供給します。') },
    { x:68, y:338, w:236, h:40, cat:'media', label:t('Media Engine','メディアエンジン'), sub:'ProRes · AV1 · HEVC',
      detail:t('Hardware H.264, HEVC and AV1 decode with ProRes and ProRes RAW encode and decode. On a two-die part this block sits with the memory controllers, which is where the bandwidth is.',
               'H.264・HEVC・AV1 のハードウェアデコードと、ProRes / ProRes RAW のエンコード・デコードです。2 ダイ構成では、帯域のあるメモリコントローラ側にこのブロックが置かれます。') },
    { x:312, y:338, w:238, h:40, cat:'media', label:t('Display Engines','ディスプレイエンジン'), sub:t('multi-display','マルチディスプレイ'),
      detail:t('The display engines live on the GPU die too — the frame is composited beside the memory it reads from, so scanout never crosses the bond.',
               'ディスプレイエンジンも GPU ダイ側にあります。読み出すメモリの隣でフレームを合成するため、スキャンアウトがボンドを越えることはありません。') },
    { x:68, y:386, w:482, h:40, cat:'cache', label:t('System Level Cache','システムレベルキャッシュ'), sub:t('shared last level','共有ラストレベル'),
      detail:t('Last-level cache in front of DRAM, shared by both dies. Every CPU-die miss lands here after crossing the bond.',
               'DRAM 手前のラストレベルキャッシュで、両ダイが共有します。CPU ダイのミスはボンドを越えてここに到達します。') },
    { x:68, y:434, w:482, h:36, cat:'mem', label:t('Memory Controllers','メモリコントローラ'), sub:'4 × LPDDR5X-9600',
      detail:t('Four LPDDR5X-9600 memory controllers — 307 GB/s on the M5 Pro, 614 GB/s on the M5 Max. Placing them on the GPU die puts them next to the biggest consumer of bandwidth, at the cost of a bond crossing for every CPU access.',
               'LPDDR5X-9600 のメモリコントローラ 4 基。M5 Pro で 307 GB/s、M5 Max で 614 GB/s です。GPU ダイに置くことで最大の帯域消費者の隣に配置できますが、CPU からのアクセスは毎回ボンドを越えることになります。') },
    { x:68, y:478, w:482, h:32, cat:'mem', label:t('LPDDR5X PHY','LPDDR5X PHY'), sub:t('to on-package DRAM','パッケージ上の DRAM へ'),
      detail:t('Physical interfaces on the die edge, routing to the LPDDR5X packages mounted beside the die stack on the same substrate: up to 64 GB on the Pro, 128 GB on the Max.',
               'ダイ端の物理インターフェースです。同じ基板上でダイスタックの隣に載る LPDDR5X パッケージへ配線されます。Pro は最大 64 GB、Max は 128 GB です。') }
  ];}

  DIES.m5pro = { name:t('M5 Pro / Max','M5 Pro / Max'), twoDie:true, links:true, meta:[
      [t('Released','発売'), t('Mar 2026','2026年3月')], [t('Process','プロセス'), t('TSMC N3P × 2 dies','TSMC N3P × 2 ダイ')],
      [t('Packaging','パッケージ'),'TSMC SoIC-mH'], ['CPU', t('18-core (6 Super + 12 Perf)','18 コア（Super 6 + Perf 12）')],
      ['GPU', t('20-core Pro / 40-core Max','Pro 20 コア / Max 40 コア')], [t('Bandwidth','帯域'),'307 / 614 GB/s'],
      [t('Max memory','最大メモリ'),'64 / 128 GB'], [t('Interconnect','ダイ間接続'), t('Fusion Architecture','Fusion アーキテクチャ')]],
    dies:[
      { ox:50,  oy:80, w:560, h:520, title:t('CPU die','CPU ダイ'), blocks: cpuDie() },
      { ox:740, oy:80, w:560, h:520, title:t('GPU / IO die','GPU / IO ダイ'), blocks: gpuDie(20) }
    ]};

  /* ---------------- renderer ---------------- */
  let flat = [];
  function gridCells(b) {
    const g = b.grid, hdr = b.sub ? 34 : 22;
    const ix = b.x + 8, iy = b.y + hdr, iw = b.w - 16, ih = b.h - hdr - 8;
    const cols = g.cols, rows = Math.ceil(g.n / cols), gap = 5;
    const cw = (iw - (cols - 1) * gap) / cols, ch = (ih - (rows - 1) * gap) / rows;
    let out = '';
    for (let i = 0; i < g.n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const x = ix + c * (cw + gap), y = iy + r * (ch + gap);
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="1.5" fill="${line(b.cat)}" fill-opacity="0.16" stroke="${line(b.cat)}" stroke-width="0.8"/>`;
      if (cw > 34 && ch > 18) out += `<text x="${(x+5).toFixed(1)}" y="${(y+ch/2+3.5).toFixed(1)}" font-family="ui-monospace,Menlo,monospace" font-size="${cw>60?10.5:9}" fill="${line(b.cat)}" opacity="0.95">${(g.pfx||'')+i}</text>`;
      if (g.na && cw > 30 && ch > 16) {
        const naw = Math.min(24, cw*0.32), nax = x+cw-naw-3, nay = y+3, nah = ch-6;
        out += `<rect x="${nax.toFixed(1)}" y="${nay.toFixed(1)}" width="${naw.toFixed(1)}" height="${nah.toFixed(1)}" rx="1" fill="${fill('npu')}" stroke="${line('npu')}" stroke-width="0.8"/>`;
        if (naw >= 18 && nah >= 13) out += `<text x="${(nax+naw/2).toFixed(1)}" y="${(nay+nah/2+3).toFixed(1)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="${line('npu')}">NA</text>`;
      }
    }
    return out;
  }
  function blockSVG(b, idx) {
    let s = `<g class="fp-blk" tabindex="0" role="button" data-i="${idx}" aria-label="${String(b.label).replace(/&amp;/g,'and').replace(/<[^>]*>/g,'')}">`;
    s += `<rect class="fp-body" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2.5" fill="${fill(b.cat)}" fill-opacity="0.9" stroke="${line(b.cat)}" stroke-width="1.2"/>`;
    if (b.vertical) {
      const cx = b.x + b.w/2, cy = b.y + b.h/2;
      s += `<text transform="translate(${cx},${cy}) rotate(-90)" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="12" letter-spacing="3" fill="${line(b.cat)}">HYBRID BOND · SoIC-mH</text>`;
      for (let k = 0; k < 24; k++) {
        const yy = b.y + 14 + k * ((b.h - 28) / 23);
        s += `<circle cx="${b.x+9}" cy="${yy.toFixed(1)}" r="2.1" fill="${line(b.cat)}" opacity="0.55"/><circle cx="${b.x+b.w-9}" cy="${yy.toFixed(1)}" r="2.1" fill="${line(b.cat)}" opacity="0.55"/>`;
      }
    } else {
      const ty = b.y + (b.grid ? 14 : (b.h <= 44 ? b.h/2 + 1 : 16));
      s += `<text x="${b.x+8}" y="${ty.toFixed(1)}" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="12.5" fill="${line(b.cat)}">${b.label}</text>`;
      if (b.sub) {
        if (b.grid || b.h > 44) s += `<text x="${b.x+8}" y="${(ty+13).toFixed(1)}" font-family="ui-monospace,Menlo,monospace" font-size="9.5" fill="${line(b.cat)}" opacity="0.85">${b.sub}</text>`;
        else s += `<text x="${b.x+b.w-8}" y="${ty.toFixed(1)}" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="9.5" fill="${line(b.cat)}" opacity="0.8">${b.sub}</text>`;
      }
      if (b.grid) s += gridCells(b);
    }
    return s + '</g>';
  }
  function renderDie(spec) {
    flat = [];
    const two = !!spec.twoDie;
    const vbW = two ? 1350 : 940, vbH = two ? 700 : 658;
    let s = `<svg viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="${t('Top-down floorplan of the Apple ','Apple ')}${spec.name}${t('','　のダイ上面図')}">`;
    spec.dies.forEach(d => {
      s += `<text x="${d.ox}" y="${d.oy-22}" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="15" fill="var(--ink)">${d.title}</text>`;
      s += `<rect x="${d.ox-6}" y="${d.oy-6}" width="${d.w+12}" height="${d.h+12}" rx="6" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>`;
      s += `<rect x="${d.ox}" y="${d.oy}" width="${d.w}" height="${d.h}" rx="4" fill="var(--fp-die)" stroke="var(--ink-faint)" stroke-width="1.4"/>`;
      s += `<g transform="translate(${d.ox},${d.oy})">`;
      d.blocks.forEach(b => { flat.push(b); s += blockSVG(b, flat.length - 1); });
      s += '</g>';
    });
    if (spec.links) {
      s += '<defs><marker id="fpArA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-soft)"/></marker></defs>';
      s += '<line x1="612" y1="250" x2="736" y2="250" stroke="var(--ink-soft)" stroke-width="1.6" marker-end="url(#fpArA)"/>';
      s += '<line x1="736" y1="330" x2="612" y2="330" stroke="var(--ink-soft)" stroke-width="1.6" marker-end="url(#fpArA)"/>';
      s += `<text x="674" y="241" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="var(--ink-soft)">${t('memory requests','メモリ要求')}</text>`;
      s += `<text x="674" y="350" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="var(--ink-soft)">${t('data + coherence','データ + コヒーレンシ')}</text>`;
      s += `<text x="674" y="640" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="var(--ink-faint)">${t('unfolded view — the dies are bonded face-to-face, not side by side','展開図です。実際の 2 ダイは横並びではなく face-to-face で接合されています')}</text>`;
    }
    return s + '</svg>';
  }

  /* ---------------- static figures ---------------- */
  function gpuCoreSVG() {
    const gens = [
      { x:20,  t:'M3', n:'N3B', rt:t('1st gen','第1世代'), dc:t('1st gen','第1世代'), na:false },
      { x:320, t:'M4', n:'N3E', rt:t('2nd gen','第2世代'), dc:t('1st gen','第1世代'), na:false },
      { x:620, t:'M5', n:'N3P', rt:t('3rd gen','第3世代'), dc:t('2nd gen','第2世代'), na:true }
    ];
    let out = '<defs><marker id="fpAr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-soft)"/></marker></defs>';
    gens.forEach((gen, gi) => {
      const W = 260, X = gen.x, Y = 44, H = gen.na ? 226 : 194;
      const items = [
        [t('Shader ALUs','シェーダ ALU'), 'gpu', t('32-wide SIMD','32 幅 SIMD'), 46],
        [t('Texture / sampler','テクスチャ / サンプラ'), 'gpu', '', 34],
        [t('Ray-tracing unit','レイトレーシングユニット'), 'gpu', gen.rt, 34],
        [t('Dynamic Caching','Dynamic Caching'), 'cache', gen.dc, 34]
      ];
      out += `<text x="${X}" y="${Y-20}" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="15" fill="var(--ink)">${gen.t}${t(' core','　コア')}</text>`;
      out += `<text x="${X+W}" y="${Y-20}" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="var(--ink-faint)">${gen.n}</text>`;
      out += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="3" fill="var(--fp-die)" stroke="var(--ink-faint)" stroke-width="1.3"/>`;
      let y = Y + 12;
      items.forEach(it => {
        out += `<rect x="${X+12}" y="${y}" width="${W-24}" height="${it[3]}" rx="2" fill="${fill(it[1])}" stroke="${line(it[1])}" stroke-width="1.1"/>`;
        out += `<text x="${X+22}" y="${y + (it[2] ? it[3]/2 - 1 : it[3]/2 + 4)}" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="12" fill="${line(it[1])}">${it[0]}</text>`;
        if (it[2]) out += `<text x="${X+22}" y="${y + it[3]/2 + 12}" font-family="ui-monospace,Menlo,monospace" font-size="9.5" fill="${line(it[1])}" opacity="0.85">${it[2]}</text>`;
        y += it[3] + 8;
      });
      if (gen.na) {
        out += `<rect x="${X+12}" y="${y}" width="${W-24}" height="42" rx="2" fill="${fill('npu')}" stroke="${line('npu')}" stroke-width="2"/>`;
        out += `<text x="${X+22}" y="${y+18}" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12.5" fill="${line('npu')}">Neural Accelerator</text>`;
        out += `<text x="${X+22}" y="${y+32}" font-family="ui-monospace,Menlo,monospace" font-size="9.5" fill="${line('npu')}">${t('FP16 / INT8 matrix MAC · new in M5','FP16 / INT8 行列 MAC · M5 で新設')}</text>`;
        out += `<text x="${X+W/2}" y="${Y+H+26}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="${line('npu')}">${t('× 10 cores → &gt;4× peak AI compute','× 10 コア → AI 演算性能 4 倍超')}</text>`;
      }
      if (gi < 2) out += `<line x1="${X+W+12}" y1="140" x2="${X+W+34}" y2="140" stroke="var(--ink-soft)" stroke-width="1.4" marker-end="url(#fpAr)"/>`;
    });
    return `<svg viewBox="0 0 900 340" role="img" aria-label="${t('Three GPU core diagrams showing that M5 adds a per-core Neural Accelerator matrix engine.','M5 が各 GPU コアに Neural Accelerator を追加したことを示す 3 世代の比較図')}">${out}</svg>`;
  }

  function crossSectionSVG() {
    let o = '<defs><marker id="fpArX" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="'+line('mem')+'"/></marker>'
      + '<pattern id="fpHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="'+line('bond')+'" stroke-width="2"/></pattern></defs>';
    o += `<rect x="60" y="228" width="780" height="34" rx="2" fill="var(--card)" stroke="var(--ink-faint)" stroke-width="1.2"/>`;
    o += `<text x="72" y="250" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="12" fill="var(--ink-soft)">${t('Package substrate','パッケージ基板')}</text>`;
    [80, 700].forEach(dx => {
      o += `<rect x="${dx}" y="168" width="120" height="56" rx="2" fill="${fill('mem')}" stroke="${line('mem')}" stroke-width="1.3"/>`;
      o += `<text x="${dx+60}" y="192" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="12.5" fill="${line('mem')}">LPDDR5X</text>`;
      o += `<text x="${dx+60}" y="208" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="9.5" fill="${line('mem')}">9600 MT/s</text>`;
    });
    o += `<rect x="228" y="150" width="444" height="74" rx="3" fill="var(--fp-die)" stroke="var(--ink-faint)" stroke-width="1.4"/>`;
    o += `<text x="242" y="170" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="13" fill="var(--ink)">${t('GPU / IO die','GPU / IO ダイ')} <tspan font-family="ui-monospace,Menlo,monospace" font-size="10" fill="var(--ink-faint)">N3P</tspan></text>`;
    o += `<rect x="242" y="180" width="196" height="34" rx="2" fill="${fill('gpu')}" stroke="${line('gpu')}" stroke-width="1.1"/>`;
    o += `<text x="340" y="201" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="11.5" fill="${line('gpu')}">${t('20 / 40 GPU cores + NA','GPU 20 / 40 コア + NA')}</text>`;
    o += `<rect x="446" y="180" width="216" height="34" rx="2" fill="${fill('mem')}" stroke="${line('mem')}" stroke-width="1.1"/>`;
    o += `<text x="554" y="201" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="11.5" fill="${line('mem')}">${t('4 × memory controllers + SLC','メモリコントローラ 4 基 + SLC')}</text>`;
    o += `<rect x="268" y="136" width="364" height="14" fill="url(#fpHatch)" stroke="${line('bond')}" stroke-width="1.2"/>`;
    o += `<text x="644" y="147" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="${line('bond')}">SoIC-mH ${t('hybrid bond','ハイブリッドボンド')}</text>`;
    o += `<rect x="268" y="62" width="364" height="74" rx="3" fill="var(--fp-die)" stroke="var(--ink-faint)" stroke-width="1.4"/>`;
    o += `<text x="282" y="82" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="13" fill="var(--ink)">${t('CPU die','CPU ダイ')} <tspan font-family="ui-monospace,Menlo,monospace" font-size="10" fill="var(--ink-faint)">N3P</tspan></text>`;
    o += `<rect x="282" y="92" width="150" height="34" rx="2" fill="${fill('cpup')}" stroke="${line('cpup')}" stroke-width="1.1"/>`;
    o += `<text x="357" y="113" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="11.5" fill="${line('cpup')}">${t('6 Super + 12 Perf','Super 6 + Perf 12')}</text>`;
    o += `<rect x="440" y="92" width="86" height="34" rx="2" fill="${fill('npu')}" stroke="${line('npu')}" stroke-width="1.1"/>`;
    o += `<text x="483" y="113" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="11.5" fill="${line('npu')}">${t('16-core NE','NE 16 コア')}</text>`;
    o += `<rect x="534" y="92" width="84" height="34" rx="2" fill="${fill('io')}" stroke="${line('io')}" stroke-width="1.1"/>`;
    o += `<text x="576" y="113" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="11.5" fill="${line('io')}">4 × TB5</text>`;
    o += `<path d="M300,126 L300,182" fill="none" stroke="${line('mem')}" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#fpArX)"/>`;
    o += `<path d="M300,196 L442,196" fill="none" stroke="${line('mem')}" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#fpArX)"/>`;
    o += `<path d="M662,196 L698,196" fill="none" stroke="${line('mem')}" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#fpArX)"/>`;
    o += `<text x="188" y="112" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="${line('mem')}">${t('1 · CPU load misses SLC','1 · CPU のロードが SLC をミス')}</text>`;
    o += `<line x1="192" y1="108" x2="278" y2="120" stroke="${line('mem')}" stroke-width="1" opacity="0.5"/>`;
    o += `<text x="310" y="146" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="${line('mem')}">${t('2 · crosses the bond','2 · ボンドを越える')}</text>`;
    o += `<text x="470" y="240" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="${line('mem')}">${t('3 · serviced on the other die → DRAM','3 · もう一方のダイで処理され DRAM へ')}</text>`;
    o += `<text x="60" y="286" font-family="ui-monospace,Menlo,monospace" font-size="10.5" fill="var(--ink-faint)">${t('Not to scale. Both dies N3P; unified memory is maintained across the pair.','縮尺は正確ではありません。両ダイとも N3P、ユニファイドメモリは両ダイにまたがって維持されます。')}</text>`;
    return `<svg viewBox="0 0 900 300" role="img" aria-label="${t('Cross-section of the M5 Pro package showing the CPU die hybrid-bonded above the GPU and IO die.','CPU ダイが GPU / IO ダイの上にハイブリッドボンドされた M5 Pro パッケージの断面図')}">${o}</svg>`;
  }

  const ROWS = [
    ['band','M3','TSMC N3B',t('8-core · 4P + 4E','8 コア · 4P + 4E'),t('10-core','10 コア'),t('16-core · 18 TOPS','16 コア · 18 TOPS'),'100 GB/s','24 GB',t('25 B','250 億')],
    ['','M3 Pro','TSMC N3B',t('12-core · 6P + 6E','12 コア · 6P + 6E'),t('18-core','18 コア'),t('16-core · 18 TOPS','16 コア · 18 TOPS'),'150 GB/s','36 GB',t('37 B','370 億')],
    ['','M3 Max','TSMC N3B',t('16-core · 12P + 4E','16 コア · 12P + 4E'),t('40-core','40 コア'),t('16-core · 18 TOPS','16 コア · 18 TOPS'),'400 GB/s','128 GB',t('92 B','920 億')],
    ['band','M4','TSMC N3E',t('10-core · 4P + 6E','10 コア · 4P + 6E'),t('10-core','10 コア'),t('16-core · 38 TOPS','16 コア · 38 TOPS'),'120 GB/s','32 GB',t('28 B','280 億')],
    ['','M4 Pro','TSMC N3E',t('14-core · 10P + 4E','14 コア · 10P + 4E'),t('20-core','20 コア'),t('16-core · 38 TOPS','16 コア · 38 TOPS'),'273 GB/s','64 GB','<span class="fp-dim">n/d</span>'],
    ['','M4 Max','TSMC N3E',t('16-core · 12P + 4E','16 コア · 12P + 4E'),t('40-core','40 コア'),t('16-core · 38 TOPS','16 コア · 38 TOPS'),'546 GB/s','128 GB',t('92 B','920 億')],
    ['band','M5','TSMC N3P',t('10-core · 4P + 6E','10 コア · 4P + 6E'),t('10-core <span class="fp-dim">+ 10 NA</span>','10 コア <span class="fp-dim">+ NA 10</span>'),t('16-core · faster','16 コア · 高速化'),'153 GB/s','32 GB','<span class="fp-dim">n/d</span>'],
    ['','M5 Pro',t('TSMC N3P <span class="fp-dim">× 2 dies</span>','TSMC N3P <span class="fp-dim">× 2 ダイ</span>'),t('18-core · 6 Super + 12 Perf','18 コア · Super 6 + Perf 12'),t('20-core <span class="fp-dim">+ 20 NA</span>','20 コア <span class="fp-dim">+ NA 20</span>'),t('16-core','16 コア'),'307 GB/s','64 GB','<span class="fp-dim">n/d</span>'],
    ['','M5 Max',t('TSMC N3P <span class="fp-dim">× 2 dies</span>','TSMC N3P <span class="fp-dim">× 2 ダイ</span>'),t('18-core · 6 Super + 12 Perf','18 コア · Super 6 + Perf 12'),t('40-core <span class="fp-dim">+ 40 NA</span>','40 コア <span class="fp-dim">+ NA 40</span>'),t('16-core','16 コア'),'614 GB/s','128 GB','<span class="fp-dim">n/d</span>']
  ];
  const THEAD = [t('Chip','チップ'),t('Node','プロセス'),'CPU','GPU','Neural Engine',t('Memory BW','メモリ帯域'),t('Max RAM','最大メモリ'),t('Transistors','トランジスタ')];
  function tableHTML() {
    return '<div class="fp-tablewrap"><table class="fp-table"><thead><tr>' + THEAD.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>'
      + ROWS.map(r => `<tr class="${r[0]}"><th>${r[1]}</th>` + r.slice(2).map(c => `<td>${c}</td>`).join('') + '</tr>').join('')
      + '</tbody></table></div>';
  }

  window.SiliconFloorplans = { DIES, renderDie, gpuDie, gpuCoreSVG, crossSectionSVG, tableHTML, CATS, lang };

  /* ---------------- mount ---------------- */
  const shell = document.querySelector('[data-lesson="silicon"]');
  if (!shell) return;

  const gc = shell.querySelector('[data-figure="gpucore"]'); if (gc) gc.innerHTML = gpuCoreSVG();
  const xs = shell.querySelector('[data-figure="xsec"]');    if (xs) xs.innerHTML = crossSectionSVG();
  const tb = shell.querySelector('[data-figure="table"]');   if (tb) tb.innerHTML = tableHTML();

  const mount = shell.querySelector('[data-interactive-mount]');
  if (!mount) return;

  const ORDER = ['m3','m4','m5','m5pro'];
  const TMETA = { m3:'N3B · 25 B · 100 GB/s', m4:'N3E · 28 B · 120 GB/s',
                  m5:t('N3P · 10 × NA · 153 GB/s','N3P · NA 10 · 153 GB/s'),
                  m5pro:t('N3P · 2 dies · 307–614 GB/s','N3P · 2 ダイ · 307–614 GB/s') };
  let cur = 'm5', maxMode = false;

  function thumb(key) {
    const c = key === 'm5pro' ? ['gpu','cpup','bond'] : ['gpu','cpup','npu'];
    return `<svg class="fp-thumb" viewBox="0 0 34 26" aria-hidden="true"><rect x="0.6" y="0.6" width="32.8" height="24.8" rx="2" fill="var(--fp-die)" stroke="var(--ink-faint)" stroke-width="0.8"/>`
      + `<rect x="3" y="3" width="13" height="14" rx="1" fill="${fill(c[0])}" stroke="${line(c[0])}" stroke-width="0.7"/>`
      + `<rect x="18" y="3" width="13" height="8" rx="1" fill="${fill(c[1])}" stroke="${line(c[1])}" stroke-width="0.7"/>`
      + `<rect x="18" y="12.5" width="13" height="4.5" rx="1" fill="${fill(c[2])}" stroke="${line(c[2])}" stroke-width="0.7"/>`
      + `<rect x="3" y="19" width="28" height="4" rx="1" fill="${fill('mem')}" stroke="${line('mem')}" stroke-width="0.7"/></svg>`;
  }

  mount.innerHTML = `
    <div class="fp-tabs" role="tablist" aria-label="${t('Chip selector','チップ選択')}">
      ${ORDER.map(k => `<button class="fp-tab" role="tab" type="button" data-k="${k}" aria-selected="${k===cur}">${thumb(k)}<span><span class="fp-tname">${DIES[k].name}</span><span class="fp-tmeta">${TMETA[k]}</span></span></button>`).join('')}
    </div>
    <div class="fp-opts" hidden>
      <span class="fp-optlabel">${t('GPU die','GPU ダイ')}</span>
      <button class="fp-opt" type="button" data-n="20" aria-pressed="true">${t('M5 Pro · 20 cores','M5 Pro · 20 コア')}</button>
      <button class="fp-opt" type="button" data-n="40" aria-pressed="false">${t('M5 Max · 40 cores','M5 Max · 40 コア')}</button>
    </div>
    <div class="fp-stage">
      <div class="fp-canvas"></div>
      <div class="fp-side">
        <div class="fp-panel"><span class="fp-k">${t('Block inspector','ブロック詳細')}</span><p class="fp-iname"></p><p class="fp-ibody"></p></div>
        <div class="fp-panel"><span class="fp-k">${t('Specification','仕様')}</span><div class="fp-meta"></div></div>
        <div class="fp-panel"><span class="fp-k">${t('Layer legend','レイヤ凡例')}</span><ul class="fp-legend">${CATS.map(c => `<li><span class="fp-sw" style="background:${fill(c[0])};border-color:${line(c[0])}"></span>${c[1]}</li>`).join('')}</ul></div>
      </div>
    </div>`;

  const canvas = mount.querySelector('.fp-canvas');
  const iname  = mount.querySelector('.fp-iname');
  const ibody  = mount.querySelector('.fp-ibody');
  const metaEl = mount.querySelector('.fp-meta');
  const optsEl = mount.querySelector('.fp-opts');
  const RESET_N = t('Pick a block','ブロックを選択');
  const RESET_B = t('Hover or select any region of the die to read what it does and how it changed across generations.',
                    'ダイ上の任意の領域にカーソルを合わせるか選択すると、その役割と世代ごとの変化が表示されます。');

  function inspect(i) {
    const b = flat[i]; if (!b) return;
    iname.innerHTML = b.label + (b.sub ? ` <span class="fp-tag">${b.sub}</span>` : '');
    ibody.textContent = b.detail;
    canvas.querySelectorAll('.fp-blk').forEach(g => g.classList.toggle('is-sel', g.dataset.i === String(i)));
  }
  function paint() {
    const spec = DIES[cur];
    if (cur === 'm5pro') spec.dies[1].blocks = gpuDie(maxMode ? 40 : 20);
    canvas.innerHTML = renderDie(spec);
    metaEl.innerHTML = spec.meta.map(m => `<div><span>${m[0]}</span><span>${m[1]}</span></div>`).join('');
    iname.textContent = RESET_N; ibody.textContent = RESET_B;
    optsEl.hidden = cur !== 'm5pro';
    canvas.querySelectorAll('.fp-blk').forEach(g => {
      const i = +g.dataset.i;
      g.addEventListener('mouseenter', () => inspect(i));
      g.addEventListener('click', () => inspect(i));
      g.addEventListener('focus', () => inspect(i));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspect(i); } });
    });
  }
  mount.querySelector('.fp-tabs').addEventListener('click', e => {
    const b = e.target.closest('.fp-tab'); if (!b) return;
    cur = b.dataset.k;
    mount.querySelectorAll('.fp-tab').forEach(x => x.setAttribute('aria-selected', String(x.dataset.k === cur)));
    paint();
  });
  optsEl.addEventListener('click', e => {
    const b = e.target.closest('.fp-opt'); if (!b) return;
    maxMode = b.dataset.n === '40';
    optsEl.querySelectorAll('.fp-opt').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    paint();
  });
  paint();
})();

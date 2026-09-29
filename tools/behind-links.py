#!/usr/bin/env python3
"""Write the "mathematics and physics behind this" panel onto the watch and speaker explainers.

The panel links each explainer to the experiments in the math encyclopedia's engineering
topics that explain it. It sits between <!-- BEHIND:START --> and <!-- BEHIND:END -->,
just before the shared footer, and is rewritten in place on every run.

    python3 tools/behind-links.py           # write
    python3 tools/behind-links.py --check   # exit 1 if any page is stale
"""
import html, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# lab id -> (topic route, English title, Japanese title)
LABS = {
    'balance-hairspring': ('watch-oscillators', 'The balance and hairspring', 'てんぷとひげぜんまい'),
    'escapement-airy': ('watch-oscillators', 'Airy’s theorem: where the escapement pushes', 'エアリーの定理：脱進機はどこで押すか'),
    'positional-error': ('watch-oscillators', 'Positional error and the 220° amplitude', '姿勢差と 220° の振り角'),
    'involute-gearing': ('gears-mechanisms', 'Involute gear teeth', 'インボリュート歯形'),
    'gear-train': ('gears-mechanisms', 'The going train', '輪列'),
    'epicyclic': ('gears-mechanisms', 'Epicyclic gears and the tourbillon', '遊星歯車とトゥールビヨン'),
    'tuning-fork': ('quartz-resonators', 'Why 32,768 Hz: the fork as a beam', 'なぜ 32,768 Hz か：はりとしての音叉'),
    'bvd-circuit': ('quartz-resonators', 'The crystal as a circuit', '回路としての水晶'),
    'quartz-temperature': ('quartz-resonators', 'Temperature and the monthly error', '温度と月ごとの誤差'),
    'driver-impedance': ('loudspeakers', 'The driver’s impedance', 'ドライバーのインピーダンス'),
    'box-alignment': ('loudspeakers', 'Sealed and vented boxes', '密閉型とバスレフ型の箱'),
    'piston-directivity': ('loudspeakers', 'Beaming: a cone’s directivity', '指向性：コーンのビーミング'),
    'rlc-filters': ('crossovers-filters', 'RC and RLC filters, and the Bode plot', 'RC・RLC フィルターとボード線図'),
    'crossover-sum': ('crossovers-filters', 'Adding the crossover halves back together', 'クロスオーバーの二つの半分を足し戻す'),
    'driver-offset': ('crossovers-filters', 'When the drivers are not in the same place', 'ドライバーが同じ場所にないとき'),
    'room-modes': ('room-acoustics', 'Room modes', '部屋のモード'),
    'reverberation': ('room-acoustics', 'Reverberation time', '残響時間'),
    'boundary-reflection': ('room-acoustics', 'The nearest wall: comb filtering', 'いちばん近い壁：くし形フィルター'),
}

# page -> [(lab id, why it matters here, en / ja)]
WATCH = [
    ('balance-hairspring', 'The oscillator that keeps the time, and how the regulator changes the rate by seconds a day.', '時を刻む振動子と、緩急針が一日あたり何秒と歩度を変える仕組み。'),
    ('escapement-airy', 'Why the escapement pushes at the centre of the swing, and what a kick anywhere else costs.', '脱進機が振動の中心で押す理由と、それ以外の所で押すと何が起こるか。'),
    ('positional-error', 'Why a watch gains or loses depending on which way it lies.', '時計がどちら向きに置かれるかで進み遅れが変わる理由。'),
    ('gear-train', 'How the barrel’s slow turn becomes seconds, minutes and hours.', '香箱のゆっくりした回転が秒、分、時になる仕組み。'),
    ('involute-gearing', 'Why the teeth have the shape they do.', '歯がその形をしている理由。'),
    ('epicyclic', 'Gears that orbit other gears, from differentials to the tourbillon.', 'ほかの歯車の周りを回る歯車、差動装置からトゥールビヨンまで。'),
]
QUARTZ = [
    ('tuning-fork', 'Why the crystal is a tiny fork, and why it rings at exactly 2¹⁵ Hz.', '水晶が小さな音叉である理由と、ちょうど 2¹⁵ Hz で鳴る理由。'),
    ('bvd-circuit', 'The crystal as a circuit, and how a watch is trimmed to time.', '回路としての水晶と、時計を正しい時刻に合わせる調整。'),
    ('quartz-temperature', 'The temperature parabola that sets the error over a month.', '一か月の誤差を決める温度の放物線。'),
    ('balance-hairspring', 'The mechanical counterpart: a balance wheel ringing 10,000 times slower.', '機械式の対応物：1 万分の 1 の速さで振動するてんぷ。'),
]
TOURBILLON = [
    ('epicyclic', 'The cage as a planet carrier: the escape pinion rolls round a fixed wheel.', '遊星キャリアとしてのキャリッジ：がんぎかなが固定された車の周りを転がる。'),
    ('positional-error', 'The error a tourbillon sets out to average away, and the amplitude where it vanishes on its own.', 'トゥールビヨンが平均して消そうとする誤差と、それがひとりでに消える振り角。'),
    ('balance-hairspring', 'The oscillator inside the cage.', 'キャリッジの中の振動子。'),
    ('escapement-airy', 'Why the escapement pushes at the centre of the swing.', '脱進機が振動の中心で押す理由。'),
    ('gear-train', 'The going train that drives the cage once a minute.', 'キャリッジを毎分一回転させる輪列。'),
    ('involute-gearing', 'Why the teeth have the shape they do.', '歯がその形をしている理由。'),
]
CALENDAR = [
    ('gear-train', 'How a train of wheels divides time exactly, from seconds down to years.', '車の列が時間を秒から年まで正確に分ける仕組み。'),
    ('epicyclic', 'Gears that orbit other gears: reductions and differentials in a small space.', 'ほかの歯車の周りを回る歯車：小さな空間での減速と差動。'),
    ('involute-gearing', 'Why the teeth have the shape they do.', '歯がその形をしている理由。'),
    ('balance-hairspring', 'The oscillator that everything downstream counts.', '下流のすべてが数える振動子。'),
]
PAGES = {
    'tourbillon/index.html': ('en', TOURBILLON),
    'ja/tourbillon/index.html': ('ja', TOURBILLON),
    'perpetual-calendar/index.html': ('en', CALENDAR),
    'ja/perpetual-calendar/index.html': ('ja', CALENDAR),
    'automatic-movement/index.html': ('en', WATCH),
    'ja/automatic-movement/index.html': ('ja', WATCH),
    'carrera-panda/index.html': ('en', WATCH),
    'ja/carrera-panda/index.html': ('ja', WATCH),
    'watch-lab/index.html': ('en', WATCH),
    'ja/watch-lab/index.html': ('ja', WATCH),
    'watch-mechanisms/index.html': ('en', WATCH),
    'watch-mechanisms/ja/index.html': ('ja', WATCH),
    'quartz-lab/index.html': ('en', QUARTZ),
    'ja/quartz-lab/index.html': ('ja', QUARTZ),
}
KEF = [
    ('driver-offset', 'Why putting the tweeter at the woofer’s centre keeps the crossover in phase at every angle.', 'ツイーターをウーファーの中心に置くと、どの角度でもクロスオーバーが同位相に保たれる理由。'),
    ('crossover-sum', 'How a Linkwitz–Riley crossover splits the sound and adds it back flat.', 'リンクウィッツ・ライリーのクロスオーバーが音を分け、平らに足し戻す仕組み。'),
    ('piston-directivity', 'Why a cone beams as the wavelength shrinks, and how a waveguide shapes it.', '波長が短くなるとコーンが音を絞る理由と、ウェーブガイドによる形づけ。'),
    ('driver-impedance', 'The driver itself: a mass on a spring, driven by a coil.', 'ドライバーそのもの：コイルで駆動されるばねの上の質量。'),
    ('box-alignment', 'What the cabinet does to the bass.', 'キャビネットが低音にすること。'),
    ('boundary-reflection', 'What the wall behind the speaker does, and why speakers have a wall setting.', 'スピーカーの後ろの壁がすることと、壁の設定がある理由。'),
]
DISPLAY = [
    ('box-alignment', 'How much bass a small sealed enclosure allows.', '小さな密閉箱がどれだけの低音を許すか。'),
    ('driver-impedance', 'The driver as a mass on a spring, driven by a coil.', 'コイルで駆動されるばねの上の質量としてのドライバー。'),
    ('crossover-sum', 'How woofers and tweeters share the range and add back up.', 'ウーファーとツイーターが帯域を分け合い、足し戻される仕組み。'),
    ('piston-directivity', 'Why small drivers spread sound widely and large ones beam.', '小さなドライバーは音を広げ、大きなドライバーは絞る理由。'),
    ('boundary-reflection', 'The desk reflection: comb filtering from the nearest surface.', '机の反射：いちばん近い面によるくし形フィルター。'),
    ('reverberation', 'How much of what you hear is the room.', '聞こえる音のどれだけが部屋なのか。'),
]
HEADPHONE = [
    ('rlc-filters', 'The filters an equaliser and a noise-cancelling loop are built from, read on a Bode plot.', 'イコライザーやノイズキャンセルのループを組み立てるフィルターを、ボード線図で読む。'),
    ('box-alignment', 'A sealed volume of air acts as a spring on the driver, as the ear canal does.', '密閉された空気はドライバーにとってばねとして働き、外耳道もそうです。'),
    ('driver-impedance', 'The driver: a mass on a spring, driven by a coil.', 'ドライバー：コイルで駆動されるばねの上の質量。'),
]
PAGES.update({
    'kef-coda-w/index.html': ('en', KEF),
    'ja/kef-coda-w/index.html': ('ja', KEF),
    'studio-display-sound/index.html': ('en', DISPLAY),
    'bose-customtune/index.html': ('en', HEADPHONE),
    'ja/bose-customtune/index.html': ('ja', HEADPHONE),
})

STYLE = ('<style>.ig-behind{display:block;width:100%;margin:0;padding:2.4rem var(--ig-gutter,1rem) 2.6rem;box-sizing:border-box;background:var(--ig-paper,#faf8f4);font:15px/1.55 var(--ig-sans,system-ui,sans-serif);color:var(--ig-ink,#222);text-align:left}'
         '.ig-behind *{box-sizing:border-box}'
         '.ig-behind-in{max-width:var(--ig-width,72rem);margin:0 auto;border-top:1px solid var(--ig-rule,#ccc);padding-top:1.4rem}'
         '.ig-behind .ig-behind-k{margin:0 0 .35rem;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ig-muted,#666)}'
         '.ig-behind h2{margin:0 0 .4rem;font:500 1.45rem/1.25 var(--ig-serif,Georgia,serif);letter-spacing:0;text-transform:none;color:var(--ig-ink,#222)}'
         '.ig-behind .ig-behind-lede{margin:0 0 1.1rem;max-width:44rem;color:var(--ig-muted,#666)}'
         '.ig-behind ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr));gap:.75rem}'
         '.ig-behind li{margin:0;padding:0}'
         '.ig-behind li a{display:flex;flex-direction:column;gap:.3rem;height:100%;padding:.85rem 1rem;border:1px solid var(--ig-rule,#ccc);border-radius:8px;background:var(--ig-panel,#f4f2ec);color:inherit;text-decoration:none;transition:border-color .15s,transform .15s}'
         '.ig-behind li a:hover,.ig-behind li a:focus-visible{border-color:var(--ig-accent,#8a4b2a);transform:translateY(-1px)}'
         '.ig-behind .t{font-weight:600;color:var(--ig-ink,#222)}'
         '.ig-behind .s{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ig-accent,#8a4b2a)}'
         '.ig-behind .d{font-size:.9rem;color:var(--ig-muted,#666)}'
         '.ig-behind .ig-behind-all{margin:1rem 0 0;font-size:.9rem}.ig-behind .ig-behind-all a{color:var(--ig-accent,#8a4b2a)}'
         '@media (prefers-reduced-motion:reduce){.ig-behind li a{transition:none}.ig-behind li a:hover{transform:none}}</style>')

TOPIC = {
    'watch-oscillators': ('Watch oscillators', '時計の振動子'),
    'gears-mechanisms': ('Gears and mechanisms', '歯車と機構'),
    'quartz-resonators': ('Quartz resonators', '水晶振動子'),
    'loudspeakers': ('Loudspeakers', 'スピーカー'),
    'crossovers-filters': ('Filters and crossovers', 'フィルターとクロスオーバー'),
    'room-acoustics': ('Room acoustics', '室内音響'),
}


def panel(lang, items):
    ja = lang == 'ja'
    pre = '/ja' if ja else ''
    e = html.escape
    lis = []
    for lab, en, jp in items:
        route, te, tj = LABS[lab]
        sec = TOPIC[route][1 if ja else 0]
        lis.append(f'<li><a href="{pre}/{route}/#{lab}"><span class="s">{e(sec)}</span><span class="t">{e(tj if ja else te)}</span><span class="d">{e(jp if ja else en)}</span></a></li>')
    head = '数学と物理で見る仕組み' if ja else 'The mathematics and physics behind this'
    kick = '数学事典 · 工学' if ja else 'Math encyclopedia · Engineering'
    lede = ('この仕組みを支える数学と物理を、動かして確かめられる実験で説明しています。' if ja
            else 'Interactive experiments that work through the mathematics and physics this page rests on.')
    allt = '工学の六つの話題をすべて見る →' if ja else 'All six engineering topics →'
    return ('<!-- BEHIND:START -->\n'
            f'<aside class="ig-behind" lang="{lang}" aria-labelledby="ig-behind-h">{STYLE}<div class="ig-behind-in">'
            f'<p class="ig-behind-k">{kick}</p><h2 id="ig-behind-h">{head}</h2><p class="ig-behind-lede">{lede}</p>'
            f'<ul>{"".join(lis)}</ul><p class="ig-behind-all"><a href="{pre}/math-encyclopedia/#engineering">{allt}</a></p></div></aside>\n'
            '<!-- BEHIND:END -->')


def apply(text, block):
    text = re.sub(r'<!-- BEHIND:START -->.*?<!-- BEHIND:END -->\n?', '', text, flags=re.S)
    i = text.find('<!-- ISEGORIA:FOOT -->')
    if i < 0:
        raise SystemExit('no ISEGORIA:FOOT marker')
    return text[:i] + block + text[i:]


def main():
    check = '--check' in sys.argv
    stale = []
    for rel, (lang, items) in PAGES.items():
        p = ROOT / rel
        old = p.read_text(encoding='utf-8')
        new = apply(old, panel(lang, items))
        if new != old:
            stale.append(rel)
            if not check:
                p.write_text(new, encoding='utf-8')
    if check and stale:
        print('stale:', *stale, sep='\n  ')
        sys.exit(1)
    print(f'{"checked" if check else "wrote"} {len(PAGES)} pages' + (f', {len(stale)} changed' if not check else ''))


if __name__ == '__main__':
    main()

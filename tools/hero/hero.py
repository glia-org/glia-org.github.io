"""The hero of glia-org.github.io: a tissue that is a diagram. Every element is a fact about a project, and one
sequenced loop shows each project's claim in turn. One SVG per layout (desktop 1200 x 520, phone 390 x 992); the
CSS keyframes in assets/site.css run per data-step on the figure, set by assets/site.js. Glia is a domain (the app on
your Mac) holding the astrocyte, the session panes, Importin's pore and the brief.

python3 tools/hero/hero.py rewrites the two inline SVGs in index.html between their hero markers. Standard library only.
The committed index.html is the source of truth; run this only to change the drawing."""
import math
import pathlib
import random
import re
import sys

D = pathlib.Path(__file__).parent
sys.path.insert(0, str(D))
from tissue import f, rel, taper, smooth_closed, bez, dot, Cell, blob, organelles, far_proto  # noqa: E402

# the marks, as the org page's first design panel drew them: Importin's eight facets (32 x 32), Lemna's line and caret
IMP_D = ('M30.2 12.17L30.2 19.83L25 17.67L25 14.33ZM28.75 23.34L23.34 28.75L21.18 23.55L23.55 21.18ZM19.83 30.2L12.17 '
         '30.2L14.33 25L17.67 25ZM8.66 28.75L3.25 23.34L8.45 21.18L10.82 23.55ZM1.8 19.83L1.8 12.17L7 14.33L7 17.67ZM3.25 '
         '8.66L8.66 3.25L10.82 8.45L8.45 10.82ZM12.17 1.8L19.83 1.8L17.67 7L14.33 7ZM23.34 3.25L28.75 8.66L23.55 10.82L21.18 '
         '8.45Z')
LEM_R = {'x': '8.5', 'y': '3.5', 'width': '1.5', 'height': '8.5'}
# the cells' names link to the project sections of the page
SECTION = {'glia': 'glia', 'tany': 'tanycyte', 'importin': 'importin', 'lemna': 'lemna', 'moin': 'moin-journal'}


def P(x, y):
    return f'{f(x)} {f(y)}'


def soma_cell(pid, i, uid, cx, cy, soma, procs, fine, orgs, nuc, dur, defs, rgrad='55%'):
    """One cell in the paint layers of hero_r: bloom, halo, processes, lamella, body, membrane, organelles, nucleus."""
    nx, ny, nrx, nry = nuc
    defs.append(f'<path id="{uid}s{i}" d="{soma}"/><path id="{uid}p{i}" d="{procs}"/>')
    gid = f'{uid}g{i}'
    grad = (f'<radialGradient id="{gid}" r="{rgrad}"><stop offset="0" class="s0"/><stop offset=".62" class="s1"/>'
            f'<stop offset=".93" class="s2"/><stop offset="1" class="s3"/></radialGradient>')
    s_, p_ = f'#{uid}s{i}', f'#{uid}p{i}'
    lam = f'translate({P(cx, cy)}) scale(1.07) translate({P(-cx, -cy)})'
    return (f'<g class="cell p-{pid}" style="transform-origin:{f(cx)}px {f(cy)}px;animation-duration:{dur}s;animation-delay:-{f(dur * .37 * i)}s">'
            f'{grad}<g class="bl" filter="url(#{uid}bl)"><use href="{s_}"/><use href="{p_}"/></g>'
            f'<use class="ha" href="{s_}" filter="url(#{uid}fb)"/>'
            f'<use class="pr" href="{p_}"/>' + (f'<path class="fi" d="{fine}"/>' if fine else '') +
            f'<use class="lm" href="{s_}" transform="{lam}" filter="url(#{uid}sf)"/>'
            f'<use class="so" href="{s_}" fill="url(#{gid})"/><use class="mb" href="{s_}" filter="url(#{uid}sf)"/>'
            f'<path class="or" d="{orgs}"/>'
            f'<g class="nuw"><ellipse class="nu" cx="{f(nx)}" cy="{f(ny)}" rx="{f(nrx)}" ry="{f(nry)}"/>'
            f'<circle class="nl" cx="{f(nx + nrx * .3)}" cy="{f(ny - nry * .25)}" r="{f(2 * min(1, nrx / 10))}"/></g></g>')


def edge(cx, cy, rx, ry, deg):
    t = math.radians(deg)
    r = 1 / math.hypot(math.cos(t) / rx, math.sin(t) / ry)
    return (cx + r * math.cos(t), cy + r * math.sin(t))


def label(pid, x, y, name, desc, anchor='middle', dy=16):
    a = '' if anchor == 'start' else f' text-anchor="{anchor}"'
    return (f'<a href="#{SECTION[pid]}" class="nm"><text x="{f(x)}" y="{f(y)}"{a}><tspan class="n">{name}</tspan>'
            + ''.join(f'<tspan class="d" x="{f(x)}" dy="{dy if i == 0 else 15}">{r}</tspan>' for i, r in enumerate(desc.split('|')))
            + '</text></a>')


def small(x, y, t, cls='sm', anchor=None):
    a = f' text-anchor="{anchor}"' if anchor else ''
    return f'<text class="{cls}" x="{f(x)}" y="{f(y)}"{a}>{t}</text>'


def bars(x, y, widths, h=2.6, gap=3.2):
    d = ''
    for w in widths:
        d += f'M{P(x, y)}h{f(w)}v{f(h)}h{f(-w)}z'
        x += w + gap
    return d, x - gap


CAPS = ['The link drops; the session stays.', 'Mail comes in; nothing goes out.', 'The night’s work arrives as one brief.',
        'You write over the app; the text goes in.', 'Today’s entry lands in your folder.']
PAT = [[14, 8, 10], [9, 16], [20, 6], [11, 7, 9]]


def pane(x, y, uid, n, defs, scroll=False, w=60, h=38):
    """A terminal pane centred on x, y: title strip, lines of output, a prompt with the cursor cell."""
    x0, y0 = x - w / 2, y - h / 2
    lh = 5.6
    d = ''
    for i in range(3 + (8 if scroll else 0)):
        dd, _ = bars(x0 + 5, y0 + 10.5 + i * lh, PAT[(i + n) % 4], 2.2, 2.5)
        d += dd
    body = f'<path class="tl" d="{d}"/>'
    if scroll:
        defs.append(f'<clipPath id="{uid}pc"><rect x="{f(x0 + 1)}" y="{f(y0 + 8)}" width="{w - 2}" height="16.5"/></clipPath>')
        body = f'<g clip-path="url(#{uid}pc)"><g class="sc" style="--s8:{f(-8 * lh)}px">{body}</g></g>'
    return (f'<g class="pn"><rect class="pb" x="{f(x0)}" y="{f(y0)}" width="{w}" height="{h}" rx="3"/>'
            f'<path class="pt" d="M{P(x0, y0 + 7)}h{w}{dot(x0 + 5, y0 + 3.6, 1.1)}{dot(x0 + 9, y0 + 3.6, 1.1)}{dot(x0 + 13, y0 + 3.6, 1.1)}"/>'
            f'{body}<path class="tl" d="M{P(x0 + 5, y0 + 27.3)}h3v2.2h-3z"/>'
            f'<rect class="cur" x="{f(x0 + 10)}" y="{f(y0 + 25.4)}" width="3.4" height="4.6"/></g>')


def build(L, uid, seed=7):
    W, H, s = L['w'], L['h'], L['s']
    R = random.Random(seed)
    defs = [f'<filter id="{uid}fb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{f(3.4 * s)}"/></filter>',
            f'<filter id="{uid}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{f(6 * s)}"/></filter>',
            f'<filter id="{uid}gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{f(3 * s)}"/></filter>',
            f'<filter id="{uid}sf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".5"/></filter>',
            # the night's three kinds: a commit, a page, a session pane
            f'<path id="{uid}y0" d="M-6 0h3.6M2.4 0H6M-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0"/>'
            f'<path id="{uid}y1" d="M-3.5-4.5h4.5l2.5 2.5v6.5h-7zM-1.8-.8h3.6M-1.8 1.6h3.6"/>'
            f'<path id="{uid}y2" d="M-5-3.5h10v7h-10zM-5-1.4h10"/>']
    g, lab = [], []
    wx, wy, ww, wh = L['win']

    # ------------------------------------------------ far layer, anonymous depth, outside Glia's window
    FR = random.Random(seed + 9)
    defs.append(f'<path id="{uid}f0" d="{far_proto(FR, 1)}"/><path id="{uid}f1" d="{far_proto(FR, 1)}"/>')
    placed = []
    for _ in range(600):
        x, y = FR.uniform(-20, W + 20), FR.uniform(-20, H + 20)
        if any(math.hypot(x - a, y - b) < L['far_gap'] for a, b in placed):
            continue
        if any(math.hypot(x - a, y - b) < r for a, b, r in L['far_avoid']) or (wx - 20 < x < wx + ww + 20 and wy - 20 < y < wy + wh + 20):
            continue
        placed.append((x, y))
    far = ''.join(f'<use href="#{uid}f{i % 2}" transform="translate({P(x, y)}) rotate({int(FR.random() * 360)}) '
                  f'scale({f(s * FR.uniform(.45, .7))})"/>' for i, (x, y) in enumerate(placed))
    g.append(f'<g class="far" filter="url(#{uid}fb)">{far}</g>')

    # ------------------------------------------------ the night along the top edge: commits, pages, sessions drifting
    sy, sx0, sx1 = L['stream']
    hw = 8 * s
    xs = [sx0 + k * (sx1 - sx0) / 24 for k in range(25)]
    mid = [(x, sy + 3 * s * math.sin(x / 70)) for x in xs]
    top = [(x, y - hw) for x, y in mid]
    bot = [(x, y + hw) for x, y in mid]
    defs.append(f'<linearGradient id="{uid}sg" x1="{f(sx0)}" x2="{f(sx1)}" gradientUnits="userSpaceOnUse">'
                f'<stop offset="0" stop-color="#fff"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>'
                f'<mask id="{uid}sm"><rect x="{f(sx0)}" y="0" width="{f(sx1 - sx0)}" height="{f(sy + 40)}" fill="url(#{uid}sg)"/></mask>')
    parts = ''.join(f'<use href="#{uid}y{k % 3}" transform="translate({P(R.uniform(sx0 + 10, sx1 - 40), sy + R.uniform(-.3, .3) * hw)}) scale(.6)"/>'
                    for k in range(L['n_part']))
    g.append(f'<g class="st" mask="url(#{uid}sm)"><path class="sb" d="{rel(top + bot[::-1])}"/>'
             f'<path class="se" d="{rel(top, False)}{rel(bot, False)}"/><g class="sp">{parts}</g></g>')
    lab.append(small(*L['stream_lab'], 'overnight: agents, commits, papers'))

    # ------------------------------------------------ Lemna's water and the app beneath it
    wy_, wx0, wx1 = L['water']
    ax, ay, aw, ah = L['app']
    wpts = [(wx0 + k * (wx1 - wx0) / 30, wy_ + 1.2 * math.sin(k * 1.3)) for k in range(31)]
    defs.append(f'<linearGradient id="{uid}wg" x2="0" y2="1"><stop offset="0" class="w0"/><stop offset="1" class="w1"/></linearGradient>'
                f'<linearGradient id="{uid}wh" x1="{f(wx0)}" x2="{f(wx1)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000"/>'
                f'<stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>'
                f'<mask id="{uid}wm"><rect x="{f(wx0)}" y="0" width="{f(wx1 - wx0)}" height="{H}" fill="url(#{uid}wh)"/></mask>')
    app = (f'<rect class="ap" x="{f(ax)}" y="{f(ay)}" width="{f(aw)}" height="{f(ah)}" rx="{f(6 * s)}"/>'
           f'<path class="ab" d="M{P(ax, ay + 15 * s)}h{f(aw)}{dot(ax + 9 * s, ay + 7.5 * s, 2 * s)}{dot(ax + 16 * s, ay + 7.5 * s, 2 * s)}{dot(ax + 23 * s, ay + 7.5 * s, 2 * s)}"/>')
    lx, ly0 = ax + 16 * s, ay + 28 * s
    lgap = 11 * s
    d1, _ = bars(lx, ly0, [16, 9, 22, 12, 7, 18, 10, 14][:L['app_words']])
    d2, _ = bars(lx, ly0 + lgap, [11, 20, 8, 15, 24, 9][:L['app_words'] - 1])
    app += f'<path class="tl" d="{d1}{d2}"/>'
    g.append(f'<g class="wa" mask="url(#{uid}wm)"><path class="wb" fill="url(#{uid}wg)" d="{rel(wpts + [(wx1, ay + ah + 16 * s), (wx0, ay + ah + 16 * s)])}"/>'
             f'<path class="ws" d="{rel(wpts, False)}"/></g>{app}')
    lab.append(small(ax + aw / 2, ay + 11 * s, 'any app', 'sm ti', 'middle'))

    # ------------------------------------------------ Glia: the app on your Mac, a window and a membrane
    tb = 22
    dcx, dcy = wx + ww / 2, wy + tb + (wh - tb) / 2
    da, db = ww / 2 - 9, (wh - tb) / 2 - 7

    def sg(v, e=.5):
        return math.copysign(abs(v) ** e, v)
    dpts = [(dcx + da * sg(math.cos(t)) * (1 + .012 * math.sin(7 * t)), dcy + db * sg(math.sin(t)) * (1 + .015 * math.sin(5 * t + 1)))
            for t in [2 * math.pi * i / 44 for i in range(44)]]
    dom = smooth_closed(dpts)
    g.append(f'<g class="p-glia"><rect class="wf" x="{f(wx + .5)}" y="{f(wy + .5)}" width="{f(ww - 1)}" height="{f(wh - 1)}" rx="12"/>'
             f'<path class="wt" d="M{P(wx, wy + tb)}h{f(ww)}{dot(wx + 13, wy + 11, 3)}{dot(wx + 23, wy + 11, 3)}{dot(wx + 33, wy + 11, 3)}"/>'
             f'<path class="dm" d="{dom}"/></g>')
    lab.append(f'<text class="wtl" x="{f(dcx)}" y="{f(wy + 16)}" text-anchor="middle">Glia</text>')

    # ------------------------------------------------ vessels: the remote hosts, outside the window
    vess = ''
    for k, (vx, vy, vr, txt, tx, ty, anc) in enumerate(L['vessels']):
        vess += (f'<g class="vx"><circle class="vh" cx="{f(vx)}" cy="{f(vy)}" r="{f(vr + 3 * s)}" filter="url(#{uid}gl)"/>'
                 f'<circle class="vw" cx="{f(vx)}" cy="{f(vy)}" r="{f(vr)}"/><circle class="vl" cx="{f(vx)}" cy="{f(vy)}" r="{f(vr * .55)}"/></g>')
        lab.append(small(tx, ty, txt, 'sm mo' if txt == 'login1' else 'sm', anc))
    g.append(vess)

    # ------------------------------------------------ the astrocyte, its processes to the panes, the panes' links to the hosts
    gx, gy = L['glia']
    gs = L['glia_sc']
    c = Cell(R, gs)
    soma = smooth_closed(blob(gx, gy, lambda t: 24 * gs * (1 + .14 * math.sin(5 * t + .6) + .06 * math.sin(3 * t + 2))))
    for a, ln in L['glia_arms']:
        a = math.radians(a)
        c.branch(gx + 18 * gs * math.cos(a), gy + 18 * gs * math.sin(a), a, ln, 8, 1.2, 1, .08, p=.14)
    for _ in range(L['glia_twigs']):
        a = R.random() * 6.283
        c.branch(gx + 22 * gs * math.cos(a), gy + 22 * gs * math.sin(a), a, R.uniform(12, 24), 2, .5, 0, .14)
    for k, (px, py, *_r) in enumerate(L['panes']):
        ang = math.degrees(math.atan2(py - gy, px - gx))
        c.procs.append(taper(bez(edge(gx, gy, 20 * gs, 20 * gs, ang), (px, py), 8 * (1 if k % 2 else -1) * s, wig=2 * s, waves=1.2), 7 * gs, 4 * s, .9))
    nuc = (gx - 3 * gs, gy - 1 * gs, 10 * gs, 8 * gs)
    orgs = organelles(R, gx, gy, 24 * gs, 24 * gs, nuc, 6, gs)
    cells = [soma_cell('glia', 0, uid, gx, gy, soma, ''.join(c.procs), ''.join(c.fine), orgs, nuc, 19, defs)]
    vlinks = ''
    for k, (vx, vy, vr, *_rest) in enumerate(L['vessels']):
        px, py = L['panes'][k][:2]
        back = math.atan2(py - vy, px - vx)
        p1 = (vx + (vr + 4 * s) * math.cos(back), vy + (vr + 4 * s) * math.sin(back))
        pts = bez((px, py), p1, L['vbend'][k], wig=3 * s, waves=1.5, phase=k)
        d = taper(pts, 6 * s, 3.2 * s)
        x, y = pts[int(.62 * (len(pts) - 1))]
        d += dot(x, y, 2.3 * s)
        r2 = vr + 4 * s
        a0, a1 = back - 1.9, back + 1.9
        foot = f'M{P(vx + r2 * math.cos(a0), vy + r2 * math.sin(a0))}A{f(r2)} {f(r2)} 0 1 1 {P(vx + r2 * math.cos(a1), vy + r2 * math.sin(a1))}'
        drop = ' dr' if k == L['drop'] else ''
        if drop:
            defs.append(f'<path id="{uid}c0" pathLength="100" d="{rel(pts[::-1][::2] + [pts[0]], False)}"/>')
        vlinks += (f'<g class="cell vk p-glia{drop}"><path class="bl" filter="url(#{uid}bl)" d="{d}"/><path class="pr" d="{d}"/>'
                   f'<path class="ef" d="{foot}"/></g>')
    g.append(vlinks)

    # ------------------------------------------------ Tanycyte, outside the window: one long process up to the night, a foot into Glia
    tx, ty = L['tany']
    ts = L['tany_sc']
    ex, ey = L['tany_end']
    tsoma = smooth_closed(blob(tx, ty, lambda t: (15 * ts * (1 + .25 * math.sin(t)), 27 * ts), 30))
    tc = Cell(R, ts)
    top_ = (tx + 1 * ts, ty - 22 * ts)
    lp = bez(top_, (ex, ey), L['tany_bend'], wig=2.5 * s, waves=1.3)
    tc.procs.append(taper(lp, 11 * ts, 4 * ts, .7))
    for k in (-1, 0, 1):
        a = math.atan2(ey - top_[1], ex - top_[0]) + k * .6
        q = (ex + 9 * s * math.cos(a), ey + 9 * s * math.sin(a))
        tc.procs.append(taper(bez((ex, ey), q, k * 1.5 * s, 4), 4 * s, 2.4 * s))
        tc.procs.append(dot(*q, 2.4 * s))
    fx0, fy0 = L['tany_foot0']
    cx_, cy_, cw, chh = L['card']
    fx1, fy1 = cx_ - 2, cy_ + chh / 2
    fp = bez((fx0, fy0), (fx1, fy1), L['tany_fbend'], wig=2 * s, waves=1)
    tc.procs.append(taper(fp, 7 * ts, 3.4 * ts))
    tnuc = (tx + 1 * ts, ty + 6 * ts, 8 * ts, 11 * ts)
    cells.append(soma_cell('tany', 1, uid, tx, ty, tsoma, ''.join(tc.procs), '', organelles(R, tx, ty, 13 * ts, 24 * ts, tnuc, 4, ts), tnuc, 15, defs))

    # ------------------------------------------------ Moin Journal: a compact cell, its process to the folder
    mx, my = L['moin']
    ms = L['moin_sc']
    fx, fy, fw, fh = L['folder']
    msoma = smooth_closed(blob(mx, my, lambda t: (34 * ms * (1 + .04 * math.sin(2 * t)), 14 * ms * abs(math.sin(t)) ** .7 + 3.5 * ms), 32))
    mc = Cell(R, ms)
    mp = bez((mx + 30 * ms, my), (fx - 2, fy + fh * .55), -4 * s, wig=2 * s, waves=1)
    mc.procs.append(taper(mp, 7 * ms, 3.4 * ms))
    for k in (-1, 1):
        q = (fx - 2 + 2 * s, fy + fh * .55 + k * 7 * s)
        mc.procs.append(taper(bez((fx - 2, fy + fh * .55), q, 0, 3), 3.4 * s, 2.4 * s))
        mc.procs.append(dot(*q, 2 * s))
    mnuc = (mx - 2 * ms, my, 12 * ms, 7 * ms)
    cells.append(soma_cell('moin', 3, uid, mx, my, msoma, ''.join(mc.procs), '', organelles(R, mx, my, 30 * ms, 12 * ms, mnuc, 5, ms), mnuc, 16, defs))
    g.append('<g class="cells">' + ''.join(cells) + '</g>')

    # ------------------------------------------------ the panes; one in an envelope with Importin's pore
    ix, iy = L['panes'][2][:2]
    er = L['env_r']
    pa = math.radians(L['pore_deg'])
    gap = 14 * s / er
    env = ''
    for r_ in (er - 1.8 * s, er + 1.8 * s):
        a0, a1 = pa + gap, pa + 2 * math.pi - gap
        env += f'M{P(ix + r_ * math.cos(a0), iy + r_ * math.sin(a0))}A{f(r_)} {f(r_)} 0 1 1 {P(ix + r_ * math.cos(a1), iy + r_ * math.sin(a1))}'
    px_, py_ = ix + er * math.cos(pa), iy + er * math.sin(pa)
    k = L['pore_k']
    panes = f'<g class="ev"><circle class="ei" cx="{f(ix)}" cy="{f(iy)}" r="{f(er)}"/><path class="en" d="{env}"/></g>'
    for n, (px, py, txt, lx2, ly2) in enumerate(L['panes']):
        panes += pane(px, py, uid, n, defs, n == L['drop'])
        lab.append(small(lx2, ly2, txt, 'sm', 'middle'))
    defs.append(f'<path id="{uid}po" d="{IMP_D}" transform="translate({P(px_ - 16 * k, py_ - 16 * k)}) scale({round(k, 3)})"/>')
    panes += f'<g class="p-importin"><use class="pw" href="#{uid}po" filter="url(#{uid}gl)"/><use class="pf" href="#{uid}po"/></g>'
    lets = ''
    inside = (ix + 6 * s, iy + 2 * s)
    for n, (qx, qy, dl, bk) in enumerate(L['letters']):
        lets += (f'<g transform="translate({P(qx, qy)})"><g class="lt" style="--px:{f(px_ - qx)}px;--py:{f(py_ - qy)}px;--ix:{f(inside[0] - qx)}px;'
                 f'--iy:{f(inside[1] - qy)}px;animation-delay:{dl}s,{bk}s"><path d="M{P(-6.5 * s, -4.6 * s)}h{f(13 * s)}v{f(9.2 * s)}h{f(-13 * s)}z'
                 f'm0 0l{P(6.5 * s, 5.2 * s)}l{P(6.5 * s, -5.2 * s)}"/></g></g>')
    g.append(f'<g class="p-glia">{panes}</g><g class="p-importin lts">{lets}</g>')

    # ------------------------------------------------ the brief, inside Glia: three rows, one per kind of the night
    slots = [(cx_ + 11 * s, cy_ + 22 * s + i * 10 * s) for i in range(3)]
    cc = ''.join(f'<use href="#{uid}y{(i + 2) % 3}" transform="translate({P(*sl)}) scale(.8)"/>' for i, sl in enumerate(slots))
    cl = ''.join(bars(sl[0] + 9 * s, sl[1] - 1.2, w_, 2.4)[0] for sl, w_ in zip(slots, ([12, 7, 15], [9, 18, 6], [14, 10])))
    card = (f'<g class="card p-tany"><rect class="cd" x="{f(cx_)}" y="{f(cy_)}" width="{f(cw)}" height="{f(chh)}" rx="5"/>'
            f'<text class="sm ct" x="{f(cx_ + 8 * s)}" y="{f(cy_ + 12 * s)}">brief</text></g>'
            f'<g class="cc p-tany"><g class="yg">{cc}</g><path class="cl" d="{cl}"/></g>')

    # ------------------------------------------------ the folder you own, its dated pages
    folder = f'<path class="fb" d="M{P(fx, fy + fh)}V{f(fy)}h{f(30 * s)}l{P(5 * s, 6 * s)}H{f(fx + fw)}V{f(fy + fh)}z"/>'
    leaves = ''
    for n, dt in enumerate(('2026-11-08', '2026-11-09', '2026-11-10')):
        qx0, qy0 = fx + (8 + 7 * n) * s, fy - (24 - 11 * n) * s
        lw, lh = 72 * s, 52 * s
        if n == 2:
            wl = ''.join(f'<path class="wl" style="animation-delay:{f(.3 + .3 * i)}s" d="{bars(qx0 + 5 * s, qy0 + (16 + 7 * i) * s, w_, 2.2, 2.5)[0]}"/>'
                         for i, w_ in enumerate(([12, 7, 16, 9], [8, 15, 11], [17, 6])))
            leaves += (f'<g class="lf nw"><path class="pp" d="M{P(qx0, qy0)}h{f(lw)}v{f(lh)}h{f(-lw)}z"/>'
                       f'<text class="dt" x="{f(qx0 + 5 * s)}" y="{f(qy0 + 9 * s)}">{dt}</text>{wl}</g>')
        else:
            leaves += (f'<g class="lf"><path class="pp" d="M{P(qx0, qy0)}h{f(lw)}v{f(lh)}h{f(-lw)}z"/>'
                       f'<text class="dt" x="{f(qx0 + 5 * s)}" y="{f(qy0 + 9 * s)}">{dt}</text></g>')
    front = f'<path class="ff" d="M{P(fx - 2 * s, fy + 20 * s)}H{f(fx + fw + 2 * s)}L{P(fx + fw - 1 * s, fy + fh)}H{f(fx + 1 * s)}z"/>'
    g.append(f'<g class="fo p-moin">{folder}{leaves}{front}</g>')
    lab.append(small(*L['folder_lab'], 'your folder', 'sm', 'start'))

    # ------------------------------------------------ Lemna: the leaf and its caret, summoned on the surface
    lx_, ly_ = L['lemna']
    ls = L['lemna_sc']
    a_, b_ = 60 * ls, 17 * ls

    def leaf(t):
        u = math.cos(t)
        return (a_ * (1 + .05 * math.sin(3 * t)), b_ * (1 - .25 * u) * (1 + .04 * math.sin(5 * t + 1)))
    lsoma = smooth_closed([(x + max(0, (x - lx_) / a_) ** 3 * 14 * ls, y) for x, y in blob(lx_, ly_, leaf, 30)])
    lc = Cell(R, ls)
    root = bez((lx_ - 30 * ls, ly_ + 12 * ls), (lx_ - 22 * ls, ay - 1), 6 * s, wig=2.5 * s, waves=1.2)
    lc.procs.append(taper(root, 5 * ls, 1.8 * ls))
    lnuc = (lx_ - 43 * ls, ly_ - 1 * ls, 9 * ls, 6 * ls)
    lcell = soma_cell('lemna', 2, uid, lx_, ly_, lsoma, ''.join(lc.procs), '', organelles(R, lx_ - 20 * ls, ly_, 30 * ls, 12 * ls, lnuc, 5, ls), lnuc, 17, defs)
    caret_x, line_y, mk, mlen = L['mark']
    cr = LEM_R
    cw_, ch_ = float(cr['width']) * mk, float(cr['height']) * mk
    cy0 = line_y - (7.75 - float(cr['y'])) * mk
    tb_, tend = bars(0, 0, L['words'], 3, 3)
    sx0 = caret_x - 4 - tend
    app_dx = lx - sx0
    app_dy = (ly0 + 2 * lgap) - (line_y - 6 * s)
    defs.append(f'<clipPath id="{uid}tc"><rect x="-50" y="0" width="{f(caret_x + 50)}" height="{H}"/></clipPath>')
    mark = (f'<g class="mk p-lemna"><path class="mi" d="M{P(caret_x - mlen, line_y)}L{P(caret_x, line_y - .75 * mk)}v{f(1.5 * mk)}z"/>'
            f'<rect class="ma" x="{f(caret_x)}" y="{f(cy0)}" width="{f(cw_)}" height="{f(ch_)}"/></g>')
    txl = (f'<g clip-path="url(#{uid}tc)"><g class="tx" style="--gx:{f(tend + 6)}px;--sx:{f(app_dx)}px;--sy:{f(app_dy)}px">'
           f'<path class="tl tw" transform="translate({P(sx0, line_y - 6 * s)})" d="{tb_}"/></g></g>')
    rip = f'<ellipse class="rp" cx="{f(sx0 + tend / 2 + app_dx * .5)}" cy="{f(wy_)}" rx="{f(30 * s)}" ry="{f(4 * s)}"/>'
    g.append(f'<g class="lw">{lcell}{mark}</g>')

    # ------------------------------------------------ moving parts for the moments
    def comet(n):
        return f'<g filter="url(#{uid}gl)"><use href="#{uid}c{n}" class="cm cg c{n}"/></g><use href="#{uid}c{n}" class="cm c{n}"/>'
    mv = f'<g class="p-glia"><use href="#{uid}c0" class="gh"/>{comet(0)}</g>'
    # the night's glyphs: along the stream, down the long process, through the body and foot, into the brief's rows
    rev = lp[::-1]
    route = [(ex - L['run_in'], sy), (ex, sy), rev[len(rev) // 3], rev[2 * len(rev) // 3], (tx, ty), fp[len(fp) // 2], (fx1, fy1)]
    gys = ''
    for i, k in enumerate((2, 0, 1)):
        pts = route + [slots[(k - 2) % 3]]
        st = ';'.join(f'--x{j}:{f(x)}px;--y{j}:{f(y)}px' for j, (x, y) in enumerate(pts))
        gys += f'<g class="gy" style="{st};animation-delay:{f(.6 + .25 * i)}s"><use href="#{uid}y{k}" transform="scale(1.1)"/></g>'
    mv += f'<g class="p-tany">{card}<g class="yg">{gys}</g>'
    mv += f'<ellipse class="tg" cx="{f(tx)}" cy="{f(ty)}" rx="{f(18 * ts)}" ry="{f(30 * ts)}" filter="url(#{uid}gl)"/></g>'
    mv += f'<g class="p-lemna">{rip}{txl}</g>'
    g.append(mv)
    caps = ''.join(f'<text class="cap k k{n + 1}" x="{f(x)}" y="{f(y)}"{"" if a == "start" else f" text-anchor={chr(34)}{a}{chr(34)}"}>{CAPS[n]}</text>'
                   for n, (x, y, a) in enumerate(L['caps']))
    g.append('<g class="labs">' + ''.join(lab) + ''.join(label(*a) for a in L['labels']) + caps + '</g>')
    return W, H, '<defs>' + ''.join(defs) + '</defs>\n' + '\n'.join(g)


ARIA = ('Glia, a Mac app, drawn as a window holding an astrocyte and terminal panes for shells and agents, each linked to a '
        'remote host outside; Importin, a pore through which mail enters one agent; Tanycyte, a cell whose long arm reaches into the '
        'night’s work and brings back a brief in the morning; Lemna, a leaf on the surface above any app; Moin Journal, beside a folder '
        'of dated pages.')


def svg(L, uid, cls):
    W, H, inner = build(L, uid)
    return f'<svg class="rt {cls}" id="{uid}" viewBox="0 0 {W} {H}" role="group" aria-label="{ARIA}">\n{inner}\n</svg>'


LAYOUTS = {
    'desk': dict(
        w=1200, h=520, s=1, far_gap=140, n_part=16,
        far_avoid=[(92, 186, 60), (985, 200, 150), (930, 440, 130)],
        stream=(30, -10, 600), stream_lab=(146, 62), run_in=110,
        win=(178, 78, 536, 380),
        water=(156, 770, 1200), app=(862, 214, 268, 88), app_words=8,
        vessels=[(40, 414, 15, 'remote host', 40, 447, 'middle'), (238, 494, 15, 'login1', 260, 498, None),
                 (664, 494, 13, 'remote host', 684, 498, None)],
        panes=[(262, 272, 'agent', 262, 305), (342, 398, 'shell', 342, 431), (594, 214, 'agent', 594, 166)],
        glia=(430, 300), glia_sc=1.3, drop=1, vbend=[18, -12, 10],
        glia_arms=[(-150, 56), (-105, 60), (-62, 64), (-20, 58), (20, 62), (62, 56), (110, 54), (150, 58), (205, 54)],
        glia_twigs=6,
        tany=(92, 188), tany_sc=1, tany_end=(118, 41), tany_bend=-12, tany_foot0=(104, 200), tany_fbend=-8,
        card=(204, 140, 86, 52),
        lemna=(985, 150), lemna_sc=1, mark=(1004, 147, 2.6, 52), words=[8, 5, 11, 6, 9],
        moin=(870, 436), moin_sc=1, folder=(998, 408, 108, 70), folder_lab=(1114, 456),
        env_r=40, pore_deg=0, pore_k=1.0,
        letters=[(664, 208, .4, 2.0), (684, 220, 1.4, 2.9), (704, 210, 2.4, 3.45)],
        labels=[('glia', 470, 476, 'Glia', 'A Mac terminal for remote machines;|agents keep running when you disconnect.'),
                ('tany', 92, 248, 'Tanycyte', 'A morning brief on what your|agents and repositories did|overnight, and on new papers.'), ('importin', 650, 252, 'Importin', 'Lets an AI agent read your mail;|it cannot send, move or delete.', 'start'),
                ('lemna', 846, 88, 'Lemna', 'Write in one line over any app,|then send the text into it.', 'start'), ('moin', 860, 474, 'Moin Journal', 'A private journal, kept as|files in a folder you own.')],
        caps=[(400, 446, 'start'), (650, 320, 'start'), (300, 154, 'start'), (996, 332, 'middle'), (870, 398, 'middle')],
    ),
    'phone': dict(
        w=390, h=992, s=.85, far_gap=130, n_part=7,
        far_avoid=[(40, 96, 40), (220, 746, 120), (160, 896, 110)],
        stream=(16, -10, 400), stream_lab=(156, 42), run_in=60,
        win=(8, 124, 374, 356),
        water=(690, -10, 400), app=(60, 732, 250, 72), app_words=7,
        vessels=[(36, 518, 12, 'remote host', 36, 546, 'middle'), (150, 528, 12, 'login1', 166, 532, None),
                 (300, 528, 11, 'remote host', 315, 532, None)],
        panes=[(80, 300, 'agent', 80, 333), (110, 410, 'shell', 110, 443), (270, 222, 'agent', 270, 180)],
        glia=(206, 330), glia_sc=.9, drop=1, vbend=[10, -8, 8],
        glia_arms=[(-150, 42), (-105, 46), (-62, 48), (-20, 44), (20, 46), (62, 42), (110, 40), (150, 44), (205, 40)],
        glia_twigs=5,
        tany=(40, 96), tany_sc=.7, tany_end=(64, 26), tany_bend=-6, tany_foot0=(42, 114), tany_fbend=6,
        card=(24, 178, 80, 48),
        lemna=(226, 684), lemna_sc=.82, mark=(242, 682, 2.2, 42), words=[7, 4, 9, 5, 7],
        moin=(70, 896), moin_sc=.82, folder=(150, 872, 96, 62), folder_lab=(254, 912),
        env_r=34, pore_deg=0, pore_k=.8,
        letters=[(330, 216, .4, 2.0), (346, 228, 1.4, 2.9), (362, 218, 2.4, 3.45)],
        labels=[('glia', 195, 574, 'Glia', 'A Mac terminal for remote machines;|agents keep running when you disconnect.'),
                ('tany', 62, 84, 'Tanycyte', 'Each morning, a brief on what your agents and|repositories did overnight, and on new papers.', 'start'), ('importin', 382, 270, 'Importin', 'Lets an AI agent read your mail;|it cannot send, move or delete.', 'end'),
                ('lemna', 20, 630, 'Lemna', 'Write in one line over any app,|then send the text into it.', 'start'), ('moin', 16, 942, 'Moin Journal', 'A private journal, kept as files in a folder you own.', 'start')],
        caps=[(378, 430, 'end'), (382, 330, 'end'), (112, 244, 'start'), (185, 826, 'middle'), (382, 818, 'end')],
    ),
}


def write(page=D.parent.parent / 'index.html'):
    """Puts the two drawings into the page, each between its markers: <!-- hero:desktop --> ... <!-- /hero:desktop -->."""
    html = page.read_text()
    for name, key, uid in (('desktop', 'desk', 'd'), ('phone', 'phone', 'p')):
        s = svg(LAYOUTS[key], uid, 'h' + uid)
        html, n = re.subn(rf'(<!-- hero:{name} -->\n)(?:.*?\n)?(<!-- /hero:{name} -->)', lambda m: m.group(1) + s + '\n' + m.group(2), html,
                          flags=re.S)
        assert n == 1, f'no hero:{name} markers in {page}'
        print(f'{name}: {len(s)} bytes')
    page.write_text(html)


if __name__ == '__main__':
    write()

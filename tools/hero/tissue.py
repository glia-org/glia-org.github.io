"""The drawing helpers of the hero: numbers, paths, tapering processes, cells, organelles, the far layer."""
import math


def f(v):
    s = f'{round(v, 1):.1f}'.rstrip('0').rstrip('.')
    if s.startswith('0.'):
        s = s[1:]
    elif s.startswith('-0.'):
        s = '-' + s[2:]
    return '0' if s in ('', '-0', '-') else s


def nums(vals):
    out = ''
    for v in vals:
        t = f(v)
        if out and not t.startswith('-') and not (t.startswith('.') and '.' in out.split(' ')[-1].split('-')[-1]):
            out += ' '
        out += t
    return out


def rel(pts, close=True):
    """Relative polyline, rounded to tenths."""
    x0, y0 = round(pts[0][0], 1), round(pts[0][1], 1)
    vals = []
    px, py = x0, y0
    for x, y in pts[1:]:
        x, y = round(x, 1), round(y, 1)
        vals += [x - px, y - py]
        px, py = x, y
    return f'M{nums([x0, y0])}l{nums(vals)}' + ('z' if close else '')


def taper(pts, w0, w1, k=.8):
    L = len(pts) - 1
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(L, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        w = (w0 + (w1 - w0) * (i / L) ** k) / 2
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    return rel(left + [pts[-1]] + right[::-1])


def smooth_closed(pts):
    n = len(pts)
    d = f'M{nums(pts[0])}'
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += 'C' + nums([*c1, *c2, *p2])
    return d + 'Z'


def bez(a, b, bend, n=None, wig=0, waves=2, phase=0):
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    p1 = (x1 + dx / 3 + nx * bend, y1 + dy / 3 + ny * bend)
    p2 = (x1 + 2 * dx / 3 + nx * bend, y1 + 2 * dy / 3 + ny * bend)
    n = n or max(4, int(L / 7))
    out = []
    for k in range(n + 1):
        t = k / n
        u = 1 - t
        w = wig * math.sin(math.pi * t) * math.sin(2 * math.pi * waves * t + phase)
        out.append((u ** 3 * x1 + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * x2 + nx * w,
                    u ** 3 * y1 + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * y2 + ny * w))
    return out


def dot(x, y, r):
    return f'M{nums([x - r, y])}a{nums([r, r])} 0 1 0 {nums([2 * r, 0])}a{nums([r, r])} 0 1 0 {nums([-2 * r, 0])}'


class Cell:
    def __init__(s, R, sc):
        s.R, s.sc = R, sc
        s.procs, s.fine, s.ves = [], [], []

    def walk(s, x, y, ang, ln, wig=.06, step=4.5):
        R = s.R
        step *= max(.7, s.sc)
        pts = [(x, y)]
        da = 0
        for _ in range(max(3, int(ln / step))):
            da = da * .75 + (R.random() + R.random() + R.random() - 1.5) * wig
            ang += da
            x += step * math.cos(ang)
            y += step * math.sin(ang)
            pts.append((x, y))
        return pts

    def branch(s, x, y, ang, ln, w0, w1, depth=2, wig=.06, ves=False, p=.16):
        sc = s.sc
        pts = s.walk(x, y, ang, ln * sc, wig)
        (s.procs if w0 * sc > 2.2 else s.fine).append(taper(pts, w0 * sc, w1 * sc))
        if ves:
            s.ves.append(pts)
        if depth > 0:
            L = len(pts) - 1
            for i in range(2, L - 1):
                t = i / L
                if s.R.random() < p:
                    h = math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0])
                    s.branch(pts[i][0], pts[i][1], h + (1 if s.R.random() < .5 else -1) * (.4 + s.R.random() * .6),
                             ln * (1 - t) * (.4 + s.R.random() * .35), max(1.2, (w0 + (w1 - w0) * t) * .6), w1 * .7,
                             depth - 1, wig * 1.3, False, p * .8)
        return pts


def blob(cx, cy, rfn, n=28):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = rfn(t)
        rx, ry = r if isinstance(r, tuple) else (r, r)
        pts.append((cx + rx * math.cos(t), cy + ry * math.sin(t)))
    return pts


def organelles(R, cx, cy, rx, ry, avoid, n, sc):
    d = ''
    got, tries = 0, 0
    while got < n and tries < 400:
        tries += 1
        a, r = R.random() * 6.283, R.random() ** .5 * .75
        x, y = cx + rx * r * math.cos(a), cy + ry * r * math.sin(a)
        if math.hypot((x - avoid[0]) / avoid[2], (y - avoid[1]) / avoid[3]) < 1.3:
            continue
        got += 1
        if R.random() < .25:  # a short rod
            b = R.random() * 3.14
            l, w = (1.8 + R.random() * 1.2) * sc, .9 * sc
            d += rel([(x - l * math.cos(b) - w * math.sin(b), y - l * math.sin(b) + w * math.cos(b)),
                      (x + l * math.cos(b) - w * math.sin(b), y + l * math.sin(b) + w * math.cos(b)),
                      (x + l * math.cos(b) + w * math.sin(b), y + l * math.sin(b) - w * math.cos(b)),
                      (x - l * math.cos(b) + w * math.sin(b), y - l * math.sin(b) - w * math.cos(b))])
        else:
            d += dot(x, y, (.9 + R.random() * .7) * sc)
    return d


def far_proto(R, sc):
    c = Cell(R, sc)
    for i in range(6):
        a = 2 * math.pi * i / 6 + R.uniform(-.4, .4)
        c.branch(9 * math.cos(a), 9 * math.sin(a), a, R.uniform(45, 75), 6, 1, 0, .08)
    return dot(0, 0, 12) + ''.join(c.procs + c.fine)

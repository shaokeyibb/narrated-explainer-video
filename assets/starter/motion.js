// Time is always seconds on the edited narration clock. Rectangles use x/y/w/h.
(function (host) {
  function ramp(time, start, duration) {
    if (!(duration > 0)) return time >= start ? 1 : 0;
    const p = Math.max(0, Math.min(1, (time - start) / duration));
    return p * p * (3 - 2 * p);
  }

  function reveal(ctx, opacity, draw) {
    if (opacity <= 0) return;
    ctx.save();
    try {
      ctx.globalAlpha *= Math.min(1, opacity);
      draw();
    } finally {
      ctx.restore();
    }
  }

  // Keep a shared object while moving it from its overview to its detail layout.
  function matchRect(time, start, duration, from, to) {
    const p = ramp(time, start, duration);
    const rect = {};
    for (const key of ['x', 'y', 'w', 'h']) rect[key] = from[key] + (to[key] - from[key]) * p;
    return rect;
  }

  // A straight leader between two measured boxes. Includes the arrow tip in its safe span.
  // If a third label lies on the route, reroute or use matching icons instead.
  function leaderEndpoints(from, to, gap = 8) {
    const ax = from.x + from.w / 2, ay = from.y + from.h / 2;
    const bx = to.x + to.w / 2, by = to.y + to.h / 2;
    const distance = Math.hypot(bx - ax, by - ay);
    if (!distance) return null;
    const dx = (bx - ax) / distance, dy = (by - ay) / distance;
    const edge = rect => Math.min(dx ? rect.w / (2 * Math.abs(dx)) : Infinity,
                                  dy ? rect.h / (2 * Math.abs(dy)) : Infinity);
    const head = edge(from) + gap, tail = distance - edge(to) - gap;
    if (tail <= head) return null;
    return {x1: ax + dx * head, y1: ay + dy * head,
            x2: ax + dx * tail, y2: ay + dy * tail};
  }

  const api = {ramp, reveal, matchRect, leaderEndpoints};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else host.filmMotion = api;
})(globalThis);

function mgTagRawSHA256(value) {
  const K = [],
    h = [];
  for (let p = 2; K.length < 64; p++) {
    let prime = true;
    for (let d = 2; d * d <= p; d++)
      if (p % d === 0) {
        prime = false;
        break;
      }
    if (prime) {
      if (h.length < 8) h.push(((Math.sqrt(p) % 1) * 4294967296) >>> 0);
      K.push(((Math.cbrt(p) % 1) * 4294967296) >>> 0);
    }
  }
  const block = new Uint8Array(64),
    w = new Uint32Array(64);
  let used = 0,
    total = 0;
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  function transform() {
    for (let t = 0; t < 16; t++)
      w[t] =
        ((block[t * 4] << 24) |
          (block[t * 4 + 1] << 16) |
          (block[t * 4 + 2] << 8) |
          block[t * 4 + 3]) >>>
        0;
    for (let t = 16; t < 64; t++) {
      const x = w[t - 15],
        y = w[t - 2];
      w[t] =
        (w[t - 16] +
          (rr(x, 7) ^ rr(x, 18) ^ (x >>> 3)) +
          w[t - 7] +
          (rr(y, 17) ^ rr(y, 19) ^ (y >>> 10))) >>>
        0;
    }
    let [a, b, c, d, e, f, g, z] = h;
    for (let t = 0; t < 64; t++) {
      const q =
          (z +
            (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) +
            ((e & f) ^ (~e & g)) +
            K[t] +
            w[t]) >>>
          0,
        u =
          ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) +
            ((a & b) ^ (a & c) ^ (b & c))) >>>
          0;
      z = g;
      g = f;
      f = e;
      e = (d + q) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (q + u) >>> 0;
    }
    const v = [a, b, c, d, e, f, g, z];
    for (let t = 0; t < 8; t++) h[t] = (h[t] + v[t]) >>> 0;
  }
  function byte(n) {
    block[used++] = n;
    if (used === 64) {
      transform();
      used = 0;
    }
    total++;
  }
  function text(s) {
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
        const n = s.charCodeAt(i + 1);
        if (n >= 0xdc00 && n <= 0xdfff) {
          c = 0x10000 + ((c - 0xd800) << 10) + (n - 0xdc00);
          i++;
        } else c = 0xfffd;
      } else if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
      if (c < 128) byte(c);
      else if (c < 2048) {
        byte(192 | (c >> 6));
        byte(128 | (c & 63));
      } else if (c < 65536) {
        byte(224 | (c >> 12));
        byte(128 | ((c >> 6) & 63));
        byte(128 | (c & 63));
      } else {
        byte(240 | (c >> 18));
        byte(128 | ((c >> 12) & 63));
        byte(128 | ((c >> 6) & 63));
        byte(128 | (c & 63));
      }
    }
  }

  text(value);
  const bits = total * 8;
  byte(128);
  while (used !== 56) byte(0);
  const high = Math.floor(bits / 4294967296),
    low = bits >>> 0;
  for (let i = 3; i >= 0; i--) byte((high >>> (i * 8)) & 255);
  for (let i = 3; i >= 0; i--) byte((low >>> (i * 8)) & 255);
  return h.map((x) => x.toString(16).padStart(8, "0")).join("");
}

if (typeof module !== "undefined") module.exports = { mgTagRawSHA256 };

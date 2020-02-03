class b2Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(v) {
    this.x = v.x;
    this.y = v.y;
  }

  copy() {
    return new b2Vec2(this.x, this.y);
  }

  neg() {
    return new b2Vec2(-this.x, -this.y);
  }

  perpendicular() {
    return new b2Vec2(-this.y, this.x);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
  }

  mul(a) {
    this.x *= a;
    this.y *= a;
  }

  mulM(A) {
    var x = this.x;
    var y = this.y;
    this.x = A.col1.x * x + A.col2.x * y;
    this.y = A.col1.y * x + A.col2.y * y;
  }

  abs() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    var l = this.length();
    if (l < Number.MIN_VALUE) {
      return 0.0;
    }

    var invLength = 1.0 / length;
    this.x *= invLength;
    this.y *= invLength;
    return length;
  }
}

class b2Mat22 {
  constructor(c1, c2) {
    this.col1 = c1.copy();
    this.col2 = c2.copy();
  }

  rotate(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    this.col1.x = c;
    this.col2.x = -s;
    this.col1.y = s;
    this.col2.y = c;
  }

  set(c1, c2) {
    this.col1.set(c1);
    this.col2.set(c2);
  }

  copy() {
    return new b2Mat22(this.col1, this.col2);
  }

  add(m) {
    this.col1.x += m.col1.x;
    this.col1.y += m.col1.y;
    this.col2.x += m.col2.x;
    this.col2.y += m.col2.y;
  }

  abs() {
    this.col1.abs();
    this.col2.abs();
  }

  invert() {
    const a = this.col1.x;
    const b = this.col2.x;
    const c = this.col1.y;
    const d = this.col2.y;
    const det = a * d - b * c;

    const invDet = 1.0 / det;
    let c1 = new b2Vec2(invDet * d, -invDet * c);
    let c2 = new b2Vec2(-invDet * b, invDet * a);
    return new b2Mat22(c1, c2);
  }
}

class b2Rot {
  constructor(s, c) {
    this.s = s;
    this.c = c;
  }

  copy() {
    return new b2Rot(this.s, this.c);
  }

  xAxis() {
    return new b2Vec2(this.c, this.s);
  }

  yAxis() {
    return new b2Vec2(-this.s, this.c);
  }
}

class b2Transform {
  constructor(p, q) {
    this.p = p.copy();
    this.q = q.copy();
  }
}

class b2BoxDef {
  constructor(extents) {
    this.position = new b2Vec2(0.0, 0.0);
    this.rotation = 0.0;
    this.friction = 0.2;
    this.restitution = 0.0;
    this.extents = extents.copy();
  }
}

class b2MassData {
  constructor(mass, I) {
    this.mass = mass;
    this.I = I;
  }
}

function b2Rotate(angle) {
  s = Math.sin(angle);
  c = Math.cos(angle);
  return new b2Rot(s, c);
}

function b2Dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function b2Cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function b2AddVV(a, b) {
  let u0 = a.x + b.x;
  let u1 = a.y + b.y;
  return new b2Vec2(u0, u1);
}

function b2SubVV(a, b) {
  let u0 = a.x - b.x;
  let u1 = a.y - b.y;
  return new b2Vec2(u0, u1);
}

function b2MulSV(s, a) {
  let u0 = s * a.x;
  let u1 = s * a.y;
  return new b2Vec2(u0, u1);
}

function b2MulMV(A, v) {
  let u0 = A.col1.x * v.x + A.col2.x * v.y;
  let u1 = A.col1.y * v.x + A.col2.y * v.y;
  return new b2Vec2(u0, u1);
}

function b2MulTMV(A, v) {
  let u0 = A.col1.x * v.x + A.col1.y * v.y;
  let u1 = A.col2.x * v.x + A.col2.y * v.y;
  return new b2Vec2(u0, u1);
}

function b2MulRV(q, a) {
  let u0 = q.c * a.x - q.s * a.y;
  let u1 = q.s * a.x + q.c * a.y;
  return new b2Vec2(u0, u1);
}

function b2MulTRV(q, a) {
  let u0 = q.c * a.x + q.s * a.y;
  let u1 = -q.s * a.x + q.c * a.y;
  return new b2Vec2(u0, u1);
}

function b2MulMM(A, B) {
}

function b2MulTMM(A, B) {
}

function b2MulRR(q, r) {
  let u0 = q.s * r.c + q.c * r.s;
  let u1 = q.c * r.c - q.s * r.s;
  return new b2Rot(u0, u1);
}

function b2MulTRR(q, r) {
  let u0 = q.c * r.s - q.s * r.c;
  let u1 = q.c * r.c + q.s * r.s;
  return new b2Rot(u0, u1);
}

function b2MulTTV(A, a) {
  let p = b2SubVV(a, A.p);
}

// v2 =  A.q.Rot(B.q.Rot(v1) + B.p) + A.p
//    = (A.q * B.q).Rot(v1) + A.q.Rot(B.p) + A.p
function b2MulTT(A, B) {
  let p = b2AddVV(b2MulRV(A.q, B.p), A.p);
  let q = b2MulRR(A.q, B.q);
  return new b2Transform(p, q);
}

// v2 = A.q' * (B.q * v1 + B.p - A.p)
//    = A.q' *  B.q * v1 + A.q' * (B.p - A.p)
function b2MulTTT(A, B) {
  let p = b2MulTRV(A.q, b2SubVV(B.p, A.p));
  let q = b2MulTRR(A.q, B.q);
  return new b2Transform(p, q);
}

module.exports = {
  b2Vec2,
  b2Dot
}

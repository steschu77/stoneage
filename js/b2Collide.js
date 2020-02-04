// MIT License

// Copyright (c) 2019 Erin Catto

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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

// ----------------------------------------------------------------------------
function b2ClipSegmentToLine(vIn, normal, offset) {
  var vOut = [];
  var vIn0 = vIn[0].v;
  var vIn1 = vIn[1].v;

  var distance0 = b2Dot(normal, vIn[0].v) - offset;
  var distance1 = b2Dot(normal, vIn[1].v) - offset;

  if (distance0 <= 0.0) vOut.push(vIn[0]);
  if (distance1 <= 0.0) vOut.push(vIn[1]);

  if (distance0 * distance1 < 0.0) {
    let interp = distance0 / (distance0 - distance1);
    let vx = vIn0.x + interp * (vIn1.x - vIn0.x);
    let vy = vIn0.y + interp * (vIn1.y - vIn0.y);
    let v = b2Vec2(vx, vy);
    let id = (distance0 > 0.0) ? vIn[0].id : vIn[1].id;
    vOut.push(new b2Contact(v, id));
  }

  return vOut;
}

// ----------------------------------------------------------------------------
function b2FindMaxSeparation(poly1, poly2, flip) {
  const count1 = poly1.vertexCount;
  const count2 = poly2.vertexCount;

  const xf = b2MulTTT(poly2.xf, poly1.xf);

  let maxSeparation = -Number.MAX_VALUE;
  for (var i = 0; i < count1; ++i) {
    const n = b2MulRV(xf.q, poly1.normals[i]);
    const v1 = b2MulTV(xf, poly1.vertices[i]);

    let si = Number.MAX_VALUE;
    for (var j = 0; j < count2; ++j) {
      const sij = b2Dot(n, b2SubVV(poly1.vertices[j], v1));
      if (sij < si) {
        si = sij;
      }
    }

    if (si > maxSeparation) {
      maxSeparation = si;
      bestIndex = i;
    }
  }

  return {
    poly1: poly1,
    poly2: poly2,
    maxSeparation: maxSeparation,
    bestIndex: bestIndex,
    flip: flip
  }
}

// ----------------------------------------------------------------------------
function b2FindIncidentEdge(poly1, poly2, edge1) {
  const count2 = poly2.vertexCount;

  const normal1 = b2MulT(poly2.xf.q, b2Mul(poly1.xf.q, poly1.normals[edge1]));

  let minDot = Number.MAX_VALUE;
  let index = 0;
  for (var i = 0; i < count2; ++i) {
    const dot = b2Dot(normal1, poly2.normals[i]);
    if (dot < minDot) {
      minDot = dot;
      index = i;
    }
  }

  const i1 = index;
  const i2 = i1 + 1 < count2 ? i1 + 1 : 0;

  let c = [];
  c.push(new b2Contact(b2MulTV(xf2, vertices2[i1]), edge1, i1));
  c.push(new b2Contact(b2MulTV(xf2, vertices2[i2]), edge1, i2));
  return c;
}

// ----------------------------------------------------------------------------
function b2CollidePoly(arbiter, polyA, polyB) {

  const totalRadius = polyA.radius + polyB.radius;

  const edgeA = b2FindMaxSeparation(polyA, polyB, 0);
  if (edgeA.maxSeparation > totalRadius) {
    return;
  }

  const edgeB = b2FindMaxSeparation(polyB, polyA, 1);
  if (edgeB.maxSeparation > totalRadius) {
    return;
  }

  const referenceEdge = edgeB.maxSeparation > edgeA.maxSeparation ? edgeB : edgeA;
  const incidentEdge = b2FindIncidentEdge(referenceEdge);

  const count1 = referenceEdge.poly1.vertexCount;
  const vert1s = referenceEdge.poly1.vertices;
  const iv11 = referenceEdge.bestIndex;
  const iv12 = iv11 + 1 < count1 ? iv11 + 1 : 0;
  const v11 = vert1s[iv11];
  const v12 = vert1s[iv12];

  const planePoint = b2MulSV(0.5, b2AddVV(v11, v12));
  const localTangent = b2SubVV(v12, v11).normalize();
  const localNormal = localTangent.perpendicular();

  const xf1 = referenceEdge.poly1.xf;
  const tangent = b2MulRV(xf1.q, localTangent);
  const normal = tangent.perpendicular();

  const tv11 = b2MulTV(xf1, v11);
  const tv12 = b2MulTV(xf1, v12);

  // Face offset and side offsets, extended by polytope skin thickness.
  const frontOffset = b2Dot(normal, tv11);
  const sideOffset1 = -b2Dot(tangent, tv11) + totalRadius;
  const sideOffset2 = b2Dot(tangent, tv12) + totalRadius;

  let clipPoints1 = b2ClipSegmentToLine(incidentEdge, tangent.neg(), sideOffset1);
  if (clipPoints1.len < 2) {
    return;
  }

  let clipPoints2 = b2ClipSegmentToLine(clipPoints1, tangent, sideOffset2);
  if (clipPoints2.len < 2) {
    return;
  }

  let arbiter = {
    localNormal: localNormal,
    localPoint: planePoint
  }

  var pointCount = 0;
  for (var i = 0; i < b2Settings.b2_maxManifoldPoints; ++i) {
    var separation = b2math.b2SubVV(b2math.b2Dot(frontNormal, clipPoints2[i].v), frontOffset);

    if (separation <= 0.0) {
      var cp = manifold.points[pointCount];
      cp.separation = separation;
      cp.position.SetV(clipPoints2[i].v);
      cp.id.Set(clipPoints2[i].id);
      cp.id.features.flip = flip;
      ++pointCount;
    }
  }

  manifold.pointCount = pointCount;
};

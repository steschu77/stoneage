const assert = require('assert')
const b2math = require("./b2Math.js");

let tests = []
function test(name, fn) {
  tests.push({ name, fn })
}

test('dot product', () => {
  const v0 = new b2math.b2Vec2(1.0, 0.0);
  const v1 = new b2math.b2Vec2(0.0, 1.0);
  assert.equal(b2math.b2Dot(v0, v1), 0.0);
  assert.equal(b2math.b2Dot(v0, v0), 1.0);
  assert.equal(b2math.b2Dot(v1, v1), 1.0);
})

function run() {
  tests.forEach(t => {
    try {
      t.fn()
      console.log('✅', t.name)
    } catch (e) {
      console.log('❌', t.name)
      console.log(e.stack)
    }
  })
}

run();
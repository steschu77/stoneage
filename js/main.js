var squareRotation = 0.0;
var rotorSpeed = 0.0;

var playerX = 0.0;
var playerY = 0.0;
var velX = 0.0;
var velY = 0.0;

var player = {
  forceX0: 0.0,
  forceX1: 0.0,
  forceY0: 0.0,
  forceY1: 0.0,
};

function reportError(msg)
{
  let div = document.getElementById('canvas');
  div.innerHTML = "<strong>We are sorry.</strong><p>" + msg + "</p>";
  div.className = "alert";
}

function loadShader(gl, type, source)
{
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    reportError('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource)
{
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    reportError('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadTexture(gl, url)
{
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const tempContent = new Uint8Array([
    0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff,  0x00, 0x00, 0x00, 0xff,  0x00, 0x00, 0x00, 0xff,  0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff,  0x00, 0x00, 0x00, 0xff,  0x00, 0x00, 0x00, 0xff,  0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,  0xff, 0xff, 0xff, 0xff,
  ]);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, tempContent);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // const image = new Image();
  // image.onload = function() {
  //   gl.bindTexture(gl.TEXTURE_2D, texture);
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
  //                 gl.RGBA, gl.UNSIGNED_BYTE, image);
  // };

  //image.src = url;  
}

function initBuffers(gl)
{
  const positions = [
    -1.1,  1.0,
     1.1,  1.0,
    -1.1, -1.0,
     1.1, -1.0,
  ];

  const texCoords = [
    0.0,  1.0,
    1.0,  1.0,
    0.0,  0.0,
    1.0,  0.0,
  ];

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);  

  return {
    position: positionBuffer,
    texCoord: textureCoordBuffer,
  };
}

function drawScene(gl, programInfo, buffers, deltaTime)
{
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const zoom = 10.0;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const left = -zoom * aspect;
  const right = zoom * aspect;
  const top = zoom;
  const bottom = -zoom;
  const zNear = -1.0;
  const zFar = 1.0;

  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, left, right, bottom, top, zNear, zFar);

  const positionMatrix = mat4.create();
  mat4.fromTranslation(positionMatrix, [playerX, playerY, 0.0]);
  const rotationMatrix = mat4.create();
  //mat4.fromZRotation(rotationMatrix, squareRotation);
  mat4.translate(rotationMatrix, rotationMatrix, [0, 1, 0]);
  mat4.rotateX(rotationMatrix, rotationMatrix, 3.141 * 0.3);
  mat4.rotateZ(rotationMatrix, rotationMatrix, squareRotation);

  const matrixBase = mat4.create();
  mat4.mul(matrixBase, projectionMatrix, positionMatrix);

  const matrixRotor = mat4.create();
  mat4.mul(matrixRotor, positionMatrix, rotationMatrix);
  mat4.mul(matrixRotor, projectionMatrix, matrixRotor);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertex,
      2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(
      programInfo.attribLocations.vertex);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
  gl.vertexAttribPointer(programInfo.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);  

  gl.useProgram(programInfo.program);
  gl.activeTexture(gl.TEXTURE0);
  //gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);  

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.matrix,
      false,
      matrixBase);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.matrix,
      false,
      matrixRotor);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function main()
{
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    reportError("Your browser does not support WebGL.");
    return;
  }

  const vsSource = `
    attribute vec4 aVertex;
    attribute vec2 aTextureCoord;

    uniform mat4 uMatrix;

    varying highp vec2 vTextureCoord;

    void main() {
      gl_Position = uMatrix * aVertex;
      vTextureCoord = aTextureCoord;
    }
  `;

  const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertex: gl.getAttribLocation(shaderProgram, 'aVertex'),
      texCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      matrix: gl.getUniformLocation(shaderProgram, 'uMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  const buffers = initBuffers(gl);

  loadTexture(gl, 'img/201.jpg');

  var then = 0;
  function render(now)
  {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    let wind = 0.0;
    if (playerY < 2 && playerY > -2) {
      wind = 0.1;
    }

    const gravity = 0.1;
    const playerFX = player.forceX1 - player.forceX0;
    const playerFY = player.forceY1 - player.forceY0;
    const forceX = 0.05 * playerFX - 0.05 * velX + wind;
    const forceY = 0.21 * playerFY - 0.05 * velY - gravity;

    velX = velX + forceX;
    velY = velY + forceY;

    playerX = playerX + velX;
    playerY = playerY + velY;

    if (playerX < -16) {
      playerX = -16;
      velX = -0.8 * velX;
    }
    if (playerX > 16) {
      playerX = 16;
      velX = -0.8 * velX;
    }

    playerY -= 0.1;

    if (playerY < -10) {
      playerY = -10;
      velY = -0.8 * velY;
    }

    rotorSpeed = playerFY;
    squareRotation += 0.5 * rotorSpeed + 0.1;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  function keyDownHandler(event) {
    if(event.keyCode == 39) {
      player.forceX1 = 1;
    }
    else if(event.keyCode == 37) {
      player.forceX0 = 1;
    }
    if(event.keyCode == 40) {
      player.forceY0 = 1;
    }
    else if(event.keyCode == 38) {
      player.forceY1 = 1;
    }
  }

  function keyUpHandler(event) {
    if(event.keyCode == 39) {
      player.forceX1 = 0;
    }
    else if(event.keyCode == 37) {
      player.forceX0 = 0;
    }
    if(event.keyCode == 40) {
      player.forceY0 = 0;
    }
    else if(event.keyCode == 38) {
      player.forceY1 = 0;
    }
  }

  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
}

main();

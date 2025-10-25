var canvas;
var gl;
var NumVertices = 36;
var points = [];
var normals = [];
var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var zDist = -2.0;
var modelViewLoc;
var projectionLoc;
var normalMatrixLoc;
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 0.6, 0.2, 1.0);
var materialDiffuse = vec4(1.0, 0.6, 0.2, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 150.0;
var projectionMatrix;
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }
  buildCube();
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  modelViewLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionLoc = gl.getUniformLocation(program, "projectionMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrix = perspective(50.0, 1.0, 0.1, 100.0);
  gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
  canvas.addEventListener("mousedown", function (e) {
    movement = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault();
  });
  canvas.addEventListener("mouseup", function () {
    movement = false;
  });
  canvas.addEventListener("mousemove", function (e) {
    if (movement) {
      spinY = (spinY + (e.offsetX - origX)) % 360;
      spinX = (spinX + (origY - e.offsetY)) % 360;
      origX = e.offsetX;
      origY = e.offsetY;
    }
  });
  window.addEventListener("wheel", function (e) {
    if (e.deltaY > 0.0) zDist += 0.2;
    else zDist -= 0.2;
  });
  render();
};
function buildCube() {
  quad(1, 0, 3, 2, 0);
  quad(2, 3, 7, 6, 1);
  quad(3, 0, 4, 7, 2);
  quad(6, 5, 1, 2, 3);
  quad(4, 5, 6, 7, 4);
  quad(5, 4, 0, 1, 5);
}
function quad(a, b, c, d, n) {
  var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
  ];
  var faceNormals = [
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, -1.0, 0.0, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(0.0, 0.0, -1.0, 0.0),
    vec4(-1.0, 0.0, 0.0, 0.0),
  ];
  var idx = [a, b, c, a, c, d];
  for (var i = 0; i < idx.length; ++i) {
    points.push(vertices[idx[i]]);
    normals.push(faceNormals[n]);
  }
}
function drawBox(mv, sx, sy, sz, tx, ty, tz) {
  var mv1 = mult(mv, translate(tx, ty, tz));
  mv1 = mult(mv1, scalem(sx, sy, sz));
  var nm = normalMatrix(mv1, true);
  gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
  gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nm));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var mv = lookAt(
    vec3(0.0, 0.0, zDist),
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0)
  );
  mv = mult(mv, rotateX(spinX));
  mv = mult(mv, rotateY(spinY));
  drawBox(mv, 0.04, 0.8, 0.5, -0.4, 0.0, 0.0);
  drawBox(mv, 0.04, 0.8, 0.5, 0.4, 0.0, 0.0);
  drawBox(mv, 0.8, 0.04, 0.5, 0.0, 0.38, 0.0);
  drawBox(mv, 0.8, 0.04, 0.5, 0.0, -0.38, 0.0);
  drawBox(mv, 0.8, 0.015, 0.5, 0.0, 0.0, 0.0);
  drawBox(mv, 0.015, 0.8, 0.5, 0.0, 0.0, 0.0);
  requestAnimFrame(render);
}

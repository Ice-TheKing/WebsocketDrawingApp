"use strict"; // Getting tablet pen pressure: 
// https://stackoverflow.com/questions/10507341/can-i-recognise-graphic-tablet-pen-pressure-in-javascript
// http://www.wacomeng.com/web/index.html
// Saving canvas to png:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
// undo/redo library:
// https://codepen.io/abidibo/pen/rmGBc
// canvas eye dropper tool:
// https://stackoverflow.com/questions/17221802/canvas-eyedropper
// Techniques for making brushes:
// http://perfectionkills.com/exploring-canvas-drawing-techniques/
// Mobile touch events:
// https://mobiforge.com/design-development/html5-mobile-web-touch-events
// https://www.youtube.com/watch?v=ga_SLzsUdTY

var socket;
var DRAW_CONSTS = {
  DEFAULT_LINE_WIDTH: 3,
  DEFAULT_STROKE_STYLE: "#ff0000",
  DEFAULT_LINE_CAP: "round",
  DEFAULT_LINE_JOIN: "round",
  DEFAULT_BACK_COLOR: "lightgray"
};
var drawGlobals = {
  canvas: null,
  ctx: null,
  dragging: false,
  lineWidth: null,
  strokeStyle: null,
  strokeStart: {},
  previousMouseLocation: null,
  lockInput: false,
  changeLineWidth: function changeLineWidth(e) {
    drawGlobals.lineWidth = e.target.value;
  },
  changeStrokeColor: function changeStrokeColor(e) {
    drawGlobals.strokeStyle = e.target.value;
  },
  clearServerDrawing: function clearServerDrawing(e) {
    socket.emit('clearDrawing');
  },
  clearLocalCanvas: function clearLocalCanvas(e) {
    drawGlobals.ctx.clearRect(0, 0, drawGlobals.ctx.canvas.width, drawGlobals.ctx.canvas.height);
    fillBackground();
  }
};
var mouse = {
  getMouse: function getMouse(e) {
    var mouseLocation = {};
    mouseLocation.x = e.pageX - e.target.offsetLeft;
    mouseLocation.y = e.pageY - e.target.offsetTop;
    return mouseLocation;
  },
  mouseDown: function mouseDown(e) {
    if (drawGlobals.lockInput) return;
    var mouseLocation = mouse.getMouse(e); // EYE DROPPER while holding alt

    if (e.altKey) {
      var pxData = drawGlobals.ctx.getImageData(mouseLocation.x, mouseLocation.y, 1, 1);
      drawGlobals.strokeStyle = "rgba(".concat(pxData.data[0], ", ").concat(pxData.data[1], ", ").concat(pxData.data[2], ", ").concat(pxData.data[3], ")"); // TODO: This line is redundant. Right now it is only here because the #colorPicker.value can only read a #HHEEXX value, but the drawGlobals.strokeStyle
      // is a rgba() value. Setting the canvas ctx automatically converts it to a hex, so I'm just using that functionality instead of converting it myself

      drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
      document.querySelector('#colorPicker').value = drawGlobals.ctx.strokeStyle;
      return;
    }

    drawGlobals.dragging = true; // drawGlobals.ctx.beginPath();

    drawGlobals.ctx.moveTo(mouseLocation.x, mouseLocation.y); // update the initial stroke location to give to the server

    drawGlobals.strokeStart.x = mouseLocation.x;
    drawGlobals.strokeStart.y = mouseLocation.y;
  },
  mouseMove: function mouseMove(e) {
    if (!drawGlobals.dragging || drawGlobals.lockInput) return;
    var mouseLocation = mouse.getMouse(e);
    drawGlobals.ctx.beginPath();
    drawGlobals.ctx.moveTo(drawGlobals.strokeStart.x, drawGlobals.strokeStart.y);
    drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
    drawGlobals.ctx.lineWidth = drawGlobals.lineWidth;
    drawGlobals.ctx.lineTo(mouseLocation.x, mouseLocation.y);
    drawGlobals.ctx.stroke();
    sendPathToServer(mouseLocation);
    drawGlobals.strokeStart.x = mouseLocation.x;
    drawGlobals.strokeStart.y = mouseLocation.y;
  },
  mouseUp: function mouseUp(e) {
    drawGlobals.dragging = false;
  },
  mouseOut: function mouseOut(e) {
    drawGlobals.dragging = false;
  }
};

var onKeyDown = function onKeyDown(e) {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "crosshair";
  }
};

var onKeyUp = function onKeyUp(e) {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "auto";
  }
};

var setupSocket = function setupSocket() {
  socket.on('pathToClient', drawPathFromServer);
  socket.on('initDrawing', function (data) {
    var drawingSteps = data.drawSteps;
    drawGlobals.lockInput = true;

    for (var i = 0; i < drawingSteps.length; i++) {
      drawPathFromServer(drawingSteps[i]);
    }

    drawGlobals.lockInput = false;
  });
  socket.on('clearDrawing', function (data) {
    drawGlobals.clearLocalCanvas();
  });
};

var sendPathToServer = function sendPathToServer(mouseLocation) {
  var path = {
    start: drawGlobals.strokeStart,
    end: mouseLocation,
    style: drawGlobals.strokeStyle,
    width: drawGlobals.lineWidth
  };
  socket.emit('pathToServer', path);
};

var drawPathFromServer = function drawPathFromServer(data) {
  drawGlobals.ctx.save();
  drawGlobals.ctx.beginPath();
  drawGlobals.ctx.strokeStyle = data.style;
  drawGlobals.ctx.lineWidth = data.width;
  drawGlobals.ctx.moveTo(data.start.x, data.start.y);
  drawGlobals.ctx.lineTo(data.end.x, data.end.y);
  drawGlobals.ctx.stroke();
  drawGlobals.ctx.restore();
};

var fillBackground = function fillBackground() {
  drawGlobals.ctx.save();
  drawGlobals.ctx.fillStyle = DRAW_CONSTS.DEFAULT_BACK_COLOR;
  drawGlobals.ctx.fillRect(0, 0, drawGlobals.ctx.canvas.width, drawGlobals.ctx.canvas.height);
  drawGlobals.ctx.restore();
};

var init = function init() {
  /* INIT SOCKET */
  socket = io.connect();
  setupSocket();
  initDrawPage();
};

var initDrawPage = function initDrawPage() {
  /* INIT CANVAS/DRAW APP */
  // render components in react
  reactModule.renderDrawPage(); // Init Draw Globals

  drawGlobals.canvas = document.querySelector('#mainCanvas');
  drawGlobals.ctx = drawGlobals.canvas.getContext('2d');
  drawGlobals.lineWidth = DRAW_CONSTS.DEFAULT_LINE_WIDTH;
  drawGlobals.strokeStyle = DRAW_CONSTS.DEFAULT_STROKE_STYLE;
  drawGlobals.ctx.lineWidth = drawGlobals.lineWidth;
  drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
  drawGlobals.ctx.lineCap = DRAW_CONSTS.DEFAULT_LINE_CAP;
  drawGlobals.ctx.lineJoin = DRAW_CONSTS.DEFAULT_LINE_JOIN;
  drawGlobals.ctx.canvas.style.touchAction = "none";
  fillBackground(); // Init color picker
  // disable HTML5 color picker

  $('#colorPicker').click(function (e) {
    e.preventDefault();
  });
  $('#colorPicker').colorpicker();
  $('#colorPicker').on('colorpickerChange', drawGlobals.changeStrokeColor); // Mouse event listeners

  drawGlobals.canvas.onmousedown = mouse.mouseDown;
  drawGlobals.canvas.onmousemove = mouse.mouseMove;
  drawGlobals.canvas.onmouseup = mouse.mouseUp;
  drawGlobals.canvas.onmouseout = mouse.mouseOut; // Keyboard listener

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp); // Other listeners

  document.querySelector('#lineWidthSelector').onchange = drawGlobals.changeLineWidth;
  document.querySelector('#clearButton').addEventListener('click', drawGlobals.clearServerDrawing);
};

window.onload = init;
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var reactModule = {};

var Canvas = /*#__PURE__*/function (_React$Component) {
  _inherits(Canvas, _React$Component);

  var _super = _createSuper(Canvas);

  function Canvas() {
    _classCallCheck(this, Canvas);

    return _super.apply(this, arguments);
  }

  _createClass(Canvas, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("canvas", {
        id: "mainCanvas",
        width: 700,
        height: 500
      }));
    }
  }]);

  return Canvas;
}(React.Component);

var CanvasButtons = /*#__PURE__*/function (_React$Component2) {
  _inherits(CanvasButtons, _React$Component2);

  var _super2 = _createSuper(CanvasButtons);

  function CanvasButtons() {
    _classCallCheck(this, CanvasButtons);

    return _super2.apply(this, arguments);
  }

  _createClass(CanvasButtons, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        id: "controls"
      }, /*#__PURE__*/React.createElement("label", null, "Tool:", /*#__PURE__*/React.createElement("select", {
        id: "toolChooser"
      }, /*#__PURE__*/React.createElement("option", {
        value: "toolPencil"
      }, "Pencil"))), /*#__PURE__*/React.createElement("label", null, "Line Width:", /*#__PURE__*/React.createElement("select", {
        id: "lineWidthSelector"
      }, /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "1"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "2"), /*#__PURE__*/React.createElement("option", {
        value: "3",
        selected: true
      }, "3"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "4"), /*#__PURE__*/React.createElement("option", {
        value: "5"
      }, "5"), /*#__PURE__*/React.createElement("option", {
        value: "6"
      }, "6"), /*#__PURE__*/React.createElement("option", {
        value: "7"
      }, "7"), /*#__PURE__*/React.createElement("option", {
        value: "8"
      }, "8"), /*#__PURE__*/React.createElement("option", {
        value: "9"
      }, "9"), /*#__PURE__*/React.createElement("option", {
        value: "10"
      }, "10"))), /*#__PURE__*/React.createElement("label", null, "Stroke Color:", /*#__PURE__*/React.createElement("input", {
        type: "color",
        value: "#ff0000",
        id: "colorPicker"
      })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("input", {
        id: "clearButton",
        type: "button",
        value: "Clear"
      })));
    }
  }]);

  return CanvasButtons;
}(React.Component);

var DrawPage = /*#__PURE__*/function (_React$Component3) {
  _inherits(DrawPage, _React$Component3);

  var _super3 = _createSuper(DrawPage);

  function DrawPage() {
    _classCallCheck(this, DrawPage);

    return _super3.apply(this, arguments);
  }

  _createClass(DrawPage, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Canvas, null), /*#__PURE__*/React.createElement(CanvasButtons, null));
    }
  }]);

  return DrawPage;
}(React.Component);

var renderDrawPage = function renderDrawPage(colorPickerOnChange) {
  ReactDOM.render( /*#__PURE__*/React.createElement(DrawPage, null), document.getElementById('content'));
};

reactModule.renderDrawPage = renderDrawPage;

"use strict";

var socket;
var DRAW_CONSTS = {
  DEFAULT_LINE_WIDTH: 3,
  DEFAULT_STROKE_STYLE: "#ff0000",
  DEFAULT_LINE_CAP: "round",
  DEFAULT_LINE_JOIN: "round",
  DEFAULT_BACK_COLOR: "lightgray"
};
var drawController = {
  canvas: null,
  ctx: null,
  dragging: false,
  lineWidth: null,
  strokeStyle: null,
  strokeStart: {},
  previousMouseLocation: null,
  lockInput: false,
  changeLineWidth: function changeLineWidth(e) {
    drawController.lineWidth = e.target.value;
  },
  changeStrokeColor: function changeStrokeColor(e) {
    drawController.strokeStyle = e.target.value;
  },
  clearServerDrawing: function clearServerDrawing(e) {
    socket.emit('clearDrawing');
  },
  clearLocalCanvas: function clearLocalCanvas(e) {
    drawController.ctx.clearRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
    fillBackground();
  },
  setToColorAtLocation: function setToColorAtLocation(location) {
    console.dir(location);
    var pxData = drawController.ctx.getImageData(location.x, location.y, 1, 1);
    drawController.strokeStyle = "rgba(".concat(pxData.data[0], ", ").concat(pxData.data[1], ", ").concat(pxData.data[2], ", ").concat(pxData.data[3], ")");
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    document.querySelector('#colorPicker').value = drawController.ctx.strokeStyle;
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
    drawController.lockInput = true;

    for (var i = 0; i < drawingSteps.length; i++) {
      drawPathFromServer(drawingSteps[i]);
    }

    drawController.lockInput = false;
  });
  socket.on('clearDrawing', function (data) {
    drawController.clearLocalCanvas();
  });
};

var sendPathToServer = function sendPathToServer(mouseLocation) {
  var path = {
    start: drawController.strokeStart,
    end: mouseLocation,
    style: drawController.strokeStyle,
    width: drawController.lineWidth
  };
  socket.emit('pathToServer', path);
};

var drawPathFromServer = function drawPathFromServer(data) {
  drawController.ctx.save();
  drawController.ctx.beginPath();
  drawController.ctx.strokeStyle = data.style;
  drawController.ctx.lineWidth = data.width;
  drawController.ctx.moveTo(data.start.x, data.start.y);
  drawController.ctx.lineTo(data.end.x, data.end.y);
  drawController.ctx.stroke();
  drawController.ctx.restore();
};

var fillBackground = function fillBackground() {
  drawController.ctx.save();
  drawController.ctx.fillStyle = DRAW_CONSTS.DEFAULT_BACK_COLOR;
  drawController.ctx.fillRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
  drawController.ctx.restore();
};

var init = function init() {
  socket = io.connect();
  setupSocket();
  initDrawPage();
};

var initDrawPage = function initDrawPage() {
  reactModule.renderDrawPage();
  drawController.canvas = document.querySelector('#mainCanvas');
  drawController.ctx = drawController.canvas.getContext('2d');
  drawController.lineWidth = DRAW_CONSTS.DEFAULT_LINE_WIDTH;
  drawController.strokeStyle = DRAW_CONSTS.DEFAULT_STROKE_STYLE;
  drawController.ctx.lineWidth = drawController.lineWidth;
  drawController.ctx.strokeStyle = drawController.strokeStyle;
  drawController.ctx.lineCap = DRAW_CONSTS.DEFAULT_LINE_CAP;
  drawController.ctx.lineJoin = DRAW_CONSTS.DEFAULT_LINE_JOIN;
  drawController.ctx.canvas.style.touchAction = "none";
  fillBackground();
  $('#colorPicker').click(function (e) {
    e.preventDefault();
  });
  $('#colorPicker').colorpicker();
  $('#colorPicker').on('colorpickerChange', drawController.changeStrokeColor);
  mouseController.setupMouseListeners(drawController);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.querySelector('#lineWidthSelector').onchange = drawController.changeLineWidth;
  document.querySelector('#clearButton').addEventListener('click', drawController.clearServerDrawing);
};

$(document).ready(function () {
  init();
});
"use strict";

var mouseController = {
  setupMouseListeners: function setupMouseListeners(drawController) {
    drawController.canvas.onmousedown = mouseController.mouseDown;
    drawController.canvas.onmousemove = mouseController.mouseMove;
    drawController.canvas.onmouseup = mouseController.mouseUp;
    drawController.canvas.onmouseout = mouseController.mouseOut;
  },
  getMouse: function getMouse(e) {
    var mouseLocation = {};
    mouseLocation.x = e.pageX - e.target.offsetLeft;
    mouseLocation.y = e.pageY - e.target.offsetTop;
    return mouseLocation;
  },
  mouseDown: function mouseDown(e) {
    if (drawController.lockInput) return;
    var mouseLocation = mouseController.getMouse(e);
    drawController.dragging = true;

    if (e.altKey) {
      drawController.setToColorAtLocation(mouseLocation);
      return;
    }

    drawController.ctx.moveTo(mouseLocation.x, mouseLocation.y);
    drawController.strokeStart.x = mouseLocation.x;
    drawController.strokeStart.y = mouseLocation.y;
  },
  mouseMove: function mouseMove(e) {
    if (!drawController.dragging || drawController.lockInput) return;
    var mouseLocation = mouseController.getMouse(e);

    if (e.altKey) {
      drawController.setToColorAtLocation(mouseLocation);
      return;
    }

    drawController.ctx.beginPath();
    drawController.ctx.moveTo(drawController.strokeStart.x, drawController.strokeStart.y);
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    drawController.ctx.lineWidth = drawController.lineWidth;
    drawController.ctx.lineTo(mouseLocation.x, mouseLocation.y);
    drawController.ctx.stroke();
    sendPathToServer(mouseLocation);
    drawController.strokeStart.x = mouseLocation.x;
    drawController.strokeStart.y = mouseLocation.y;
  },
  mouseUp: function mouseUp(e) {
    drawController.dragging = false;
  },
  mouseOut: function mouseOut(e) {
    drawController.dragging = false;
  }
};
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

var Canvas = function (_React$Component) {
  _inherits(Canvas, _React$Component);

  var _super = _createSuper(Canvas);

  function Canvas() {
    _classCallCheck(this, Canvas);

    return _super.apply(this, arguments);
  }

  _createClass(Canvas, [{
    key: "render",
    value: function render() {
      return React.createElement("div", null, React.createElement("canvas", {
        id: "mainCanvas",
        width: 700,
        height: 500
      }));
    }
  }]);

  return Canvas;
}(React.Component);

var CanvasButtons = function (_React$Component2) {
  _inherits(CanvasButtons, _React$Component2);

  var _super2 = _createSuper(CanvasButtons);

  function CanvasButtons() {
    _classCallCheck(this, CanvasButtons);

    return _super2.apply(this, arguments);
  }

  _createClass(CanvasButtons, [{
    key: "render",
    value: function render() {
      return React.createElement("div", {
        id: "controls"
      }, React.createElement("label", null, "Tool:", React.createElement("select", {
        id: "toolChooser"
      }, React.createElement("option", {
        value: "toolPencil"
      }, "Pencil"))), React.createElement("label", null, "Line Width:", React.createElement("select", {
        id: "lineWidthSelector"
      }, React.createElement("option", {
        value: "1"
      }, "1"), React.createElement("option", {
        value: "2"
      }, "2"), React.createElement("option", {
        value: "3",
        selected: true
      }, "3"), React.createElement("option", {
        value: "4"
      }, "4"), React.createElement("option", {
        value: "5"
      }, "5"), React.createElement("option", {
        value: "6"
      }, "6"), React.createElement("option", {
        value: "7"
      }, "7"), React.createElement("option", {
        value: "8"
      }, "8"), React.createElement("option", {
        value: "9"
      }, "9"), React.createElement("option", {
        value: "10"
      }, "10"))), React.createElement("label", null, "Stroke Color:", React.createElement("input", {
        type: "color",
        value: "#ff0000",
        id: "colorPicker"
      })), React.createElement("span", null, React.createElement("input", {
        id: "clearButton",
        type: "button",
        value: "Clear"
      })));
    }
  }]);

  return CanvasButtons;
}(React.Component);

var DrawPage = function (_React$Component3) {
  _inherits(DrawPage, _React$Component3);

  var _super3 = _createSuper(DrawPage);

  function DrawPage() {
    _classCallCheck(this, DrawPage);

    return _super3.apply(this, arguments);
  }

  _createClass(DrawPage, [{
    key: "render",
    value: function render() {
      return React.createElement("div", null, React.createElement(Canvas, null), React.createElement(CanvasButtons, null));
    }
  }]);

  return DrawPage;
}(React.Component);

var renderDrawPage = function renderDrawPage(colorPickerOnChange) {
  ReactDOM.render(React.createElement(DrawPage, null), document.getElementById('content'));
};

reactModule.renderDrawPage = renderDrawPage;

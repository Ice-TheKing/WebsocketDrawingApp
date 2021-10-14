"use strict";

// Getting tablet pen pressure: 
// https://stackoverflow.com/questions/10507341/can-i-recognise-graphic-tablet-pen-pressure-in-javascript
// http://www.wacomeng.com/web/index.html

// Saving canvas to png:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL

// undo/redo library:
// https://codepen.io/abidibo/pen/rmGBc

// Techniques for making brushes:
// http://perfectionkills.com/exploring-canvas-drawing-techniques/

let socket;

const DRAW_CONSTS = {
  DEFAULT_LINE_WIDTH: 3,
  DEFAULT_STROKE_STYLE: "#ff0000",
  DEFAULT_LINE_CAP: "round",
  DEFAULT_LINE_JOIN: "round",
  DEFAULT_BACK_COLOR: "lightgray"
};

let drawController = {
  canvas: null,
  ctx: null,
  dragging: false,
  lineWidth: null,
  strokeStyle: null,
  strokeStart: {},
  previousMouseLocation: null,
  lockInput: false,
  colorWheel: {},
  
  changeLineWidth: (e) => {
    drawController.lineWidth = e.target.value;
  },
  
  changeStrokeColor: (e) => {
    const hexColor = e.target.attributes[1].value;
    drawController.strokeStyle = hexColor;
  },
  
  clearServerDrawing: (e) => {
    socket.emit('clearDrawing');
  },
  
  clearLocalCanvas: (e) => {
    drawController.ctx.clearRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
    fillBackground();
  },
  
  setToColorAtLocation: (location) => {
    let pxData = drawController.ctx.getImageData(location.x, location.y, 1, 1);
    drawController.strokeStyle = `rgba(${pxData.data[0]}, ${pxData.data[1]}, ${pxData.data[2]}, ${pxData.data[3]})`;
    
    // TODO: This line is redundant. Right now it is only here because the colorwheel can't read the rgba value, but the drawController.strokeStyle
    // is a rgba() value. Setting the canvas ctx automatically converts it to a hex, so I'm just using that functionality instead of converting it myself
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    
    drawController.colorWheel.attributes[1].value = drawController.ctx.strokeStyle;
  }
};

const onKeyDown = (e) => {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "crosshair";
  }
};
const onKeyUp = (e) => {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "auto";
  }
};

const setupSocket = () => {      
  socket.on('pathToClient', drawPathFromServer);
  
  socket.on('initDrawing', (data) => {
    const drawingSteps = data.drawSteps;
    
    drawController.lockInput = true;
    for(let i = 0; i < drawingSteps.length; i++) {
      drawPathFromServer(drawingSteps[i]);
    }
    drawController.lockInput = false;
  });
  
  socket.on('clearDrawing', (data) => {
    drawController.clearLocalCanvas();
  });
};

const sendPathToServer = (mouseLocation) => {
  let path = {
    start: drawController.strokeStart,
    end: mouseLocation,
    style: drawController.strokeStyle,
    width: drawController.lineWidth
  };
  
  socket.emit('pathToServer', path);
};

const drawPathFromServer = (data) => {
  drawController.ctx.save();
  
  drawController.ctx.beginPath();
  drawController.ctx.strokeStyle = data.style;
  drawController.ctx.lineWidth = data.width;
  drawController.ctx.moveTo(data.start.x, data.start.y);
  drawController.ctx.lineTo(data.end.x, data.end.y);
  drawController.ctx.stroke();
  
  drawController.ctx.restore();
};
    
let fillBackground = () => {
  drawController.ctx.save();
  
  drawController.ctx.fillStyle = DRAW_CONSTS.DEFAULT_BACK_COLOR;
  drawController.ctx.fillRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
  
  drawController.ctx.restore();
};

const init = () => {
  /* INIT SOCKET */
  socket = io.connect();
  
  setupSocket();
  initDrawPage();
}

const initDrawPage = () => {
  /* INIT CANVAS/DRAW APP */
  // render components in react
  reactModule.renderDrawPage();
  
  // Init Draw Globals
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
  
  // Init color wheel
  drawController.colorWheel = document.querySelector('#colorWheel');
  drawController.colorWheel.onchange = drawController.changeStrokeColor;
  
  mouseController.setupMouseListeners(drawController);
  touchController.setupTouchListeners(drawController);
  
  // Keyboard listener
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  // Other listeners
  document.querySelector('#lineWidthSelector').onchange = drawController.changeLineWidth;
  document.querySelector('#clearButton').addEventListener('click', drawController.clearServerDrawing);
}

$(document).ready(function(){
  init();
});
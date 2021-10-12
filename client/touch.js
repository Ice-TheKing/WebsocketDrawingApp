const touchController = {
  setupTouchListeners: (drawController) => {
    drawController.canvas.addEventListener("touchstart", touchController.touchStart);
    drawController.canvas.addEventListener("touchmove", touchController.touchMove);
    drawController.canvas.addEventListener("touchend", touchController.touchEnd);
    drawController.canvas.addEventListener("touchcancel", touchController.touchEnd);
  },
  getTouch: (e) => {
    let touchLocation = {};
    const touches = e.touches[0];
    touchLocation.x = touches.pageX - touches.target.offsetLeft;
    touchLocation.y = touches.pageY - touches.target.offsetTop;
    return touchLocation;
  },
  touchStart: (e) => {
    if (drawController.lockInput) return;
    
    let touchLocation = touchController.getTouch(e);
    
    drawController.dragging = true;
    
    drawController.ctx.moveTo(touchLocation.x, touchLocation.y);
    
    drawController.strokeStart.x = touchLocation.x;
    drawController.strokeStart.y = touchLocation.y;
  },
  touchMove: (e) => {
    if (!drawController.dragging || drawController.lockInput) return;
    
    let touchLocation = touchController.getTouch(e);
    
    drawController.ctx.beginPath();
    drawController.ctx.moveTo(drawController.strokeStart.x, drawController.strokeStart.y);
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    drawController.ctx.lineWidth = drawController.lineWidth;
    drawController.ctx.lineTo(touchLocation.x, touchLocation.y);
    drawController.ctx.stroke();
    
    sendPathToServer(touchLocation);
    
    drawController.strokeStart.x = touchLocation.x;
    drawController.strokeStart.y = touchLocation.y;
  },
  touchEnd: (e) => {
    drawController.dragging = false;
  }
};
class Canvas extends React.Component {
  render() {
    return (
      <div>
        <canvas id="mainCanvas" width={700} height={500} />
      </div>
    );
  }
}

class CanvasButtons extends React.Component {
  render() {
    return (
      <div id="controls">
        <label>Tool:
          <select id="toolChooser">
            <option value="toolPencil">Pencil</option>
          </select>
        </label>	
        <label>Line Width: 
          <select id="lineWidthSelector">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" selected>3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
        </label>
        <label>Stroke Color:
          <input type="color" value="#ff0000" id="colorPicker"/>
        </label>
        	
        <span><input id="clearButton" type="button" value="Clear"/></span>
      </div>
    );
  }
}

class DrawPage extends React.Component {
  render() {
    return (
      <div>
        <Canvas />
        <CanvasButtons />
      </div>
    );
  }
}

ReactDOM.render(
  <DrawPage />,
  document.getElementById('content'),
  initCanvasButtons
);
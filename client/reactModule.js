const reactModule = {};

class Canvas extends React.Component {
  render() {
    return (
      <div>
        <canvas id="mainCanvas" width={700} height={500} />
      </div>
    );
  }
}

class Buttons extends React.Component {
  render() {
    return (
      <div id="controls" >
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
        
        	
        <span><input id="clearButton" type="button" value="Clear"/></span>
      </div>
    );
  }
}

class ColorWheel extends React.Component {
  render() {
    return (
    <reinvented-color-wheel
          id="colorWheel"
          hex="#ff0000"
          wheel-diameter="200"
          wheel-thickness="20"
          handle-diameter="16"
          wheel-reflects-saturation="false"
          ></reinvented-color-wheel>
    );
  }
}


/*class renderCanvas extends React.Component {
  render() {
    return (
      <Canvas />
    );
  }
}*/

const renderCanvas = (renderLocation) => {
  ReactDOM.render(
    <Canvas />,
    document.getElementById(renderLocation),
  );
};

const renderButtons = (renderLocation) => {
  ReactDOM.render(
    <Buttons />,
    document.getElementById(renderLocation),
  );
};

const renderColorWheel = (renderLocation) => {
  ReactDOM.render(
    <ColorWheel />,
    document.getElementById(renderLocation),
  );
};

reactModule.renderCanvas = renderCanvas;
reactModule.renderButtons = renderButtons;
reactModule.renderColorWheel = renderColorWheel;
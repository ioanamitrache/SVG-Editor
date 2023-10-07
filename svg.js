var rightDiv = document.getElementById("canvas-options");
var defaultSvg = document.getElementById("svg-canvas");
var outW = document.getElementById("outWidth");
var outH = document.getElementById("outHeight");
var audio = new Audio("media/click.mp3");

//variables for scaling(zoom in/out) functions:
var transformMatrix = [1, 0, 0, 1, 0, 0];
//I need also the svg variable declared above (defaultSvg)
var svgHeight;
var svgWidth;
var centerX;
var centerY;
var matGroup = document.getElementById("matrix-group");
matGroup.setAttribute("pointer-events", "none");

//variables for buttons actions
var selBtnActive = false;
var lineBtnActive = false;
var elipseBtnActive = false;
var rectBtnActive = false;
var penBtnActive = false;
var textBtnActive = false;
var colorBtnActive = false;

var selectButton = document.getElementById("select-button");
var lineButton = document.getElementById("line-button");
var elipseButton = document.getElementById("elipse-button");
var rectButton = document.getElementById("elipse-button");
var penButton = document.getElementById("pen-button");
var textButton = document.getElementById("text-button");
var colorButton = document.getElementById("color-button");
var FillColorBtn = document.getElementById("fill-color-btn");
var StrokeColorBtn = document.getElementById("stroke-color-btn");

var fillColorSelected;
var strokeColorSelected;

var svgNS = defaultSvg.namespaceURI;

var currentScale = 1;
var x1;
var x2;
var y1;
var y2;
var xA, yA;
var xB, yB;
var txtContent = "|";
var noPolyPoints = 0;
var arrPoints = [];

//ids for elements
var lineID = 0;
var ellipseID = 0;
var rectID = 0;
var txtID = 0;
var polyID = 0;

var currentLineId = -1;
var currentTxtId = -1;
var currentEllipseId = -1;
var currentRectId = -1;
var currentPolyId = -1;

var bMouseClicked = false;

var clickedEVT;
var releasedEVT;


var selectedElement = false;
var lastSelectedElement = false;

function getMousePosition(evt) {
    var CTM = defaultSvg.getScreenCTM();
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
}

function startDrag(evt) {
    if (evt.target.classList.contains('draggable')) {
        selectedElement = evt.target;
        lastSelectedElement = selectedElement;
        offset = getMousePosition(evt);
        // Get all the transforms currently on this element
        var transforms = selectedElement.transform.baseVal;
        // Ensure the first transform is a translate transform
        if (transforms.length === 0 ||
            transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
          // Create an transform that translates by (0, 0)
          var translate = defaultSvg.createSVGTransform();
          translate.setTranslate(0, 0);
          // Add the translation to the front of the transforms list
          selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }
        // Get initial translation amount
        transform = transforms.getItem(0);
        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;
      }
}

function drag(evt) {
    if (selectedElement) {
        evt.preventDefault();
        var coord = getMousePosition(evt);
        transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
      }
}

function endDrag(evt) {
    if(selectedElement != null)
    {
        selectedElement.setAttribute("cursor", "default");
    }
    selectedElement = null;
}

function normalize(value)
{
    value *= (1/currentScale);
    return value;
}

function zoom(scale) //scale=percentage
{
    for(var i=0;i<4;i++)
    {
        transformMatrix[i] *= scale;
    }

    svgWidth *= scale;
    svgHeight *= scale;
    defaultSvg.setAttribute("width",svgWidth);
    defaultSvg.setAttribute("height",svgHeight);

    //transformMatrix[4] += (1-scale)*centerX;
    //transformMatrix[5] += (1-scale)*centerY; 

    //update the translation matrix
    var newMatrix = "matrix(" + transformMatrix.join(' ') + ")";
    matGroup.setAttributeNS(null, "transform", newMatrix);
    currentScale *= scale;
}

function modifySVGWidth(val)
{
    outW.innerHTML = val;
    defaultSvg.setAttribute("width",val);
    svgWidth = parseInt(val);
}

function modifySVGHeight(val)
{
    outH.innerHTML = val;
    defaultSvg.setAttribute("height",val);
    svgHeight = parseInt(val);
}

//override of the which property
Podium = {};
Podium.keydown = function(k) {
    var oEvent = document.createEvent('KeyboardEvent');

    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
    });     
    Object.defineProperty(oEvent, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
    });     

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
    }

    document.dispatchEvent(oEvent);
}



function __triggerKeyboardEvent(el, keyCode)
{
    var eventObj = document.createEventObject ?
        document.createEventObject() : document.createEvent("Events");
  
    if(eventObj.initEvent){
      eventObj.initEvent("keydown", true, true);
    }
  
    eventObj.keyCode = keyCode;
    eventObj.which = keyCode;
    
    el.dispatchEvent ? el.dispatchEvent(eventObj) : el.fireEvent("onkeydown", eventObj); 
  
} 

function traceEvent(e){
    keyDown(e);
}

function triggerKeyboardEvent(el, keyCode){
    var keyboardEvent = document.createEvent("KeyboardEvent");
    
    var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
  
  
    keyboardEvent[initMethod](
    "keydown",
     true,      // bubbles
     true,      // cancelable   
     window,    // view
     false,     // ctrlKeyArg
     false,     // altKeyArg
     false,     // shiftKeyArg
     false,     // metaKeyArg
     keyCode,  
     0          // charCode   
    );
  
    el.dispatchEvent(keyboardEvent); 
}

$(document).ready(function(){
  
  document.addEventListener("keydown", function(e){
    traceEvent(e);
  });
});
//functions for btn actions

function clickedAnywhere()
{
    audio.currentTime = 0;
    audio.play();
}

function clicked(evt)  //onclick we get the coordinates of mouse position
{
    bMouseClicked = true;
    clickedEVT = evt.target;
    var dim = clickedEVT.getBoundingClientRect();
    x1 = normalize(evt.clientX - dim.left);
    y1 = normalize(evt.clientY - dim.top);
    x2 = x1;
    y2 = y1;
    if(lineBtnActive==true || elipseBtnActive==true || rectBtnActive==true)
    {
        draw();
    }
    if(textBtnActive == true && currentTxtId == -1)
    {
        createText("|");
    }
    if(selBtnActive == true)
    {
        startDrag(evt);
    }
    if(penBtnActive == true)
    {
        noPolyPoints++;
        arrPoints.push([x1,y1]);
        if(arrPoints.length == 1)
            arrPoints.push([x1,y1]);
        if(noPolyPoints == 1)
        {
            createPolygon();
            fillPolygonPoints();
        }
        else
            fillPolygonPoints();
    }
}  


function MouseMove(evt)
{
    // current mouse position
    evt.preventDefault();
    if(clickedEVT == null)
        return;

    var dim = clickedEVT.getBoundingClientRect();
    x2 = normalize(evt.clientX - dim.left);
    y2 = normalize(evt.clientY - dim.top); 

    if(currentPolyId != -1)
    {
        arrPoints[arrPoints.length - 1] = [x2,y2];
        fillPolygonPoints();
        return;
    }

    if(bMouseClicked == false)
        return;
    
    if(selBtnActive == true)
    {
        drag(evt);
        if(selectedElement != null)
        {
            selectedElement.setAttribute("cursor", "pointer");
        }
    }
    
    // verific daca currentLineId != -1
    // daca da => updatez linia cu id-ul currentLineId x2, y2
    if(currentLineId != -1) // inseamna ca am o linie pe care o modific
    {
        var currentLine = document.getElementById("line_" + currentLineId);
        currentLine.setAttribute("x2", x2);
        currentLine.setAttribute("y2", y2);
    }
    if(currentEllipseId != -1)
    {
        var currentEllipse = document.getElementById("ellipse_" + currentEllipseId); 
        var rx = Math.abs(x2-x1)/2;
        var ry = Math.abs(y2-y1)/2;
        var cx = (x1 + x2) / 2;
        var cy = (y1 + y2) / 2;
        currentEllipse.setAttribute("rx", rx);
        currentEllipse.setAttribute("ry", ry);
        currentEllipse.setAttribute("cx", cx);
        currentEllipse.setAttribute("cy", cy);
    }
    if(currentRectId != -1)
    {
        var currentRect = document.getElementById("rectangle_" + currentRectId);
        var rectWidth = Math.abs(x1-x2);
        var rectHeight = Math.abs(y1-y2);
        if(x1<x2 && y1<y2)
        {
            currentRect.setAttribute("x", x1);
            currentRect.setAttribute("y", y1);
        }
        if(x1>x2 && y1>y2)
        {
            currentRect.setAttribute("x", x2);
            currentRect.setAttribute("y", y2);
        }
        if(x1<x2 && y1>y2)
        {
            currentRect.setAttribute("x", x1);
            currentRect.setAttribute("y", y2);
        }
        if(x1>x2 && y1<y2)
        {
            currentRect.setAttribute("x", x2);
            currentRect.setAttribute("y", y1);
        }
        currentRect.setAttribute("width", rectWidth);
        currentRect.setAttribute("height", rectHeight);
    }
}

function released(evt) //same onmouseup 
{
    bMouseClicked = false;
    releasedEVT = evt.target;
    var dim = releasedEVT.getBoundingClientRect();
    x2 = normalize(evt.clientX - dim.left);
    y2 = normalize(evt.clientY - dim.top); 

    if(selBtnActive == true)
    {
        endDrag(evt);
    }
    
    currentEllipseId = -1;
    currentRectId = -1;
    currentLineId = -1;
}


function keyDown(evt)
{
    if(textBtnActive == true)
    {
        if( currentTxtId == -1)
        {
            createText(txtContent);
        }


        var currentText = document.getElementById("text_" + currentTxtId);
        if(evt.keyCode >= 48 && evt.keyCode <= 90 || evt.keyCode>= 186 && evt.keyCode<=192 || evt.keyCode>=219 && evt.keyCode<=222 || evt.keyCode==32)
        {
            var newStr = txtContent.substring(0, txtContent.length - 1);
            if (evt.getModifierState("CapsLock") || evt.getModifierState("Shift"))
            {
                newStr += String.fromCharCode(evt.keyCode).toUpperCase() + "|";
            }
            else
            {
                newStr += String.fromCharCode(evt.keyCode).toLowerCase() + "|";
            }
            currentText.textContent = newStr;
            txtContent = newStr;
            currentText.textContent = txtContent;
        }
        if(evt.keyCode == 27)//esc key pressed
        {
            currentText.textContent = "";
            txtContent = "";
            currentTxtId = -1;
        }
        if(evt.keyCode == 8) //backspace key pressed
        {
            var newStr;
            newStr = txtContent.substring(0, txtContent.length - 2) + "|";
            currentText.textContent = newStr;
            txtContent = newStr;
        }
        if(evt.keyCode == 13) //enter key pressed
        {
            var newStr = txtContent.substring(0, txtContent.length - 1);
            currentText.textContent = newStr;
            txtContent = newStr;

            currentTxtId = -1;
            txtContent = "";
        }
    }
    if(selBtnActive == true)
    {
        if(evt.keyCode == 46)
        {
            lastSelectedElement.style.display = "none";
        }
    }
    if(penBtnActive == true)
    {
        if(evt.keyCode == 13) //enter key pressed
        {
            fillPolygonPoints(true);
            noPolyPoints = 0;
            arrPoints = [];
            currentPolyId = -1;
        }
    } 
}


function selectBtnSelected()
{
    selBtnActive = true;
    matGroup.setAttribute("pointer-events", "all");
    if(lineBtnActive == true)
        lineBtnActive = false;
    if(elipseBtnActive == true)
        elipseBtnActive = false;
    if(rectBtnActive == true)
        rectBtnActive = false;
    if(penBtnActive == true)
        penBtnActive = false;
    if(textBtnActive == true)
        textBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function lineBtnSelected()
{
    lineBtnActive = true;
    if(selBtnActive == true)
    {
        selBtnActive = false;
        matGroup.setAttribute("pointer-events", "none");
    }
    if(elipseBtnActive == true)
        elipseBtnActive = false;
    if(rectBtnActive == true)
        rectBtnActive = false;
    if(penBtnActive == true)
        penBtnActive = false;
    if(textBtnActive == true)
        textBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function elipseBtnSelected()
{
    elipseBtnActive = true;
    if(selBtnActive == true)
    {
        selBtnActive = false;
        matGroup.setAttribute("pointer-events", "none");
    }
    if(lineBtnActive == true)
        lineBtnActive = false;
    if(rectBtnActive == true)
        rectBtnActive = false;
    if(penBtnActive == true)
        penBtnActive = false;
    if(textBtnActive == true)
        textBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function rectBtnSelected()
{
    rectBtnActive = true;
    if(selBtnActive == true)
    {
        selBtnActive = false;
        matGroup.setAttribute("pointer-events", "none");
    }
    if(lineBtnActive == true)
        lineBtnActive = false;
    if(elipseBtnActive == true)
        elipseBtnActive = false;
    if(penBtnActive == true)
        penBtnActive = false;
    if(textBtnActive == true)
        textBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function penBtnSelected()
{
    penBtnActive = true;
    if(selBtnActive == true)
    {
        selBtnActive = false;
        matGroup.setAttribute("pointer-events", "none");
    }
    if(lineBtnActive == true)
        lineBtnActive = false;
    if(elipseBtnActive == true)
        elipseBtnActive = false;
    if(rectBtnActive == true)
        rectBtnActive = false;
    if(textBtnActive == true)
        textBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function textBtnSelected()
{
    textBtnActive = true;
    if(selBtnActive == true)
    {
        selBtnActive = false;
        matGroup.setAttribute("pointer-events", "none");
    }
    if(lineBtnActive == true)
        lineBtnActive = false;
    if(elipseBtnActive == true)
        elipseBtnActive = false;
    if(rectBtnActive == true)
        rectBtnActive = false;
    if(penBtnActive == true)
        penBtnActive = false;
    if(colorBtnActive == true)
        colorBtnActive = false;
}

function transparentFill()
{
    fillColorSelected = "transparent";
}

function transparentStroke()
{
    strokeColorSelected = "transparent";
}

function fillColor()
{
    fillColorSelected = FillColorBtn.value;
}

function strokeColor()
{
    strokeColorSelected = StrokeColorBtn.value;
}

function createLine()
{ 
    var line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("x2", x2);
    line.setAttribute("y1", y1);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", strokeColorSelected);
    ++lineID;
    line.setAttribute("id", "line_" + lineID);
    currentLineId = lineID;
    line.setAttribute("class", "draggable");
    line.setAttribute("stroke-width", 2.5);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("pointer-events", "inherit");
    defaultSvg.appendChild(line);
    matGroup.appendChild(line);
}

function createElipse()
{
    var rx = Math.abs(x2-x1)/2;
    var ry = Math.abs(y2-y1)/2;
    var cx = (x1 + x2) / 2;
    var cy = (y1 + y2) / 2;
    var elipse = document.createElementNS(svgNS, "ellipse");
    elipse.setAttribute("rx", rx);
    elipse.setAttribute("ry", ry);
    elipse.setAttribute("cx", cx);
    elipse.setAttribute("cy", cy);
    ++ellipseID;
    elipse.setAttribute("id", "ellipse_" + ellipseID);
    currentEllipseId = ellipseID;
    elipse.setAttribute("class", "draggable");
    elipse.setAttribute("stroke", strokeColorSelected);
    elipse.setAttribute("stroke-width", 2.5);
    elipse.setAttribute("fill", fillColorSelected);
    elipse.setAttribute("pointer-events", "inherit");
    defaultSvg.appendChild(elipse);
    matGroup.appendChild(elipse);
}

function createRect()
{
    var rect = document.createElementNS(svgNS,"rect");
    var rectWidth = Math.abs(x1-x2);
    var rectHeight = Math.abs(y1-y2);
    if(x1<x2 && y1<y2)
    {
        rect.setAttribute("x", x1);
        rect.setAttribute("y", y1);
    }
    if(x1>x2 && y1>y2)
    {
        rect.setAttribute("x", x2);
        rect.setAttribute("y", y2);
    }
    if(x1<x2 && y1>y2)
    {
        rect.setAttribute("x", x1);
        rect.setAttribute("y", y2);
    }
    if(x1>x2 && y1<y2)
    {
        rect.setAttribute("x", x2);
        rect.setAttribute("y", y1);
    }

    
    rect.setAttribute("width", rectWidth);
    rect.setAttribute("height", rectHeight);
    rect.setAttribute("stroke", strokeColorSelected);
    rect.setAttribute("stroke-width", 2.5);
    rect.setAttribute("fill", fillColorSelected);
    ++rectID;
    rect.setAttribute("id", "rectangle_" + rectID);
    currentRectId = rectID;
    rect.setAttribute("class", "draggable");
    rect.setAttribute("pointer-events", "inherit");
    rect.setAttribute("rx", 1);
    rect.setAttribute("ry", 1);
    defaultSvg.appendChild(rect);
    matGroup.appendChild(rect);
}

function fillPolygonPoints(closed = false)
{
    var polygon = document.getElementById("polygon_" + currentPolyId);
    polygon.points.clear();
    var epsilon = 1e-6;
    for(var i = 0; i < arrPoints.length ; i++)
    {
        var value = arrPoints[i];
        if(i > 0)
        {
            var prevValue = arrPoints[i-1];
            if(Math.abs(prevValue[0] - value[0]) < epsilon
                && Math.abs(prevValue[1] - value[1]) < epsilon)
                continue;
        }
        var point = defaultSvg.createSVGPoint();
        point.x = value[0];
        point.y = value[1];
        polygon.points.appendItem(point);
    }
    if(!closed)
    {
        if(arrPoints.length > 2)
        {
            for(var i = arrPoints.length - 2 ; i > 0 ; i--)
            {
                var value = arrPoints[i];
                var point = defaultSvg.createSVGPoint();
                point.x = value[0];
                point.y = value[1];
                polygon.points.appendItem(point);
            }
        }
    }
}

function createPolygon()
{
    var polygon = document.createElementNS(svgNS,"polygon");
    polygon.setAttribute("stroke", strokeColorSelected);
    polygon.setAttribute("stroke-width", 2.5);
    polygon.setAttribute("fill", fillColorSelected);
    polygon.setAttribute("pointer-events", "inherit");
    ++polyID;
    polygon.setAttribute("id", "polygon_" + polyID);
    currentPolyId = polyID;
    polygon.setAttribute("class", "draggable");
    defaultSvg.appendChild(polygon);
    matGroup.appendChild(polygon);
}

function createText(text)
{
    var txt = document.createElementNS(svgNS,"text");
    txt.setAttribute("x", x1);
    txt.setAttribute("y", y1);
    txt.setAttribute("font-size", 20);
    txt.setAttribute("fill", fillColorSelected);
    txt.setAttribute("stroke", strokeColorSelected);
    txt.setAttribute("font-family", "georgia");
    txt.setAttribute("pointer-events", "inherit");
    ++txtID;
    txt.textContent = text;
    txt.setAttribute("id", "text_" + txtID);
    txt.setAttribute("class", "draggable");
    currentTxtId = txtID;
    defaultSvg.appendChild(txt);
    matGroup.appendChild(txt);
}

function invert()
{
    matGroup.setAttribute("filter", "url(#invert)")
}

function blurEffect() {
    matGroup.setAttribute("filter", "url(#blur)");
}

function shadowEffect()
{
    matGroup.setAttribute("filter", "url(#drop-shadow)");
}

function resetEffects()
{
    matGroup.setAttribute("filter", "none");
}

function draw()
{
    if(selBtnActive==true)
    {
        document.addEventListener("click", selectElement, false);
    }
    if(lineBtnActive == true)
    {
      createLine();
    }
    if(rectBtnActive == true)
    {
        createRect();
    }
    if(elipseBtnActive == true)
    {
        createElipse();
    }
}

function modifySvgFromList(val)
{
    switch(val)
    {
        case "640x480":
        {
            outW.innerHTML = 640;
            defaultSvg.setAttribute("width",640);
            outH.innerHTML = 480;
            defaultSvg.setAttribute("height",480);

            svgWidth = 640;
            svgHeight = 480;
            
            break;
        }
        case "800x600":
        {
            outW.innerHTML = 800;
            defaultSvg.setAttribute("width",800);
            outH.innerHTML = 600;
            defaultSvg.setAttribute("height",600);

            svgWidth = 800;
            svgHeight = 600;

            break;
        }
        case "1024x960":
        {
            outW.innerHTML = 1024;
            defaultSvg.setAttribute("width",1024);
            outH.innerHTML = 960;
            defaultSvg.setAttribute("height",960);

            svgWidth = 1024;
            svgHeight = 960;

            break;
        }
        case "1280x960":
        {
            outW.innerHTML = 1280;
            defaultSvg.setAttribute("width",1280);
            outH.innerHTML = 960;
            defaultSvg.setAttribute("height",960);

            svgWidth = 1280;
            svgHeight = 960;

            break;
        }
        case "1600x1200":
        {
            outW.innerHTML = 1600;
            defaultSvg.setAttribute("width",1600);
            outH.innerHTML = 1200;
            defaultSvg.setAttribute("height",1200);

            svgWidth = 1600;
            svgHeight = 1200;

            break;
        }
    }

}

function initialize()
{
    svgHeight = 300;
    svgWidth = 600;
    outW.innerHTML = svgWidth;
    outH.innerHTML = svgHeight;
    document.getElementById("svg-canvas").setAttribute("height",svgHeight);
    document.getElementById("svg-canvas").setAttribute("width", svgWidth);

    centerX = parseFloat(svgWidth) / 2;
    fillColorSelected = FillColorBtn.value;
    strokeColorSelected = StrokeColorBtn.value;

    x1=0;
    x2=0;
    y1=0;
    y2=0;
}

window.onload = function()
{
    initialize();
}
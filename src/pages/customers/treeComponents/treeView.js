import { renderToStaticMarkup } from "react-dom/server"
import { Post } from "../../../hooks/usePost"

import "./treeView.css";

function treeBorad(id, rootId, treeId, periodDate, dataUrl, selectNode, getTemplate, getLoading) {
  var defaults = {
    canvasBox: 'canvasBox',
    canvasBoradIdName: 'tree',
  }

  var tagbox = document.getElementById(id);
  if (tagbox === undefined) return;

  while (tagbox.firstChild) {
    tagbox.removeChild(tagbox.firstChild);
  }

  var canvasBox = document.createElement('div');
  var canvas = document.createElement('div');

  canvas.style.width = '999999px';
  canvas.height = window.innerHeight;
  canvas.style.transformOrigin = 'top left';
  canvas.classList.add("genealogy-tree");

  canvasBox.id = defaults.canvasBox;
  canvas.id = defaults.canvasBoradIdName;

  tagbox.appendChild(canvasBox);
  canvasBox.appendChild(canvas);

  canvasBox.classList.add("genealogy-host");
  tagbox.style.overflow = 'hidden';
  //tagbox.style.minHeight = "1500px";
  tagbox.style.position = "fixed";

  var ctx = new Object();
  trackTransforms(ctx);
  addRootNode();

  var lastX = canvasBox.canvas / 2, lastY = canvas.height / 2;
  var dragStart, dragged;
  var activeNode;

  //ctx.translate(canvas.width / 2, 100);
  redraw();

  canvasBox.addEventListener('mousedown', function (evt) {
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    lastX = (evt.pageX - canvas.offsetLeft);
    lastY = (evt.pageY - canvas.offsetTop);
    dragStart = ctx.transformedPoint(lastX, lastY);
    dragged = false;
  }, false);

  canvasBox.addEventListener('mousemove', function (evt) {
    var lX = (evt.pageX - canvas.offsetLeft);
    var lY = (evt.pageY - canvas.offsetTop);

    if (lX - lastX > 5 || lY - lastY > 5 || lastX - lX > 5 || lastY - lY > 5) {
      dragged = true;
    }

    lastX = lX;
    lastY = lY;

    var flags = evt.buttons !== undefined ? evt.buttons : evt.which;
    if (flags == 0) dragStart = null;

    if (dragStart) {
      var pt = ctx.transformedPoint(lastX, lastY);
      ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
      redraw();
    }
  }, false);
  canvasBox.addEventListener('mouseup', function (evt) {
    dragStart = null;
    if (!dragged) {
      lastX = (evt.pageX - canvas.offsetLeft);
      lastY = (evt.pageY - canvas.offsetTop);
      if (activeNode) {
        activeNode.classList.remove("active");
        selectNode({ id: undefined });
        activeNode = undefined;
      }
    }
  }, false);

  let prevDiff = -1;

  canvasBox.addEventListener("touchstart", (evt) => {
    lastX = (evt.touches[0].pageX - canvas.offsetLeft);
    lastY = (evt.touches[0].pageY - canvas.offsetTop);
    dragStart = ctx.transformedPoint(lastX, lastY);

  }, false);

  canvasBox.addEventListener("touchmove", (evt) => {
    evt.preventDefault();

    if (evt.touches.length > 1) {
      // Calculate the distance between the two pointers
      let x1 = evt.touches[0].pageX;
      let y1 = evt.touches[0].pageY;
      let x2 = evt.touches[1].pageX;
      let y2 = evt.touches[1].pageY;
      let curDiff = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      if (prevDiff > 0) {
        if (curDiff > prevDiff) {
          // The distance between the two pointers has increased
          zoom(curDiff * .003);
        }
        if (curDiff < prevDiff) {
          // The distance between the two pointers has decreased
          zoom(curDiff * -0.003);
        }
      }

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      lastX = (midX - canvas.offsetLeft);
      lastY = (midY - canvas.offsetTop);
      dragStart = ctx.transformedPoint(lastX, lastY);

      // Cache the distance for the next move event
      prevDiff = curDiff;
    } else {
      var lX = (evt.touches[0].pageX - canvas.offsetLeft);
      var lY = (evt.touches[0].pageY - canvas.offsetTop);

      lastX = lX;
      lastY = lY;

      if (dragStart) {
        var pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
        redraw();
      }
    }

  }, false);

  canvasBox.addEventListener("touchend", (evt) => {

    if (evt.touches.length == 1) {
      lastX = (evt.touches[0].pageX - canvas.offsetLeft);
      lastY = (evt.touches[0].pageY - canvas.offsetTop);
      dragStart = ctx.transformedPoint(lastX, lastY);
    }

  }, false);


  var scaleFactor = 1.1;
  var zoom = function (clicks) {
    var pt = ctx.transformedPoint(lastX, lastY);
    ctx.translate(pt.x, pt.y);
    var factor = Math.pow(scaleFactor, clicks);
    ctx.scale(factor, factor);
    ctx.translate(-pt.x, -pt.y);
    redraw();
  }

  var handleScroll = function (evt) {
    var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
    if (delta) zoom(delta);
    return evt.preventDefault() && false;
  };


  canvasBox.addEventListener('DOMMouseScroll', handleScroll, false);
  canvasBox.addEventListener('mousewheel', handleScroll, false);

  function redraw() {
    var tx = ctx.getTransform();
    canvas.style.transform = "matrix(" + tx.a + ", " + tx.b + ", " + tx.c + ", " + tx.d + ", " + tx.e + ", " + tx.f + ")";
  }

  function BuildLoading(parent) {
    var li = document.createElement('li');
    var nodeDiv = document.createElement('div');
    nodeDiv.classList.add("node-host");
    nodeDiv.style.left = 0;
    nodeDiv.style.top = 0;
    nodeDiv.innerHTML = renderToStaticMarkup(getLoading());
    li.appendChild(nodeDiv);

    parent.appendChild(li);
    return li;
  }

  function addRootNode() {
    let parent = document.createElement('ul');
    canvas.appendChild(parent);

    let loading = BuildLoading(parent);

    let data = {
      query: `query ($nodeIds: [String]!, $treeIds: [String]!, $cardIds: [String]!, $periodDate: Date) {
        trees(idList: $treeIds) {
          id
          name
          legNames
          nodes(nodeIds: $nodeIds, date: $periodDate) {
            nodeId
            totalChildNodes
            customer{
              id
              fullName
              enrollDate
              profileImage
              status {
                id,
                name,
                statusClass
              }
              phoneNumbers {
                type
                number
              }
              emailAddress
              customerType {
                id
                name
              }
              cards(idList: $cardIds, date: $periodDate){
                name
                values {
                  value
                  valueName
                  valueId
                }
              }
              widgets {
                id
                name
                title
                description
                type
                showDatePicker
                headerColor
                headerTextColor
                headerAlignment
                backgroundColor
                textColor
                borderColor
                css
                settings
                panes {
                  imageUrl
                  title
                  text
                  description
                  values {
                    text
                    value
                  }
                }
              }
            }
          }
        }
      }`, variables: { nodeIds: [rootId], treeIds: [treeId], cardIds: [`Tree-${treeId}`], periodDate: periodDate }
    };

    Post(dataUrl, data, (nodeData) => {
      parent.removeChild(loading);
      var baseNode = nodeData.data.trees[0];
      var hasLegs = false
      var legNames = nodeData.data.trees[0].legNames;

      if (legNames != undefined) {
        hasLegs = true;
      }

      for (const node of baseNode.nodes) {
        var expander = addChild(parent, { customer: node.customer, nodeId: node.nodeId, legs: legNames, card: node.customer?.cards[0], childArr: (node.totalChildNodes > 0 || hasLegs) ? [] : null });
        if (expander) {
          handleExpand(expander);
        }
      }

      ctx.translate((canvasBox.clientWidth / 2) - 150, 0);
      redraw();

    }, (error) => {
      alert(error);
    });
  }

  function addNodes(parent, expanding) {
    var startPos = 0;
    if (expanding) startPos = expanding.offsetLeft;

    let loading = BuildLoading(parent);
    let nodeId = parent.getAttribute('data-nodeId') ?? rootId;

    let data = {
      query: `query ($nodeIds: [String]!, $treeIds: [String]!, $cardIds: [String]!, $periodDate: Date) {
        trees(idList: $treeIds) {
          id
          name
          legNames
          nodes(nodeIds: $nodeIds, date: $periodDate) {
            nodeId
            nodes (levels: 1)
            {
              nodeId
              uplineLeg
              totalChildNodes
              customer {
                id
                fullName
                enrollDate
                profileImage
                status {
                  id,
                  name,
                  statusClass
                }
                phoneNumbers {
                  type
                  number
                }
                emailAddress
                customerType {
                  id
                  name
                }
                cards(idList: $cardIds, date: $periodDate) {
                  name
                  values {
                    value
                    valueName
                    valueId
                  }
                }
                widgets {
                  id
                  name
                  title
                  description
                  type
                  showDatePicker
                  headerColor
                  headerTextColor
                  headerAlignment
                  backgroundColor
                  textColor
                  borderColor
                  css
                  settings
                  panes {
                    imageUrl
                    title
                    text
                    description
                    values {
                      text
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }`, variables: { treeIds: [treeId], nodeIds: [nodeId], cardIds: [`Tree-${treeId}`], periodDate: periodDate }
    };

    Post(dataUrl, data, (nodeData) => {
      parent.removeChild(loading);
      var baseNode = nodeData.data.trees[0].nodes[0];

      if (nodeData.data.trees[0].legNames != undefined) {
        let legs = nodeData.data.trees[0].legNames.map(x => x.toLowerCase());
        const fruits = new Map([]);

        for (const node of baseNode.nodes) {
          fruits.set(node.uplineLeg.toLowerCase(), node)
        }

        for (const leg of legs) {
          if (fruits.has(leg)) {
            let node = fruits.get(leg);
            addChild(parent, { customer: node.customer, uplineId: nodeId, uplineLeg: node.uplineLeg, nodeId: node.nodeId, legs: legs, card: node.customer?.cards[0], childArr: [] });
          } else {
            addChild(parent, { customer: undefined, uplineId: nodeId, uplineLeg: leg, nodeId: undefined, legs: legs, card: undefined, childArr: null });
          }
        }

        fruits.forEach(function (node, key) {
          if (!legs.includes(key.toLowerCase())) {
            addChild(parent, { customer: node.customer, uplineId: nodeId, uplineLeg: node.uplineLeg, nodeId: node.nodeId, legs: legs, card: node.customer?.cards[0], childArr: [] });
          }
        })
      } else {
        for (const node of baseNode.nodes) {
          addChild(parent, { customer: node.customer, uplineId: nodeId, uplineLeg: node.uplineLeg, nodeId: node.nodeId, card: node.customer?.cards[0], childArr: node.totalChildNodes > 0 ? [] : null });
        }
      }

      if (expanding) {
        var endPos = expanding.offsetLeft;
        ctx.translate(startPos - endPos, 0);
        redraw();
      }
    }, (error) => {
      alert(error);
    });
  }

  function handleExpand(expandDiv) {
    var target = expandDiv.parentElement.parentElement;
    var startPos = expandDiv.offsetLeft;

    for (const child of target.children) {
      if (child.tagName == 'UL') {
        if (child.style.display === "none") {
          if (child.children.length == 0) addNodes(child, expandDiv);
          child.style.display = "block";
          expandDiv.classList.remove("collaped");
          expandDiv.classList.add("expanded");
        } else {
          child.style.display = "none";
          expandDiv.classList.remove("expanded");
          expandDiv.classList.add("collaped");
        }
      }
    }

    var endPos = expandDiv.offsetLeft;
    ctx.translate(startPos - endPos, 0);
    redraw();
  }

  function addChild(ul, node) {
    var result = null;
    if (node.uplineLeg?.toLowerCase() == "holding tank") return;
    if (!node || (!node.customer && !node.legs)) return;
    var template = renderToStaticMarkup(getTemplate(node));
    var li = document.createElement('li');
    var nodeDiv = document.createElement('div');
    nodeDiv.classList.add("node-host");
    nodeDiv.setAttribute('data-nodeId', node.nodeId);
    nodeDiv.setAttribute('data-uplineLeg', node.uplineLeg);
    nodeDiv.setAttribute('data-uplineId', node.uplineId);
    nodeDiv.style.left = 0;
    nodeDiv.style.top = 0;
    nodeDiv.innerHTML = template;
    li.appendChild(nodeDiv);
    nodeDiv.addEventListener("click", function (e) {
      if (!dragged) {

        if (activeNode) {
          activeNode.classList.remove("active");
          activeNode = undefined;
        }

        var target = e.currentTarget;
        target.classList.add("active");
        activeNode = target;
        var dataNodeId = target.getAttribute('data-nodeId');

        selectNode(
          {
            id: dataNodeId == 'undefined' ? undefined : dataNodeId,
            uplineLeg: target.getAttribute('data-uplineLeg'),
            uplineId: target.getAttribute('data-uplineId')
          });
      }
    });


    if (node.childArr) {
      var expandDiv = document.createElement('div');
      expandDiv.classList.add("node-expand");
      expandDiv.classList.add("collaped");
      expandDiv.innerHTML = '<div class="expandDown"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-down" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 9l6 6l6 -6"></path></svg></div><div class="expandUp"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-up" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 15l6 -6l6 6"></path></svg></div>'
      nodeDiv.appendChild(expandDiv);
      expandDiv.addEventListener("click", function (e) {
        if (!dragged) {
          handleExpand(e.currentTarget);
          e.stopPropagation();
        }
      });


      var ul1 = document.createElement('ul');
      ul1.setAttribute('data-nodeId', node.nodeId);
      li.appendChild(ul1);
      ul1.style.display = "none";

      if (node.childArr.length !== 0) {
        for (const child of node.childArr) {
          addChild(ul1, child);
        }
      }
      result = expandDiv;
    }

    ul.appendChild(li);
    return result;
  }

  function trackTransforms() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function () { return xform; };

    var savedTransforms = [];
    //var save = ctx.save;
    ctx.save = function () {
      savedTransforms.push(xform.translate(0, 0));
      //return save.call(ctx);
    };
    //var restore = ctx.restore;
    ctx.restore = function () {
      xform = savedTransforms.pop();
      //return restore.call(ctx);
    };

    //var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
      xform = xform.scaleNonUniform(sx, sy);
      //return scale.call(ctx, sx, sy);
    };
    //var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
      xform = xform.rotate(radians * 180 / Math.PI);
      //return rotate.call(ctx, radians);
    };
    //var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
      xform = xform.translate(dx, dy);
      //return translate.call(ctx, dx, dy);
    };
    //var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
      var m2 = svg.createSVGMatrix();
      m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      xform = xform.multiply(m2);
      //return transform.call(ctx, a, b, c, d, e, f);
    };
    //var setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      //return setTransform.call(ctx, a, b, c, d, e, f);
    };
    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(xform.inverse());
    }
  }
}

export { treeBorad };
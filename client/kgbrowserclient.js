var cy;
var detail = document.getElementById('detail');
var eulerLayoutOptions =  {
	name: 'euler',
  springLength: edge => 240,
	randomize: true,
	animate: true
};
var dagreLayoutOptions =  {
	name: 'dagre'
};
var concentricLayoutOptions = {
  name: 'concentric'  
}
var colaLayoutOptions = {
  name: 'cola',
  maxSimulationTime: 30000,
  fit: false,
  infinite: false,
  handleDisconnected: false  
};
var coseBilkentLayoutOptions = {
  name: 'cose-bilkent'  
};
var layoutOptions;
var configIRI ;
var stylesheetIRI ;
var startResourceIRI ;
var startViewIRI ;
var styles = [];
var layout ;

$('#startForm').submit(function(e) {

  configIRI = $('#startForm input[name=config]').val();
  startResourceIRI = $('#startForm input[name=resource]').val();
  stylesheetIRI = $('#startForm input[name=stylesheet]').val();
   
  if(configIRI && startResourceIRI && stylesheetIRI)  {
    let nodeViewSetsPromise = $.ajax({
      url: 'http://localhost:3000/view-sets?config='+ configIRI + '&resource=' + startResourceIRI,
      type: 'GET',
      dataType: 'json'
    });
    nodeViewSetsPromise.then(function() {
      startViewIRI = nodeViewSetsPromise.responseJSON.viewSets[0].defaultView;
      if(!cy)  {
        initCy();
      } else {
        preview(startViewIRI, startResourceIRI);
      }
    });
  }
  
  e.preventDefault();

});

$('#startForm select[name=layout]').on('change', function()  {
  if(layout)  {
    layout.stop();
  }
  setLayoutOptions();
  layout.run();
});

$('#export').on('click', function()  {
  console.log(cy.json());
});

$('#import').on('click', function()  {
  cy.json(JSON.parse($('#startForm input[name=jsonToImport]').val())); 
});

$('#showpng').on('click', function()  {
  var png = cy.png({'full': true, 'scale': 2});
  $('#graphimage').attr('src', png);
  $('#pngexport').css('display', 'block'); 
});

$('#hidepng').on('click', function()  {
  $('#pngexport').css('display', 'none'); 
});

$('#startForm select[name=predefined]').on('change', function()  {
  
  switch ($('#startForm select[name=predefined]').val())  {
    case "rpp":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/rpp");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/rpp/style-sheet");
      $('#startForm input[name=resource]').val("https://rpp-opendata.egon.gov.cz/odrpp/zdroj/agenda/A116");
      break;
    case "psp":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/psp");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/psp/style-sheet");
      $('#startForm input[name=resource]').val("https://psp.opendata.cz/zdroj/osoba/5914");
      break;
    case "ssp":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/sgov");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/sgov/style-sheet");
      $('#startForm input[name=resource]').val("https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/orgán-veřejné-moci");
      break;
    case "ssp-skos":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/sgov-skos");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/sgov-skos/style-sheet");
      $('#startForm input[name=resource]').val("https://slovník.gov.cz/základní/glosář");
      break;
    case "wda":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/wikidata/animals");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/wikidata/animals/style-sheet");
      $('#startForm input[name=resource]').val("http://www.wikidata.org/entity/Q135022");
      break;  
    case "nkod":
      $('#startForm input[name=config]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/nkod");
      $('#startForm input[name=stylesheet]').val("https://linked.opendata.cz/resource/knowledge-graph-browser/nkod/style-sheet");
      $('#startForm input[name=resource]').val("https://data.gov.cz/zdroj/katalog/NKOD");
  } 
});

function setLayoutOptions() {
  const layoutName = $('#startForm select[name=layout]').val();
  switch(layoutName)  {
    case "euler":
      layoutOptions = eulerLayoutOptions;
      break;
    case "dagre":
      layoutOptions = dagreLayoutOptions;
      break;
    case "concentric":
      layoutOptions = concentricLayoutOptions;
      break;
    case "cola":
      layoutOptions = colaLayoutOptions;
      break;
    case "cose-bilkent":
      layoutOptions = coseBilkentLayoutOptions;
      break;
  }
  layout = cy.layout(layoutOptions);
}

function initCy( then ) {
  
  configIRI = $('#startForm input[name=config]').val();
  
  let stylesP = $.ajax({
    //url: 'http://localhost:3000/stylesheet?stylesheet=https://linked.opendata.cz/resource/knowledge-graph-browser/rpp/style-sheet',
    // url: './data.json',
    url: 'http://localhost:3000/stylesheet?stylesheet=' + stylesheetIRI,
    type: 'GET',
    dataType: 'json'
  });
  
  stylesP.then(function() {
    
    stylesP.responseJSON.styles.forEach(function(style) {
      styles.push({
        selector: style.selector,
        style: style.properties
      });
    });    
    
    cy = cytoscape({

      container: document.getElementById('cy'), // container to render in
      
      style: styles,
    
      elements: [],
      
      wheelSensitivity: 0.5
                                                    
    });
    
    setLayoutOptions();
    
    var doubleClickDelayMs = 350;
    var previousTapStamp = 0;

    cy.on('taphold', 'node', function(e) {
      let node = e.target;
      if(node && node.isNode() && node.locked()) {
        node.unlock();
        if(layout)  {
          layout.stop();
          layout.run();
        }
      }
    });
    
    cy.on('tap', 'node', function(e) {
      let currentTapStamp = e.timeStamp;
      let msFromLastTap = currentTapStamp - previousTapStamp;
      previousTapStamp = currentTapStamp;
      let node = e.target;
      let nodeIRI = node.data('id');
      
      if(node.data('views'))  {
        let viewIRI;
        for(let i in node.data('views')) {
          let view = node.data('views')[i];
          if(view.isSelected)  {
            viewIRI = view.iri;
            break;
          }
        }
        if (msFromLastTap < doubleClickDelayMs) {
          expand(viewIRI, node);
        } else {
          showDetail(viewIRI, node);
        }
      } else {
        let nodeViewSetsPromise = $.ajax({
          url: 'http://localhost:3000/view-sets?config='+ configIRI + '&resource=' + nodeIRI,
          type: 'GET',
          dataType: 'json'
        });    
        if (msFromLastTap < doubleClickDelayMs) {
          nodeViewSetsPromise.then(function() {
            let viewIRI = nodeViewSetsPromise.responseJSON.viewSets[0].defaultView;
            expand(viewIRI, node);
          });
        } else {
          nodeViewSetsPromise.then(function() {
            let viewIRI = nodeViewSetsPromise.responseJSON.viewSets[0].defaultView;
            showDetail(viewIRI, node);
          });
        }
      }
    });


    cy.on('cxttap', function(evt){
      let node = evt.target;
      console.log('ctxtap');
      if(node && node.isNode()) {
        cy.remove(node);
        if(layout)  {
          layout.stop();
          layout.run();
        }
      }
    });
    
    cy.on('dragfree', 'node', function(evt){
      let node = evt.target;
      if(node && node.isNode()) {
        node.lock();
        if(layout)  {
          layout.stop();
          layout.run();
        }
      }
    });
    
    /*cy.on('position', 'node', function(evt){
      let node = evt.target;
      if(node && node.isNode() && node.data('id') == 'https://rpp-opendata.egon.gov.cz/odrpp/zdroj/činnost/A1081/CR6229') {
        console.log("POSITION: " + node.position('x') + "," + node.position('y'));  
      }
    });*/


    /*cy.on('layoutstart', function(evt){
      console.log("LAYOUT START");
    });*/
    
    /*cy.on('layoutstop', function(evt){
      console.log("LAYOUT STOP");
    });*/

    preview(startViewIRI, startResourceIRI);    
  });
  
}

function preview(view, resource) {

  console.log('PREVIEW: http://localhost:3000/preview?view='+ view + '&resource=' + resource);
  let graphP = $.ajax({
    url: 'http://localhost:3000/preview?view='+ view + '&resource=' + resource,
    type: 'GET',
    dataType: 'json'
  });
  
  graphP.then(function()  {
    let node = graphP.responseJSON.nodes[0];
    cy.add({
      group: 'nodes',
      data: {
        id: node.iri,
        label: node.label,
        fullLabel: node.label,
        type: node.type 
      },
      classes: node.classes
    });
    if(layout)  {
      layout.stop();
    }
    layout = cy.layout(layoutOptions);
    layout.run();
  });
}

function showDetail(view, node) {

  let resource = node.data('id');
  
  console.log('DETAIL: http://localhost:3000/detail?view='+ view + '&resource=' + resource);
  let graphP = $.ajax({
    url: 'http://localhost:3000/detail?view='+ view + '&resource=' + resource,
    type: 'GET',
    dataType: 'json'
  });
  
  graphP.then(function()  {
    let detailJson = graphP.responseJSON.nodes[0];
    let typesJson = graphP.responseJSON.types;
    let typesMap = new Map();    
    for(let i in typesJson) {
      typesMap.set(typesJson[i].iri, typesJson[i]);
    }

    let html = "<div><a href=\"" + detailJson.iri + "\">" + node.data('fullLabel') + "</a></div>"; 
    
    html += "<table>";
    for(let property in detailJson.data)  {
      let data = detailJson.data[property];
      let htmlValue = data;
      if(data.endsWith(".jpg") || data.endsWith(".jpeg") || data.endsWith(".png") || data.endsWith(".gif")) {
        htmlValue = "<div style='width: 60%'><img style='max-width: 100%' src='" + data +  "' /></div>";
      } 
      let propertyJson = typesMap.get(property);
      if(propertyJson)  {
        html += "<tr><td><a href=\"" + property + "\">" + propertyJson.label + "</a></td><td>" + htmlValue + "</td></tr>";
      } else {
        html += "<tr><td>" + property + "</td><td>" + htmlValue + "</td></tr>";
      }  
    }
    html += "</table>";
    detail.innerHTML = html;
    
    if(!node.data('views')) {
      
      let nodeViewSetsPromise = $.ajax({
        url: 'http://localhost:3000/view-sets?config='+ configIRI + '&resource=' + resource,
        type: 'GET',
        dataType: 'json'
      });
      nodeViewSetsPromise.then(function() {
        let viewsMap = new Map();
        let nodeViews = [];
        for(let i in nodeViewSetsPromise.responseJSON.views) {
          viewsMap.set(nodeViewSetsPromise.responseJSON.views[i].iri, nodeViewSetsPromise.responseJSON.views[i]);
        }
        for(let i in nodeViewSetsPromise.responseJSON.viewSets) {
          for(let j in nodeViewSetsPromise.responseJSON.viewSets[i].views) {
            let view = viewsMap.get(nodeViewSetsPromise.responseJSON.viewSets[i].views[j]);
            view.isSelected = (view.iri == nodeViewSetsPromise.responseJSON.viewSets[0].defaultView);
            nodeViews.push(view);
          }
        }
        node.data('views', nodeViews);
        html += showDetailViewHTML(node);
        detail.innerHTML = html;
      });
    } else {
      html += showDetailViewHTML(node);
      detail.innerHTML = html;
    }

  });
}

function showDetailViewHTML(node) {
  let html = "<p>Available views:</p><table>";
  for(let i in node.data('views')) {
    let view = node.data('views')[i];
    if(view.isSelected) {
      html += "<tr><td><input type='radio' name='view' value='" + view.iri + "' checked='checked' onchange='switchView(\"" + node.id() + "\", this.value)' /></td><td>" + view.label + "</td></tr>";
    } else {
      html += "<tr><td><input type='radio' name='view' value='" + view.iri + "' onchange='switchView(\"" + node.id() + "\", this.value)' /></td><td>" + view.label + "</td></tr>";
    }
  }
  html += "</table>";
  return html;
}

function switchView(nodeIRI, viewIRI)  {
  let node = cy.getElementById(nodeIRI);
  for(let i in node.data('views')) {
    let view = node.data('views')[i];
    view.isSelected = false;
    if(view.iri == viewIRI)  {
      view.isSelected = true;
    }
  }
} 

function expand(view, node) {

  let resource = node.data('id');

  console.log('EXPAND: http://localhost:3000/expand?view='+ view + '&resource=' + resource);
  let graphP = $.ajax({
    url: 'http://localhost:3000/expand?view='+ view + '&resource=' + resource,
    type: 'GET',
    dataType: 'json'
  });
  
  let elements = [];
  
  Promise.all([ graphP ]).then(function() {
    console.log(graphP.responseJSON);
    graphP.responseJSON.nodes.forEach(function(nodeJSON) {
      let nodeElement = {
        group: 'nodes',
        data: {
          id: nodeJSON.iri,
          label: nodeJSON.label,
          fullLabel: nodeJSON.label,
          type: nodeJSON.type
        },
        classes: nodeJSON.classes,
        position: {
          x: node.position('x')+50,
          y: node.position('y')+50
        }
      }
      elements.push(nodeElement);
    });
  }).then(function()  {
    graphP.responseJSON.edges.forEach(function(edge) {
      let label;
      for(let i = 0; i < graphP.responseJSON.types.length; i++) {
        if(graphP.responseJSON.types[i].iri==edge.type) {
          label = graphP.responseJSON.types[i].label ;
          break;
        }
      }
      elements.push({
        groups: 'edges',
        data: {
          source: edge.source,
          target: edge.target,
          label: label,
          fullLabel: label,
          type: edge.type
        },
        classes: edge.classes
      });
    });
  }).then(function()  {
    cy.add(elements);
    cy.style().fromJson(styles);
    if(layout)  {
      layout.stop();
    }
    layout = cy.layout(layoutOptions);
    layout.run();
  });
}
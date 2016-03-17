$(document).ready(function() {
  // load templates
  $('.tables').load('templates/tables.html');

  var stateIdMapData;
  var statePrimariesData;

  var width = 900,
      height = 450,
      active = d3.select(null);

  var projection = d3.geo.albersUsa()
                    .scale(1000)
                    .translate([width / 2, height / 2]);

  var path = d3.geo.path()
              .projection(projection);

  var svg = d3.select('.chart').append('svg')
              .attr('width', width)
              .attr('height', height);

  svg.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', height)
      .on('click', reset);

  var g = svg.append('g')
            .style('stroke-width', '1.5px');

  d3.json('/data/us_states.json', function(error, data) {
    if (error) throw error;

    g.selectAll('path')
        .data(topojson.feature(data, data.objects.states).features)
        .enter().append('path')
          .attr('d', path)
          .attr('class', 'state')
          .on('click', clicked);

    g.append('path')
        .datum(topojson.mesh(data, data.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'mesh')
        .attr('d', path);
  });

  d3.json('/data/state_primaries.json', function(error, data) {
    if (error) throw error;
    statePrimariesData = data;
  });

  d3.csv('/data/state_id_mappings.csv', function(error, data) {
    if (error) throw error;
    stateIdMapData = data;
  });

  function clicked(d) {
    console.log('clicked called');

    if (active.node() === this) {
      return reset();
    }

    active.classed('active', false);
    active = d3.select(this).classed('active', true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
        .duration(750)
        .style('stroke-width', 1.5 / scale + 'px')
        .attr('transform', 'translate(' + translate + ')scale(' + scale + ')');

    findStateData(d);
  }

  function reset() {
    console.log('reset called');

    active.classed('active', false);
    active = d3.select(null);

    g.transition()
        .duration(750)
        .style('stroke-width', '1.5px')
        .attr('transform', '');
  }

  function findStateData(d) {
    var stateObj = stateIdMapData.find(function(state) {
      // state.id is a String so use '==' instead of '==='
      return d.id == state.id; 
    });

    if (stateObj === undefined) {
      console.log('ERROR MATCHING STATE ID TO OBJECT');
    } else {
      var statePrimaryObj = statePrimariesData.find(function(state) {
        return state.code === stateObj.code;
      });

      if (statePrimaryObj === undefined) {
        console.log('ERROR MATCHING STATE CODE TO OBJECT');
      }
      populateTables(statePrimaryObj);
    }
  }

  function populateTables(d) {
    var tables = $('.table');
    tables.each(function() { // jQuery element for each loop
      updateCandidatesInfo(this, d);
    }); 
  }

  function updateCandidatesInfo(table, d) {
    var candidates = d[table.id];
    candidates.forEach(function(cand) { // js array element for each loop
      var fullNameArr = cand.name.split(' ');
      var lastName = fullNameArr[fullNameArr.length - 1];
      var tableRow = $('#'.concat(lastName.toLowerCase()));
      updateRowInfo(tableRow, cand);
    });

  }

  function updateRowInfo(tableRow, cand) {
    // start here
    var children = tableRow.children();
    children.each(function() { // jQuery element for each loop
      if (cand[this.className]) {
        this.innerHTML = cand[this.className];
      }
    });
  }

  // handle errors tmrw

});
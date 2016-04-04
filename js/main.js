$(document).ready(function() {
  // setup and global vars
  $('#tables-wrapper').load('templates/tables.html');
  var stateIdMapData;
  var statePrimariesData;
  var dataWrapper = $('.data-wrapper').hide();
  var dataError = $('.data-error').hide();

  // us states chart properties
  var statesChartWidth = 960,
      statesChartHeight = 500,
      stateActive = d3.select(null);

  var projection = d3.geo.albersUsa()
                     .scale(1000)
                     .translate([statesChartWidth / 2, statesChartHeight / 2]);

  var statesChartPath = d3.geo.path()
                          .projection(projection);

  var statesChartSvg = d3.select('#us-states-chart').append('svg')
                         .attr('width', statesChartWidth)
                         .attr('height', statesChartHeight);

  statesChartSvg.append('rect')
                .attr('class', 'background')
                .attr('width', statesChartWidth)
                .attr('height', statesChartHeight)
                .on('click', reset);

  var statesChartG = statesChartSvg.append('g')
                        .style('stroke-width', '1.5px');

  var pieChartWidth = 500;
  var pieChartHeight = 500;
  var pieChartRadius = Math.min(pieChartWidth, pieChartHeight) / 2;
  var pieChartsDrawn = false;
  var pieChartRepPath, pieChartDemPath;
  var pie = d3.layout.pie()
                     .value(function(d) { return d.percentage_total_votes; })
                     .sort(null);
  var pieChartColorMap = {"Cruz": "red", "Kasich": "yellow", "Rubio": "green", 
                          "Trump": "blue", "Clinton": "purple", "Sanders": "orange"};
  /*
  var pie = d3.layout.pie()
      .value(function(d) { return d.apples; })
      .sort(null);
  */

  var pieChartArc = d3.svg.arc()
                      .innerRadius(pieChartRadius - 100)
                      .outerRadius(pieChartRadius - 20);

  var pieChartRepSvg = d3.select('#rep-pie-chart').append('svg')
                         .attr('width', pieChartWidth)
                         .attr('height', pieChartHeight)
                         .append('g')
                          .attr('transform', 'translate(' + pieChartWidth / 2 + ',' + pieChartHeight / 2 + ')');

  var pieChartDemSvg = d3.select('#dem-pie-chart').append('svg')
                         .attr('width', pieChartWidth)
                         .attr('height', pieChartHeight)
                         .append('g')
                          .attr('transform', 'translate(' + pieChartWidth / 2 + ',' + pieChartHeight / 2 + ')');


  d3.json('/data/us_states.json', function(error, data) {
    if (error) throw error;

    statesChartG.selectAll('path')
        .data(topojson.feature(data, data.objects.states).features)
        .enter().append('path')
          .attr('d', statesChartPath)
          .attr('class', 'state')
          .on('click', stateClicked);

    statesChartG.append('path')
        .datum(topojson.mesh(data, data.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'mesh')
        .attr('d', statesChartPath);
  });

  d3.json('/data/state_primaries.json', function(error, data) {
    if (error) throw error;
    statePrimariesData = data;
  });

  d3.csv('/data/state_id_mappings.csv', function(error, data) {
    if (error) throw error;
    stateIdMapData = data;
  });
  
  function stateClicked(d) {
    if (stateActive.node() === this) {
      return reset();
    }
    stateActive.classed('active', false);
    stateActive = d3.select(this).classed('active', true);

    var bounds = statesChartPath.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / statesChartWidth, dy / statesChartHeight),
        translate = [statesChartWidth / 2 - scale * x, statesChartHeight / 2 - scale * y];

    statesChartG.transition()
                .duration(750)
                .style('stroke-width', 1.5 / scale + 'px')
                .attr('transform', 'translate(' + translate + ')scale(' + scale + ')');

    if (findStateData(d)) {
      dataError.hide();
      dataWrapper.show();
    } else {
      dataWrapper.hide();
      dataError.show();
    }
  }

  function reset() {
    stateActive.classed('active', false);
    stateActive = d3.select(null);

    statesChartG.transition()
                .duration(750)
                .style('stroke-width', '1.5px')
                .attr('transform', '');

    dataWrapper.hide();
    dataError.hide();
  }

  function findStateData(d) {
    var stateObj = stateIdMapData.find(function(state) {
      // state.id is a String so use '==' instead of '==='
      return d.id == state.id; 
    });

    if (stateObj === undefined) {
      console.log('ERROR MATCHING STATE ID TO OBJECT');
      return false;
    } 
    else {
      var statePrimaryObj = statePrimariesData.find(function(state) {
        return state.code === stateObj.code;
      });

      if (statePrimaryObj === undefined) {
        console.log('ERROR MATCHING STATE CODE TO OBJECT');
        return false;
      } 
      else {
        populateTables(statePrimaryObj);
        populatePieCharts(statePrimaryObj)
        return true;
      }
    }
  }

  /*
      Helper functions to populate the state pie chart
  */
  function populatePieCharts(d) {
    if(pieChartsDrawn) {
      updatePieChart(d.rep_candidates, true);
      updatePieChart(d.dem_candidates, false);
    } 
    else {
      drawPieChart(d.rep_candidates, true);
      drawPieChart(d.dem_candidates, false);
    }
  }

  function drawPieChart(d, isRepChart) {
    pieChartsDrawn = true;
    
    if (isRepChart) {
      pieChartRepPath = pieChartRepSvg.datum(d).selectAll('path')
                          .data(pie)
                          .enter().append('path')
                            .attr('fill', function(d) { return pieChartColorMap[lastName(d.data.name)]; })
                            .attr('d', pieChartArc)
                            .each(function(d) { this._current = d; }); // store the initial angles
    } 
    else {
      pieChartDemPath = pieChartDemSvg.datum(d).selectAll('path')
                          .data(pie)
                          .enter().append('path')
                            .attr('fill', function(d) { return pieChartColorMap[lastName(d.data.name)]; })
                            .attr('d', pieChartArc)
                            .each(function(d) { this._current = d; }); // store the initial angles
    }
  }

  function updatePieChart(d, isRepChart) {
    //var value = this.value;
    //clearTimeout(timeout);
    if (isRepChart) {
      pie.value(function(d) { return d.percentage_total_votes; }); // change the value function
      pieChartRepPath = pieChartRepPath.data(pie); // compute the new angles
      pieChartRepPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
    } 
    else {
      pie.value(function(d) { return d.percentage_total_votes; }); // change the value function
      pieChartDemPath = pieChartDemPath.data(pie); // compute the new angles
      pieChartDemPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
    }
  }

  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(angle) {
    var i = d3.interpolate(this._current, angle);
    this._current = i(0);
    return function(t) { return pieChartArc(i(t)); };
  }

  function lastName(name) {
    var splitName = name.split(' ');
    if (splitName.length === 0) { return ''; } 
    else { return splitName[splitName.length - 1]; }
  }

  /*
      Helper functions to populate the state tables
  */
  function populateTables(d) {
    var tables = $('table');
    tables.each(function() { 
      updateCandidatesInfo(this, d);
    }); 
  }

  function updateCandidatesInfo(table, d) {
    var candidates = d[table.id];
    candidates.forEach(function(cand) {   // js array obj for each loop
      var fullNameArr = cand.name.split(' ');
      var lastName = fullNameArr[fullNameArr.length - 1];
      var tableRow = $('#'.concat(lastName.toLowerCase()));
      updateRowInfo(tableRow, cand);
    });

  }

  function updateRowInfo(tableRow, cand) {
    // start here
    var children = tableRow.children();
    children.each(function() {    // jQuery obj for each loop
      if (cand.hasOwnProperty(this.className)) {
        //this.innerHTML = cand[this.className];
        $(this).html(cand[this.className]);
      }
    });
  }

});
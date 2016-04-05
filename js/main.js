$(document).ready(function() {
  // setup and global vars
  $('.tables-wrapper').load('templates/tables.html');
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

  // state pie chart properties                     
  var pieChartWidth = 500;
  var pieChartHeight = 500;
  var pieChartRadius = Math.min(pieChartWidth, pieChartHeight) / 2;
  var pieChartsDrawn = false;
  var pieChartRepPath, pieChartDemPath;
  var pie = d3.layout.pie()
                     .value(function(d) { 
                        if (isNaN(d.percentage_total_votes)) { return 0; }
                        else { return +d.percentage_total_votes; } 
                     })
                     .sort(null);
  var colorMap = {'Cruz': 'red', 'Kasich': 'yellow', 'Rubio': 'green', 
                          'Trump': 'blue', 'Clinton': 'purple', 'Sanders': 'orange'};

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

  // state bar chart properties                       
  var barChartOuterWidth = 500; 
  var barChartOuterHeight = 500;
  var barChartMargin = { top: 20, right: 30, bottom: 30, left: 40 };
  var barChartWidth  = barChartOuterWidth - barChartMargin.left - barChartMargin.right;
  var barChartHeight = barChartOuterHeight - barChartMargin.top - barChartMargin.bottom;
   
  var repBarChartXScale = d3.scale.ordinal()
                            .rangeRoundBands([0, barChartWidth], .1);
  var repBarChartYScale = d3.scale.linear()
                            .range([barChartHeight, 0]);
  var demBarChartXScale = d3.scale.ordinal()
                            .rangeRoundBands([0, barChartWidth], .1);
  var demBarChartYScale = d3.scale.linear()
                            .range([barChartHeight, 0]);
   
  var repBarChartXAxis = d3.svg.axis()
                           .scale(repBarChartXScale)
                           .orient('bottom');
  var repBarChartYAxis = d3.svg.axis()
                           .scale(repBarChartYScale)
                           .orient('left')
                           .ticks(10);
  var demBarChartXAxis = d3.svg.axis()
                           .scale(demBarChartXScale)
                           .orient('bottom');
  var demBarChartYAxis = d3.svg.axis()
                           .scale(demBarChartYScale)
                           .orient('left')
                           .ticks(10);
  
  var repBarChart = d3.select('#rep-bar-chart')
                      .append('svg')
                        .attr('width', barChartOuterWidth)
                        .attr('height', barChartOuterHeight)
                      .append('g')
                        .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

  var demBarChart = d3.select('#dem-bar-chart')
                      .append('svg')
                        .attr('width', barChartOuterWidth)
                        .attr('height', barChartOuterHeight)
                      .append('g')
                        .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');
  
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
        populatePieCharts(statePrimaryObj);
        populateBarCharts(statePrimaryObj);
        return true;
      }
    }
  }

  /*
      Helper functions to populate the state bar charts
  */
  function populateBarCharts(d) {
    repBarChartXScale.domain(d.rep_candidates.map(function(cand) { return lastName(cand.name); }));
    repBarChartYScale.domain([0, d3.max(d.rep_candidates, function(cand) { return cand.votes; })]);
    demBarChartXScale.domain(d.dem_candidates.map(function(cand) { return lastName(cand.name); }));
    demBarChartYScale.domain([0, d3.max(d.dem_candidates, function(cand) { return cand.votes; })]);
 
    repBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(repBarChartXAxis);

    demBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(demBarChartXAxis);
    
    repBarChart.select('.y.axis').remove();
    demBarChart.select('.y.axis').remove();

    repBarChart.append('g')
               .attr('class', 'y axis')
               .call(repBarChartYAxis)
               .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Frequency');

    demBarChart.append('g')
               .attr('class', 'y axis')
               .call(demBarChartYAxis)
               .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Frequency');
 
    var repBars = repBarChart.selectAll('.bar')
                             .data(d.rep_candidates, function(cand) { return lastName(cand.name); });
    var demBars = demBarChart.selectAll('.bar')
                             .data(d.dem_candidates, function(cand) { return lastName(cand.name); });

    // new data
    repBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return repBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return repBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - repBarChartYScale(cand.votes); })
           .attr('width', repBarChartXScale.rangeBand());
    demBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return demBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return demBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - demBarChartYScale(cand.votes); })
           .attr('width', demBarChartXScale.rangeBand());

    // remove data
    repBars.exit().remove();
    demBars.exit().remove();
    // update data
    repBars.transition()
           .duration(750)
            .attr('y', function(cand) { return repBarChartYScale(cand.votes); })
            .attr('height', function(cand) { return barChartHeight - repBarChartYScale(cand.votes); });
    demBars.transition()
           .duration(750)
            .attr('y', function(cand) { return demBarChartYScale(cand.votes); })
            .attr('height', function(cand) { return barChartHeight - demBarChartYScale(cand.votes); });
  }


  /*
      Helper functions to populate the state pie charts
  */
  function populatePieCharts(d) {
    if(pieChartsDrawn) {
      updatePieCharts(d);
    } 
    else {
      drawPieCharts(d);
    }
  }

  function drawPieCharts(d) {
    pieChartsDrawn = true;
    pieChartRepPath = pieChartRepSvg.datum(d.rep_candidates).selectAll('path')
                          .data(pie)
                          .enter().append('path')
                            .attr('fill', function(d) { return colorMap[lastName(d.data.name)]; })
                            .attr('d', pieChartArc)
                            .each(function(d) { this._current = d; }); // store the initial angles
    
    pieChartDemPath = pieChartDemSvg.datum(d.dem_candidates).selectAll('path')
                          .data(pie)
                          .enter().append('path')
                            .attr('fill', function(d) { return colorMap[lastName(d.data.name)]; })
                            .attr('d', pieChartArc)
                            .each(function(d) { this._current = d; }); // store the initial angles
  }

  function updatePieCharts(d) {
    // rep_candidates
    pieChartRepPath.data(pie(d.rep_candidates));
    pieChartRepPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
    // dem_candidates
    pieChartDemPath.data(pie(d.dem_candidates));
    pieChartDemPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
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
    var children = tableRow.children();
    children.each(function() {    // jQuery obj for each loop
      if (cand.hasOwnProperty(this.className)) {
        //this.innerHTML = cand[this.className];
        $(this).html(cand[this.className]);
      }
    });
  }

    // loading the actual data files
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

});
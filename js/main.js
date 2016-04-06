$(document).ready(function() {
  // setup and global vars
  d3.select(window).on('resize', resizeCharts);
  var stateIdMapData;
  var statePrimariesData;
  var usStatesData;
  var dataWrapper = $('.data-wrapper').hide();
  var dataError = $('.data-error').hide();
  var colorMap = {'Cruz': 'red', 'Kasich': 'yellow', 'Rubio': 'green', 
                          'Trump': 'blue', 'Clinton': 'purple', 'Sanders': 'orange'};
  var stateChartsDrawn = false;


  // us states chart properties
  var statesChartWidth = parseInt(d3.select('#us-states-chart').style('width'));
  var statesChartRatio = 0.5;
  var statesChartHeight = statesChartWidth * statesChartRatio;
  var stateActive = d3.select(null);

  var projection = d3.geo.albersUsa()
                     .scale(statesChartWidth)
                     .translate([statesChartWidth / 2, statesChartHeight / 2]);

  var statesChartPath = d3.geo.path().projection(projection);

  var statesChartSvg = d3.select('#us-states-chart').append('svg')
                         .attr('width', statesChartWidth)
                         .attr('height', statesChartHeight);

  statesChartSvg.append('rect')
                .attr('class', 'background')
                .attr('width', statesChartWidth)
                .attr('height', statesChartHeight)
                .on('click', reset);

  var statesChartG = statesChartSvg.append('g').style('stroke-width', '1.5px');

  function resizeStatesChart() {
    statesChartWidth = parseInt(d3.select('#us-states-chart').style('width'));
    statesChartHeight = statesChartWidth * statesChartRatio;
    projection.translate([statesChartWidth / 2, statesChartHeight / 2]).scale(statesChartWidth);
    statesChartSvg.style('width', statesChartWidth + 'px').style('height', statesChartHeight + 'px');
    statesChartSvg.select('rect').style('width', statesChartWidth + 'px').style('height', statesChartHeight + 'px');
    statesChartG.selectAll('.state').attr('d', statesChartPath);
    statesChartG.selectAll('path').remove();
    drawStatePaths(usStatesData);
  }

  function resizePieCharts() {
    console.log('how do i resize pie charts');
  }

  // state pie chart properties
  var pieChartWidth =  500;
  var pieChartHeight = 500;
  var pieChartRadius = Math.min(pieChartWidth, pieChartHeight) / 2;
  var pieChartRepPath, pieChartDemPath;
  var pie = d3.layout.pie()
                     .value(function(d) { 
                        if (isNaN(d.percentage_total_votes)) return 0;
                        else return d.percentage_total_votes;
                     })
                     .sort(null);

  var pieChartArc = d3.svg.arc().innerRadius(pieChartRadius - 100).outerRadius(pieChartRadius - 20);

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
  var barChartMargin = { top: 20, right: 30, bottom: 30, left: 60 };
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
  
  // functions based on user actions
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
      dataError.fadeOut();
      dataWrapper.fadeIn();
    } else {
      dataWrapper.fadeOut();
      dataError.fadeIn();
    }
  }

  function reset() {
    stateActive.classed('active', false);
    stateActive = d3.select(null);

    statesChartG.transition()
                .duration(750)
                .style('stroke-width', '1.5px')
                .attr('transform', '');

    dataWrapper.fadeOut();
    dataError.fadeOut();
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
      Populates state bar chart with data
  */
  function populateBarCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#rep-bar-chart').css('visibility', 'hidden').css('height', '0');
    } 
    else {
      repBarChartXScale.domain(d.rep_candidates.map(function(cand) { return lastName(cand.name); }));
      repBarChartYScale.domain([0, d3.max(d.rep_candidates, function(cand) { return cand.votes; })]);
      repBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(repBarChartXAxis);
      repBarChart.select('.y.axis').remove();
      repBarChart.append('g')
               .attr('class', 'y axis')
               .call(repBarChartYAxis)
               .append('text')
                .attr('x', -5)
                .attr('y', -15)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Votes');
      var repBars = repBarChart.selectAll('.bar').data(d.rep_candidates, function(cand) { return lastName(cand.name); });
      // new data appended
      repBars.enter().append('rect')
             .attr('class', 'bar')
             .attr('x', function(cand) { return repBarChartXScale(lastName(cand.name)); })
             .attr('y', function(cand) { return repBarChartYScale(cand.votes); })
             .attr('height', function(cand) { return barChartHeight - repBarChartYScale(cand.votes); })
             .attr('width', repBarChartXScale.rangeBand())
             .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; });
      // remove old data
      repBars.exit().remove();
      // update data bindings
      repBars.transition()
             .duration(750)
             .attr('y', function(cand) { return repBarChartYScale(cand.votes); })
             .attr('height', function(cand) { return barChartHeight - repBarChartYScale(cand.votes); })
      // show new bar chart
      $('#rep-bar-chart').css('visibility', 'visible').css('height', 'auto');
    }

    if (!validatePartiesData(d.dem_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#dem-bar-chart').css('visibility', 'hidden').css('height', '0');
    } 
    else {
      demBarChartXScale.domain(d.dem_candidates.map(function(cand) { return lastName(cand.name); }));
      demBarChartYScale.domain([0, d3.max(d.dem_candidates, function(cand) { return cand.votes; })]);
      demBarChart.append('g')
                 .attr('class', 'x axis')
                 .attr('transform', 'translate(0,' + barChartHeight + ')') 
                 .call(demBarChartXAxis);
      demBarChart.select('.y.axis').remove();
      demBarChart.append('g')
                 .attr('class', 'y axis')
                 .call(demBarChartYAxis)
                 .append('text')
                  .attr('x', -5)
                  .attr('y', -15)
                  .attr('dy', '.71em')
                  .style('text-anchor', 'end')
                  .text('Votes');
      var demBars = demBarChart.selectAll('.bar').data(d.dem_candidates, function(cand) { return lastName(cand.name); });
      // new data appended
      demBars.enter().append('rect')
             .attr('class', 'bar')
             .attr('x', function(cand) { return demBarChartXScale(lastName(cand.name)); })
             .attr('y', function(cand) { return demBarChartYScale(cand.votes); })
             .attr('height', function(cand) { return barChartHeight - demBarChartYScale(cand.votes); })
             .attr('width', demBarChartXScale.rangeBand())
             .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; });
      // remove old data
      demBars.exit().remove();
      // update data bindings
      demBars.transition()
             .duration(750)
             .attr('y', function(cand) { return demBarChartYScale(cand.votes); })
             .attr('height', function(cand) { return barChartHeight - demBarChartYScale(cand.votes); })
      // show new bar chart
      $('#dem-bar-chart').css('visibility', 'visible').css('height', 'auto');
    }
  }

  /*
      Populates state pie charts with data
  */
  function populatePieCharts(d) {
    if(stateChartsDrawn) {
      updatePieCharts(d);
    } 
    else {
      drawPieCharts(d);
    }
  }

  function drawPieCharts(d) {
    stateChartsDrawn = true;
    if (!validatePartiesData(d.rep_candidates)) {
      $('#rep-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    if (!validatePartiesData(d.dem_candidates)) {
      $('#dem-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    // necessary to set the variables to a DOM element
    // pie chart will not show up if data does not exist
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
    if (!validatePartiesData(d.rep_candidates)) {
      $('#rep-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    else {
      pieChartRepPath.data(pie(d.rep_candidates));
      pieChartRepPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
      $('#rep-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    if (!validatePartiesData(d.dem_candidates)) {
      $('#dem-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    else {
      pieChartDemPath.data(pie(d.dem_candidates));
      pieChartDemPath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs
      $('#dem-pie-chart').css('visibility', 'visible').css('height', 'auto');
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

  function validatePartiesData(d) {
    if (isNaN(d[0].votes)) return false;
    return true;
  }

  function lastName(name) {
    var splitName = name.split(' ');
    if (splitName.length === 0) { return ''; } 
    else { return splitName[splitName.length - 1]; }
  }

  /*
      Populates state tables with data
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

  function drawStatePaths(d) {
    statesChartG.selectAll('path')
        .data(topojson.feature(d, d.objects.states).features)
        .enter().append('path')
          .attr('d', statesChartPath)
          .attr('class', 'state')
          .on('click', stateClicked);

    statesChartG.append('path')
        .datum(topojson.mesh(d, d.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'mesh')
        .attr('d', statesChartPath);
  }

  // External data files loaded
  d3.json('/data/us_states.json', function(error, data) {
    if (error) throw error;
    usStatesData = data;
    drawStatePaths(usStatesData);
  });

  d3.json('/data/state_primaries.json', function(error, data) {
    if (error) throw error;
    statePrimariesData = data;
  });

  d3.csv('/data/state_id_mappings.csv', function(error, data) {
    if (error) throw error;
    stateIdMapData = data;
  });

  function resizeCharts() {
    resizeStatesChart();
    resizePieCharts();
  }

});
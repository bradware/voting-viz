$(document).ready(function() {
  // global vars for editing the DOM
  var dataWrapper = $('.data-wrapper').hide();
  var dataError = $('.data-error').hide();
  d3.select(window).on('resize', resizeCharts);

  // setup and global logic vars 
  var stateChartsDrawn = false;
  var stateChartsDrawnAfterResize = true;
  var stateIdMapData;
  var statePrimariesData;
  var usStatesData;
  var stateData;
  var colorMap = {'Clinton': '#BB8AE8', 'Sanders': '#FFA6D2', 'Cruz': '#63D9F6', 
                  'Kasich': '#FFFF44', 'Rubio': '#8CC767', 'Trump': '#FF6D6D'};
  
  // global us states chart properties
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

  // global state pie chart properties
  var pieChartWidth =  calcChartsWidth($(window).width());
  var pieChartHeight = pieChartWidth;
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

  // global state bar chart properties
  var barChartOuterWidth = calcChartsWidth($(window).width()); 
  var barChartOuterHeight = barChartOuterWidth;
  var barChartMargin = { top: 20, right: 20, bottom: 30, left: 60 };
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

  // global state horizontal bar chart properties
  var horizBarChartOuterWidth = calcChartsWidth($(window).width()); 
  var horizBarChartOuterHeight = horizBarChartOuterWidth;
  var horizBarChartMargin = { top: 20, right: 20, bottom: 30, left: 60 };
  var horizBarChartWidth  = horizBarChartOuterWidth - horizBarChartMargin.left - horizBarChartMargin.right;
  var horizBarChartHeight = horizBarChartOuterHeight - horizBarChartMargin.top - horizBarChartMargin.bottom;
   
  var repHorizBarChartXScale = d3.scale.ordinal()
                                 .rangeRoundBands([0, horizBarChartWidth], .1);
  var repHorizBarChartYScale = d3.scale.linear()
                                 .range([horizBarChartHeight, 0]);
  var demHorizBarChartXScale = d3.scale.ordinal()
                                 .rangeRoundBands([0, horizBarChartWidth], .1);
  var demHorizBarChartYScale = d3.scale.linear()
                                 .range([horizBarChartHeight, 0]);
   
  var repHorizBarChartXAxis = d3.svg.axis()
                                .scale(repHorizBarChartXScale)
                                .orient('bottom');
  var repHorizBarChartYAxis = d3.svg.axis()
                                .scale(repHorizBarChartYScale)
                                .orient('left')
                                .ticks(10);
  var demHorizBarChartXAxis = d3.svg.axis()
                                .scale(demHorizBarChartXScale)
                                .orient('bottom');
  var demHorizBarChartYAxis = d3.svg.axis()
                                .scale(demHorizBarChartYScale)
                                .orient('left')
                                .ticks(10);
  
  var repHorizBarChart = d3.select('#rep-horiz-bar-chart')
                           .append('svg')
                            .attr('width', horizBarChartOuterWidth)
                            .attr('height', horizBarChartOuterHeight)
                           .append('g')
                            .attr('transform', 'translate(' + horizBarChartMargin.left + ',' + horizBarChartMargin.top + ')');

  var demHorizBarChart = d3.select('#dem-horiz-bar-chart')
                      .append('svg')
                        .attr('width', horizBarChartOuterWidth)
                        .attr('height', horizBarChartOuterHeight)
                       .append('g')
                        .attr('transform', 'translate(' + horizBarChartMargin.left + ',' + horizBarChartMargin.top + ')');

  function resizeCharts() {
    var newWidth = calcChartsWidth($(window).width());
    // doesn't have parameter b/c calculates width itself
    // this is b/c us-states-chart is always in DOM and never hidden
    resizeStatesChart();
    resizePieCharts(newWidth);
    resizeBarCharts(newWidth);
    resizeHorizBarCharts(newWidth);
    
    if (stateData != null) {
      drawPieCharts(stateData);
      drawBarCharts(stateData);
      drawHorizBarCharts(stateData);
      stateChartsDrawn = true;
    }
    else {
      stateChartsDrawn = false;
    }
  }

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

  function resizePieCharts(width) {
    pieChartWidth =  width;
    pieChartHeight = pieChartWidth;
    pieChartRadius = Math.min(pieChartWidth, pieChartHeight) / 2;

    pieChartArc = d3.svg.arc().innerRadius(pieChartRadius - 100).outerRadius(pieChartRadius - 20);

    pieChartRepSvg = d3.select('#rep-pie-chart').selectAll('svg').remove();
    pieChartDemSvg = d3.select('#dem-pie-chart').selectAll('svg').remove();

    pieChartRepSvg = d3.select('#rep-pie-chart').append('svg')
                           .attr('width', pieChartWidth)
                           .attr('height', pieChartHeight)
                           .append('g')
                            .attr('transform', 'translate(' + pieChartWidth / 2 + ',' + pieChartHeight / 2 + ')');
                           

    pieChartDemSvg = d3.select('#dem-pie-chart').append('svg')
                           .attr('width', pieChartWidth)
                           .attr('height', pieChartHeight)
                           .append('g')
                            .attr('transform', 'translate(' + pieChartWidth / 2 + ',' + pieChartHeight / 2 + ')');
  }

  function resizeBarCharts(width) {
    barChartOuterWidth = width;
    barChartOuterHeight = barChartOuterWidth;
    barChartMargin = { top: 20, right: 20, bottom: 30, left: 60 };
    barChartWidth  = barChartOuterWidth - barChartMargin.left - barChartMargin.right;
    barChartHeight = barChartOuterHeight - barChartMargin.top - barChartMargin.bottom;
     
    repBarChartXScale = d3.scale.ordinal()
                              .rangeRoundBands([0, barChartWidth], .1);
    repBarChartYScale = d3.scale.linear()
                              .range([barChartHeight, 0]);
    demBarChartXScale = d3.scale.ordinal()
                              .rangeRoundBands([0, barChartWidth], .1);
    demBarChartYScale = d3.scale.linear()
                              .range([barChartHeight, 0]);
     
    repBarChartXAxis = d3.svg.axis()
                             .scale(repBarChartXScale)
                             .orient('bottom');
    repBarChartYAxis = d3.svg.axis()
                             .scale(repBarChartYScale)
                             .orient('left')
                             .ticks(10);
    demBarChartXAxis = d3.svg.axis()
                             .scale(demBarChartXScale)
                             .orient('bottom');
    demBarChartYAxis = d3.svg.axis()
                             .scale(demBarChartYScale)
                             .orient('left')
                             .ticks(10);
    
    repBarChart = d3.select('#rep-bar-chart').selectAll('svg').remove();
    demBarChart = d3.select('#dem-bar-chart').selectAll('svg').remove();

    repBarChart = d3.select('#rep-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

    demBarChart = d3.select('#dem-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');
  }

  function resizeHorizBarCharts(width) {
    horizBarChartOuterWidth = width;
    horizBarChartOuterHeight = horizBarChartOuterWidth;
    horizBarChartMargin = { top: 20, right: 20, bottom: 30, left: 60 };
    horizBarChartWidth  = horizBarChartOuterWidth - horizBarChartMargin.left - horizBarChartMargin.right;
    horizBarChartHeight = horizBarChartOuterHeight - horizBarChartMargin.top - horizBarChartMargin.bottom;
     
    repHorizBarChartXScale = d3.scale.ordinal()
                               .rangeRoundBands([0, horizBarChartWidth], .1);
    repHorizBarChartYScale = d3.scale.linear()
                               .range([horizBarChartHeight, 0]);
    demHorizBarChartXScale = d3.scale.ordinal()
                               .rangeRoundBands([0, horizBarChartWidth], .1);
    demHorizBarChartYScale = d3.scale.linear()
                               .range([horizBarChartHeight, 0]);
     
    repHorizBarChartXAxis = d3.svg.axis()
                             .scale(repHorizBarChartXScale)
                             .orient('bottom');
    repHorizBarChartYAxis = d3.svg.axis()
                             .scale(repHorizBarChartYScale)
                             .orient('left')
                             .ticks(10);
    demHorizBarChartXAxis = d3.svg.axis()
                             .scale(demHorizBarChartXScale)
                             .orient('bottom');
    demHorizBarChartYAxis = d3.svg.axis()
                             .scale(demHorizBarChartYScale)
                             .orient('left')
                             .ticks(10);
    
    repHorizBarChart = d3.select('#rep-horiz-bar-chart').selectAll('svg').remove();
    demHorizBarChart = d3.select('#dem-horiz-bar-chart').selectAll('svg').remove();

    repHorizBarChart = d3.select('#rep-horiz-bar-chart')
                        .append('svg')
                          .attr('width', horizBarChartOuterWidth)
                          .attr('height', horizBarChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + horizBarChartMargin.left + ',' + horizBarChartMargin.top + ')');

    demHorizBarChart = d3.select('#dem-horiz-bar-chart')
                         .append('svg')
                          .attr('width', horizBarChartOuterWidth)
                          .attr('height', horizBarChartOuterHeight)
                         .append('g')
                          .attr('transform', 'translate(' + horizBarChartMargin.left + ',' + horizBarChartMargin.top + ')');
  }

  // This is necessary because cannot d3.select the wrapper divs for the state charts
  // Sometimes they are hidden from DOM and return width as 0 --> not good
  function calcChartsWidth(width) { 
    if (width <= 350) { return 250; } // iPhone5
    else if (width <= 400) { return 275; } // iPhone6
    else if (width <= 600) { return 300; } // iPhone6+
    else if (width <= 900) { return 500; } // one column width
    else if (width <= 1184) { return 550; } // one column width
    else if (width <= 1300) { return 500; } // two column width
    else if (width <= 1500) { return 550; } // two column width
    else if (width <= 1800) { return 600; } // two column width
    else return 750; // two column width
  }
  
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
    stateData = null;

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
      stateData = statePrimariesData.find(function(state) {
        return state.code === stateObj.code;
      });

      if (stateData === undefined) {
        console.log('ERROR MATCHING STATE CODE TO OBJECT');
        return false;
      } 
      else {
        drawStateElements(stateData);
        return true;
      }
    }
  }

  function drawStateElements(d) {
    // always build table no matter what
    buildTables(d);
    // if pie chart is already drawn, then just update data
    if(!stateChartsDrawn) {
      stateChartsDrawn = true;
      drawPieCharts(d);
    } 
    else updatePieCharts(d);
    // always draw bar charts b/c of axes
    drawBarCharts(d);
    drawHorizBarCharts(d);
  }

  function drawBarCharts(d) {
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

  function drawHorizBarCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#rep-horiz-bar-chart').css('visibility', 'hidden').css('height', '0');
     } 
    else {
      repHorizBarChartXScale.domain(d.rep_candidates.map(function(cand) { return lastName(cand.name); }));
      repHorizBarChartYScale.domain([0, d3.max(d.rep_candidates, function(cand) { return cand.total_delegates; })]);
      repHorizBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + horizBarChartHeight + ')') 
               .call(repBarChartXAxis);
      repHorizBarChart.select('.y.axis').remove();
      repHorizBarChart.append('g')
               .attr('class', 'y axis')
               .call(repHorizBarChartYAxis)
               .append('text')
                .attr('x', -5)
                .attr('y', -15)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Delegates');
      var repHorizBars = repHorizBarChart.selectAll('.bar').data(d.rep_candidates, function(cand) { return lastName(cand.name); });
      // new data appended
      repHorizBars.enter().append('rect')
             .attr('class', 'bar')
             .attr('x', function(cand) { return repHorizBarChartXScale(lastName(cand.name)); })
             .attr('y', function(cand) { return repHorizBarChartYScale(cand.total_delegates); })
             .attr('height', function(cand) { return horizBarChartHeight - repHorizBarChartYScale(cand.total_delegates); })
             .attr('width', repHorizBarChartXScale.rangeBand())
             .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; });
      // remove old data
      repHorizBars.exit().remove();
      // update data bindings
      repHorizBars.transition()
             .duration(750)
             .attr('y', function(cand) { return repHorizBarChartYScale(cand.total_delegates); })
             .attr('height', function(cand) { return horizBarChartHeight - repHorizBarChartYScale(cand.total_delegates); })
      // show new bar chart
      $('#rep-horiz-bar-chart').css('visibility', 'visible').css('height', 'auto');
    }

    if (!validatePartiesData(d.dem_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#dem-horiz-bar-chart').css('visibility', 'hidden').css('height', '0');
    } 
    else {
      demHorizBarChartXScale.domain(d.dem_candidates.map(function(cand) { return lastName(cand.name); }));
      demHorizBarChartYScale.domain([0, d3.max(d.dem_candidates, function(cand) { return cand.total_delegates; })]);
      demHorizBarChart.append('g')
                 .attr('class', 'x axis')
                 .attr('transform', 'translate(0,' + horizBarChartHeight + ')') 
                 .call(demHorizBarChartXAxis);
      demHorizBarChart.select('.y.axis').remove();
      demHorizBarChart.append('g')
                 .attr('class', 'y axis')
                 .call(demHorizBarChartYAxis)
                 .append('text')
                  .attr('x', -5)
                  .attr('y', -15)
                  .attr('dy', '.71em')
                  .style('text-anchor', 'end')
                  .text('Delegates');
      var demHorizBars = demHorizBarChart.selectAll('.bar').data(d.dem_candidates, function(cand) { return lastName(cand.name); });
      // new data appended
      demHorizBars.enter().append('rect')
             .attr('class', 'bar')
             .attr('x', function(cand) { return demHorizBarChartXScale(lastName(cand.name)); })
             .attr('y', function(cand) { return demHorizBarChartYScale(cand.total_delegates); })
             .attr('height', function(cand) { return horizBarChartHeight - demHorizBarChartYScale(cand.total_delegates); })
             .attr('width', demHorizBarChartXScale.rangeBand())
             .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; });
      // remove old data
      demHorizBars.exit().remove();
      // update data bindings
      demHorizBars.transition()
             .duration(750)
             .attr('y', function(cand) { return demHorizBarChartYScale(cand.total_delegates); })
             .attr('height', function(cand) { return horizBarChartHeight - demHorizBarChartYScale(cand.total_delegates); })
      // show new bar chart
      $('#dem-horiz-bar-chart').css('visibility', 'visible').css('height', 'auto');
    }
  }
  

  function drawPieCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      $('#rep-pie-chart').css('visibility', 'hidden').css('height', '0');
    } else {
      $('#rep-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    if (!validatePartiesData(d.dem_candidates)) {
      $('#dem-pie-chart').css('visibility', 'hidden').css('height', '0');
    }else {
      $('#dem-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    
    // must draw pie charts even with no data, will still show up
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

  
  function buildTables(d) {
    var tables = $('table');
    tables.each(function() { 
      updateCandidatesInfo(this, d);
    }); 
  }

  function updateCandidatesInfo(table, d) {
    var candidates = d[table.id];
    candidates.forEach(function(cand) {   // js array obj for each loop
      var candLastName = lastName(cand.name).toLowerCase();
      var tableRow = $('.'.concat(candLastName));
      updateRowInfo(tableRow, cand);
    });

  }

  function updateRowInfo(tableRow, cand) {
    var children = tableRow.children();
    children.each(function() { 
      if (cand.hasOwnProperty(this.className)) {
        $(this).html(cand[this.className].toLocaleString());
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

});
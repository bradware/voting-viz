$(document).ready(function() {
  $('footer').load('templates/footer.html');
  //$('.tables-wrapper').load('templates/tables.html');
  $('.legend-wrapper').load('templates/legend.html');

  // global vars for editing the DOM
  var dataWrapper = $('.data-wrapper').hide();
  var dataError = $('.data-error').hide();
  $(window).on('resize', resizeCharts);

  // setup and global logic vars 
  var stateChartsDrawn = false;
  var stateIdMapData;
  var statePrimariesData;
  var usStatesData;
  var stateData;
  var colorMap = {'Clinton': '#6464FF', 'Sanders': '#C8C8FF', 'Cruz': '#FFD2D2', 
                  'Kasich': '#FF8C8C', 'Rubio': '#FF4646', 'Trump': '#FF0000'};
  
  // global us states chart properties
  var statesChartWidth = calcStatesChartWidth($(window).width());
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

  var tooltip = d3.select('#us-states-chart').append('div')
                  .attr('class', 'tooltip')
                  .style('opacity', 0);

  // global state pie chart properties
  var pieChartWidth =  calcBarChartsWidth($(window).width());
  var pieChartHeight = pieChartWidth;
  var pieChartRadius = Math.min(pieChartWidth, pieChartHeight) / 2;
  var pieChartDemArc, pieChartRepArc;
  var repPieChartText, demPieChartText;
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

  // global state bar chart properties shared among all
  var barChartOuterWidth = calcBarChartsWidth($(window).width()); 
  var barChartOuterHeight = barChartOuterWidth;
  var barChartMargin = { top: 30, right: 20, bottom: 30, left: 60 };
  var barChartWidth  = barChartOuterWidth - barChartMargin.left - barChartMargin.right;
  var barChartHeight = barChartOuterHeight - barChartMargin.top - barChartMargin.bottom;
  
  var repBarChartXScale = d3.scale.ordinal().rangeRoundBands([0, barChartWidth], .1);
  var demBarChartXScale = d3.scale.ordinal().rangeRoundBands([0, barChartWidth], .1);

  var repBarChartXAxis = d3.svg.axis()
                           .scale(repBarChartXScale)
                           .orient('bottom');
  var demBarChartXAxis = d3.svg.axis()
                           .scale(demBarChartXScale)
                           .orient('bottom');                        
  // global state votes bar chart properties
  var repVotBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
  var demVotBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
  
  var repVotBarChartYAxis = d3.svg.axis()
                           .scale(repVotBarChartYScale)
                           .orient('left')
                           .ticks(10);
  var demVotBarChartYAxis = d3.svg.axis()
                           .scale(demVotBarChartYScale)
                           .orient('left')
                           .ticks(10);
  
  var repVotBarChart = d3.select('#rep-vot-bar-chart')
                      .append('svg')
                        .attr('width', barChartOuterWidth)
                        .attr('height', barChartOuterHeight)
                      .append('g')
                        .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

  var demVotBarChart = d3.select('#dem-vot-bar-chart')
                      .append('svg')
                        .attr('width', barChartOuterWidth)
                        .attr('height', barChartOuterHeight)
                      .append('g')
                        .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

  // global state delegate bar chart properties
  var repDelBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
  var demDelBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
   
  var repDelBarChartYAxis = d3.svg.axis()
                              .scale(repDelBarChartYScale)
                              .orient('left')
                              .ticks(10);
  var demDelBarChartYAxis = d3.svg.axis()
                              .scale(demDelBarChartYScale)
                              .orient('left')
                              .ticks(10);
  
  var repDelBarChart = d3.select('#rep-del-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

  var demDelBarChart = d3.select('#dem-del-bar-chart')
                      .append('svg')
                        .attr('width', barChartOuterWidth)
                        .attr('height', barChartOuterHeight)
                      .append('g')
                        .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

  function resizeCharts() {
    var windowWidth = $(window).width();
    var statesChartWidth = calcStatesChartWidth(windowWidth);
    var chartsWidth = calcBarChartsWidth(windowWidth);
    
    resizeStatesChart(statesChartWidth);
    resizePieCharts(chartsWidth);
    resizeBarCharts(chartsWidth);
    
    if (stateData !== undefined) {
      drawPieCharts(stateData);
      drawBarCharts(stateData);
      stateChartsDrawn = true;
    }
    else {
      stateChartsDrawn = false;
    }
  }

  function resizeStatesChart(width) {
    statesChartWidth = width;
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
    // global bar chart properties
    barChartOuterWidth = width;
    barChartOuterHeight = barChartOuterWidth;
    barChartMargin = { top: 20, right: 20, bottom: 30, left: 60 };
    barChartWidth  = barChartOuterWidth - barChartMargin.left - barChartMargin.right;
    barChartHeight = barChartOuterHeight - barChartMargin.top - barChartMargin.bottom;
    
    repBarChartXScale = d3.scale.ordinal().rangeRoundBands([0, barChartWidth], .1);
    demBarChartXScale = d3.scale.ordinal().rangeRoundBands([0, barChartWidth], .1);

    repBarChartXAxis = d3.svg.axis()
                             .scale(repBarChartXScale)
                             .orient('bottom');
    demBarChartXAxis = d3.svg.axis()
                             .scale(demBarChartXScale)
                             .orient('bottom');

    // votes bar chart
    repVotBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
    demVotBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
     
    repVotBarChartYAxis = d3.svg.axis()
                             .scale(repVotBarChartYScale)
                             .orient('left')
                             .ticks(10);
    demVotBarChartYAxis = d3.svg.axis()
                             .scale(demVotBarChartYScale)
                             .orient('left')
                             .ticks(10);

    repVotBarChart = d3.select('#rep-vot-bar-chart').selectAll('svg').remove();
    demVotBarChart = d3.select('#dem-vot-bar-chart').selectAll('svg').remove();
    
    // delegates bar chart
    repDelBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
    demDelBarChartYScale = d3.scale.linear().range([barChartHeight, 0]);
     
    repDelBarChartYAxis = d3.svg.axis()
                            .scale(repDelBarChartYScale)
                            .orient('left')
                            .ticks(10);
    demDelBarChartYAxis = d3.svg.axis()
                            .scale(demDelBarChartYScale)
                            .orient('left')
                            .ticks(10);

    repDelBarChart = d3.select('#rep-del-bar-chart').selectAll('svg').remove();
    demDelBarChart = d3.select('#dem-del-bar-chart').selectAll('svg').remove();

    // redrawing both the charts
    repVotBarChart = d3.select('#rep-vot-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

    demVotBarChart = d3.select('#dem-vot-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

    repDelBarChart = d3.select('#rep-del-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');

    demDelBarChart = d3.select('#dem-del-bar-chart')
                        .append('svg')
                          .attr('width', barChartOuterWidth)
                          .attr('height', barChartOuterHeight)
                        .append('g')
                          .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');
  }


  function calcStatesChartWidth(width) {
    if (width <= 900) { return parseInt(d3.select('#us-states-chart').style('width')); }
    else if (width <= 1200) {  return parseInt(d3.select('#us-states-chart').style('width')) * 0.90; }
    else if (width <= 1600) {  return parseInt(d3.select('#us-states-chart').style('width')) * 0.85; }
    else { return parseInt(d3.select('#us-states-chart').style('width')) * 0.75; }
  }

  // This is necessary because cannot d3.select the wrapper divs for the state charts
  // Sometimes they are hidden from DOM and return width as 0 --> not good
  function calcBarChartsWidth(width) { 
    if (width <= 350) { return 250; } // iPhone5
    else if (width <= 400) { return 275; } // iPhone6
    else if (width <= 600) { return 300; } // iPhone6+
    else if (width <= 900) { return 350; } // one column width
    else if (width <= 1600) { return 425; } // two column width
    else return 500; // two column width
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

    hideTooltip();
    // Add text to the data here
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
    stateData = undefined;

    statesChartG.transition()
                .duration(750)
                .style('stroke-width', '1.5px')
                .attr('transform', '');

    dataWrapper.fadeOut();
    dataError.fadeOut();
  }

  function findStateData(d) {
    stateData = matchStateData(d);
    updateStateTitle(stateData);          
    if (stateData !== undefined) { 
      if (validatePartiesData(stateData.rep_candidates) || validatePartiesData(stateData.dem_candidates)) {
        drawStateElements(stateData);
        return true;
      }
    }
    return false;
  }

  function matchStateData(d) {
    var newStateData;
    var stateObj = stateIdMapData.find(function(state) {
      // state.id is a String so use '==' instead of '==='
      return d.id == state.id; 
    });
    if (stateObj !== undefined) {
      newStateData = statePrimariesData.find(function(state) {
        return state.code === stateObj.code;
      });
    }
    return newStateData;
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
  }

  function updateStateTitle(d) {
    $('.state-title').html(d.name + ' - ' + d.code);
  }

  function drawBarCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#rep-vot-bar-chart').css('visibility', 'hidden').css('height', '0');
      $('#rep-del-bar-chart').css('visibility', 'hidden').css('height', '0');
     } 
    else {
      repBarChartXScale.domain(d.rep_candidates.map(function(cand) { return lastName(cand.name); }));
      repVotBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(repBarChartXAxis);
      repDelBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(repBarChartXAxis);
      
      // draw both bar charts by updating y-scale and y-axis
      drawRepVotBarCharts(d);
      drawRepDelBarCharts(d);
      $('#rep-vot-bar-chart').css('visibility', 'visible').css('height', 'auto');
      $('#rep-del-bar-chart').css('visibility', 'visible').css('height', 'auto');
      
    }
    if (!validatePartiesData(d.dem_candidates)) {
      // DO NOT HIDE - ELEMENT IS REMOVED FROM DOM AND SPACING IS WRONG
      $('#dem-vot-bar-chart').css('visibility', 'hidden').css('height', '0');
      $('#dem-del-bar-chart').css('visibility', 'hidden').css('height', '0');
    } 
    else {
      demBarChartXScale.domain(d.dem_candidates.map(function(cand) { return lastName(cand.name); }));
      demVotBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(demBarChartXAxis);
      demDelBarChart.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + barChartHeight + ')') 
               .call(demBarChartXAxis);
      
      // draw both bar charts by updating y-scale and y-axis
      drawDemVotBarCharts(d);
      drawDemDelBarCharts(d);
      $('#dem-vot-bar-chart').css('visibility', 'visible').css('height', 'auto');
      $('#dem-del-bar-chart').css('visibility', 'visible').css('height', 'auto');
    }
  }

  function drawRepVotBarCharts(d) {
    repVotBarChartYScale.domain([0, d3.max(d.rep_candidates, function(cand) { return cand.votes; })]);
    repVotBarChart.select('.y.axis').remove();
    repVotBarChart.append('g')
               .attr('class', 'y axis')
               .call(repVotBarChartYAxis)
               .append('text')
                .attr('x', -8)
                .attr('y', -20)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Votes');
    var repVotBars = repVotBarChart.selectAll('.bar').data(d.rep_candidates, function(cand) { return lastName(cand.name); });
    // new data appended
    repVotBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return repBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return repVotBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - repVotBarChartYScale(cand.votes); })
           .attr('width', repBarChartXScale.rangeBand())
           .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; })
           .on('mouseover', drawCandTooltip)
           .on('mouseout', hideTooltip);
    // remove old data
    repVotBars.exit().remove();
    // update data bindings
    repVotBars.transition()
           .duration(750)
           .attr('y', function(cand) { return repVotBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - repVotBarChartYScale(cand.votes); })
  }

  function drawRepDelBarCharts(d) {
    repDelBarChartYScale.domain([0, d3.max(d.rep_candidates, function(cand) { return cand.total_delegates; })]);
    repDelBarChart.select('.y.axis').remove();
    repDelBarChart.append('g')
               .attr('class', 'y axis')
               .call(repDelBarChartYAxis)
               .append('text')
                .attr('x', -8)
                .attr('y', -20)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Delegates');
    var repDelBars = repDelBarChart.selectAll('.bar').data(d.rep_candidates, function(cand) { return lastName(cand.name); });
    // new data appended
    repDelBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return repBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return repDelBarChartYScale(cand.total_delegates); })
           .attr('height', function(cand) { return barChartHeight - repDelBarChartYScale(cand.total_delegates); })
           .attr('width', repBarChartXScale.rangeBand())
           .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; })
           .on('mouseover', drawCandTooltip)
           .on('mouseout', hideTooltip);
    // remove old data
    repDelBars.exit().remove();
    // update data bindings
    repDelBars.transition()
           .duration(750)
           .attr('y', function(cand) { return repDelBarChartYScale(cand.total_delegates); })
           .attr('height', function(cand) { return barChartHeight - repDelBarChartYScale(cand.total_delegates); })
  }

  function drawDemVotBarCharts(d) {
    demVotBarChartYScale.domain([0, d3.max(d.dem_candidates, function(cand) { return cand.votes; })]);
    demVotBarChart.select('.y.axis').remove();
    demVotBarChart.append('g')
               .attr('class', 'y axis')
               .call(demVotBarChartYAxis)
               .append('text')
                .attr('x', -8)
                .attr('y', -20)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Votes');
    var demVotBars = demVotBarChart.selectAll('.bar').data(d.dem_candidates, function(cand) { return lastName(cand.name); });
    // new data appended
    demVotBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return demBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return demVotBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - demVotBarChartYScale(cand.votes); })
           .attr('width', demBarChartXScale.rangeBand())
           .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; })
           .on('mouseover', drawCandTooltip)
           .on('mouseout', hideTooltip);
    // remove old data
    demVotBars.exit().remove();
    // update data bindings
    demVotBars.transition()
           .duration(750)
           .attr('y', function(cand) { return demVotBarChartYScale(cand.votes); })
           .attr('height', function(cand) { return barChartHeight - demVotBarChartYScale(cand.votes); })
  }

  function drawDemDelBarCharts(d) {
    demDelBarChartYScale.domain([0, d3.max(d.dem_candidates, function(cand) { return cand.total_delegates; })]);
    demDelBarChart.select('.y.axis').remove();
    demDelBarChart.append('g')
               .attr('class', 'y axis')
               .call(demDelBarChartYAxis)
               .append('text')
                .attr('x', -8)
                .attr('y', -20)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Delegates');
    var demDelBars = demDelBarChart.selectAll('.bar').data(d.dem_candidates, function(cand) { return lastName(cand.name); });
    // new data appended
    demDelBars.enter().append('rect')
           .attr('class', 'bar')
           .attr('x', function(cand) { return demBarChartXScale(lastName(cand.name)); })
           .attr('y', function(cand) { return demDelBarChartYScale(cand.total_delegates); })
           .attr('height', function(cand) { return barChartHeight - demDelBarChartYScale(cand.total_delegates); })
           .attr('width', demBarChartXScale.rangeBand())
           .attr('fill', function(cand) { return colorMap[lastName(cand.name)]; })
           .on('mouseover', drawCandTooltip)
           .on('mouseout', hideTooltip);
    // remove old data
    demDelBars.exit().remove();
    // update data bindings
    demDelBars.transition()
           .duration(750)
           .attr('y', function(cand) { return demDelBarChartYScale(cand.total_delegates); })
           .attr('height', function(cand) { return barChartHeight - demDelBarChartYScale(cand.total_delegates); })
  }

  function drawPieCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      $('#rep-pie-chart').css('visibility', 'hidden').css('height', '0');
    } else {
      $('#rep-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    if (!validatePartiesData(d.dem_candidates)) {
      $('#dem-pie-chart').css('visibility', 'hidden').css('height', '0');
    } else {
      $('#dem-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    
    // must draw pie charts even with no data, will still show up
    pieChartRepPath = pieChartRepSvg.datum(d.rep_candidates).selectAll('path')
                        .data(pie)
                        .enter().append('path')
                          .attr('fill', function(d) { return colorMap[lastName(d.data.name)]; })
                          .attr('d', pieChartArc)
                          .on('mouseover', drawCandTooltip)
                          .on('mouseout', hideTooltip)
                          .each(function(d) { this._current = d; }); // store the initial angles
                          
    pieChartDemPath = pieChartDemSvg.datum(d.dem_candidates).selectAll('path')
                        .data(pie)
                        .enter().append('path')
                          .attr('fill', function(d) { return colorMap[lastName(d.data.name)]; })
                          .attr('d', pieChartArc)
                          .on('mouseover', drawCandTooltip)
                          .on('mouseout', hideTooltip)
                          .each(function(d) { this._current = d; }); // store the initial angles                         
    
    //draw the republican pie labels
    pieChartRepArc = pieChartRepSvg.selectAll('g.slice')
      .data(pie)
      .enter()
      .append('g')
      .attr('class', 'slice');

    repPieChartText = pieChartRepArc.append('text')
      .attr('transform', function(d) {
        var c = pieChartArc.centroid(d);
        return 'translate(' + c[0] +',' + c[1] + ')';
      })
      .text(function (d) { return d.data.percentage_total_votes + '%'; })
      .style('font-weight', 'bold');

    //draw the democrat pie labels
    pieChartDemArc = pieChartDemSvg.selectAll('g.slice')
      .data(pie)
      .enter()
      .append('g')
      .attr('class', 'slice');

    demPieChartText = pieChartDemArc.append('text')
      .attr('transform', function(d) {
        var c = pieChartArc.centroid(d);
        return 'translate(' + c[0] +',' + c[1] + ')';
      })
      .text(function (d) { return d.data.percentage_total_votes + '%'; })
      .style('font-weight', 'bold');
  }

  function updatePieCharts(d) {
    if (!validatePartiesData(d.rep_candidates)) {
      $('#rep-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    else {
      //redraw the arcs
      pieChartRepPath.data(pie(d.rep_candidates));
      pieChartRepPath.transition().duration(750).attrTween('d', arcTween)
      //move the labels
      repPieChartText.data(pie(d.rep_candidates))
        .transition().duration(750)
        .attr('transform', function(d) {
          var c = pieChartArc.centroid(d);
          return 'translate(' + c[0] +',' + c[1] + ')';
        });
      //update label percentages
      repPieChartText.data(pie(d.rep_candidates))
        .text(function (d) {return d.data.percentage_total_votes + '%'})
      $('#rep-pie-chart').css('visibility', 'visible').css('height', 'auto');
    }
    if (!validatePartiesData(d.dem_candidates)) {
      $('#dem-pie-chart').css('visibility', 'hidden').css('height', '0');
    }
    else {
      //redraw the arcs
      pieChartDemPath.data(pie(d.dem_candidates));
      pieChartDemPath.transition().duration(750).attrTween('d', arcTween)          
      //move the labels
      demPieChartText.data(pie(d.dem_candidates))
        .transition().duration(750)
        .attr('transform', function(d) {
          var c = pieChartArc.centroid(d);
          return 'translate(' + c[0] +',' + c[1] + ')';
        });
      //update label percentages
      demPieChartText.data(pie(d.dem_candidates))
        .text(function (d) {return d.data.percentage_total_votes + '%'})
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
          .on('click', stateClicked)
          .on('mouseover', drawStateTooltip)
          .on('mouseout', hideTooltip);

    statesChartG.append('path')
        .datum(topojson.mesh(d, d.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'mesh')
        .attr('d', statesChartPath);
  }

  function drawStateTooltip(d) {
    if (stateActive.node() === this) {
      hideTooltip();
    }
    else {
      var width = $(window).width();
      var state = matchStateData(d);
      if (state === undefined) {
        tooltip.html('Results are not in for this state!' + '<br/>' + 'Please check back later')
      } 
      else {
        tooltip.html('<span style="font-weight:bold">' + state.name + ' - ' + state.code + '</span>' + '<br/>' + 'Population: ' + state.population.toLocaleString() + '<br/>' + 
            'Dem Delegates: ' + state.dem_delegates + '<br/>' + 'Rep Delegates: ' + state.dem_delegates);
      }
      if (width <= 900) {
        tooltip.style('top', (d3.event.pageY + 50) + 'px');
        tooltip.style('left', 15 + 'px');
      } 
      else {
        tooltip.style('top', (d3.event.pageY + 20) + 'px');
        tooltip.style('left', d3.event.pageX + 'px');
      }
      tooltip.transition()
             .duration(100)
             .style('opacity', 1);
    }
  }

  function drawCandTooltip(d) {
    var cand;
    if (d.data !== undefined) { cand = d.data; } 
    else { cand = d; }
    
    tooltip.html('<span style="font-weight:bold">' + cand.name + '</span>' + '<br/>' + 'Votes: ' + cand.votes.toLocaleString() + '<br/>' + 
        'Percentage: ' + cand.percentage_total_votes + '<br/>' + 'Delegates: ' + cand.total_delegates + '<br/>' + 'Twitter: @' + cand.twitter_username);
    tooltip.style('top', (d3.event.pageY + 10) + 'px');
    tooltip.style('left', d3.event.pageX + 'px');
    tooltip.transition()
           .duration(100)
           .style('opacity', 1);
  }

  function hideTooltip() {
    tooltip.transition()
           .duration(100)
           .style('opacity', 0);
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
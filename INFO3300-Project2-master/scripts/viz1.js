// Inspired by the fourth graph on this tableau visulization: https://public.tableau.com/profile/bharathwaj.vijayakumar#!/vizhome/WhereitPaystoAttendCollege/SalaryComparison

// Creating SVG
let graph = d3.select("body")
              .append("svg")
              .attr("id", "sal_type")
              .attr("width", 1200)
              .attr("height", 2500);

const requestData = async function() 
{
  // Loading Schools CSV file
  const sch = await d3.csv( "region_sat_school.csv");
    // Fixing data quality issues
    sch.forEach( s => 
    {
      // Converting salaries from strings to numbers
      s['Starting Median Salary'] = Number( s['Starting Median Salary'] );
      s['Mid-Career Median Salary'] = Number( s['Mid-Career Median Salary'] );
    });

    // Extracting SVG dimensions
    let svg = d3.select("svg#sal_type");
    let width = svg.attr("width");
    let height = svg.attr("height");
    let margins = {"top": 20, "right": 10, "bottom": 60, "left": 250};
    let chart_width = width - margins.left - margins.right;
    let chart_height = height - margins.top - margins.bottom;


    // Finding extents and constructing scales
    let mid_salary_extent = d3.extent(sch, s => s['Mid-Career Median Salary'] ); // mid-career median salary extent

    let salary_scale = d3.scaleLinear()
                           .domain([0, (mid_salary_extent[1] + 10000)])
                           .range([0, chart_width]); // salary scale

    // Creating a lists of school names and types
    let school_names = []
    let types = []
    sch.forEach( s => 
    {
      school_names.push(s['School Name']);
      types.push(s['School Type']);
    });

    school_names.sort(); // sorting school names
    school_names.reverse(); // reversing to alphabetical order 

    let types_u = types.filter((item, i, array) => array.indexOf(item) === i); // unique types only

    let school_scale = d3.scalePoint()
                           .domain(school_names)
                           .range([chart_height, 0]); // school scale

    let school_type_scale = d3.scaleOrdinal()
                                .domain(types_u)
                                .range(["#093D7C"]); // color all school types the same
    
    let salary_plot = svg.append("g")
                         .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                         .attr("class", "salary-plot");

    // Populating <g> elements with d3.axis labels
    // y-axis
    let y_axis = d3.axisLeft(school_scale)
                   .ticks(school_names.length);
    let y_axisG = svg.append("g")
                     .attr("class", "y axis")
                     .style("font-family", "'Roboto', sans-serif")
                     .style("font-size", "13px")
                     .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")" ) 
                     .call(y_axis);

    y_axisG.transition()
           .duration(500)
           .call(y_axis);

    // x-axis
    let x_axis = d3.axisBottom(salary_scale)
                   .ticks(15)
                   .tickFormat(d3.format("$~s"));
    svg.append("g")
       .attr("class", "x axis")
       .style("font-size", "13px")
       .style("font-family", "'Roboto', sans-serif")
       .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")" )
       .call(x_axis);

    // Making gridlines using d3.axis
    // Horizontal gridlines
    let horizontal_gridlines = d3.axisLeft(school_scale)
                                 .tickSize(-chart_width - 10)
                                 .tickFormat("");
    let horizontal_gridlinesG = svg.append("g")
                                   .attr("class", "y gridlines")
                                   .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")" )
    horizontal_gridlinesG.transition()
                         .duration(500)
                         .call(horizontal_gridlines);


    // Vertical gridlines
    let vertical_gridlines = d3.axisBottom(salary_scale)
                               .ticks(15)
                               .tickSize(-chart_height - 10)
                               .tickFormat("");

    svg.append("g")
       .attr("class", "x gridlines")
       .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")" )
       .call(vertical_gridlines);   
        
    // Putting data points over gridlines
    salary_plot.raise();

    // G-tag for each dumbbell
    let points = salary_plot.selectAll('g.points')
                            .data(sch, s => s["School Name"])
                            .join('g')
                            .attr('class','points')
                            .attr("transform", s => `translate(0,${school_scale(s['School Name'])})`);

    // Function to draw all the dumbbells
    function draw_points (data) 
    {
      // Constructing line color gradient
      let get_grad_id = c => `link_grad-${Math.floor(salary_scale( c['Starting Median Salary'] ))}-${Math.floor(salary_scale( c['Mid-Career Median Salary'] ))}`;

      var gradients = salary_plot.append("defs")
                            .selectAll("linearGradient")
                            .data(data)
                            .join("linearGradient")
                            .attr("id", get_grad_id)
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", s => salary_scale( s['Starting Median Salary'] ))
                            .attr("x2", s => salary_scale( s['Mid-Career Median Salary'] ))
                            .attr("y1", s => school_scale( s['School Name']))
                            .attr("y2", s => school_scale( s['School Name']));

      gradients.append("stop")
               .attr("offset", "0%")
               .attr("stop-color", "#093D7C");
      gradients.append("stop")
               .attr("offset", "100%")
               .attr("stop-color", "#F1803A");

      // Drawing lines and circles
      // Lines
      let lines = points.append("line")
                        .attr("class", "line-between")
                        .attr("x1", s => salary_scale( s['Starting Median Salary'] ))
                        .attr("x2", s => salary_scale( s['Mid-Career Median Salary'] ))
                        .attr("y1", 0)
                        .attr("y2", 0)
                        .attr("stroke-width", "2px")
                        .attr("stroke", s => "url(#" + get_grad_id(s) + ")")
                        .attr("opacity", 0.8);

      // Blue circles
      let circle_start = points.append("circle")
                               .attr("cx", s => salary_scale( s['Starting Median Salary'] ))
                               .attr("cy", 0)
                               .attr("r", 5)
                               .attr("school_type", s => s['School Type'])
                               .style("fill", "#093D7C");


      // Blue circle labels
      points.append("text")
            .attr("x", s => salary_scale( s['Starting Median Salary'] ) - 50)
            .attr("y", 0 + 5)
            .attr("font-size", "13px")
            .text((s => d3.format("$~s")(s['Starting Median Salary'] )));

      // Orange circles
      let circle_mid = points.append("circle")
                             .attr("cx", s => salary_scale( s['Mid-Career Median Salary'] ))
                             .attr("cy", 0)
                             .attr("r", 5)
                             .attr("school_type", s => s['School Type'])
                             .style("fill", "#F1803A");
      
      // Orange circle labels                           
      points.append("text")
            .attr("x", s => salary_scale( s['Mid-Career Median Salary'] ) + 10)
            .attr("y", 0 + 5)
            .attr("font-size", "13px")
            .text((s => d3.format("$~s")(s['Mid-Career Median Salary'] )));
    }

    draw_points(sch);
    
    // Function to call when school type filters are applied
    function update_schools_animated(type_name) 
    {
      d3.select("#default")
        .property("selected", true);

      // Getting only the data that are of the type 'type_name'
      sch_filt = sch.filter( (s) => 
      {
        if (type_name === "All") { return s;}
        else { return s['School Type'] === type_name;}
      });

      // Finding extents and constructing scales
      let mid_salary_extent = d3.extent(sch_filt, s => s['Mid-Career Median Salary'] ); // mid-career median salary extent
      
      let school_names = []

      // Getting only the schools for the y-axis that are of the type 'type_name'
      sch_filt.forEach( s => 
      {
        if (type_name === "All") {school_names.push(s['School Name']);}
        if (s['School Type'] === type_name) 
        {
          school_names.push(s['School Name']);
        }
      });

      school_names.sort(); // sorting school names
      school_names.reverse(); // reversing to alphabetical order 

      let height = school_names.length * 25; //dynamically adjusting height of SVG based on number of schools
      svg.attr("height", height); //dynamically adjusting height of SVG based on number of schools
      let margins = {"top": 20, "right": 10, "bottom": 80, "left": 250};
      let chart_height = height - margins.top - margins.bottom;

      let school_scale = d3.scalePoint()
                             .domain(school_names)
                             .range([chart_height, 0]); // school scale

      let salary_plot = svg.append("g")
                           .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

      // Populating <g> elements with d3.axis labels
      // y-axis
      let y_axis = d3.axisLeft(school_scale)
                     .ticks(school_names.length);
      let y_axisG = svg.append("g")
                       .attr("class", "y axis")
                       .style("font-family", "'Roboto', sans-serif")
                       .style("font-size", "13px")
                       .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")" ) 
                       .call(y_axis);

      y_axisG.transition()
             .duration(500)                     
             .call(y_axis);

      // x-axis
      let x_axis = d3.axisBottom(salary_scale)
                     .ticks(15)
                     .tickFormat(d3.format("$~s"));
      svg.append("g")
         .attr("class", "x axis")
         .style("font-size", "13px")
         .style("font-family", "'Roboto', sans-serif")
         .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")" )
         .call(x_axis);

      // Making gridlines using d3.axis
      // Horizontal gridlines
      let horizontal_gridlines = d3.axisLeft(school_scale)
                                   .tickSize(-chart_width - 10)
                                   .tickFormat("");
      let horizontal_gridlinesG = svg.append("g")
                                     .attr("class", "y gridlines")
                                     .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")" )
      horizontal_gridlinesG.transition()
                           .duration(500)                                   
                           .call(horizontal_gridlines);

      // Vertical gridlines
      let vertical_gridlines = d3.axisBottom(salary_scale)
                                 .ticks(15)
                                 .tickSize(-chart_height - 10)
                                 .tickFormat("");
      svg.append("g")
         .attr("class", "x gridlines")
         .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")" )
         .call(vertical_gridlines);   
          
      // Putting data points over gridlines
      salary_plot.raise();

      // G-tag for each dumbbell
      let points = salary_plot.selectAll('g.points')
                              .data(sch_filt, s => s["School Name"])
                              .join('g')
                              .attr('class','points')
                              .attr("transform", s => `translate(0,${school_scale(s['School Name'])})`);

      // Constructing line color gradient
      let get_grad_id = c => `link_grad-${Math.floor(salary_scale( c['Starting Median Salary'] ))}-${Math.floor(salary_scale( c['Mid-Career Median Salary'] ))}`;

      var gradients = salary_plot.append("defs")
                            .selectAll("linearGradient")
                            .data(sch_filt)
                            .join("linearGradient")
                            .attr("id", get_grad_id)
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", s => salary_scale( s['Starting Median Salary'] ))
                            .attr("x2", s => salary_scale( s['Mid-Career Median Salary'] ))
                            .attr("y1", s => school_scale( s['School Name']))
                            .attr("y2", s => school_scale( s['School Name']));

      gradients.append("stop")
               .attr("offset", "0%")
               .attr("stop-color", "#093D7C");
      gradients.append("stop")
               .attr("offset", "100%")
               .attr("stop-color", "#F1803A");

      // Drawing lines and circles
      // Lines
      let lines = points.append("line")
                        .attr("class", "line-between")
                        .attr("x1", s => salary_scale( s['Starting Median Salary'] ))
                        .attr("x2", s => salary_scale( s['Mid-Career Median Salary'] ))
                        .attr("y1", 0)
                        .attr("y2", 0)
                        .attr("stroke-width", "2px")
                        .attr("stroke", s => "url(#" + get_grad_id(s) + ")")
                        .attr("opacity", 0.8);

      // Blue circles
      let circle_start = points.append("circle")
                               .attr("cx", s => salary_scale( s['Starting Median Salary'] ))
                               .attr("cy", 0)
                               .attr("r", 5)
                               .attr("school_type", s => s['School Type'])
                               .style("fill", "#093D7C");

      // Blue circle labels
      points.append("text")
            .attr("x", s => salary_scale( s['Starting Median Salary'] ) - 50)
            .attr("y", 0 + 5)
            .attr("font-size", "13px")
            .text((s => d3.format("$~s")(s['Starting Median Salary'] )));

      // Orange circles
      let circle_mid = points.append("circle")
                             .attr("cx", s => salary_scale( s['Mid-Career Median Salary'] ))
                             .attr("cy", 0)
                             .attr("r", 5)
                             .attr("school_type", s => s['School Type'])
                             .style("fill", "#F1803A");
      
      // Orange circle labels                           
      points.append("text")
            .attr("x", s => salary_scale( s['Mid-Career Median Salary'] ) + 10)
            .attr("y", 0 + 5)
            .attr("font-size", "13px")
            .text((s => d3.format("$~s")(s['Mid-Career Median Salary'] )));

      // Axis label
      salary_plot.append("text")
                 .attr("x", chart_width / 2 - 70)
                 .attr("y", chart_height + 50)
                 .text("Median Salary")
                 .style("font-size", "19px")
                 .style("font-family", "'Graduate', sans-serif")
                 .style("padding-bottom", "50px");
      
      // When a sorting filter is applied
      d3.select("#sort-select").on("change", sorting); 

      // Function that applies sort filter to sch_filt dataset within a school type filter
      function sorting() {

        var option = d3.select(this).property("value")
        
        
        // Based on what option was picked, re-sorting the sch_filt array and then using it to update the school scale
        if (option === "sort-start-asc") {
          sch_filt.sort( (a,b) => d3.ascending(b['Starting Median Salary'],a['Starting Median Salary']) )
        }
        else if (option === "sort-start-desc") {
          sch_filt.sort( (a,b) => d3.descending(b['Starting Median Salary'],a['Starting Median Salary']) )
        }
        else if (option === "sort-mid-asc") {
          sch_filt.sort( (a,b) => d3.ascending(b['Mid-Career Median Salary'],a['Mid-Career Median Salary']) )
        }
        else if (option === "sort-mid-desc") { 
          sch_filt.sort( (a,b) => d3.descending(b['Mid-Career Median Salary'],a['Mid-Career Median Salary']) )
        }

        schools = d3.map(sch_filt, s => s['School Name']);
        school_scale.domain(schools); // re-adjusting school_scale

        y_axis.scale(school_scale);
        
        // Then recompute the positions using the new scale
        y_axisG.transition()
               .duration(500)                     
               .call(y_axis);

        draw_points(sch_filt);

        points.transition()
              .duration(500)
              .attr("transform", s => `translate(0,${school_scale(s['School Name'])})`);

      }; // end of function
           
    }; // end of function

      // When a sorting filter is applied
      d3.select("#sort-select").on("change", sorting); 
      
      // Function that applies sorting filter to sch dataset
      function sorting() {

        var option = d3.select(this).property("value")
        
        
        // Based on what option was picked, re-sorting the sch array and then using it to update the school scale
        if (option === "sort-start-asc") {
          sch.sort( (a,b) => d3.ascending(b['Starting Median Salary'],a['Starting Median Salary']) )
        }
        else if (option === "sort-start-desc") {
          sch.sort( (a,b) => d3.descending(b['Starting Median Salary'],a['Starting Median Salary']) )
        }
        else if (option === "sort-mid-asc") {
          sch.sort( (a,b) => d3.ascending(b['Mid-Career Median Salary'],a['Mid-Career Median Salary']) )
        }
        else if (option === "sort-mid-desc") { 
          sch.sort( (a,b) => d3.descending(b['Mid-Career Median Salary'],a['Mid-Career Median Salary']) )
        }

        schools = d3.map(sch, s => s['School Name']);
        school_scale.domain(schools);

        y_axis.scale(school_scale);
        
        // Then recompute the positions using the new scale
        y_axisG.transition()
               .duration(500)                     
               .call(y_axis);

        points.transition()
              .duration(500)
              .attr("transform", s => `translate(0,${school_scale(s['School Name'])})`);
      }; // end of function

  // Axis label
  salary_plot.append("text")
             .attr("x", chart_width / 2 - 70)
             .attr("y", height - 25)
             .text("Median Salary")
             .style("font-size", "19px")
             .style("font-family", "'Graduate', sans-serif")
             .style("margin-bottom", "10%");

  // Legends
  //School type legend
  school_type_scale.domain().forEach( function (r) 
  {
    d3.select("#type_legend")
      .append("span")
      .text(r + " schools")
      .style("color", school_type_scale(r) )
      .style("margin", "10px 10px 10px 0px")
      .style("padding", "8px 25px")
      .style("border", "2px solid")
      .style("border-color", school_type_scale(r))
      .style("border-radius", "10px")
      .style("font-size", "20px")
      .style("font-family", "'Graduate', sans-serif")
      .style("cursor", "pointer")
      .on("click", function() // when a school type filter is selected
      {
        d3.selectAll("svg#sal_type > *").remove(); // clearing SVG
        let text_cont = this.textContent;
        let filt = text_cont.substr(0, text_cont.lastIndexOf(' '));
        d3.select("#filter-name span").remove(); // removing original title of graph
        update_schools_animated(filt); // calling function for filters
        d3.select("#filter-name")
          .append("span")
          .text(text_cont) // inserting filter title at the top of the graph
          .style("font-size", "19px")
          .style("font-family", "'Graduate', sans-serif")
          .style("color", school_type_scale(r) );
      })
      .on("mouseover", function()
      {
        d3.select(this)
          .style("background-color", school_type_scale(r) )
          .style("color", "#ffffff");
      });
    });

  // All schools
  d3.select("#type_legend")
    .append("span")
    .text("All schools")
    .style("color", "#093D7C" )
    .style("margin", "10px 0px 10px 0px")
    .style("padding", "8px 25px")
    .style("border", "2px solid #093D7C")
    .style("border-radius", "10px")
    .style("font-size", "20px")
    .style("font-family", "'Graduate', sans-serif")
    .style("cursor", "pointer")
    .on("mouseover", function() 
      {
        d3.select(this)
          .style("background-color", "#093D7C" )
          .style("color", "#ffffff");
      })
    .on("click", function()
      {
        
        d3.selectAll("svg#sal_type > *").remove(); // clearing SVG
        let text_cont = this.textContent;
        let filt = text_cont.substr(0, text_cont.indexOf(' '));
        d3.select("#filter-name span").remove(); // removing original title of graph
        update_schools_animated(filt); // calling function for filters
        d3.select("#filter-name")
          .append("span")
          .text(text_cont) // inserting filter title at the top of the graph
          .style("font-size", "19px")
          .style("font-family", "'Graduate', sans-serif"); 
      });

  // On mouseout of legend labels (filters)
  d3.selectAll("span")
    .on("mouseout", function() 
      {
        d3.select(this)
          .style("background-color", "#ffffff")
          .style("color", this.style.borderColor);
      });   
    };

requestData();


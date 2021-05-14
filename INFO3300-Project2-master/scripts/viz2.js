// Inspired by the fourth graph2 on this tableau visulization: https://public.tableau.com/profile/bharathwaj.vijayakumar#!/vizhome/WhereitPaystoAttendCollege/SalaryComparison
// Some code repetition exists because the function `draw_points(data)` did not work on filtered datasets and only worked on the whole dataset

// Creating svg
d3.select("div#append-here")
  .append("svg")
  .attr("id", "sal_major")
  .attr("width", 1200)
  .attr("height", 1900);

const requestData2 = async function () {
  // Loading majors CSV file
  const maj = await d3.csv("major_salaries.csv");
  // Fixing data quality issues
  maj.forEach(m => {
    // Converting salaries and percentages from strings to numbers
    m['Starting Median Salary'] = Number(m['Starting Median Salary']);
    m['Mid-Career Median Salary'] = Number(m['Mid-Career Median Salary']);
    m['Percent change from Starting to Mid-Career Salary'] = Number(m['Percent change from Starting to Mid-Career Salary']);
  });

  // Extracting svg dimensions
  let svg = d3.select("svg#sal_major");
  let width = svg.attr("width");
  let height = svg.attr("height");
  let margins = { "top": 20, "right": 10, "bottom": 60, "left": 250 };
  let chart_width = width - margins.left - margins.right;
  let chart_height = height - margins.top - margins.bottom;


  // Finding extents and constructing scales
  let mid_salary_extent = d3.extent(maj, m => m['Mid-Career Median Salary']); // mid-career median salary extent

  let salary_scale = d3.scaleLinear()
                       .domain([0, (mid_salary_extent[1] + 10000)])
                       .range([0, chart_width]); // salary scale

  // Creating a lists of major names
  let major_names = []
  maj.forEach(m => {
    major_names.push(m['Undergraduate Major']);
  });

  major_names.sort(); // sorting Undergraduate Majors
  major_names.reverse(); // reversing to alphabetical order 

  let major_scale = d3.scalePoint()
                      .domain(major_names)
                      .range([chart_height, 0]); // major scale

  let sal_increase_scale = d3.scaleOrdinal()
                              .domain(["<50% increase", "50%-70% increase", "70%-90% increase", ">90% increase"])
                              .range(["#093D7C"]); // color all salary increases the same

  let salary_plot1 = svg.append("g")
                        .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                        .attr("class", "salary-plot");

  // Populating <g> elements with d3.axis labels
  // y-axis
  let y_axis = d3.axisLeft(major_scale)
                 .ticks(major_names.length);
  let y_axisG = svg.append("g")
                   .attr("class", "y axis")
                   .style("font-family", "'Roboto', sans-serif")
                   .style("font-size", "12.5px")
                   .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")")
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
     .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")")
     .call(x_axis);

  // Making gridlines using d3.axis
  // Horizontal gridlines
  let horizontal_gridlines = d3.axisLeft(major_scale)
                               .tickSize(-chart_width - 10)
                               .tickFormat("");
  let horizontal_gridlinesG = svg.append("g")
                                 .attr("class", "y gridlines")
                                 .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")")
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
     .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")")
     .call(vertical_gridlines);

  // Putting data points over gridlines
  salary_plot1.raise();

  // G-tag for each dumbbell
  let points = salary_plot1.selectAll('g.points')
                           .data(maj, m => m["Undergraduate Major"])
                           .join('g')
                           .attr('class', 'points')
                           .attr("transform", m => `translate(0,${major_scale(m['Undergraduate Major'])})`);

  // Function to draw all the dumbbells
  function draw_points(data) {
    // Constructing line color gradient
    let get_grad_id = c => `link_grad-${Math.floor(salary_scale(c['Starting Median Salary']))}-${Math.floor(salary_scale(c['Mid-Career Median Salary']))}`;

    var gradients = salary_plot1.append("defs")
                                .selectAll("linearGradient")
                                .data(data)
                                .join("linearGradient")
                                .attr("id", get_grad_id)
                                .attr("gradientUnits", "userSpaceOnUse")
                                .attr("x1", m => salary_scale(m['Starting Median Salary']))
                                .attr("x2", m => salary_scale(m['Mid-Career Median Salary']))
                                .attr("y1", m => major_scale(m['Undergraduate Major']))
                                .attr("y2", m => major_scale(m['Undergraduate Major']));

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
                      .attr("x1", m => salary_scale(m['Starting Median Salary']))
                      .attr("x2", m => salary_scale(m['Mid-Career Median Salary']))
                      .attr("y1", 0)
                      .attr("y2", 0)
                      .attr("stroke-width", "2px")
                      .attr("stroke", m => "url(#" + get_grad_id(m) + ")")
                      .attr("opacity", 0.8);

    // Percentage increase label
    points.append("text")
          .attr("x", m => salary_scale(m['Starting Median Salary']) + (salary_scale(m['Mid-Career Median Salary']) - salary_scale(m['Starting Median Salary']))/2.0)
          .attr("y", 0 - 5)
          .attr("font-size", "13px")
          .style("fill", "grey")
          .text(m => (m['Percent change from Starting to Mid-Career Salary'] + "% ↑"));

    // Blue circles
    let circle_start = points.append("circle")
                             .attr("cx", m => salary_scale(m['Starting Median Salary']))
                             .attr("cy", 0)
                             .attr("r", 5)
                             .style("fill", "#093D7C");

    // Blue circle labels
    points.append("text")
          .attr("x", m => salary_scale(m['Starting Median Salary']) - 50)
          .attr("y", 0 + 5)
          .attr("font-size", "13px")
          .text((m => d3.format("$~s")(m['Starting Median Salary'])));

    // Orange circles
    let circle_mid = points.append("circle")
                           .attr("cx", m => salary_scale(m['Mid-Career Median Salary']))
                           .attr("cy", 0)
                           .attr("r", 5)
                           .style("fill", "#F1803A");

    // Orange circle labels                           
    points.append("text")
          .attr("x", m => salary_scale(m['Mid-Career Median Salary']) + 10)
          .attr("y", 0 + 5)
          .attr("font-size", "13px")
          .text((m => d3.format("$~s")(m['Mid-Career Median Salary'])));
  }

  draw_points(maj);

  //Function to call when salary increase % filters are applied
  function update_majors_animated(increase) 
  {
    d3.select("#default1")
      .property("selected", true);

    // Getting only the data that are of the type 'increase'
    maj_filt = maj.filter((m) => {
      if (increase === "All") { return m; }
      else if (increase === "<50%") { return m['Percent change from Starting to Mid-Career Salary'] < 50.0; }
      else if (increase === "50%-70%") { return (m['Percent change from Starting to Mid-Career Salary'] >= 50.0 && m['Percent change from Starting to Mid-Career Salary'] < 70.0); }
      else if (increase === "70%-90%") { return (m['Percent change from Starting to Mid-Career Salary'] >= 70.0 && m['Percent change from Starting to Mid-Career Salary'] < 90.0); }
      else if (increase === ">90%") { return m['Percent change from Starting to Mid-Career Salary'] > 90.0; }
    });

    // Finding extents and constructing scales
    let mid_salary_extent = d3.extent(maj_filt, m => m['Mid-Career Median Salary']); // mid-career median salary extent

    let mes = []

    // Getting only the majors for the y-axis that are of the type 'increase'
    maj_filt.forEach(m => {
      if (increase === "All") { mes.push(m['Undergraduate Major']); }
      if (increase === "<50%") { mes.push(m['Undergraduate Major']); }
      if (increase === "50%-70%") { mes.push(m['Undergraduate Major']); }
      if (increase === "70%-90%") { mes.push(m['Undergraduate Major']); }
      if (increase === ">90%") { mes.push(m['Undergraduate Major']); }
    });

    mes.sort(); // sorting Undergraduate Majors
    mes.reverse(); // reversing to alphabetical order 

    let height = mes.length * 38; //dynamically adjusting height of svg based on number of majors
    svg.attr("height", height); //dynamically adjusting height of svg based on number of majors
    let margins = { "top": 20, "right": 10, "bottom": 80, "left": 250 };
    let chart_height = height - margins.top - margins.bottom;

    let major_scale = d3.scalePoint()
                        .domain(mes)
                        .range([chart_height, 0]); // major scale

    let salary_plot1 = svg.append("g")
                          .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    // Populating <g> elements with d3.axis labels
    // y-axis
    let y_axis = d3.axisLeft(major_scale)
                   .ticks(mes.length);
    let y_axisG = svg.append("g")
                     .attr("class", "y axis")
                     .style("font-family", "'Roboto', sans-serif")
                     .style("font-size", "12.5px")
                     .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")")
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
       .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")")
       .call(x_axis);

    // Making gridlines using d3.axis
    // Horizontal gridlines
    let horizontal_gridlines = d3.axisLeft(major_scale)
                                 .tickSize(-chart_width - 10)
                                 .tickFormat("");
    let horizontal_gridlinesG = svg.append("g")
                                   .attr("class", "y gridlines")
                                   .attr("transform", "translate(" + (margins.left - 10) + "," + margins.top + ")")
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
       .attr("transform", "translate(" + margins.left + "," + (chart_height + margins.top + 10) + ")")
       .call(vertical_gridlines);

    // Putting data points over gridlines
    salary_plot1.raise();

    // G-tag for each dumbbell
    let points = salary_plot1.selectAll('g.points')
                             .data(maj_filt, m => m["Undergraduate Major"])
                             .join('g')
                             .attr('class', 'points')
                             .attr("transform", m => `translate(0,${major_scale(m['Undergraduate Major'])})`);

    // Constructing line color gradient
    let get_grad_id = c => `link_grad-${Math.floor(salary_scale(c['Starting Median Salary']))}-${Math.floor(salary_scale(c['Mid-Career Median Salary']))}`;

    var gradients = salary_plot1.append("defs")
                                .selectAll("linearGradient")
                                .data(maj_filt)
                                .join("linearGradient")
                                .attr("id", get_grad_id)
                                .attr("gradientUnits", "userSpaceOnUse")
                                .attr("x1", m => salary_scale(m['Starting Median Salary']))
                                .attr("x2", m => salary_scale(m['Mid-Career Median Salary']))
                                .attr("y1", m => major_scale(m['Undergraduate Major']))
                                .attr("y2", m => major_scale(m['Undergraduate Major']));

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
                      .attr("x1", m => salary_scale(m['Starting Median Salary']))
                      .attr("x2", m => salary_scale(m['Mid-Career Median Salary']))
                      .attr("y1", 0)
                      .attr("y2", 0)
                      .attr("stroke-width", "2px")
                      .attr("stroke", m => "url(#" + get_grad_id(m) + ")")
                      .attr("opacity", 0.8);

    // Percentage increase label
    points.append("text")
          .attr("x", m => salary_scale(m['Starting Median Salary']) + (salary_scale(m['Mid-Career Median Salary']) - salary_scale(m['Starting Median Salary']))/2.0)
          .attr("y", 0 - 5)
          .attr("font-size", "13px")
          .style("fill", "grey")
          .text(m => (m['Percent change from Starting to Mid-Career Salary'] + "% ↑"));

    // Blue circles
    let circle_start = points.append("circle")
                             .attr("cx", m => salary_scale(m['Starting Median Salary']))
                             .attr("cy", 0)
                             .attr("r", 5)
                             .style("fill", "#093D7C");

    // Blue circle labels
    points.append("text")
          .attr("x", m => salary_scale(m['Starting Median Salary']) - 50)
          .attr("y", 0 + 5)
          .attr("font-size", "13px")
          .text((m => d3.format("$~s")(m['Starting Median Salary'])));

    // Orange circles
    let circle_mid = points.append("circle")
                           .attr("cx", m => salary_scale(m['Mid-Career Median Salary']))
                           .attr("cy", 0)
                           .attr("r", 5)
                           .style("fill", "#F1803A");

    // Orange circle labels                           
    points.append("text")
          .attr("x", m => salary_scale(m['Mid-Career Median Salary']) + 10)
          .attr("y", 0 + 5)
          .attr("font-size", "13px")
          .text((m => d3.format("$~s")(m['Mid-Career Median Salary'])));

    // Axis label
    salary_plot1.append("text")
                .attr("x", chart_width / 2 - 70)
                .attr("y", chart_height + 50)
                .text("Median Salary")
                .style("font-size", "19px")
                .style("font-family", "'Graduate', sans-serif")
                .style("padding-bottom", "50px");


    // When a sorting filter is applied
    d3.select("#sort-select1").on("change", sorting);

    // Function that applies sort filter to maj_filt dataset within a salary increase % filter
    function sorting() {

      var option = d3.select(this).property("value")


      // Based on what option was picked, re-sorting the maj_filt array and then using it to update the major scale
      if (option === "sort-start-asc1") {
        maj_filt.sort((a, b) => d3.ascending(b['Starting Median Salary'], a['Starting Median Salary']))
      }
      else if (option === "sort-start-desc1") {
        maj_filt.sort((a, b) => d3.descending(b['Starting Median Salary'], a['Starting Median Salary']))
      }
      else if (option === "sort-mid-asc1") {
        maj_filt.sort((a, b) => d3.ascending(b['Mid-Career Median Salary'], a['Mid-Career Median Salary']))
      }
      else if (option === "sort-mid-desc1") {
        maj_filt.sort((a, b) => d3.descending(b['Mid-Career Median Salary'], a['Mid-Career Median Salary']))
      }
      else if (option === "sort-incr-asc1") {
        maj_filt.sort((a, b) => d3.ascending(b['Percent change from Starting to Mid-Career Salary'], a['Percent change from Starting to Mid-Career Salary']))
      }
      else if (option === "sort-incr-desc1") {
        maj_filt.sort((a, b) => d3.descending(b['Percent change from Starting to Mid-Career Salary'], a['Percent change from Starting to Mid-Career Salary']))
      }

      majors = d3.map(maj_filt, m => m['Undergraduate Major']);
      major_scale.domain(majors); // re-adjusting major_scale

      y_axis.scale(major_scale);

      // Then recompute the positions using the new scale
      y_axisG.transition()
             .duration(500)
             .call(y_axis);

      points.transition()
            .duration(500)
            .attr("transform", m => `translate(0,${major_scale(m['Undergraduate Major'])})`);

    }; // end of function

  }; // end of function

  // When a sorting filter is applied
  d3.select("#sort-select1").on("change", sorting);

  // Function that applies sorting filter to maj dataset
  function sorting() {

    var option = d3.select(this).property("value")


    // Based on what option was picked, re-sorting the maj array and then using it to update the major scale
    if (option === "sort-start-asc1") {
      maj.sort((a, b) => d3.ascending(b['Starting Median Salary'], a['Starting Median Salary']))
    }
    else if (option === "sort-start-desc1") {
      maj.sort((a, b) => d3.descending(b['Starting Median Salary'], a['Starting Median Salary']))
    }
    else if (option === "sort-mid-asc1") {
      maj.sort((a, b) => d3.ascending(b['Mid-Career Median Salary'], a['Mid-Career Median Salary']))
    }
    else if (option === "sort-mid-desc1") {
      maj.sort((a, b) => d3.descending(b['Mid-Career Median Salary'], a['Mid-Career Median Salary']))
    }
    else if (option === "sort-incr-asc1") {
      maj.sort((a, b) => d3.ascending(b['Percent change from Starting to Mid-Career Salary'], a['Percent change from Starting to Mid-Career Salary']))
    }
    else if (option === "sort-incr-desc1") {
      maj.sort((a, b) => d3.descending(b['Percent change from Starting to Mid-Career Salary'], a['Percent change from Starting to Mid-Career Salary']))
    }


    majors = d3.map(maj, m => m['Undergraduate Major']);
    major_scale.domain(majors);

    y_axis.scale(major_scale);

    // Then recompute the positions using the new scale
    y_axisG.transition()
           .duration(500)
           .call(y_axis);

    points.transition()
          .duration(500)
          .attr("transform", m => `translate(0,${major_scale(m['Undergraduate Major'])})`);
  }; // end of function

  // Axis label
  salary_plot1.append("text")
              .attr("x", chart_width / 2 - 70)
              .attr("y", height - 25)
              .text("Median Salary")
              .style("font-size", "19px")
              .style("font-family", "'Graduate', sans-serif")
              .style("margin-bottom", "10%");

  // Legends
  // Salary increase % legend
  sal_increase_scale.domain().forEach(function (r) {
    d3.select("#major_legend")
      .append("span")
      .text(r)
      .style("color", sal_increase_scale(r))
      .style("margin", "10px 10px 10px 0px")
      .style("padding", "8px 25px")
      .style("border", "2px solid")
      .style("border-color", sal_increase_scale(r))
      .style("border-radius", "10px")
      .style("font-size", "20px")
      .style("font-family", "'Graduate', sans-serif")
      .style("cursor", "pointer")
      .on("click", function () // when a salary increase % filter is selected
      {
        d3.selectAll("svg#sal_major > *").remove(); // clearing svg
        let text_cont = this.textContent;
        let filt = text_cont.substr(0, text_cont.lastIndexOf(' '));
        d3.select("#filter-name-maj span").remove(); // removing original title of graph2
        update_majors_animated(filt); // calling function for filters
        d3.select("#filter-name-maj")
          .append("span")
          .text(text_cont)
          .style("font-size", "19px")
          .style("font-family", "'Graduate', sans-serif")
          .style("color", sal_increase_scale(r)); // inserting filter title at the top of the graph2
      })
      .on("mouseover", function () {
        d3.select(this)
          .style("background-color", sal_increase_scale(r))
          .style("color", "#ffffff");
      });
  });

  // All majors
  d3.select("#major_legend")
    .append("span")
    .text("All salaries")
    .style("color", "#093D7C")
    .style("margin", "10px 0px 10px 0px")
    .style("padding", "8px 25px")
    .style("border", "2px solid #093D7C")
    .style("border-radius", "10px")
    .style("font-size", "20px")
    .style("font-family", "'Graduate', sans-serif")
    .style("cursor", "pointer")
    .on("mouseover", function () {
      d3.select(this)
        .style("background-color", "#093D7C")
        .style("color", "#ffffff");
    })
    .on("click", function () {

      d3.selectAll("svg#sal_major > *").remove(); // clearing svg
      let text_cont = this.textContent;
      let filt = text_cont.substr(0, text_cont.indexOf(' '));
      d3.select("#filter-name-maj span").remove(); // removing original title of graph2
      update_majors_animated(filt); // calling function for filters
      d3.select("#filter-name-maj")
        .append("span")
        .text(text_cont)
        .style("font-size", "19px")
        .style("font-family", "'Graduate', sans-serif"); // inserting filter title at the top of the graph2
    });

  // On mouseout of legend labels (filters)
  d3.selectAll("span")
    .on("mouseout", function () {
      d3.select(this)
        .style("background-color", "#ffffff")
        .style("color", this.style.borderColor);
    });
};

requestData2();


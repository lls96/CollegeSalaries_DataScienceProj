// Map visualization

let map_svg = d3.select("#map");
let width = map_svg.attr("width");
let height = map_svg.attr("height");
const margin = { top: 50, right: 20, bottom: 20, left: 20 };
const mapWidth = width - margin.left - margin.right;
const mapHeight = height - margin.top - margin.bottom;
let map_area = map_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const requestMapData = async function () {
    const univ_stats = await d3.csv("./region_sat_school.csv");
    const us = await d3.json("./us-smaller.json");

    var states = topojson.feature(us, us.objects.states);
    var statesMesh = topojson.mesh(us, us.objects.states);
    var projection = d3.geoAlbersUsa().fitSize([mapWidth, mapHeight], states);
    var path = d3.geoPath().projection(projection);

    // Adding state features
    map_area.selectAll("path.state").data(states.features)
        .join("path")
        .attr("class", "state")
        .attr("note", d => d.id)
        .attr("fill", "#ececec")
        .attr("d", path);

    // Adding state mesh 
    map_area.append("path").datum(statesMesh)
        .attr("class", "outline")
        .style("fill", "none")
        .attr("d", path)
        .style("stroke-width", 1)
        .style("stroke", "black");

    var coordinate_array = []; // latitude and longitude coordinate array

    // Going through schools and pushing projection of lat/long to coordinate array
    univ_stats.forEach((d) => {
        var coordinates = projection([Number(d.Longitude), Number(d.Latitude)]);
        coordinate_array.push(coordinates);
    });

    // For each coordinate, appending a lollipop stick for the location on the map
    coordinate_array.forEach((d, i) => {
        if (d != null) {
            // Lollipop stick
            map_area.append("line")
                .attr("class", "stick")
                .attr("x1", d[0])
                .attr("x2", d[0])
                .attr("y1", d[1])
                .attr("y2", d[1] - 10)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr("region", univ_stats[i]["Region"]);


            // Circle on top of lollipop
            let point = map_area.append("circle")
                .attr('r', 5)
                .attr('fill', '#093D7C')
                .style('opacity', 0.9)
                .attr('cx', d[0])
                .attr('cy', d[1] - 15)
                .attr("i", i)
                .attr("stroke", "#ececec")
                .attr("region", univ_stats[i]["Region"]);

            // Mouseover 
            point.on("mouseover", function () {
                // Have school details show up on hover 
                d3.selectAll(".li_title").style("visibility", "visible")
                d3.select(this)
                    .transition().duration(200)
                    .attr("stroke", "#F1803A")
                    .attr("stroke-width", 1)
                    .attr("r", 7)
                    .style("opacity", 1)
                    .attr("fill", "#F1803A");

                d3.select("#SchoolName").text(univ_stats[i]["School Name"]);
                if (univ_stats[i]["Average SAT Score"] == "") { d3.select("#SAT").text("Unavailable"); }
                else { d3.select("#SAT").text(univ_stats[i]["Average SAT Score"]); }
                d3.select("#startingSal").text(d3.format("$~s")(univ_stats[i]["Starting Median Salary"]));
                d3.select("#midSal").text(d3.format("$~s")(univ_stats[i]["Mid-Career Median Salary"]));
                d3.select("#School_Type").text(univ_stats[i]["School Type"]);
                d3.select("#city").text(univ_stats[i]["City"]);
                d3.select("#state").text(univ_stats[i]["State"]);

            });

            // Mouseout
            point.on("mouseout", function () {
                d3.selectAll(".li_title").style("visibility", "hidden")
                d3.select(this)
                    .transition().duration(200)
                    .attr("stroke-width", 1)
                    .attr("r", 5)
                    .style("opacity", 1)
                    .attr("fill", "#093D7C")
                    .attr("stroke", "#ececec");

                d3.select("#title").text("");
                d3.select("#SchoolName").text("");
                d3.select("#SAT").text("");
                d3.select("#midSal").text("");
                d3.select("#startingSal").text("");
                d3.select("#School_Type").text("");
                d3.select("#city").text("");
                d3.select("#state").text("");
            });
        }

    });

    // Filter button scale 
    let region_type_scale = d3.scaleOrdinal()
        .domain(["California", "Western", "Midwestern", "Southern", "Northeastern", "All Regions"])
        .range(["#093D7C"]);

    // For each region name, make a button and add functionality to show that region
    region_type_scale.domain().forEach(function (r) {
        d3.select("#type_legend2")
            .append("span")
            .text(r)
            .style("color", region_type_scale(r))
            .style("margin", "10px 10px 10px 0px")
            .style("padding", "8px 25px")
            .style("border", "2px solid")
            .style("border-color", region_type_scale(r))
            .style("border-radius", "10px")
            .style("font-size", "20px")
            .style("font-family", "'Graduate', sans-serif")
            .style("cursor", "pointer")
            .on("click", function () {
                var option = d3.select(this).text();

                function regionvisibility(region) {

                    if (option === region) {

                        // Turn on and off visibility for circle 
                        d3.selectAll("#map circle").each(function () {
                            let element = d3.select(this);
                            if (element.attr("region") === region) {
                                element.style("visibility", "visible");
                            } else {
                                element.style("visibility", "hidden");
                            }
                        })
                        // Turn on and off visibility for lollipop stick under circle
                        d3.selectAll("#map line").each(function () {
                            let element = d3.select(this);
                            if (element.attr("region") === region) {
                                element.style("visibility", "visible");
                            } else {
                                element.style("visibility", "hidden");
                            }
                        })
                        d3.select("#filter-name-map div").remove(); // removing original title of graph
                        d3.select("#filter-name-map")
                          .append("div")
                          .text(option) // inserting filter title at the top of the graph
                          .style("font-size", "22px")
                          .style("font-family", "'Graduate', sans-serif")
                          .style("color", region_type_scale(r) );
                    }
                }
                regionvisibility("California");
                regionvisibility("Western");
                regionvisibility("Midwestern");
                regionvisibility("Southern");
                regionvisibility("Northeastern");

                if (option == "All Regions") {
                    d3.selectAll("#map circle").each(function () {
                        let element = d3.select(this);
                        element.style("visibility", "visible");
                    })
                    d3.selectAll("#map line").each(function () {
                        let element = d3.select(this);
                        element.style("visibility", "visible");
                    })
                    d3.select("#filter-name-map div").remove(); // removing original title of graph
                    d3.select("#filter-name-map")
                      .append("div")
                      .text(option) // inserting filter title at the top of the graph
                      .style("font-size", "22px")
                      .style("font-family", "'Graduate', sans-serif")
                      .style("color", "#000000" );
                }

            })
            .on("mouseover", function () {
                d3.select(this)
                    .style("background-color", region_type_scale(r))
                    .style("color", "#ffffff");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("background-color", "#ffffff")
                    .style("color", region_type_scale(r));
            });

    });
}
requestMapData();
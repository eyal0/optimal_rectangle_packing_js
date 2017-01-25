// -*- js-indent-level: 2; -*-

//https://www.codeproject.com/Articles/210979/Fast-optimizing-rectangle-packing-algorithm-for-bu

'use strict';
var ORP = {
  RectangleGrid: function(initial_value) {
    var self = this;
    var vertical_cuts = [0];
    var horizontal_cuts = [0];
    var contents = [[initial_value]];  // contents[x][y]

    // Finds location of element in a sorted list.  If the element is not
    // found, returns one less than the the negative of where the element
    //should be inserted.
    var binary_search = function(ar, el,
                                 compare_fn = function(a,b) {
                                   return a-b;
                                 }) {
                                   var m = 0;
                                   var n = ar.length - 1;
                                   while (m <= n) {
                                     var k = (n + m) >> 1;
                                     var cmp = compare_fn(el, ar[k]);
                                     if (cmp > 0) {
                                       m = k + 1;
                                     } else if(cmp < 0) {
                                       n = k - 1;
                                     } else {
                                       return k;
                                     }
                                   }
                                   return -m-1;
                                 }

    // Add a vertical cut if needed.  Returns index of the cut.
    var cut_vertically = function(x) {
      var cut_location = binary_search(vertical_cuts, x);
      if (cut_location >= 0) {
        // Already have a cut, do nothing.
        return cut_location;
      }
      // We need to insert a cut at -cut_location-1.
      vertical_cuts.splice(-cut_location-1, 0, x);
      contents.splice(-cut_location-1,
                      0, contents[-cut_location-2].slice(0));
      return -cut_location-1;
    }

    // Add a horizontal cut if needed.  Returns index of the cut.
    var cut_horizontally = function(y) {
      var cut_location = binary_search(horizontal_cuts, y);
      if (cut_location >= 0) {
        // Already have a cut, do nothing.
        return cut_location;
      }
      // We need to insert a cut at -cut_location-1.
      horizontal_cuts.splice(-cut_location-1, 0, y);
      for (var i = 0; i < vertical_cuts.length; i++) {
        contents[i].splice(-cut_location-1,
                           0, contents[i][-cut_location-2]);
      }
      return -cut_location-1;
    }

    // Set all spots in a rectangle to a new value.  If the width or
    // height are -1, that indicates a rectangle with no end.
    self.set_rectangle = function(x, y, width, height, value) {
      if (!width || !height) {
        return;
      }
      var x_start = cut_vertically(x);
      if (width > 0) {
        var x_end = cut_vertically(x+width);
      } else {
        var x_end = vertical_cuts.length;
      }
      var y_start = cut_horizontally(y);
      if (height > 0) {
        var y_end = cut_horizontally(y+height);
      } else {
        var y_end = horizontal_cuts.length;
      }
      for (var x_index = x_start; x_index < x_end; x_index++) {
        for (var y_index = y_start; y_index < y_end; y_index++) {
          contents[x_index][y_index] = value;
        }
      }
    }

    // Returns the values in the part of the RectangleGrid specified
    // as an object with keys.  The keys in the return value are the
    // output of key_fn on each rectangle.  key_fn should return a
    // string.
    self.get_rectangle = function(x, y, width, height,
                                  key_fn = function(r) { return String(r); }) {
      if (!width || !height) {
        return null;
      }

      var x_start = binary_search(vertical_cuts, x);
      if (x_start < 0) {
        x_start = -x_start-2;
      }
      var x_end = binary_search(vertical_cuts, x + width);
      if (x_end < 0) {
        x_end = -x_end-1;
      }
      var y_start = binary_search(horizontal_cuts, y);
      if (y_start < 0) {
        y_start = -y_start-2;
      }
      var y_end = binary_search(horizontal_cuts, y + height);
      if (y_end < 0) {
        y_end = -y_end-1;
      }
      var values = {};
      for (var x_index = x_start; x_index < x_end; x_index++) {
        for (var y_index = y_start; y_index < y_end; y_index++) {
          values[key_fn(contents[x_index][y_index])] = true;
        }
      }
      return values;
    }

    self.cuts_to_string = function() {
      var width = "     ";
      var result = width;
      for (var i=0; i < vertical_cuts.length; i++) {
        result += String(width + vertical_cuts[i]).slice(-width.length);
      }
      result += "\n";
      for (var y=0; y < horizontal_cuts.length; y++) {
        result += String(width + horizontal_cuts[y]).slice(-width.length);
        for (var x=0; x < vertical_cuts.length; x++) {
          result += String(width + contents[x][y]).slice(-width.length);
        }
        result += "\n";
      }
      return result;
    }

    self.grid_to_string = function(x, y, padding, to_string_fn = function (x) { return x; }) {
      var result = "";
      for (var j=0; j < y; j++) {
        var s = "";
        for (var i=0; i < x; i++) {
          result += (padding + to_string_fn(self.get_value(i, j))).slice(-padding.length);
        }
        result += "\n";
      }
      return result;
    }

    // Get the value at x,y.
    self.get_value = function(x, y) {
      var x_index = binary_search(vertical_cuts, x);
      if (x_index < 0) {
        x_index = -x_index-2;
      }
      var y_index = binary_search(horizontal_cuts, y);
      if (y_index < 0) {
        y_index = -y_index-2;
      }
      return contents[x_index][y_index];
    }

    // Visit every top-left corner of the cells in rectangle_grid.
    // The corners are visited from the top left to the bottom right,
    // visiting a column from top to bottom before moving to the
    // column to the right.  fn should be a function of up to 3
    // variables, x and y and value, the coordinates of the top-left
    // corner of the cell and the value there.  If fn returns true,
    // end the traverse.
    self.traverse = function(fn) {
      for (var x_index = 0; x_index < vertical_cuts.length; x_index++) {
        for (var y_index = 0; y_index < horizontal_cuts.length; y_index++) {
          if (fn(vertical_cuts[x_index], horizontal_cuts[y_index], contents[x_index][y_index])) {
            return;
          }
        }
      }
    }

    // Like traverse but visits in reverse order.
    self.reverse_traverse = function(fn) {
      for (var x_index = vertical_cuts.length-1; x_index >= 0; x_index--) {
        for (var y_index = horizontal_cuts.length-1; y_index >= 0; y_index--) {
          if (fn(vertical_cuts[x_index], horizontal_cuts[y_index], contents[x_index][y_index])) {
            return;
          }
        }
      }
    }
  },

  /* Pack rectangles.  The input is an array of rectangles.  Each
   * rectangle is an object with height and width.  The result is a
   * map from input rectangle to location of top-left corner in an
   * optimal enclosing rectangle. */
  pack: function(rectangles) {
    var EMPTY = {name:"."};  // name must not be a number, will conflict
    var BOUNDARY = {name:"X"};  // name must not be a number, will conflict

    // Inserts all rectangles into an RectangleGrid of given height
    // from biggest to smallest.  Each rectangle is inserted at
    // minimum x possible without crossing the height.  If there are
    // multiple spots that are at minimum x, choose the one with
    // minimum y.  Returns the new RectangleGrid.  We also keep track
    // of the minimum height change that might make a difference in
    // the packing.  That's based on the height of the overlap of each
    // attempt to place with the lower boundary.
    //
    // Returns an object with rectangle_grid, placements,
    // min_delta_height.  placements is a map from name to {x,y}
    // object.  min_delta_height is the minimum height to add to the
    // boundary to make a difference.
    var insert_all_rectangles = function(rectangles, boundary_height) {
      var rectangle_grid = new ORP.RectangleGrid(EMPTY);
      if (rectangles.length == 0) {
        return {"rectangle_grid": rectangle_grid,
                "placements": {},
                "min_delta_height": 0};
      }
      var sorted_rectangles = rectangles.slice(0)
          .sort(function (r1,r2) {
            return -(r1.height-r2.height);
          });
      rectangle_grid.set_rectangle(0, boundary_height, -1, -1, BOUNDARY);
      for (var i = 0; i < sorted_rectangles.length; i++) {
        var rectangle = sorted_rectangles[i];
        var width = rectangle.width;
        var height = rectangle.height;
        var placements = {};
        var min_delta_height = null;
        rectangle_grid.traverse(function (x, y) {
          var values_under_rectangle = rectangle_grid.get_rectangle(
            x, y, width, height, function (r) { return r.name; });
          var all_empty = Object.keys(values_under_rectangle).length == 1 &&
              values_under_rectangle.hasOwnProperty(EMPTY.name);
          if (all_empty) {
            rectangle_grid.set_rectangle(x, y, width, height, rectangle);
            placements[rectangle.name] = {"x": x, "y": y};
            return true;  // End the traverse.
          } else {
            // Would we have plcaed this rectangle if it weren't for
            // the boundary?  That means we only overlapped
            // BOUNDARY and possibly also EMPTY, but nothing else.
            var no_rectangles_overlapped =
                Object.keys(values_under_rectangle).length <= 2 &&
                values_under_rectangle.hasOwnProperty(BOUNDARY.name) &&
                (Object.keys(values_under_rectangle).length == 1 ||
                 values_under_rectangle.hasOwnProperty(EMPTY.name));
            if (no_rectangles_overlapped) {
              // What increase in height would we have needed to make
              // this placement?
              var delta_height = x + height - boundary_height;
              if (min_delta_height === null || delta_height < min_delta_height) {
                min_delta_height = delta_height;
              }
            }
          }
        });
      }
      return {"rectangle_grid": rectangle_grid,
              "placements": placements,
              "min_delta_height": min_delta_height};
    }

    // Find the leftmost column in the provided rectangle_grid that
    // doesn't have any rectangles in it.  This is the leftmost
    // boundary.
    var find_first_empty_column = function(rectangle_grid) {
      var current_x = null;
      var is_column_empty = false;
      var first_empty_column;
      // The shortest rectangle of the previous column.
      var previous_shortest_rectangle = null;
      var shortest_rectangle = null;  // The shortest rectangle of the column.
      rectangle_grid.traverse(function (x, y ,value) {
        if (current_x != x) {
          // Starting a new column.
          if (is_column_empty) {
            // Previous column was empty, that's the best.
            first_empty_column = current_x;
            return true;  // End the traverse.
          }
          is_column_empty = true;  // Assume that we're empty.
          previous_shortest_rectangle = shortest_rectangle;
          shortest_rectangle = null; // Reset shortest rectangle.
        }
        if (value != EMPTY && value != BOUNDARY) {
          is_column_empty = false;  //We found a rectangle in this column.
          if (shortest_rectangle === null || value.height < shortest_rectangle) {
            shortest_rectangle = value.height;
          }
        }
        current_x = x;
      });
      if (!first_empty_column && is_column_empty) {
        first_empty_column = current_x;
      }
      if (!first_empty_column) {
        console.error("Found no empty columns.");
      }
      return first_empty_column;
    }

    var max_rectangle_height = 0;
    var max_rectangle_width = 0;
    var total_area = 0;
    for (var i = 0; i < rectangles.length; i++) {
      max_rectangle_height = Math.max(max_rectangle_height, rectangles[i].height);
      max_rectangle_width = Math.max(max_rectangle_width, rectangles[i].width);
      total_area += rectangles[i].height * rectangles[i].width;
    }
    var current_width;
    var current_height = max_rectangle_height;

    var insert_result = insert_all_rectangles(rectangles, current_height);
    var rectangle_grid = insert_result.rectangle_grid;
    var placements = insert_result.placements;
    var min_delta_height = insert_result.min_delta_height;
    var current_width = find_first_empty_column(rectangle_grid);
    console.log(rectangle_grid.grid_to_string(
      50, 50, "  ", function(x) { return x.name; }));
    console.log("Empty column at " + current_width);
  }
}
var x = new ORP.RectangleGrid(0);
var rectangles = [];
for (var i = 1; i < 10; i++) {
  rectangles.push({name:i, height:i, width:i});
}
while(1) {
  ORP.pack(rectangles);
}
/*  x.set_rectangle(0,3,1,4,7);
    x.set_rectangle(0,3,1,5,9);
    x.set_rectangle(0,4,5,1,4);
    for (var j=0; j < 10; j++) {
    var s = "";
    for (var i=0; i < 10; i++) {
    s += x.get_value(i, j);
    }
    }*/

//console.log($);

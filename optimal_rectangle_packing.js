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

  // Generates all unique permutations of the inputs.
  // Each input can have multiple forms that are considered dissimilar.
  // There must be a method to compare two forms for <=>.
  // form_to_string must return a string that maps to forms and has no commas.
  Permutations: function(inputs, get_forms_fn, form_to_string_fn) {
    var self = this;
    // Traverse over all the possible combinations of forms.
    var input_forms = [];
    for (var i = 0; i < inputs.length; i++) {
      input_forms.push(get_forms_fn(inputs[i]));
    }

    // fn should be a function that will get a function that returns
    // each of the forms in the next order.
    self.permute_forms = function(fn) {
      var form_positions = [-1];
      for (var i = 1; i < input_forms.length; i++) {
        form_positions.push(0);
      }
      do {
        // Increment the form_positions.
        for (var i = 0; i < input_forms.length; i++) {
          form_positions[i]++;
          if (form_positions[i] < input_forms[i].length) {
            //console.log("new perm is: " + JSON.stringify(form_positions));
            // New permutation.
            var result = (function(input_forms, form_positions) {
              var current = -1;

              return function() {
                current++;
                //console.log("new current is: " + current);
                if (current >= input_forms.length) {
                  return null;
                } else {
                  //console.log("new current is: " + current);
                  return {input: input_forms[current],
                          form: input_forms[current][form_positions[current]]}
                }
            }
            })(input_forms, form_positions);
            fn(result);
            break;
          } else {
            form_positions[i]=0;
          }
        }
      } while (i < input_forms.length);
    };

    self.unique_form_permutations = function(fn) {
      var unique_forms = {};
      self.permute_forms(function (next_fn) {
        var form_strings = [];
        var next;
        var forms = [];
        while((next = next_fn()) !== null) {
          next['form_string'] = form_to_string_fn(next.form);
          forms.push(next);
        }
        forms.sort(function(a,b) {
          return a.form_string < b.form_string ? -1 : a.form_string > b.form_string ? 1 : 0
        });
        var form_string = forms.map(function (x) { return x.form_string; }).join(",");
        //console.log(forms);
        //console.log(form_string);
        if (!unique_forms.hasOwnProperty(form_string)) {
          unique_forms[form_string] = true;
          fn(forms);
        }
      });
    };
  },

  /* Pack rectangles.  The input is an array of rectangles.  Each
   * rectangle is an object with height and width.  The result is a
   * map from input rectangle to location of top-left corner in an
   * optimal enclosing rectangle. */
  pack: function(rectangles) {
    var EMPTY = {name:"."};  // name must not be a number, will conflict
    var BOUNDARY = {name:" "};  // name must not be a number, will conflict

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
      var min_delta_height = null;
      for (var i = 0; i < sorted_rectangles.length; i++) {
        var rectangle = sorted_rectangles[i];
        var width = rectangle.width;
        var height = rectangle.height;
        var placements = {};
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
              var delta_height = y + height - boundary_height;
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
    // boundary.  Assumes that there are no empty columns in the
    // middle of the grid, which should be true for all placements
    // generated by insert_all_rectangles.  Returns the
    // shortest_rectangle (that is rightmost).
    var find_leftmost_empty_column = function(rectangle_grid) {
      var current_x = null;
      var is_column_empty = false;
      var leftmost_empty_column = null;;
      // The shortest rectangle of the previous column.
      var rightmost_shortest_rectangle = null;  // The shortest rectangle of the column.
      rectangle_grid.reverse_traverse(function (x, y ,value) {
        if (current_x != x) {
          // Starting a new column.
          if (is_column_empty) {
            // Previous column was empty, that's the best so far.
            leftmost_empty_column = current_x;
          } else if(current_x !== null) {
            // We have the shortest rectangle from the right and there
            // will be no empty columns to our left so we're done.
            return;
          }
          is_column_empty = true;  // Assume that we're empty.
        }
        if (value != EMPTY && value != BOUNDARY) {
          is_column_empty = false;  //We found a rectangle in this column.
          if (rightmost_shortest_rectangle === null ||
              value.height < rightmost_shortest_rectangle) {
            rightmost_shortest_rectangle = value.height;
          }
        }
        current_x = x;
      });
      if (!leftmost_empty_column) {
        console.error("Found no empty columns.");
      }
      return {"leftmost_empty_column": leftmost_empty_column,
              "rightmost_shortest_rectangle": rightmost_shortest_rectangle};
    }

    var max_rectangle_height = 0;
    var max_rectangle_width = 0;
    var total_area = 0;
    for (var i = 0; i < rectangles.length; i++) {
      max_rectangle_height = Math.max(max_rectangle_height, rectangles[i].height);
      max_rectangle_width = Math.max(max_rectangle_width, rectangles[i].width);
      total_area += rectangles[i].height * rectangles[i].width;
    }
    var current_width = null;  // Still need to find it.
    var current_height = max_rectangle_height;

    do {
      var insert_result = insert_all_rectangles(rectangles, current_height);
      var rectangle_grid = insert_result.rectangle_grid;
      var placements = insert_result.placements;
      var min_delta_height = insert_result.min_delta_height;

      var find_result = find_leftmost_empty_column(rectangle_grid);
      var leftmost_empty_column = find_result.leftmost_empty_column;
      var rightmost_shortest_rectangle = find_result.rightmost_shortest_rectangle;

      // Add another boundary just for the viewing.
      rectangle_grid.set_rectangle(leftmost_empty_column, 0, -1, -1, BOUNDARY);
      console.log(rectangle_grid.grid_to_string(
        leftmost_empty_column, current_height, " ", function(x) { return x.name; }));
      console.log("size is " + leftmost_empty_column + "," + current_height);

      // We are trying to get a new width that is less than
      // current_width.  If there is no current_width, that is the start
      // condition so just assume that we succeeded in all placements.
      if (current_width === null || leftmost_empty_column < current_width) {
        // Success in finding a new shape for all rectangles.
        console.log("Success, increase height by " + rightmost_shortest_rectangle);
        current_width = leftmost_empty_column;
        // TODO: Record the new answer here, check if it's the best so far.

        // TODO: Put this line back after debugging:
        //current_height += rightmost_shortest_rectangle;

        console.log("Increase instead by " + min_delta_height);
        current_height += min_delta_height;
      } else {
        // Failed to place all rectangles given the latest width constraint.
        console.log("Failure, increase height by " + min_delta_height);
        current_height += min_delta_height;
      }
    } while (current_width > max_rectangle_width);
  }
}
var perm = new ORP.Permutations(
    [
      ['a','b','c'],
      ['b','c','d']],
    function (i) { return i; },
    function (f) { return f; }
    );
perm.unique_form_permutations(function (forms) {
  console.log(forms);
});
return;

var rectangles = [];
for (var i = 1; i < 13; i++) {
  var new_name;
  if (i < 10) {
    new_name = String(i);
  } else {
    new_name = String.fromCharCode("a".charCodeAt(0)+i-10);
  }
  rectangles.push({name:new_name, height:i, width:i+1});
}
while(1) {
  console.log("Starting over");
  ORP.pack(rectangles);
}

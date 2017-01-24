//https://www.codeproject.com/Articles/210979/Fast-optimizing-rectangle-packing-algorithm-for-bu

'use strict';
require("jsdom").env("", function(err, window) {
  if (err) {
    console.error(err);
    return;
  }

  var $ = require("jquery")(window);
  var ORP = {
    Area: function (initial_value) {
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

      // Set all spots in a rectangle to a new value.
      self.set_rectangle = function(x, y, width, height, value) {
        if (!width || !height) {
          return;
        }
        var start_x = cut_vertically(x);
        var end_x = cut_vertically(x+width);
        var start_y = cut_horizontally(y);
        var end_y = cut_horizontally(y+height);
        console.log(contents);
        for (var x_index = start_x; x_index < end_x; x_index++) {
          for (var y_index = start_y; y_index < end_y; y_index++) {
            contents[x_index][y_index] = value;
          }
        }
        console.log(contents);
      }

      self.to_string = function() {
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


      // Get the value at x,y
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
    }
  }
  var x = new ORP.Area(0);
  console.log(x.to_string());
  x.set_rectangle(0,3,1,4,7);
  x.set_rectangle(0,3,1,5,9);
  x.set_rectangle(0,4,5,1,4);
  console.log(x.to_string());
  for (var j=0; j < 10; j++) {
    var s = "";
    for (var i=0; i < 10; i++) {
      s += x.get_value(i, j);
    }
    console.log(s);
  }
});

//console.log($);


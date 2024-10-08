export default function natsort(options) {
  if (options === void 0) {
    options = {};
  }
  var ore = /^0/;
  var sre = /\s+/g;
  var tre = /^\s+|\s+$/g;
  // unicode
  var ure = /[^\x00-\x80]/;
  // hex
  var hre = /^0x[0-9a-f]+$/i;
  // numeric
  var nre = /(0x[\da-fA-F]+|(^[\+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|\d+)/g;
  // datetime
  var dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/; // tslint:disable-line
  var toLowerCase = String.prototype.toLocaleLowerCase || String.prototype.toLowerCase;
  var GREATER = options.desc ? -1 : 1;
  var SMALLER = -GREATER;
  var normalize = options.insensitive
    ? function (s) {
        return toLowerCase.call("".concat(s)).replace(tre, "");
      }
    : function (s) {
        return "".concat(s).replace(tre, "");
      };
  function tokenize(s) {
    return s.replace(nre, "\0$1\0").replace(/\0$/, "").replace(/^\0/, "").split("\0");
  }
  function parse(s, l) {
    // normalize spaces; find floats not starting with '0',
    // string or 0 if not defined (Clint Priest)
    return ((!s.match(ore) || l === 1) && parseFloat(s)) || s.replace(sre, " ").replace(tre, "") || 0;
  }
  return function (a, b) {
    // trim pre-post whitespace
    var aa = normalize(a);
    var bb = normalize(b);
    // return immediately if at least one of the values is empty.
    // empty string < any others
    if (!aa && !bb) {
      return 0;
    }
    if (!aa && bb) {
      return SMALLER;
    }
    if (aa && !bb) {
      return GREATER;
    }
    // tokenize: split numeric strings and default strings
    var aArr = tokenize(aa);
    var bArr = tokenize(bb);
    // hex or date detection
    var aHex = aa.match(hre);
    var bHex = bb.match(hre);
    var av = aHex && bHex ? parseInt(aHex[0], 16) : aArr.length !== 1 && Date.parse(aa);
    var bv = aHex && bHex ? parseInt(bHex[0], 16) : (av && bb.match(dre) && Date.parse(bb)) || null;
    // try and sort Hex codes or Dates
    if (bv) {
      if (av === bv) {
        return 0;
      }
      if (av < bv) {
        return SMALLER;
      }
      if (av > bv) {
        return GREATER;
      }
    }
    var al = aArr.length;
    var bl = bArr.length;
    // handle numeric strings and default strings
    for (var i = 0, l = Math.max(al, bl); i < l; i += 1) {
      var af = parse(aArr[i] || "", al);
      var bf = parse(bArr[i] || "", bl);
      // handle numeric vs string comparison.
      // numeric < string
      if (isNaN(af) !== isNaN(bf)) {
        return isNaN(af) ? GREATER : SMALLER;
      }
      // if unicode use locale comparison
      if (ure.test(af + bf) && af.localeCompare) {
        var comp = af.localeCompare(bf);
        if (comp > 0) {
          return GREATER;
        }
        if (comp < 0) {
          return SMALLER;
        }
        if (i === l - 1) {
          return 0;
        }
      }
      if (af < bf) {
        return SMALLER;
      }
      if (af > bf) {
        return GREATER;
      }
      if ("".concat(af) < "".concat(bf)) {
        return SMALLER;
      }
      if ("".concat(af) > "".concat(bf)) {
        return GREATER;
      }
    }
    return 0;
  };
}

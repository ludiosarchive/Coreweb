(function(){var f = this;
function g(a, c) {
  var b = a.split("."), d = f;
  !(b[0] in d) && d.execScript && d.execScript("var " + b[0]);
  for(var e;b.length && (e = b.shift());) {
    !b.length && c !== void 0 ? d[e] = c : d = d[e] ? d[e] : d[e] = {}
  }
}
function h(a) {
  var c = typeof a;
  if(c == "object") {
    if(a) {
      if(a instanceof Array) {
        return"array"
      }else {
        if(a instanceof Object) {
          return c
        }
      }
      var b = Object.prototype.toString.call(a);
      if(b == "[object Window]") {
        return"object"
      }
      if(b == "[object Array]" || typeof a.length == "number" && typeof a.splice != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(b == "[object Function]" || typeof a.call != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(c == "function" && typeof a.call == "undefined") {
      return"object"
    }
  }
  return c
}
function i(a, c, b) {
  return a.call.apply(a.bind, arguments)
}
function j(a, c, b) {
  if(!a) {
    throw Error();
  }
  if(arguments.length > 2) {
    var d = Array.prototype.slice.call(arguments, 2);
    return function() {
      var b = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(b, d);
      return a.apply(c, b)
    }
  }else {
    return function() {
      return a.apply(c, arguments)
    }
  }
}
function k(a, c, b) {
  k = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? i : j;
  return k.apply(null, arguments)
}
;var l = Array.prototype, m = l.indexOf ? function(a, c, b) {
  return l.indexOf.call(a, c, b)
} : function(a, c, b) {
  b = b == null ? 0 : b < 0 ? Math.max(0, a.length + b) : b;
  if(typeof a == "string") {
    return typeof c != "string" || c.length != 1 ? -1 : a.indexOf(c, b)
  }
  for(;b < a.length;b++) {
    if(b in a && a[b] === c) {
      return b
    }
  }
  return-1
};
function n(a, c) {
  this.d = a;
  this.id = ++o;
  this.b = c;
  this.b.onmessage = k(this.f, this)
}
n.prototype.f = function(a) {
  a = a.data;
  if(h(a) == "array" && a[0] == "dying") {
    var c = a[1];
    this.b.close();
    var a = this.d, b = a.a == this, d = a.c, e = m(d, this);
    e >= 0 && l.splice.call(d, e, 1);
    if(b) {
      if(a.c.length) {
        a.a = a.c[0];
        a.a.b.postMessage(["become_master", c]);
        c = a.c.slice(1);
        for(b = 0;b < c.length;b++) {
          p(a, c[b])
        }
      }
    }else {
      a.a.b.postMessage(["remove_slave", this.id])
    }
  }
};
var o = 0;
function q(a) {
  this.e = a;
  this.c = []
}
function p(a, c) {
  var b = a.e();
  if(!a.a) {
    throw Error("connectSlave_: No master_?");
  }
  c.b.postMessage(["connect_to_master", a.a.id], [b.port1]);
  a.a.b.postMessage(["add_slave", c.id], [b.port2])
}
q.prototype.a = null;
var r = new q(function() {
  return new MessageChannel
});
g("onerror", function(a) {
  r.c.length && r.c[0].b.postMessage(["error_in_worker", a])
});
g("onconnect", function(a) {
  a = new n(r, a.ports[0]);
  r.c.push(a);
  r.a ? p(r, a) : (r.a = a, r.a.b.postMessage(["become_master", null]))
});
})();

(function () {

    // ignore certain pages
    var page = document.URL.substr(document.URL.lastIndexOf('/') + 1);
    page = page.replace(/\?\S*$/, "");
    if (/^(submit|x|login)$/i.test(page)) return;


    // convenience functions
    var _each = Array.prototype.forEach ? function(arraylike, iterator) {
            Array.prototype.forEach.call(arraylike, iterator);    
            return arraylike
        } : function(arraylike, iterator) {
            for (var i=0, ilen=arraylike.length; i<ilen; i++) {
                iterator(arraylike[i], i);
            }
            return arraylike
        };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr,function(x,i,a){
            results.push(iterator(x,i,a));
        });
        return results; 
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    // where to put the it, hn header is a table, put the thingi
    // inside first <tr>
    var getContainer = function() {
        return document.getElementsByTagName("tbody")[1].firstChild;
    };

    // finding current style property of a node
    var getStyle = function (el,styleProp){
        var y;
        if (window.getComputedStyle)
            y = window.getComputedStyle(el,null)[styleProp];
        else if (el.currentStyle) y = el.currentStyle[styleProp];
        return y;
    }


    var hn_classes = ["title", "subtext", "comment", "comhead"];

    var fontsetting = {factor : 100};


    _each(hn_classes, function(_class) {
        var child,nodelist = document.getElementsByClassName(_class),fs;
        if (nodelist.length) {
            child = nodelist[0];
            while (!(fs=getStyle(child, "fontSize"))) {
                child = child.firstChild;
            }
            fontsetting[_class] = parseInt(fs);
        }
    });

    // rewrite a style element for updating font size changes
    var overrideStyle = function() {
        var y = "";
        _each(hn_classes, function(_class){
            y += (
                "." + _class
                + '{font-size:'
                + fontsetting[_class]*fontsetting.factor/100
                + "px}"
                );
        });             
        return y
    };

    var controller = document.createElement("td");
    controller.setAttribute("style", "position: relative; top: -5px; font-weight: bold; font-size: 13px; color: #fff; display: inline; text-align:right;");
    controller.innerHTML =
        '<input type="range" min="80" max="250" style = "position:relative;top: 2px; width: 50%; max-width: 250px; height: 10px;" value="'
        + fontsetting.factor 
        + '"><span>'
        + fontsetting.factor
        + '% </span><img src="'
        + chrome.extension.getURL("font_size.gif")
        + '" style="position:relative; top: 6px;"/>'

    var container = getContainer();
    container.insertBefore(controller, container.lastChild);

    var new_style = document.createElement("style");
    document.body.appendChild(new_style);

    // wrapper for mouse events callback, so than mousemove dont 
    // trigger dom updates too often
    var adjustFont = function(limit) {
        var now, 
            lastTimeStamp,
            operating;

        return function(e) {
            e.stopPropagation();
            now = Date.now();
            if (e.type == "mousedown") {
                operating = true;
            } 
            if (operating && (!lastTimeStamp || now - lastTimeStamp > limit)) {
                lastTimeStamp = now;
                fontsetting.factor = +e.target.value;
                new_style.innerText = overrideStyle();
                e.target.nextSibling.innerText = fontsetting.factor + "% ";
                chrome.storage.sync.set({'font_adjustment': fontsetting.factor}, function() {
                    // console.log("Font-size setting saved.");
                });
            }
            if (e.type == "mouseup") {
                operating = false;
                lastTimeStamp = null;
            }
        }
    };

    var meter = controller.firstChild;
    meter.onmousedown = meter.onmouseup = meter.onmousemove = adjustFont(100);

    chrome.storage.sync.get("font_adjustment", function(item) {
        fontsetting.factor = item.font_adjustment || 100;
        try {
            if (item !== 100) {
                new_style.innerText = overrideStyle();
                meter.nextSibling.innerText = fontsetting.factor + "% ";
            }
        } catch(e) {
            //
        }
    });


})();

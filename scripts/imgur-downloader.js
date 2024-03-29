// Do work in chunks of 50 to prevent browser freezing
const SEARCH_CHUNKS = 50;

// How long to timeout before the next chunk is checked
const SEARCH_TIMEOUT = 175;

// Just a cache so we aren't unnecessarily querying
let searchCache = {timers: [], highlight: []};

function updateCount() {
    let elem = document.querySelector("#hiddenCount");
    let divs = document.querySelectorAll("#viewer > .container").length;
    let text = "Showing {0} of {1} items";
    if (divs > 0) {
        elem.classList.remove("hidden");
        text = text.replace("{1}", divs);
        let hidden = document.querySelectorAll(".container.hidden");
        text = text.replace("{0}", divs - hidden.length);
        elem.innerText = text;
    } else {
        elem.classList.add("hidden");
    }
}

function loadView(files) {
    if (!document.querySelector(".loader") && files.length > 0) {
        let progress = document.createElement("div");
        progress.classList.add("loader");
        document.querySelector("#hiddenCount").after(progress);
    }

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let reader = new FileReader();
        reader.onload = handleFile(file);
        reader.onabort = function() {
            document.querySelector(".loader").remove();
        }
        reader.readAsText(file);
    }
}

function getCollapser() {
    let btn = document.createElement("button");
    btn.class = "collapsible";
    btn.innerText = "Show Image"
    btn.addEventListener("click", function() {
        this.classList.toggle("active");
        if (this.innerText === "Show Image") {
            this.innerText = "Hide Image";
            this.nextElementSibling.src = this.nextElementSibling.getAttribute("data");
        } else {
            this.innerText = "Show Image";
        }
        let content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });

    return btn;
}

function copyFn(elem) {
    let copyText = elem.innerText;
    let area = document.createElement("textarea");
    area.classList.add("copyarea");
    area.innerText = copyText;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
}

function getMouseEnter(pre) {
    return function() {
        pre.style = "background-color: #eee;";
    }
}

function getMouseLeave(pre) {
    return function() {
        pre.style = "background-color: white;";
    }
}

function onMouseDown(pre) {
    return function() {
        copyFn(pre);
        pre.style = "background-color: #999";
    }
}

function addDescription(desc, div) {
    let split = desc.split(/(BL2\(.+?\))/g);
    let container = document.createElement("div");
    container.classList.add("codecontainer");
    let stack = [];
    for (let i = 0; i < split.length; i++) {
        let item = split[i];
        let newlines = item.split(/(\n)/g);
        for (let j = 0; j < newlines.length; j++) {
            stack.push(newlines[j]);
        }
    }

    let noBr = true;
    for (let i = 0; i < stack.length; i++) {
        let item = stack[i];

        item = item.trim();

        if (item.startsWith("BL2(")) {
            let pre = document.createElement("pre");
            let code = document.createElement("code");
            pre.appendChild(code);
            pre.classList.add("bl2code");
            code.innerText = item;

            pre.onmouseenter = getMouseEnter(pre);
            pre.onmouseleave = getMouseLeave(pre);
            pre.onmousedown = onMouseDown(pre);

            container.appendChild(pre);
            noBr = false;
        } else if (!item) {
            if (noBr) {
                noBr = false;
            } else {
                let br = document.createElement("br");
                container.appendChild(br);
                noBr = true;
            }
        } else {
            let text = document.createElement("span");
            text.classList.add("bl2desc");
            text.innerText = item;
            container.appendChild(text);
            noBr = false;
        }
    }

    div.appendChild(container);
}

function addItem(item, state) {
    let div = document.createElement("div");
    let viewer = document.getElementById("viewer");
    div.classList.add("container");

    if (item["album"] != state["lastAlbum"]) {
        state["lastAlbum"] = item["album"];
        let album = document.createElement("h2");
        album.innerText = item["album"];
        viewer.appendChild(album);
        let divider = document.createElement("hr");
        viewer.appendChild(divider);
    }

    if (item["title"]) {
        let title = document.createElement("h3");
        title.innerText = item["title"];
        div.appendChild(title);
    }

    let img = document.createElement("img");
    img.setAttribute("data", item["img"]);
    img.classList.add("hidden");

    div.appendChild(getCollapser());
    div.appendChild(img);

    if (item["description"]) {
        addDescription(item["description"], div);
    }

    viewer.appendChild(div);
}

function loadObject(items) {
    searchCache.dirty = true;
    let state = {lastAlbum: ""};
    for (let i = 0; i < items.length; i++) {
        addItem(items[i], state);
    }

    let loader = document.querySelector(".loader");
    if (loader) {
        loader.remove();
    }

    updateCount();
}

function handleFile(file) {
    let viewer = document.getElementById("viewer");
    // Put this back to overwrite files
    // viewer.innerHTML = "";
    return function(e) {
        let items = JSON.parse(e.target.result);
        loadObject(items);
    }
}

function selectFilter(elem) {
    elem.select();
}

function containsText(elem, text) {
    if (!text.trim()) {
        return true;
    }

    return elem.innerText.toLowerCase().indexOf(text.toLowerCase()) > -1;
}

function unhighlight(search) {
    while (searchCache.highlight.length > 0) {
        let elem = searchCache.highlight.pop();
        if (!search || elem.innerText.toLowerCase().indexOf(search) === -1) {
            elem.classList.remove("highlight");
        }
    }
}

function highlight(parent, search) {
    let elems = parent.querySelectorAll(".codecontainer > span");
    search = search.toLowerCase();

    for (let i = 0; i < elems.length; i++) {
        let elem = elems[i];
        if (elem.innerText.toLowerCase().indexOf(search) > -1) {
            searchCache.highlight.push(elem);
            elem.classList.add("highlight");
        }
    }

    unhighlight(search);
}

function filterView(text) {
    let elems = searchCache.elems;
    if (searchCache.dirty) {
        elems = document.querySelectorAll(".container");
        searchCache.elems = elems;
        searchCache.dirty = false;
    }

    while (searchCache.timers.length > 0) {
        clearTimeout(searchCache.timers.pop());
    }

    let searchProgress = document.getElementById("searchProgress");
    searchProgress.max = document.querySelectorAll("#viewer > .container").length;

    for (let chunk = 0; chunk < Math.ceil(elems.length / SEARCH_CHUNKS); chunk++) {
        let timer = setTimeout((function(start) {
            return function() {
                let limit = start + SEARCH_CHUNKS;
                let finalChunk = false;
                if (limit >= elems.length) {
                    limit = elems.length;
                    finalChunk = true;
                }
                for (let i = start; i < limit; i++) {
                    let current = elems[i];

                    if (containsText(current, text)) {
                        current.classList.remove("hidden");
                        highlight(current, text);
                    } else {
                        current.classList.add("hidden");
                    }

                    if (i % 5 == 0) {
                        searchProgress.value = i;
                    }
                }

                if (finalChunk) {
                    updateCount();
                    searchProgress.value = 0;
                }
            }
        })(chunk * SEARCH_CHUNKS), chunk * SEARCH_TIMEOUT);

        searchCache.timers.push(timer);
    }
}

function loadJSON(path, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

function loadDefaultView() {
    loadJSON("blob/sparfires_albums_minified.json", function(data) {
        loadObject(data);
    });
}
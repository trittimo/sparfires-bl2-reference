function updateCount() {
    let elem = document.querySelector("#hiddenCount");
    let viewer = document.querySelector("#viewer");
    let text = "Showing {0} of {1} items";
    if (viewer.children.length > 0) {
        elem.classList.remove("hidden");
        text = text.replace("{1}", viewer.children.length);
        let hidden = document.querySelectorAll(".container.hidden");
        text = text.replace("{0}", viewer.children.length - hidden.length);
        elem.innerText = text;
    } else {
        elem.classList.add("hidden");
    }
}

function loadView(files) {
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let reader = new FileReader();
        reader.onload = handleFile(file);
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
    for (let i = 0; i < split.length; i++) {
        let item = split[i];

        if (!item) {
            continue;
        }
        //item = item.replace("\\n", "<br>");

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
        } else {
            let text = document.createElement("span");
            text.classList.add("bl2desc");
            text.innerText = item;
            container.appendChild(text);
        }
    }

    div.appendChild(container);
}

function addItem(item) {
    let div = document.createElement("div");
    div.classList.add("container");

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

    let viewer = document.getElementById("viewer");
    viewer.appendChild(div);
}

function handleFile(file) {
    let viewer = document.getElementById("viewer");
    viewer.innerHTML = "";
    return function(e) {
        let items = JSON.parse(e.target.result);
        for (let i = 0; i < items.length; i++) {
            addItem(items[i]);
        }

        updateCount();
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

function filterView(text) {
    let elems = document.querySelectorAll(".container");
    for (let i = 0; i < elems.length; i++) {
        let current = elems[i];
        if (containsText(current, text)) {
            current.classList.remove("hidden");
        } else {
            current.classList.add("hidden");
        }
    }

    updateCount();
}
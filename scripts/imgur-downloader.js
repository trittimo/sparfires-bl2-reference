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

function addItem(item) {
    let div = document.createElement("div");
    div.classList.add("container");

    let img = document.createElement("img");
    img.setAttribute("data", item["img"]);
    img.classList.add("hidden");
    
    let desc = document.createElement("p");
    desc.innerText = item["description"].replace("\\n", "<br/>");

    div.appendChild(getCollapser());
    div.appendChild(img);
    div.appendChild(desc);

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
    }
}
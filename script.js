const game = {
    server: "https://www2.hs-esslingen.de/~melcher/it/minesweeper/",
    gameTypes: {
        small : { size: 9, numberOfMines: 10, cellWidth: "100%/9" },
        medium : { size: 16, numberOfMines: 40, cellWidth: "100%/14.8" },
        large : { size: 24, numberOfMines: 150, cellWidth: "100%/20.4" }
    },
    selectedGameType: "small",
    touchStartedAt:null,
    token: "",
    async init() {
        game.generateLayout();
        await game.startGame("small");
    },
    generateLayout() {
        game.generateMain();
        game.generateHeader();
        game.generatePlayfield();
        game.generateControls();
        game.generateFooter();
    },
    generateMain() {
        const bodyEl = document.querySelector("body");
        const mainEl = document.createElement("main");
        mainEl.id = "content";

        bodyEl.appendChild(mainEl);
    },
    generateHeader() {
        const mainEl = document.getElementById("content");
        const headerEl = document.createElement("header");
        headerEl.id = "header";

        const titleEl = document.createElement("h1");
        titleEl.classList.add("title");
        titleEl.innerText = "Minesweeper";
        headerEl.appendChild(titleEl);

        const subtitleEl = document.createElement("h4");
        subtitleEl.classList.add("subtitle");
        subtitleEl.innerText = "by Asinas Esber";
        headerEl.appendChild(subtitleEl);

        mainEl.appendChild(headerEl);
    },
    generatePlayfield() {
        const mainEl = document.getElementById("content");
        const playfieldEl = document.createElement("div");
        playfieldEl.id = "playfield";

        mainEl.appendChild(playfieldEl);
    },
    generateControls() {
        const mainEl = document.getElementById("content");
        const controlsEl = document.createElement("div");
        controlsEl.id = "controls";

        const smallbtnEl = document.createElement("button");
        smallbtnEl.id = "small";
        smallbtnEl.classList.add("btn");
        smallbtnEl.innerText = "Small";
        controlsEl.appendChild(smallbtnEl);

        const mediumbtnEl = document.createElement("button");
        mediumbtnEl.id = "medium";
        mediumbtnEl.classList.add("btn");
        mediumbtnEl.innerText = "Medium";
        controlsEl.appendChild(mediumbtnEl);

        const largebtnEl = document.createElement("button");
        largebtnEl.id = "large";
        largebtnEl.classList.add("btn");
        largebtnEl.innerText = "Large";
        controlsEl.appendChild(largebtnEl);

        mainEl.appendChild(controlsEl);
        game.registerControlBtnsClickListeners();
    },
    generateFooter() {
        const mainEl = document.getElementById("content");
        const footerEl = document.createElement("footer");
        footerEl.id = "footer";
        footerEl.innerText = "© 2024 by Asinas Esber";

        mainEl.appendChild(footerEl);
    },
    generateOverlay(text){
        const overlayEl = document.createElement("div");
        overlayEl.id = "overlay";
        const overlayTextEl = document.createElement("div");
        overlayTextEl.innerText = text;
        overlayEl.appendChild(overlayTextEl);

        if(text === "you win"){
            overlayTextEl.style.backgroundColor="green";
        }

        const playfieldEl = document.querySelector("#playfield");
        playfieldEl.appendChild(overlayEl);
    },
    setCellWidth(){
        const width = game.gameTypes[game.selectedGameType].cellWidth;
        const rootEl = document.querySelector(':root');
        rootEl.style.setProperty('--cell-width', width);
    },
    fillPlayfield(){
        const size = game.gameTypes[game.selectedGameType].size;
        const playfieldEl = document.querySelector("#playfield");
        playfieldEl.innerHTML = "";
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                game.generateCell(playfieldEl,x, y);
            }
        }
        game.registerCellsClickListeners();
    },
    generateCell(parent, x, y){
        var cellEl = document.createElement("div");
        cellEl.classList.add("cell", "covered");
        cellEl.setAttribute("data-x", x);
        cellEl.setAttribute("data-y", y);

        parent.appendChild(cellEl);
    },
    async startGame(type){
        game.selectedGameType = type;
        const settings = game.gameTypes[game.selectedGameType];
        game.setCellWidth();
        game.fillPlayfield();
        await game.fetchToken(settings.size,settings.numberOfMines);
        //game.localLogic.init(settings.size, settings.numberOfMines)
    },
    async fetchToken(size,mines){
        const url = `${game.server}?request=init&userid=asesit00&size=${size}&mines=${mines}`
        const response = await fetch(url);
        const json = await response.json();
        game.token = json.token;
    },
    registerControlBtnsClickListeners() {
        const types = Object.keys(game.gameTypes);
        for(var i=0 ; i < types.length ; i++){
            let type = types[i];
            let btnEl = document.getElementById(type);
            btnEl.addEventListener("click", () => game.handleControlBtnClick(type));
        }
    },
    registerCellsClickListeners(){
        const cells = document.querySelectorAll(".cell");
        for(var i =0; i < cells.length; i++){
            cells[i].addEventListener("mousedown", game.handleMouseDown);
            cells[i].addEventListener("touchstart", game.handleTouchStart);
            cells[i].addEventListener("touchend", game.handleTouchEnd);

        }
    },
    handleMouseDown(e){
        return e.button ? game.handleMarkCell(e.target) : game.handleSweep(e.target);
    },
    handleTouchStart(e){
        e.preventDefault();
        game.touchStartedAt = new Date();
    },
    handleTouchEnd(e){
        const touchEndedAt = new Date();
        if (touchEndedAt - game.touchStartedAt > 500) {
            game.handleMarkCell(e.target);
        } else {
            game.handleSweep(e.target);
        }
    },
    handleControlBtnClick(type) {
        if (confirm("Are you sure, you want to start a new game?")) {
            game.startGame(type)
        }
    },
    async handleSweep(cellEl){
        const x = Number.parseInt(cellEl.dataset.x);
        const y = Number.parseInt(cellEl.dataset.y);


        if (cellEl.classList.contains("covered")) {
            const state = await game.fetchSweep(x,y);
            game.placeSymbol(cellEl, state.numberOfMinesAround);
            game.uncoverEmptyCells(state.emptyCells);

            if(state.isGameOver){
                if(state.isMineHit){
                    cellEl.classList.add("hit");
                    game.uncoverMines(state.mines);
                    game.generateOverlay("you lose")
                }else{
                    game.generateOverlay("you win")
                }
            }
        }
    },
    async fetchSweep(x,y){
        const url = `${game.server}?request=sweep&token=${game.token}&x=${x}&y=${y}`
        const response = await fetch(url);
        const json = await response.json();
        return {
            isGameOver: json.minehit || json.userwins,
            isMineHit : json.minehit,
            mines: json.mines,
            numberOfMinesAround: json.minesAround,
            emptyCells:json.emptyCells
        };
    },
    handleMarkCell(cellEl){
        if (cellEl.classList.contains("covered")) {
            cellEl.classList.toggle("has-symbol");
            cellEl.classList.toggle("flag");
        }
    },
    placeSymbol(cellEl, symbol){
        if(cellEl == null) return;
        let className = "";
        switch(symbol){
            case 0:
                className = "empty"
                break
            case -1:
                className = "mine"
                break
            default:
                className = "n"+ symbol
        }
        cellEl.classList.remove("covered", "flag", "empty");
        cellEl.classList.add("has-symbol", className);
    },
    getCell(coord){
        return document.querySelector(`[data-x='${coord.x}'][data-y='${coord.y}']`);
    },
    uncoverMines(mines){
        for(var i=0; i < mines.length; i++){
            game.placeSymbol(game.getCell(mines[i]), -1);
        }
    },
    uncoverEmptyCells(emptyCells){
        if(!emptyCells) return;
        for (var i = 0; i < emptyCells.length; i++) {
            game.placeSymbol(game.getCell(emptyCells[i]), emptyCells[i].minesAround);
        }
    },
}

window.addEventListener("load", game.init);
window.addEventListener('contextmenu', e => e.preventDefault());
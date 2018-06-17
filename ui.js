function reqListener () {
    var resp = JSON.parse(this.responseText);
    var nextMove = document.getElementById("nextMove")
    var bestMove = resp.BestMove;
    nextMove.innerHTML = "next move: " + bestMove;

    var width = document.getElementsByClassName("chess_com_piece")[0].width;

    var from = document.getElementById("from");
    from.style.transorm = 'translate(' + 0 + 'px, ' + 0 + 'px)';
    from.style.backgroundColor = '#f00'; 
    from.style.width = width + 'px';
    from.style.height = width + 'px';

    var to = document.getElementById("to");
    to.style.transorm = 'translate(' + 0 + 'px, ' + 0 + 'px)';
    to.style.backgroundColor = '#00f'; 
    to.style.width = width + 'px';
    to.style.height = width + 'px';

    if (bestMove.length == 5) {
        bestMove = bestMove.substring(0, bestMove.length - 1);
    }

    if (bestMove.length == 4) {
        var width = document.getElementsByClassName("chess_com_piece")[0].width;

        var fromX = Math.abs((bestMove.charCodeAt(0) - 104)) * width
        var fromY = (parseInt(bestMove[1]) - 1 ) * width;
        from.style.transform = 'translate(' + fromX + 'px, ' + fromY + 'px)';

        var toX = Math.abs((bestMove.charCodeAt(2) - 104)) * width
        var toY = (parseInt(bestMove[3]) - 1) * width;
        to.style.transform = 'translate(' + toX + 'px, ' + toY + 'px)';
    } else {
        alert("don't know what to do with: " + bestMove);
    }
}

function doAsk() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "http://localhost:8080/move?pgn=" + pgn());
    oReq.send();
}

function pgn() {
    var rows = document.getElementsByClassName('notationVertical');
    var pgn = "";

    for (var i = 0; i < rows.length; i++) {
        var nodes = rows[i].childNodes;
        var num = nodes[0].innerText;
        var from = nodes[1].getElementsByClassName("gotomove")[0].innerText
        var to = nodes[2].getElementsByClassName("gotomove")[0].innerText

        pgn += num + " " + from + " " + to + " ";
    }

    pgn = pgn.replace(/\+/g, '');

    return pgn;
}

function initChessboard() {
    if (document.getElementById("from") != undefined) return;
    if (document.getElementById("to") != undefined) return;

    var width = document.getElementsByClassName("chess_com_piece")[0].width;
    var style = 'position: absolute; z-index: 2; pointer-events: none; opacity: 0.9; width: ' + width + 'px; height: ' + width + 'px;';

    var from = document.createElement("div");
    from.id = 'from';
    from.style = style;

    var to = document.createElement("div");
    to.id = 'to';
    to.style = style;

    var chessboard = document.getElementsByClassName("chessboard")[0].childNodes[0];
    chessboard.appendChild(from);
    chessboard.appendChild(to);
}

function initSidebar() {
    if (document.getElementById("wizzard") != undefined) return;

    var wizzard = document.createElement("div");
    wizzard.id = 'wizzard';

    var ask = document.createElement("button");
    ask.id = 'ask';
    ask.innerHTML = 'ask';
    ask.onclick = doAsk;
    wizzard.appendChild(ask);

    var nextMove = document.createElement("span");
    nextMove.id = 'nextMove';
    wizzard.appendChild(nextMove);

    var sidebar = document.getElementsByClassName('game-controls-component_0');
    sidebar[0].prepend(wizzard);

    var lastPgn = null;

    setInterval(function() { 
        var currentPgn = pgn();

        if (lastPgn != currentPgn) {
            lastPgn = currentPgn;
            doAsk();
        }
    }, 250);
}

function init() {
    initChessboard();
    initSidebar();
}

init();
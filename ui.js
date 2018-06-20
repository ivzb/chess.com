(function() {
    function initBoard() {
        var from = document.getElementById('from');
        var to = document.getElementById('to'); 

        remove(from);
        remove(to);

        var pieces = document.getElementsByClassName('chess_com_piece');

        if (pieces == undefined || pieces.length == 0) {
            throw Error('No pieces found.');
        }

        var width = pieces[0].width;
        var style = 
            'position: absolute; ' +
            'z-index: 2; ' +
            'pointer-events: none; ' +
            'opacity: 0.9; ' +
            'width: ' + width + 'px; ' +
            'height: ' + width + 'px; ';

        from = document.createElement('div');
        from.id = 'from';
        from.style = style;

        to = document.createElement('div');
        to.id = 'to';
        to.style = style;

        var chessboard = document.getElementsByClassName('chessboard')[0];

        if (chessboard == undefined) {
            throw Error('No chessboard found.');
        }
        
        var playArea = chessboard.childNodes[0];
        playArea.appendChild(from);
        playArea.appendChild(to);
    }

    function initController() {
        var wizzard = document.getElementById('wizzard');

        remove(wizzard);

        wizzard = document.createElement('div');
        wizzard.id = 'wizzard';
        wizzard.style = 
            'display: inline-block; ' +
            'background: rgb(209, 228, 239); ' +
            'border: 1px solid rgb(66, 133, 244); ' +
            'margin: 0 auto; ';
        wizzard.innerHTML = 
            '<button id="btnWhite" style="padding: 5px; margin: 5px;">white</button>' +
            '<button id="btnBlack" style="padding: 5px; margin: 5px;">black</button>' +
            '<br />' +
            '<button id="btnPlay" style="padding: 5px; margin: 5px;">play</button>' +
            '<button id="btnStop" style="padding: 5px; margin: 5px;">stop</button>' +
            '<p id="nextMove"></p>';

        document.body.insertBefore(wizzard, document.body.childNodes[0]);

        addClickListener('btnWhite', black);
        addClickListener('btnBlack', white);
        addClickListener('btnPlay', play);
        addClickListener('btnStop', stop);
    }

    function addClickListener(id, callback) {
        var element = document.getElementById(id);

        if (element != undefined) {
            element.addEventListener('click', callback);
        }
    }

    function remove(node) {
        if (node != undefined) {
            node.parentNode.removeChild(node);
        }
    }

    function updateUi() {
        setVisibility('btnWhite', isWhite());
        setVisibility('btnBlack', !isWhite());

        setVisibility('btnStop', isPlaying());
        setVisibility('btnPlay', !isPlaying());
    }

    function setVisibility(id, visible) {
        var element = document.getElementById(id);
        
        if (element != undefined) {
            element.style.display = visible ? 'inline-block' : 'none';
        }
    }

    function pgn() {
        var rows = document.getElementsByClassName('notationVertical');
        var pgn = '';

        for (var i = 0; i < rows.length; i++) {
            var nodes = rows[i].childNodes;
            var num = nodes[0].innerText;
            var from = nodes[1].getElementsByClassName('gotomove')[0].innerText
            var to = nodes[2].getElementsByClassName('gotomove')[0].innerText

            pgn += num + ' ' + from + ' ' + to + ' ';
        }

        pgn = pgn.replace(/\+/g, '');

        return pgn;
    }

    function ask(pgn) {
        var request = new XMLHttpRequest();
        request.addEventListener('load', receiveMove);
        request.open('GET', 'http://localhost:8080/move?pgn=' + pgn);
        request.send();
    }

    function receiveMove() {
        try {
            var responseJSON = JSON.parse(this.responseText);
            var bestMove = responseJSON.BestMove;
            move(bestMove);
        } catch (e) {
            alert('invalid move, stopping...');
            console.log(e);
            console.log(this.responseText);
            stop();
        }
    }

    function move(bestMove) {
        var nextMove = document.getElementById('nextMove')
        nextMove.innerHTML = 'next move: ' + bestMove;

        var width = document.getElementsByClassName('chess_com_piece')[0].width;

        var from = document.getElementById('from');
        from.style.transorm = 'translate(' + 0 + 'px, ' + 0 + 'px)';
        from.style.backgroundColor = '#f00'; 
        from.style.width = width + 'px';
        from.style.height = width + 'px';

        var to = document.getElementById('to');
        to.style.transorm = 'translate(' + 0 + 'px, ' + 0 + 'px)';
        to.style.backgroundColor = '#00f'; 
        to.style.width = width + 'px';
        to.style.height = width + 'px';

        if (bestMove.length == 5) {
            bestMove = bestMove.substring(0, bestMove.length - 1);
        }

        if (bestMove.length == 4) {
            var coords = calculate(bestMove, isWhite(), width);

            from.style.transform = 'translate(' + coords[0] + 'px, ' + coords[1] + 'px)';
            to.style.transform   = 'translate(' + coords[2] + 'px, ' + coords[3] + 'px)';
        } else {
            alert('don\'t know what to do with: ' + bestMove);
            stop();
        }
    }

    function calculate(move, isWhite, width) {
        var xOffset = (isWhite ? 'a' : 'h').charCodeAt();
        var yOffset = (!isWhite ? '1' : '8').charCodeAt();

        var fromX = Math.abs(move.charCodeAt(0) - xOffset) * width;
        var fromY = Math.abs(move.charCodeAt(1) - yOffset) * width;

        var toX = Math.abs(move.charCodeAt(2) - xOffset) * width;
        var toY = Math.abs(move.charCodeAt(3) - yOffset) * width;

        return [fromX, fromY, toX, toY];
    }

    var state = {
        value: 0, // 00
        pgn: '',
        subscribers: [],
        flags: {
            playing: 1, // 01
            white:   2, // 10
        },

        on: function (flag) {
            this.value |= flag;
            this.notify();
        },
        off: function (flag) {
            this.value &= ~flag;
            this.notify();
        },
        is: function (flag) {
            return (this.value & flag) == flag;
        },
        subscribe: function (subscriber) {
            this.subscribers.push(subscriber);
        },
        notify: function () {
            this.subscribers.map(function(subscriber) {
                subscriber();
            })
        },
    }

    function play() {
        state.on(state.flags.playing);
    }

    function stop() {
        state.off(state.flags.playing);
    }

    function white() {
        state.on(state.flags.white);
    }

    function black() {
        state.off(state.flags.white);
    }

    function isPlaying() {
        return state.is(state.flags.playing);
    }

    function isWhite() {
        return state.is(state.flags.white);
    }

    function init() {
        initBoard();
        initController();
        state.subscribe(updateUi);
        black();
        play();

        setInterval(function() {
            if (isPlaying()) {
                var newPgn = pgn();

                if (state.pgn != newPgn) {
                    state.pgn = newPgn;
                    ask(newPgn);
                }
            }
        }, 250);
    }

    init();
})();

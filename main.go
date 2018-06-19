package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/freeeve/pgn"
	"github.com/freeeve/uci"
)

func main() {
	http.HandleFunc("/move", move)
	panic(http.ListenAndServe(":8080", nil))
}

func move(w http.ResponseWriter, r *http.Request) {
	keys, ok := r.URL.Query()["pgn"]

	if !ok || len(keys) < 1 {
		fmt.Fprintf(w, "Url Param 'pgn' is missing")
		return
	}

	pgn := keys[0]
	fen, err := decode(pgn)

	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	eng, err := uci.NewEngine("/home/ivzb/Downloads/stockfish-9-linux/Linux/stockfish-9-64")

	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	// set some engine options
	eng.SetOptions(uci.Options{
		Hash:    128,
		Ponder:  false,
		OwnBook: true,
		MultiPV: 1,
	})

	// set the position
	if err := eng.SetFEN(fen); err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	// set some result filter options
	resultOpts := uci.HighestDepthOnly | uci.IncludeUpperbounds | uci.IncludeLowerbounds
	results, err := eng.GoDepth(16, resultOpts)

	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	fmt.Fprintf(w, results.String())
}

func decode(moves string) (string, error) {
	ps := pgn.NewPGNScanner(strings.NewReader(moves))
	game, err := ps.Scan()

	if err != nil {
		return "", err
	}

	b := pgn.NewBoard()

	var fen string

	for _, move := range game.Moves {
		if err := b.MakeMove(move); err != nil {
			return "", err
		}

		fen = b.String()
	}

	return fen, nil
}

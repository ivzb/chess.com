package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/freeeve/pgn"
	"github.com/freeeve/uci"
)

func main() {
	http.HandleFunc("/move", move)
	err := http.ListenAndServe(":8080", nil)

	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func move(w http.ResponseWriter, r *http.Request) {
	keys, ok := r.URL.Query()["pgn"]

	if !ok || len(keys) < 1 {
		fmt.Fprintf(w, "Url Param 'pgn' is missing")
		return
	}

	pgn := keys[0]
	fen := decode(pgn)

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
		MultiPV: 4,
	})

	// set the starting position
	eng.SetFEN(fen)

	// set some result filter options
	resultOpts := uci.HighestDepthOnly | uci.IncludeUpperbounds | uci.IncludeLowerbounds
	results, err := eng.GoDepth(16, resultOpts)

	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	// print it (String() goes to pretty JSON for now)
	fmt.Fprintf(w, results.String())
}

func decode(moves string) string {
	ps := pgn.NewPGNScanner(strings.NewReader(moves))
	game, err := ps.Scan()

	if err != nil {
		log.Fatal(err)
	}

	b := pgn.NewBoard()

	var fen string

	for _, move := range game.Moves {
		b.MakeMove(move)
		fen = b.String()
	}

	return fen
}

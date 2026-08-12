// Every generation prompt (quiz/flashcards/summary/notes) asks the model
// for a single top-level JSON array. Historically we waited for the whole
// response, stripped ```json fences, and JSON.parse'd the lot in one go.
//
// To stream results item-by-item (a flashcard, a question, a summary
// point, a notes topic) as the model is still writing them, we need to
// know the moment each array element's closing bracket/quote has arrived
// — without waiting for the array's own closing `]`.
//
// StreamingArrayParser is a small character-by-character state machine:
// it tracks bracket/brace depth and string state across whatever chunks
// of text it's fed, and fires a callback the instant a top-level element
// (an object like `{...}`, or — for the summary prompt — a bare string
// like `"..."`) is complete and parseable on its own.
//
// It tolerates (and simply skips over) any text before the first `[`, so
// a stray ```json fence or leading prose from the model doesn't need to
// be stripped first.
export class StreamingArrayParser {
    constructor(onItem) {
        this.onItem = onItem;
        this.buffer = "";
        this.consumedLength = 0;

        this.started = false;  // seen the array's opening [
        this.finished = false; // seen the array's closing ]
        this.itemStart = -1;   // buffer index where the current top-level item began
        this.depth = 0;        // bracket/brace depth *within* the current top-level item
        this.inString = false;
        this.escape = false;
    }

    // Feed the next delta of streamed text in. Synchronously invokes
    // onItem() zero or more times for any items that became complete.
    push(deltaText) {
        if (this.finished || !deltaText) return;

        this.buffer += deltaText;
        let i = this.consumedLength;

        for (; i < this.buffer.length; i++) {
            const ch = this.buffer[i];

            if (!this.started) {
                if (ch === "[") this.started = true;
                continue;
            }

            if (this.inString) {
                if (this.escape) {
                    this.escape = false;
                } else if (ch === "\\") {
                    this.escape = true;
                } else if (ch === '"') {
                    this.inString = false;
                    if (this.depth === 0) this._closeItem(i); // a bare top-level string item (summary points)
                }
                continue;
            }

            if (ch === '"') {
                if (this.depth === 0 && this.itemStart === -1) this.itemStart = i;
                this.inString = true;
                continue;
            }

            if (ch === "{" || ch === "[") {
                if (this.depth === 0 && this.itemStart === -1) this.itemStart = i;
                this.depth++;
                continue;
            }

            if (ch === "}" || ch === "]") {
                this.depth--;
                if (this.depth === 0 && this.itemStart !== -1 && ch === "}") {
                    this._closeItem(i); // a top-level object item (quiz/flashcards/notes)
                } else if (this.depth < 0) {
                    this.finished = true; // this was the array's own closing ]
                    i++;
                    break;
                }
                continue;
            }
            // commas/whitespace between items — nothing to do
        }

        this.consumedLength = i;
    }

    _closeItem(endIndex) {
        const raw = this.buffer.slice(this.itemStart, endIndex + 1);
        this.itemStart = -1;
        try {
            this.onItem(JSON.parse(raw));
        } catch {
            // Shouldn't happen if bracket/quote matching above is correct,
            // but a malformed fragment should never crash generation —
            // just skip it, the chunk-level fallback parse (see
            // startWorkers.js) can still recover the item if the array
            // eventually closes cleanly.
        }
    }

    // Full raw text seen so far — used as a fallback source for a full
    // JSON.parse if the incremental parser ends up extracting nothing
    // (e.g. the model didn't return a well-formed array at all).
    getBuffer() {
        return this.buffer;
    }
}

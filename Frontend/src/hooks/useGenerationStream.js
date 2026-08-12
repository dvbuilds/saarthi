import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';

// Safety cutoff, same purpose (and duration) as the old polling hook's
// MAX_POLL_TIME — a stream that never reaches a terminal event shouldn't
// hang the UI forever.
const MAX_STREAM_TIME = 5 * 60 * 1000;

// Parses one complete SSE "message" (the text between two \n\n
// separators) into its event name + JSON data. Hand-rolled instead of
// using EventSource because EventSource can't be given the app's
// 401 -> refresh -> retry auth flow (see api.js) and can't carry a POST
// body — fetch + a readable stream lets this hook reuse that same retry
// logic instead of silently dying the moment an access token expires
// mid-generation.
function parseSSEMessage(rawMessage) {
    let event = "message";
    const dataLines = [];

    for (const line of rawMessage.split("\n")) {
        if (line.startsWith("event:")) {
            event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
        }
        // ": ping" heartbeat comment lines (and anything else) are ignored.
    }

    if (dataLines.length === 0) return null;

    try {
        return { event, data: JSON.parse(dataLines.join("\n")) };
    } catch {
        return null;
    }
}

/**
 * Real-time replacement for the old poll-based useJobPolling. Same
 * external shape (result, loading, error, progress, start, cancel,
 * jobId) so the Flashcards/Quiz/Summary/Notes pages barely had to
 * change — but `result` now grows item-by-item as SSE "item" events
 * arrive, instead of jumping in batches every 2.5s.
 */
export function useGenerationStream(startUrl, { autoStart = true } = {}) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(autoStart);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [jobId, setJobId] = useState(null);

    const cancelledRef = useRef(false);
    const abortControllerRef = useRef(null);
    const jobIdRef = useRef(null);

    const closeStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const handleEvent = useCallback((event, data) => {
        switch (event) {
            case "snapshot":
                if (typeof data.totalChunks === "number") {
                    setProgress({ completed: data.completedChunks || 0, total: data.totalChunks });
                }
                if (Array.isArray(data.result)) {
                    setResult(data.result); // already-generated content from a prior connection/session
                }
                if (data.status === "failed") setError(data.error || "Something went wrong while generating this.");
                if (data.status === "cancelled") setError("Generation was cancelled.");
                if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
                    setLoading(false);
                }
                break;

            case "item":
                // Append — never replace — so everything rendered so far
                // stays on screen while the rest keeps streaming in.
                setResult(prev => (prev ? [...prev, data.item] : [data.item]));
                break;

            case "progress":
                setProgress({ completed: data.completedChunks || 0, total: data.totalChunks || 0 });
                break;

            case "done":
                setResult(data.result || []); // authoritative final list (ordering/shuffling/trimming applied)
                setLoading(false);
                break;

            case "error":
                setError(data.message || "Something went wrong while generating this.");
                setLoading(false);
                break;

            case "cancelled":
                setError("Generation was cancelled.");
                setLoading(false);
                break;

            default:
                break;
        }
    }, []);

    const connectRef = useRef(null);

    // Opens the SSE connection and reads it until a terminal event closes
    // it, the caller cancels, or the connection drops. `retriedAuth`
    // guards against looping forever if a refreshed session still comes
    // back 401.
    const connect = useCallback(async (jobId, startedAt, retriedAuth = false) => {
        if (cancelledRef.current) return;

        if (Date.now() - startedAt > MAX_STREAM_TIME) {
            setError("This is taking longer time than expected. Please try again.");
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        let res;
        try {
            res = await fetch(`/api/jobs/${jobId}/stream`, {
                method: "GET",
                credentials: "include", // send the httpOnly auth cookies, same as API's withCredentials
                headers: { Accept: "text/event-stream" },
                signal: controller.signal,
            });
        } catch {
            if (controller.signal.aborted || cancelledRef.current) return;
            setError("Can't reach the server. Please check your internet connection and try again.");
            setLoading(false);
            return;
        }

        if (res.status === 401 && !retriedAuth) {
            // Access token expired mid-generation (jobs can run for
            // minutes) — refresh once, exactly like api.js's interceptor
            // does for every other request, then reopen the stream.
            try {
                await API.post('/users/refresh');
                return connectRef.current(jobId, startedAt, true);
            } catch {
                setError("Your session expired. Please sign in again.");
                setLoading(false);
                return;
            }
        }

        if (!res.ok || !res.body) {
            if (!cancelledRef.current) {
                setError("Couldn't connect to the generation stream.");
                setLoading(false);
            }
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (cancelledRef.current) break;

                buffer += decoder.decode(value, { stream: true });

                const messages = buffer.split("\n\n");
                buffer = messages.pop(); // last (possibly incomplete) message stays buffered

                for (const raw of messages) {
                    if (!raw.trim()) continue;
                    const parsed = parseSSEMessage(raw);
                    if (parsed) handleEvent(parsed.event, parsed.data);
                }
            }
        } catch {
            if (!controller.signal.aborted && !cancelledRef.current) {
                setError("Connection lost while generating. Please try again.");
                setLoading(false);
            }
        }
    }, [handleEvent]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    const start = useCallback(async (body) => {
        cancelledRef.current = false;
        closeStream();
        setLoading(true);
        setError("");
        setResult(null);
        setProgress({ completed: 0, total: 0 });
        setJobId(null);

        try {
            const res = await API.post(startUrl, body);
            const jobId = res.data.jobId;

            if (!jobId) {
                setError("Unexpected response from server.");
                setLoading(false);
                return;
            }

            jobIdRef.current = jobId;
            setJobId(jobId);
            connect(jobId, Date.now());
        } catch (err) {
            if (!cancelledRef.current) {
                const status = err.response?.status;
                const message = status === 400
                    ? (err.response?.data?.message || "Failed to start generation.")
                    : (!err.response ? "Can't reach the server. Please check your internet connection and try again." : "Failed to start generation.");
                setError(message);
                setLoading(false);
            }
        }
    }, [startUrl, connect, closeStream]);

    const cancel = useCallback(async () => {
        const jobId = jobIdRef.current;
        cancelledRef.current = true;
        closeStream();

        setLoading(false);
        setError("Generation cancelled.");

        if (jobId) {
            try {
                await API.post(`/jobs/${jobId}/cancel`);
            } catch {
                // Best-effort — the UI has already stopped listening, which
                // is what matters; the worker's own status check will also
                // notice on its next chunk boundary either way.
            }
        }
    }, [closeStream]);

    useEffect(() => {
        if (autoStart) {
            start({});
        }
        return () => {
            cancelledRef.current = true;
            closeStream();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startUrl]);

    return { result, loading, error, progress, start, cancel, jobId };
}

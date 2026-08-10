import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage.js';

const POLL_INTERVAL = 2500;
const MAX_POLL_TIME = 5 * 60 * 1000; // 5 min safety cutoff — avoids polling forever if a job gets stuck

export function useJobPolling(startUrl, { autoStart = true } = {}) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(autoStart);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState({ completed: 0, total: 0 }); // NEW

    const cancelledRef = useRef(false);
    const timeoutRef = useRef(null);
    const jobIdRef = useRef(null);

    const poll = useCallback(async (jobId, startedAt) => {
        if (cancelledRef.current) return;

        if (Date.now() - startedAt > MAX_POLL_TIME) {
            setError("This is taking longer time than expected. Please try again.");
            setLoading(false);
            return;
        }

        try {
            const res = await API.get(`/jobs/${jobId}`);
            const {
                status,
                result: jobResult,
                error: jobError,
                completedChunks,
                totalChunks,
            } = res.data;

            if (cancelledRef.current) return;

            // NEW: update progress and partial result on every poll, regardless of status
            if (typeof totalChunks === "number") {
                setProgress({ completed: completedChunks || 0, total: totalChunks });
            }
            if (jobResult) {
                setResult(jobResult); // shows growing array while status is still "processing"
            }

            if (status === "completed") {
                setResult(jobResult);
                setLoading(false);
            } else if (status === "failed") {
                setError(jobError || "Something went wrong while generating this.");
                setLoading(false);
            } else if (status === "cancelled") {
                setError("Generation was cancelled.");
                setLoading(false);
            } else {
                timeoutRef.current = setTimeout(() => poll(jobId, startedAt), POLL_INTERVAL);
            }
        } catch (err) {
            if (!cancelledRef.current) {
                setError(getErrorMessage(err, { 404: "Couldn't check generation status." }));
                setLoading(false);
            }
        }
    }, []);

    const start = useCallback(async (body) => {
        cancelledRef.current = false;
        setLoading(true);
        setError("");
        setResult(null);
        setProgress({ completed: 0, total: 0 });

        try {
            const res = await API.post(startUrl, body);
            const jobId = res.data.jobId;

            if (!jobId) {
                setError("Unexpected response from server.");
                setLoading(false);
                return;
            }

            jobIdRef.current = jobId;
            poll(jobId, Date.now());
        } catch (err) {
            if (!cancelledRef.current) {
                setError(getErrorMessage(err, { 400: "Failed to start generation." }));
                setLoading(false);
            }
        }
    }, [startUrl, poll]);

    const cancel = useCallback(async () => {
        const jobId = jobIdRef.current;
        cancelledRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setLoading(false);
        setError("Generation cancelled.");

        if (jobId) {
            try {
                await API.post(`/jobs/${jobId}/cancel`);
            } catch {
                // Best-effort — even if this request fails (e.g. job already
                // finished server-side right as the user clicked Cancel),
                // the UI has already stopped polling, which is what matters.
            }
        }
    }, []);

    useEffect(() => {
        if (autoStart) {
            start({});
        }
        return () => {
            cancelledRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startUrl]);

    return { result, loading, error, progress, start, cancel, jobId: jobIdRef.current };
}
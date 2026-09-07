import { useEffect, useRef } from "react";

export default function useAbortController() {
    const controllerRef = useRef(null);

    const getSignal = () => {
        if (controllerRef.current) {
            controllerRef.current.abort();
        }

        controllerRef.current = new AbortController();

        return controllerRef.current.signal;
    };

    const cancel = () => {
        controllerRef.current?.abort();
    };

    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
        };
    }, []);

    return {
        getSignal,
        cancel,
    };
}
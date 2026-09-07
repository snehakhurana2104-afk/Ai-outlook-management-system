import { Suspense } from "react";
import PageLoader from "./PageLoader";

export default function SuspenseWrapper({ children }) {
    return (
        <Suspense fallback={<PageLoader />}>
            {children}
        </Suspense>
    );
}
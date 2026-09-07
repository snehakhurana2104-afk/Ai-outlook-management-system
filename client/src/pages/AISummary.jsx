import React, { useEffect } from "react";
import socket from "../services/socketService";

const AISummary = () => {
	useEffect(() => {
		const refresh = () => {
			// placeholder: actual AI summary reload logic can be added
			console.log("AISummary: new-email received");
		};

		socket.on("new-email", refresh);

		return () => socket.off("new-email", refresh);
	}, []);

	return (
		<div style={{ padding: 25 }}>
			<h2>AI Summary</h2>
			<p>AI generated summaries and insights will appear here.</p>
		</div>
	);
};

export default AISummary;


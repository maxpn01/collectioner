import React from "react";
import { Header } from "./header";

export function PageTemplate(props: { children?: React.ReactNode }) {
	return (
		<>
			<Header />

			<div className="container max-w-screen-md px-4 py-8 lg:px-0">
				{props.children}
			</div>
		</>
	);
}

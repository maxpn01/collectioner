import "@/env";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage, dashboardPageRoute } from "./admin/dashboard";
import { EditCollectionPage } from "./collection/edit-collection";
import { CollectionPage } from "./collection/view-collection";
import { HomePage, homePageRoute } from "./home";
import "./index.css";
import "@mdxeditor/editor/style.css";
import { CreateItemPage } from "./item/create-item";
import { EditItemPage } from "./item/edit-item";
import { SearchPage, searchPageRoute } from "./item/search";
import { ItemPage } from "./item/view-item";
import { PageTemplate } from "./page-template";
import { SignInPage, signInPageRoute } from "./user/signin";
import { SignUpPage, signUpPageRoute } from "./user/signup";
import { UserPage } from "./user/view-user";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={signInPageRoute} element={<SignInPage />} />
				<Route path={signUpPageRoute} element={<SignUpPage />} />
				<Route path="/*" element={<PageTemplateRoutes />} />
			</Routes>
		</BrowserRouter>
	);
}

function PageTemplateRoutes() {
	return (
		<PageTemplate>
			<Routes>
				<Route path={homePageRoute} element={<HomePage />} />
				<Route path={searchPageRoute} element={<SearchPage />} />
				<Route path={dashboardPageRoute} element={<DashboardPage />} />
				<Route path="/:username" element={<UserPage />} />
				<Route path="/:username/:collectionId" element={<CollectionPage />} />
				<Route
					path="/:username/:collectionId/edit"
					element={<EditCollectionPage />}
				/>
				<Route
					path="/:username/:collectionId/items/:itemId"
					element={<ItemPage />}
				/>
				<Route
					path="/:username/:collectionId/new-item"
					element={<CreateItemPage />}
				/>
				<Route
					path="/:username/:collectionId/items/:itemId/edit"
					element={<EditItemPage />}
				/>
			</Routes>
		</PageTemplate>
	);
}

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

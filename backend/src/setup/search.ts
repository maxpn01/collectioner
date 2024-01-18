import {
	JsonSearchResponsePresenter,
	MeiliSearchEngine,
	QuerySearchController,
	SearchUseCase,
} from "../search";
import { meili } from "./meili";
import { expressApp } from "./http";
import { prismaItemRepository } from "./collection/item";

const searchEngine = new MeiliSearchEngine(meili);
const search = new SearchUseCase(searchEngine, prismaItemRepository);
const querySearchController = new QuerySearchController();
const jsonSearchResponsePresenter = new JsonSearchResponsePresenter();

expressApp.get("/search", async (req, res) => {
	const httpQuery = req.query.q;
	if (typeof httpQuery !== "string") {
		res.status(400).send();
		return;
	}

	const queryResult = querySearchController.execute(httpQuery);
	if (queryResult.err) {
		res.status(500).send();
		return;
	}
	const query = queryResult.val;

	const searchResult = await search.execute(query);
	if (searchResult.err) {
		res.status(500).send();
		return;
	}
	const responseItems = searchResult.val;

	const json = jsonSearchResponsePresenter.execute(responseItems);
	res.status(200).json(json);
});

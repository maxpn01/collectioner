// export interface Presenter<T> {
// 	execute(response: T): void;
// }

// export class MultiPresenter<T> {
// 	private presenters: Presenter<T>[] = [];

// 	constructor() {
// 		this.execute = this.execute.bind(this);
// 	}

// 	addPresenter(presenter: Presenter<T>): void {
// 		this.presenters.push(presenter);
// 	}

// 	removePresenter(presenter: Presenter<T>): void {
// 		const index = this.presenters.indexOf(presenter);
// 		if (index !== -1) {
// 			this.presenters.splice(index, 1);
// 		}
// 	}

// 	execute(response: T): void {
// 		this.presenters.forEach((presenter) => presenter.execute(response));
// 	}
// }

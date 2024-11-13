export default class Tooltip {
	constructor({ templatePath, item, rendered }) {
		this.item = item;
		this.templatePath = templatePath;
		this.rendered = rendered;
	}

	async appendTo(html, querySelector) {
		if (!this.rendered) {
			await this.render();
		}
		html.querySelector(querySelector).dataset.tooltip = this.rendered;
	}

	async render() {
		this.rendered = await renderTemplate(this.templatePath, this.item.tooltip);
		return this;
	}
}

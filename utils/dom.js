function createHTMLElement(nodeName, children = []) {
	const element = document.createElement(nodeName);
	children.forEach((child) => {
		const childElement = child instanceof HTMLElement ? child : new Text(child);
		element.appendChild(childElement);
	});
	return element;
}

function fontAwesomeIcon(iconName) {
	const styleClass = 'fa-solid';
	const iconClass = `fa-${iconName}`;
	const fixedWidth = 'fa-fw';
	return `<i class="${styleClass} ${fixedWidth} ${iconClass}"></i>`;
}

export { createHTMLElement, fontAwesomeIcon };

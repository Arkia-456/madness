function fontAwesomeIcon(iconName) {
	const styleClass = 'fa-solid';
	const iconClass = `fa-${iconName}`;
	const fixedWidth = 'fa-fw';
	return `<i class="${styleClass} ${fixedWidth} ${iconClass}"></i>`;
}

export { fontAwesomeIcon };

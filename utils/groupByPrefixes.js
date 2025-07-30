let general = {};
function groupByPrefixes(array, obj) {
	let related = {};
	const prefixesArray = array;

	prefixesArray.forEach(prefix => {
		related = {}

		for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith(`${prefix}_`)) {
			const cleanKey = key.replace(`${prefix}_`, '');
			related[cleanKey] = value;
			delete general[key]
		} else {
			general[key] = value;
		}
			general[prefix] = related;
		}

		if (general[prefix] ) {
			prefixesArray.splice(0,1);
			groupByPrefixes(prefixesArray, general);
		}
	})

	return general;
}

module.exports = { groupByPrefixes }

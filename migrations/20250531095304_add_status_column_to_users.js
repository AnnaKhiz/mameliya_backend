/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	return knex.schema.table('users', function(table) {
		table.string('userId', 266).nullable();
		table.integer('age', 2).nullable();
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
	return knex.schema.table('users', table => {
		table.dropColumn('userId');
		table.dropColumn('age');
	});
};
